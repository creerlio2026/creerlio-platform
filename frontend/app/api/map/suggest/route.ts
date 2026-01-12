export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q') || ''
    const showAll = searchParams.get('show_all') === '1'

    if (!q.trim()) {
      return NextResponse.json({ businesses: [] }, { status: 200 })
    }

    // Search for businesses by name
    let query = supabase
      .from('business_profiles')
      .select('*')
      .ilike('business_name', `%${q.trim()}%`)
      .limit(6)

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const businesses = (data || []).map((b: any) => ({
      id: b.id,
      name: b.business_name || 'Unnamed Business',
      slug: b.slug || `business-${b.id}`,
      industry: Array.isArray(b.industry) ? b.industry[0] : (b.industry || null),
      location: null, // Could be derived from lat/lng with reverse geocoding if needed
      lat: b.latitude,
      lng: b.longitude,
    }))

    return NextResponse.json({ businesses }, { status: 200 })
  } catch (err: any) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
