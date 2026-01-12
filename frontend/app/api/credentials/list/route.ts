/**
 * API Route: List Credentials (Admin/User)
 * Returns credentials for authenticated user or admin view
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '') || null
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = await createClient(accessToken)
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const trustLevel = searchParams.get('trust_level')
    const isAdmin = searchParams.get('admin') === 'true'

    // Build query
    let query = supabase
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
        created_at,
        credential_issuers (
          id,
          name,
          logo_url
        ),
        blockchain_anchors (
          transaction_hash,
          block_number,
          chain_name,
          network,
          status
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by user or admin view
    if (!isAdmin) {
      query = query.eq('holder_user_id', user.id)
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (trustLevel) {
      query = query.eq('trust_level', trustLevel)
    }

    const { data: credentials, error } = await query

    if (error) {
      console.error('[Credential List] Error:', error)
      return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 })
    }

    // Get verification counts
    const credentialIds = credentials?.map(c => c.id) || []
    const { data: verificationStats } = await supabase
      .from('verification_logs')
      .select('credential_id')
      .in('credential_id', credentialIds)

    const statsMap = new Map<string, number>()
    verificationStats?.forEach(stat => {
      statsMap.set(stat.credential_id, (statsMap.get(stat.credential_id) || 0) + 1)
    })

    const credentialsWithStats = credentials?.map(cred => ({
      ...cred,
      verification_count: statsMap.get(cred.id) || 0,
    }))

    return NextResponse.json({
      credentials: credentialsWithStats || [],
    })
  } catch (error: any) {
    console.error('[Credential List] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
