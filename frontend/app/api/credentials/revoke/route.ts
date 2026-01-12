/**
 * API Route: Revoke Credential
 * Handles credential revocation and blockchain update
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hashCredentialId, getContractInstance, getRpcUrl } from '@/lib/blockchain'
import { ethers } from 'ethers'

export async function POST(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '') || null
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No access token provided' }, { status: 401 })
    }
    
    // Create Supabase client with access token
    const supabase = await createClient(accessToken)
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid or expired token' }, { status: 401 })
    }

    const body = await request.json()
    const { credentialId, reason } = body

    if (!credentialId) {
      return NextResponse.json({ error: 'credentialId is required' }, { status: 400 })
    }

    // Get credential
    const { data: credential, error: credError } = await supabase
      .from('credentials')
      .select('id, holder_user_id, status')
      .eq('id', credentialId)
      .single()

    if (credError || !credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    // Verify ownership (or admin rights)
    if (credential.holder_user_id !== user.id) {
      // Check if user is admin (implement admin check logic here)
      // For now, only allow owner to revoke
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (credential.status === 'revoked') {
      return NextResponse.json({ error: 'Credential already revoked' }, { status: 400 })
    }

    // Update credential status
    const { error: updateError } = await supabase
      .from('credentials')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
        revoked_reason: reason || null,
      })
      .eq('id', credentialId)

    if (updateError) {
      console.error('[Credential Revoke] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to revoke credential' }, { status: 500 })
    }

    // Revoke on blockchain if anchored
    const { data: blockchainAnchor } = await supabase
      .from('blockchain_anchors')
      .select('chain_name, network, contract_address, status')
      .eq('credential_id', credentialId)
      .eq('status', 'confirmed')
      .maybeSingle()

    if (blockchainAnchor) {
      try {
        const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY
        if (!privateKey) {
          console.warn('[Credential Revoke] Blockchain private key not configured, skipping on-chain revocation')
        } else {
          const customRpcUrl = process.env[`${blockchainAnchor.chain_name.toUpperCase()}_${blockchainAnchor.network.toUpperCase()}_RPC_URL`]
          const rpcUrl = customRpcUrl || getRpcUrl(blockchainAnchor.chain_name as 'polygon' | 'base', blockchainAnchor.network as any)
          
          const provider = new ethers.JsonRpcProvider(rpcUrl)
          const wallet = new ethers.Wallet(privateKey, provider)
          
          const contract = getContractInstance(
            blockchainAnchor.contract_address,
            blockchainAnchor.chain_name as 'polygon' | 'base',
            blockchainAnchor.network as any,
            provider
          )
          const contractWithSigner = contract.connect(wallet) as ethers.Contract

          const credentialIdHash = hashCredentialId(credentialId)
          const tx = await contractWithSigner.revokeCredential(credentialIdHash)
          
          console.log('[Credential Revoke] Blockchain transaction sent:', tx.hash)
          
          // Update blockchain anchor record (optional, can be done async)
          const receipt = await tx.wait()
          console.log('[Credential Revoke] Blockchain transaction confirmed:', receipt.blockNumber)
        }
      } catch (chainError) {
        console.error('[Credential Revoke] Blockchain revocation error:', chainError)
        // Continue even if blockchain revocation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Credential revoked successfully',
    })
  } catch (error: any) {
    console.error('[Credential Revoke] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
