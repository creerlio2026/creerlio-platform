export const dynamic = 'force-dynamic'

/**
 * API Route: Request Reconnection
 * Allows talents to request reconnection with businesses they were previously connected with.
 * This sends a notification to the business and updates the connection status.
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
    const { connection_request_id, business_id, message } = body

    if (!connection_request_id || !business_id) {
      return NextResponse.json(
        { error: 'connection_request_id and business_id are required' },
        { status: 400 }
      )
    }

    // Verify the user owns this talent profile
    const { data: talentProfile, error: talentError } = await supabase
      .from('talent_profiles')
      .select('id, name, title')
      .eq('user_id', user.id)
      .maybeSingle()

    if (talentError || !talentProfile) {
      return NextResponse.json(
        { error: 'Talent profile not found' },
        { status: 403 }
      )
    }

    // Verify the connection request exists, belongs to this talent, and is in discontinued status
    const { data: connectionRequest, error: connError } = await supabase
      .from('talent_connection_requests')
      .select('id, talent_id, business_id, status, selected_sections, created_at')
      .eq('id', connection_request_id)
      .eq('talent_id', talentProfile.id)
      .eq('status', 'discontinued')
      .maybeSingle()

    if (connError || !connectionRequest) {
      return NextResponse.json(
        { error: 'Connection request not found or not in withdrawn status' },
        { status: 400 }
      )
    }

    // Get business name for the notification
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('id, business_name, name')
      .eq('id', business_id)
      .maybeSingle()

    const businessName = businessProfile?.business_name || businessProfile?.name || 'Business'
    const talentName = talentProfile.name || talentProfile.title || 'A talent'

    // Update the connection request status to indicate reconnection is pending
    // We use 'pending' status to indicate the talent is requesting to reconnect
    const { error: updateError } = await supabase
      .from('talent_connection_requests')
      .update({
        status: 'pending',
        responded_at: new Date().toISOString()
      })
      .eq('id', connection_request_id)

    if (updateError) {
      console.error('[Request Reconnect] Error updating connection status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update connection status' },
        { status: 500 }
      )
    }

    // Create a notification for the business
    // First check if business_notifications table exists, if not, we'll just update the connection status
    try {
      const { error: notifError } = await supabase
        .from('business_notifications')
        .insert({
          business_id,
          talent_id: talentProfile.id,
          connection_request_id,
          notification_type: 'reconnect_request',
          title: `Reconnection Request from ${talentName}`,
          message: message || `${talentName} would like to reconnect with you. They were previously connected and are requesting to restore the connection.`,
          metadata: {
            sent_by_user_id: user.id,
            talent_name: talentName,
            original_connection_id: connection_request_id,
            original_sections: connectionRequest.selected_sections
          }
        })

      if (notifError) {
        // Table might not exist - that's okay, the connection status update is the main action
        if (!notifError.message?.includes('relation') && !notifError.message?.includes('does not exist')) {
          console.warn('[Request Reconnect] Warning creating notification:', notifError.message)
        }
      }
    } catch (notifErr) {
      // Ignore notification errors - the main action (status update) succeeded
      console.log('[Request Reconnect] Notification table may not exist, skipping notification')
    }

    console.log('[Request Reconnect] Reconnection request sent:', {
      connection_request_id,
      talent_id: talentProfile.id,
      business_id,
      talent_name: talentName,
      business_name: businessName
    })

    return NextResponse.json({
      success: true,
      message: 'Reconnection request sent successfully',
      reconnected: false // Will be true if auto-approved in future enhancement
    })

  } catch (error: any) {
    console.error('[Request Reconnect] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
