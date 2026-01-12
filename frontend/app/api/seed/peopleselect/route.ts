import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if PeopleSelect already exists
    const { data: existing } = await supabase
      .from('business_profiles')
      .select('id, business_name')
      .ilike('business_name', '%peopleselect%')
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'PeopleSelect already exists',
        business: existing
      }, { status: 200 })
    }

    // Create PeopleSelect Recruitment business
    // Cammeray, NSW coordinates: -33.8186, 151.2064
    const { data: business, error } = await supabase
      .from('business_profiles')
      .insert({
        business_name: 'PeopleSelect Recruitment',
        business_slug: 'peopleselect-recruitment',
        industries: ['Recruitment & Staffing', 'Human Resources'],
        work_types: ['hybrid', 'onsite'],
        latitude: -33.8186,
        longitude: 151.2064,
        is_published: true,
        location: 'Cammeray, NSW, Australia'
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'PeopleSelect Recruitment created successfully',
      business: business
    }, { status: 201 })

  } catch (err: any) {
    console.error('Seed error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
