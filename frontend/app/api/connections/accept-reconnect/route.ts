export const dynamic = 'force-dynamic'

/**
 * API Route: Accept Reconnection Request
 * Allows businesses to accept reconnection requests from talents.
 * This restores the connection to 'accepted' status, preserving all previous
 * messages, video chat history, and shared sections.
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
    const { connection_request_id } = body

    if (!connection_request_id) {
      return NextResponse.json(
        { error: 'connection_request_id is required' },
        { status: 400 }
      )
    }

    // Verify the user owns this business profile
    const { data: businessProfile, error: businessError } = await supabase
      .from('business_profiles')
      .select('id, business_name, name')
      .eq('user_id', user.id)
      .maybeSingle()

    if (businessError || !businessProfile) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 403 }
      )
    }

    // Verify the connection request exists, belongs to this business, and is pending (reconnection request)
    const { data: connectionRequest, error: connError } = await supabase
      .from('talent_connection_requests')
      .select('id, talent_id, business_id, status, selected_sections, created_at')
      .eq('id', connection_request_id)
      .eq('business_id', businessProfile.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (connError || !connectionRequest) {
      return NextResponse.json(
        { error: 'Connection request not found or not in pending status' },
        { status: 400 }
      )
    }

    // Get talent name for the response
    const { data: talentProfile } = await supabase
      .from('talent_profiles')
      .select('id, name, title')
      .eq('id', connectionRequest.talent_id)
      .maybeSingle()

    const talentName = talentProfile?.name || talentProfile?.title || 'Talent'
    const businessName = businessProfile.business_name || businessProfile.name || 'Business'

    // Update the connection request status back to 'accepted'
    // This reinstates the connection with all previous history intact
    // (messages, video chats, and shared sections are linked by talent_id/business_id, not by status)
    const { error: updateError } = await supabase
      .from('talent_connection_requests')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString()
      })
      .eq('id', connection_request_id)

    if (updateError) {
      console.error('[Accept Reconnect] Error updating connection status:', updateError)
      return NextResponse.json(
        { error: 'Failed to accept reconnection request' },
        { status: 500 }
      )
    }

    // Create a notification for the talent to let them know they're reconnected
    try {
      const { error: notifError } = await supabase
        .from('talent_notifications')
        .insert({
          talent_id: connectionRequest.talent_id,
          business_id: businessProfile.id,
          connection_request_id,
          notification_type: 'reconnect_accepted',
          title: `Reconnection Accepted by ${businessName}`,
          message: `Great news! ${businessName} has accepted your reconnection request. Your previous messages and history have been restored. You can now message them again.`,
          metadata: {
            accepted_by_user_id: user.id,
            business_name: businessName,
            original_connection_id: connection_request_id
          }
        })

      if (notifError) {
        // Table might not exist - that's okay, the connection status update is the main action
        if (!notifError.message?.includes('relation') && !notifError.message?.includes('does not exist')) {
          console.warn('[Accept Reconnect] Warning creating notification:', notifError.message)
        }
      }
    } catch (notifErr) {
      // Ignore notification errors - the main action (status update) succeeded
      console.log('[Accept Reconnect] Notification table may not exist, skipping notification')
    }

    // Mark any related business notification as read
    try {
      await supabase
        .from('business_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('connection_request_id', connection_request_id)
        .eq('business_id', businessProfile.id)
    } catch (err) {
      // Ignore - table may not exist
    }

    console.log('[Accept Reconnect] Connection restored:', {
      connection_request_id,
      talent_id: connectionRequest.talent_id,
      business_id: businessProfile.id,
      talent_name: talentName,
      business_name: businessName
    })

    return NextResponse.json({
      success: true,
      message: 'Reconnection accepted successfully. Previous messages and history have been restored.',
      talent_name: talentName
    })

  } catch (error: any) {
    console.error('[Accept Reconnect] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
