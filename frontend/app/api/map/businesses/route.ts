export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Geocode address to coordinates using Mapbox Geocoding API
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!MAPBOX_TOKEN) return null

    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    const response = await fetch(geocodeUrl)
    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center
      return { lat, lng }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const q = searchParams.get('q') || ''
    const industries = searchParams.get('industries')?.split(',').filter(Boolean) || []
    const work = searchParams.get('work') || ''
    const showAll = searchParams.get('show_all') === '1'
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = parseFloat(searchParams.get('radius') || '5')

    let query = supabase
      .from('business_profiles')
      .select('*')

    // If show_all is false, only show businesses that match filters
    // If show_all is true, ignore filters and show all businesses
    if (!showAll) {
      // Apply filters when show_all is false
      if (q.trim()) {
        query = query.or(`business_name.ilike.%${q.trim()}%,name.ilike.%${q.trim()}%`)
      }
      // Note: industries and work_types filters removed - columns don't exist in current schema
      // If no filters are applied and show_all is false, return empty array
      if (!q.trim() && industries.length === 0 && !work.trim()) {
        return NextResponse.json({ businesses: [] }, { status: 200 })
      }
    } else {
      // show_all is true - ignore text filters but still apply location filters if provided
      // Don't add any text-based filters here
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map businesses and geocode those without coordinates
    let businesses = await Promise.all((data || []).map(async (b: any) => {
      let lat = b.latitude
      let lng = b.longitude
      let approx = false

      // If no coordinates but has location data, try to geocode
      if ((lat == null || lng == null) && (b.city || b.state || b.country || b.address)) {
        const locationParts = [b.address, b.city, b.state, b.country].filter(Boolean)
        if (locationParts.length > 0) {
          const locationString = locationParts.join(', ')
          const geocoded = await geocodeAddress(locationString)
          if (geocoded) {
            lat = geocoded.lat
            lng = geocoded.lng
            approx = true // Mark as approximate since we geocoded it
          }
        }
      }

      return {
        id: b.id,
        name: b.business_name || b.name || 'Unnamed Business',
        slug: b.slug || `business-${b.id}`,
        industries: Array.isArray(b.industry) ? b.industry : (b.industry ? [b.industry] : []),
        work: b.work_types || [],
        lat,
        lng,
        city: b.city,
        state: b.state,
        country: b.country,
        address: b.address,
        approx,
      }
    }))

    // Filter by geographic radius if provided
    // If a business doesn't have lat/lng but has city/state/country, include it anyway
    // (the frontend can geocode it or show it in a list)
    if (lat && lng) {
      const centerLat = parseFloat(lat)
      const centerLng = parseFloat(lng)

      businesses = businesses.filter((b: any) => {
        // If business has coordinates, check if it's within radius
        if (b.lat != null && b.lng != null) {
          const distance = haversineDistance(centerLat, centerLng, b.lat, b.lng)
          return distance <= radius
        }
        // If business doesn't have coordinates but has location text, include it
        // (frontend can handle geocoding or display it separately)
        if (b.city || b.state || b.country || b.address) {
          return true
        }
        // Otherwise exclude businesses with no location data
        return false
      })
    } else {
      // If no location filter, only exclude businesses with absolutely no location data
      businesses = businesses.filter((b: any) => {
        return b.lat != null || b.lng != null || b.city || b.state || b.country || b.address
      })
    }

    return NextResponse.json({ businesses }, { status: 200 })
  } catch (err: any) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// Haversine formula to calculate distance between two lat/lng points in km
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
