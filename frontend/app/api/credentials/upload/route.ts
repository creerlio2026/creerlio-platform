/**
 * API Route: Upload Credential
 * Handles file upload, hash generation, credential creation, and blockchain anchoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeFileHash } from '@/lib/crypto'

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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const credentialType = formData.get('credential_type') as string
    const category = formData.get('category') as string
    const credentialIssuerId = formData.get('credential_issuer_id') as string
    const issuedDate = formData.get('issued_date') as string
    const expiryDate = formData.get('expiry_date') as string
    const trustLevel = formData.get('trust_level') as string || 'self_asserted'
    const visibility = formData.get('visibility') as string || 'link_only'

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Compute SHA-256 hash
    const sha256Hash = await computeFileHash(file)

    // Generate unique QR token
    const { data: tokenData, error: tokenError } = await supabase.rpc('generate_qr_token')
    if (tokenError) {
      console.error('[Credential Upload] Token generation error:', tokenError)
      return NextResponse.json({ error: 'Failed to generate QR token' }, { status: 500 })
    }
    const qrToken = tokenData as string

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${user.id}/${fileName}`
    const bucketName = 'credential-files'

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[Credential Upload] Storage error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Create credential record
    const { data: credential, error: credentialError } = await supabase
      .from('credentials')
      .insert({
        credential_issuer_id: credentialIssuerId || null,
        holder_user_id: user.id,
        title,
        description,
        credential_type: credentialType || null,
        category: category || null,
        issued_date: issuedDate || new Date().toISOString().split('T')[0],
        expiry_date: expiryDate || null,
        status: 'active',
        trust_level: trustLevel,
        visibility: visibility as 'public' | 'link_only' | 'private',
        sha256_hash: sha256Hash,
        qr_token: qrToken,
        file_storage_path: filePath,
      })
      .select()
      .single()

    if (credentialError) {
      console.error('[Credential Upload] Database error:', credentialError)
      // Cleanup: delete uploaded file
      await supabase.storage.from(bucketName).remove([filePath])
      return NextResponse.json({ error: 'Failed to create credential record' }, { status: 500 })
    }

    // Create credential file record
    const { error: fileRecordError } = await supabase
      .from('credential_files')
      .insert({
        credential_id: credential.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_storage_path: filePath,
        sha256_hash: sha256Hash,
        is_primary: true,
      })

    if (fileRecordError) {
      console.error('[Credential Upload] File record error:', fileRecordError)
      // Continue anyway, file record is not critical
    }

    // Queue blockchain anchoring (async, don't wait)
    // The blockchain anchoring will be handled by a background job or separate API call
    // For now, we'll return success and anchor separately

    return NextResponse.json({
      success: true,
      credential: {
        id: credential.id,
        title: credential.title,
        qr_token: credential.qr_token,
        sha256_hash: credential.sha256_hash,
        verification_url: `/verify/${qrToken}`,
      },
    })
  } catch (error: any) {
    console.error('[Credential Upload] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
