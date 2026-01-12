export const dynamic = 'force-dynamic'

/**
 * API Route: Get Talent Name
 * Server-side route to fetch talent name for businesses viewing connections
 * This bypasses RLS issues by using service role or proper authentication
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
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const talentId = searchParams.get('talent_id')

    if (!talentId) {
      return NextResponse.json({ error: 'talent_id is required' }, { status: 400 })
    }

    // First try talent_profiles
    const { data: talentProfile, error: profileError } = await supabase
      .from('talent_profiles')
      .select('id, name, title, user_id')
      .eq('id', talentId)
      .maybeSingle()

    if (!profileError && talentProfile) {
      const name = (talentProfile.name && String(talentProfile.name).trim()) ||
                   (talentProfile.title && String(talentProfile.title).trim()) ||
                   null
      
      if (name) {
        return NextResponse.json({ name })
      }

      // If no name in talent_profiles, try portfolio metadata
      const userId = talentProfile.user_id || talentId
      
      // Try with limit(1) first (in case multiple portfolio items exist)
      let portfolioItem = null
      const portfolioRes = await supabase
        .from('talent_bank_items')
        .select('metadata')
        .eq('user_id', userId)
        .eq('item_type', 'portfolio')
        .limit(1)
        .maybeSingle()
      
      if (!portfolioRes.error && portfolioRes.data) {
        portfolioItem = portfolioRes.data
      } else if (portfolioRes.error && portfolioRes.error.message.includes('JSON object requested')) {
        // Multiple rows returned, try to get all and find first with name
        const portfolioResAll = await supabase
          .from('talent_bank_items')
          .select('metadata')
          .eq('user_id', userId)
          .eq('item_type', 'portfolio')
          .limit(10)
        
        if (!portfolioResAll.error && portfolioResAll.data && portfolioResAll.data.length > 0) {
          // Find first item with a name
          portfolioItem = portfolioResAll.data.find(item => item.metadata?.name) || portfolioResAll.data[0]
        }
      }

      if (portfolioItem?.metadata?.name) {
        const portfolioName = String(portfolioItem.metadata.name).trim()
        if (portfolioName) {
          return NextResponse.json({ name: portfolioName })
        }
      }
    }

    // Fallback: Try portfolio metadata with talent_id as user_id
    let portfolioItem2 = null
    const portfolioRes2 = await supabase
      .from('talent_bank_items')
      .select('metadata')
      .eq('user_id', talentId)
      .eq('item_type', 'portfolio')
      .limit(1)
      .maybeSingle()
    
    if (!portfolioRes2.error && portfolioRes2.data) {
      portfolioItem2 = portfolioRes2.data
    } else if (portfolioRes2.error && portfolioRes2.error.message.includes('JSON object requested')) {
      // Multiple rows returned, try to get all and find first with name
      const portfolioRes2All = await supabase
        .from('talent_bank_items')
        .select('metadata')
        .eq('user_id', talentId)
        .eq('item_type', 'portfolio')
        .limit(10)
      
      if (!portfolioRes2All.error && portfolioRes2All.data && portfolioRes2All.data.length > 0) {
        // Find first item with a name
        portfolioItem2 = portfolioRes2All.data.find(item => item.metadata?.name) || portfolioRes2All.data[0]
      }
    }

    if (portfolioItem2?.metadata?.name) {
      const portfolioName = String(portfolioItem2.metadata.name).trim()
      if (portfolioName) {
        return NextResponse.json({ name: portfolioName })
      }
    }

    return NextResponse.json({ error: 'Talent name not found' }, { status: 404 })
  } catch (error: any) {
    console.error('[Talent Name API] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
