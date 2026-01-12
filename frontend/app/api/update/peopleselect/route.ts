import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Update PeopleSelect with proper location data
    // Cammeray, NSW coordinates: -33.8186, 151.2064
    const { data: businesses, error } = await supabase
      .from('business_profiles')
      .update({
        latitude: -33.8186,
        longitude: 151.2064,
      })
      .ilike('business_name', '%peopleselect%')
      .select()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'PeopleSelect updated successfully',
      businesses: businesses
    }, { status: 200 })

  } catch (err: any) {
    console.error('Update error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
