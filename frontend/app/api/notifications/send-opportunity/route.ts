export const dynamic = 'force-dynamic'

/**
 * API Route: Send Opportunity Notification
 * Allows businesses to send opportunity notifications to talents who have withdrawn their connection
 * This notifies the talent to reconsider reconnecting with the business
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { talent_id, business_id, connection_request_id, message } = body

    if (!talent_id || !business_id) {
      return NextResponse.json(
        { error: 'talent_id and business_id are required' },
        { status: 400 }
      )
    }

    // Verify the user owns this business
    const { data: businessProfile, error: businessError } = await supabase
      .from('business_profiles')
      .select('id, business_name, name')
      .eq('id', business_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (businessError || !businessProfile) {
      return NextResponse.json(
        { error: 'Business profile not found or access denied' },
        { status: 403 }
      )
    }

    // Verify there's a withdrawn connection between this business and talent
    const { data: connectionRequest, error: connError } = await supabase
      .from('talent_connection_requests')
      .select('id, status, talent_id, business_id')
      .eq('talent_id', talent_id)
      .eq('business_id', business_id)
      .eq('status', 'discontinued')
      .maybeSingle()

    if (connError || !connectionRequest) {
      return NextResponse.json(
        { error: 'No withdrawn connection found with this talent' },
        { status: 400 }
      )
    }

    // Get business name for the notification title
    const businessName = businessProfile.business_name || businessProfile.name || 'A business'

    // Create the notification
    const { data: notification, error: insertError } = await supabase
      .from('talent_notifications')
      .insert({
        talent_id,
        business_id,
        connection_request_id: connection_request_id || connectionRequest.id,
        notification_type: 'opportunity',
        title: `New Opportunity from ${businessName}`,
        message: message || `${businessName} would like to reconnect with you. They may have new opportunities that match your profile.`,
        metadata: {
          sent_by_user_id: user.id,
          business_name: businessName,
          original_connection_id: connectionRequest.id
        }
      })
      .select()
      .single()

    if (insertError) {
      // Check if the table doesn't exist yet
      if (insertError.message?.includes('relation') && insertError.message?.includes('does not exist')) {
        console.error('[Send Opportunity] talent_notifications table does not exist. Please run the migration.')
        return NextResponse.json(
          { error: 'Notifications system not configured. Please contact support.' },
          { status: 500 }
        )
      }
      console.error('[Send Opportunity] Error creating notification:', insertError)
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      )
    }

    console.log('[Send Opportunity] Notification sent successfully:', {
      notification_id: notification.id,
      talent_id,
      business_id,
      business_name: businessName
    })

    return NextResponse.json({
      success: true,
      message: 'Opportunity notification sent successfully',
      notification_id: notification.id
    })

  } catch (error: any) {
    console.error('[Send Opportunity] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
