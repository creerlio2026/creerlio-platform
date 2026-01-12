/**
 * API Route: Anchor Credential on Blockchain
 * Handles blockchain transaction for credential anchoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hashCredentialId, toBytes32, getContractInstance, getTransactionUrl, getRpcUrl } from '@/lib/blockchain'
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
    const { credentialId, chainName = 'polygon', network = 'testnet', contractAddress } = body

    if (!credentialId || !contractAddress) {
      return NextResponse.json(
        { error: 'credentialId and contractAddress are required' },
        { status: 400 }
      )
    }

    // Get credential details
    const { data: credential, error: credError } = await supabase
      .from('credentials')
      .select('id, sha256_hash, holder_user_id')
      .eq('id', credentialId)
      .single()

    if (credError || !credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    // Verify ownership
    if (credential.holder_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if already anchored
    const { data: existingAnchor } = await supabase
      .from('blockchain_anchors')
      .select('id, transaction_hash, status')
      .eq('credential_id', credentialId)
      .eq('status', 'confirmed')
      .maybeSingle()

    if (existingAnchor) {
      return NextResponse.json({
        success: true,
        message: 'Credential already anchored',
        anchor: existingAnchor,
      })
    }

    // For server-side anchoring, we need a wallet/private key
    // This should be stored securely in environment variables
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Blockchain private key not configured' },
        { status: 500 }
      )
    }

    // Create blockchain transaction
    const customRpcUrl = process.env[`${chainName.toUpperCase()}_${network.toUpperCase()}_RPC_URL`]
    const rpcUrl = customRpcUrl || getRpcUrl(chainName, network)
    
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const wallet = new ethers.Wallet(privateKey, provider)
    
    const contract = getContractInstance(contractAddress, chainName, network, provider)
    const contractWithSigner = contract.connect(wallet) as ethers.Contract

    const credentialIdHash = hashCredentialId(credential.id)
    const sha256HashBytes32 = toBytes32(credential.sha256_hash)

    // Create pending anchor record
    const { data: anchorRecord, error: anchorInsertError } = await supabase
      .from('blockchain_anchors')
      .insert({
        credential_id: credentialId,
        chain_name: chainName,
        network: network,
        contract_address: contractAddress,
        credential_id_on_chain: credential.id,
        sha256_hash: credential.sha256_hash,
        status: 'pending',
      })
      .select()
      .single()

    if (anchorInsertError) {
      console.error('[Blockchain Anchor] Database error:', anchorInsertError)
      return NextResponse.json({ error: 'Failed to create anchor record' }, { status: 500 })
    }

    try {
      // Send transaction
      const tx = await contractWithSigner.issueCredential(credentialIdHash, sha256HashBytes32)
      console.log('[Blockchain Anchor] Transaction sent:', tx.hash)

      // Wait for confirmation (optional, can be done async)
      const receipt = await tx.wait()
      console.log('[Blockchain Anchor] Transaction confirmed:', receipt.blockNumber)

      // Update anchor record with transaction details
      const { error: updateError } = await supabase
        .from('blockchain_anchors')
        .update({
          transaction_hash: tx.hash,
          block_number: receipt.blockNumber,
          block_timestamp: new Date(receipt.timestamp * 1000).toISOString(),
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmation_count: receipt.confirmations,
          gas_used: receipt.gasUsed?.toString(),
        })
        .eq('id', anchorRecord.id)

      if (updateError) {
        console.error('[Blockchain Anchor] Update error:', updateError)
      }

      // Create blockchain anchored event
      await supabase.from('credential_events').insert({
        credential_id: credentialId,
        event_type: 'blockchain_anchored',
        performed_by: user.id,
        performed_by_type: 'holder',
        event_data: {
          chain_name: chainName,
          network: network,
          transaction_hash: tx.hash,
          block_number: receipt.blockNumber,
        },
      })

      const transactionUrl = getTransactionUrl(chainName, network, tx.hash)

      return NextResponse.json({
        success: true,
        anchor: {
          id: anchorRecord.id,
          transaction_hash: tx.hash,
          block_number: receipt.blockNumber,
          transaction_url: transactionUrl,
        },
      })
    } catch (txError: any) {
      console.error('[Blockchain Anchor] Transaction error:', txError)
      
      // Update anchor record to failed
      await supabase
        .from('blockchain_anchors')
        .update({
          status: 'failed',
          metadata: { error: txError.message },
        })
        .eq('id', anchorRecord.id)

      return NextResponse.json(
        { error: txError.message || 'Transaction failed' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Blockchain Anchor] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
