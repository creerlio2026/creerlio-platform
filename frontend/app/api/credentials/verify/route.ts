export const dynamic = 'force-dynamic'

/**
 * API Route: Verify Credential
 * Handles credential verification including hash comparison and blockchain verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeUrlHash, compareHashes } from '@/lib/crypto'
import { verifyCredentialOnChain, getTransactionUrl } from '@/lib/blockchain'

export async function GET(request: NextRequest) {
  try {
    // Public endpoint - no authentication required
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const qrToken = searchParams.get('token')

    if (!qrToken) {
      return NextResponse.json({ error: 'QR token is required' }, { status: 400 })
    }

    // Get credential by QR token
    const { data: credential, error: credError } = await supabase
      .from('credentials')
      .select(`
        id,
        title,
        description,
        credential_type,
        category,
        issued_date,
        expiry_date,
        status,
        trust_level,
        visibility,
        sha256_hash,
        qr_token,
        mask_holder_name,
        file_storage_path,
        credential_issuers (
          id,
          name,
          logo_url,
          website_url
        )
      `)
      .eq('qr_token', qrToken)
      .single()

    if (credError || !credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    // Log verification attempt
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referrer = request.headers.get('referer') || null

    // Determine verification result
    let verificationResult: 'valid' | 'expired' | 'revoked' | 'mismatch' | 'not_found' = 'valid'
    let hashMatch = false
    let blockchainVerified = false

    // Check status
    if (credential.status === 'revoked') {
      verificationResult = 'revoked'
    } else if (credential.expiry_date && new Date(credential.expiry_date) < new Date()) {
      verificationResult = 'expired'
    } else {
      // Verify file hash
      try {
        // Get signed URL for file
        const { data: signedUrlData } = await supabase.storage
          .from('credential-files')
          .createSignedUrl(credential.file_storage_path, 3600) // 1 hour expiry

        if (signedUrlData?.signedUrl) {
          // Re-compute hash from stored file
          const computedHash = await computeUrlHash(signedUrlData.signedUrl)
          hashMatch = compareHashes(computedHash, credential.sha256_hash)

          if (!hashMatch) {
            verificationResult = 'mismatch'
          }
        }
      } catch (hashError) {
        console.error('[Credential Verify] Hash computation error:', hashError)
        // Continue with verification, hash check failed
      }

      // Verify on blockchain if anchored
      const { data: blockchainAnchor } = await supabase
        .from('blockchain_anchors')
        .select('chain_name, network, contract_address, transaction_hash, block_number, status')
        .eq('credential_id', credential.id)
        .eq('status', 'confirmed')
        .maybeSingle()

      if (blockchainAnchor) {
        try {
          const chainVerification = await verifyCredentialOnChain(
            blockchainAnchor.contract_address,
            blockchainAnchor.chain_name as 'polygon' | 'base',
            blockchainAnchor.network as any,
            credential.id,
            credential.sha256_hash
          )

          blockchainVerified = chainVerification.exists && 
                              !chainVerification.isRevoked && 
                              chainVerification.hashMatches
        } catch (chainError) {
          console.error('[Credential Verify] Blockchain verification error:', chainError)
          // Continue without blockchain verification
        }
      }
    }

    // Update QR token scan count
    await supabase
      .from('credential_qr_tokens')
      .update({
        scan_count: supabase.raw('scan_count + 1'),
        last_scan_at: new Date().toISOString(),
      })
      .eq('credential_id', credential.id)

    // Log verification
    await supabase.from('verification_logs').insert({
      credential_id: credential.id,
      qr_token: qrToken,
      verification_result: verificationResult,
      hash_match: hashMatch,
      blockchain_verified: blockchainVerified,
      ip_address: ipAddress,
      user_agent: userAgent,
      referrer: referrer,
    })

    // Get blockchain transaction URL if available
    const blockchainAnchor = await supabase
      .from('blockchain_anchors')
      .select('chain_name, network, transaction_hash')
      .eq('credential_id', credential.id)
      .eq('status', 'confirmed')
      .maybeSingle()

    const blockchainTxUrl = blockchainAnchor?.data?.transaction_hash
      ? getTransactionUrl(
          blockchainAnchor.data.chain_name as 'polygon' | 'base',
          blockchainAnchor.data.network as any,
          blockchainAnchor.data.transaction_hash
        )
      : null

    return NextResponse.json({
      credential: {
        id: credential.id,
        title: credential.title,
        description: credential.description,
        credential_type: credential.credential_type,
        category: credential.category,
        issued_date: credential.issued_date,
        expiry_date: credential.expiry_date,
        status: credential.status,
        trust_level: credential.trust_level,
        issuer: credential.credential_issuers ? {
          name: credential.credential_issuers.name,
          logo_url: credential.credential_issuers.logo_url,
          website_url: credential.credential_issuers.website_url,
        } : null,
      },
      verification: {
        result: verificationResult,
        hash_match: hashMatch,
        blockchain_verified: blockchainVerified,
        blockchain_tx_url: blockchainTxUrl,
      },
    })
  } catch (error: any) {
    console.error('[Credential Verify] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
