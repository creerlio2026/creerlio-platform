import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple UUID generation function
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export async function POST(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.replace('Bearer ', '') || null
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No access token provided' }, { status: 401 })
    }
    
    // Create Supabase client with access token so RLS can access auth.uid()
    const supabase = await createClient(accessToken)
    
    // Verify user with access token
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('[Video Chat] Auth error:', userError)
      return NextResponse.json({ error: 'Unauthorized - Invalid or expired token' }, { status: 401 })
    }
    
    const body = await request.json()
    const { connection_request_id, initiated_by, recording_enabled = false } = body
    
    if (!connection_request_id || !initiated_by) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }
    
    if (!['talent', 'business'].includes(initiated_by)) {
      return NextResponse.json({ error: 'Invalid initiated_by value' }, { status: 400 })
    }
    
    // Verify connection request exists and is accepted
    // First check if it exists (without status filter) to get better error info
    const { data: connDataCheck, error: connCheckError } = await supabase
      .from('talent_connection_requests')
      .select('id, status, talent_id, business_id')
      .eq('id', connection_request_id)
      .maybeSingle()
    
    if (connCheckError) {
      console.error('[Video Chat] Error checking connection request:', connCheckError)
      return NextResponse.json({ 
        error: 'Failed to verify connection request',
        details: connCheckError.message 
      }, { status: 500 })
    }
    
    if (!connDataCheck) {
      console.error('[Video Chat] Connection request not found:', connection_request_id)
      return NextResponse.json({ error: 'Connection request not found' }, { status: 404 })
    }
    
    // Check if status is accepted (not discontinued or rejected)
    if (connDataCheck.status !== 'accepted') {
      console.error('[Video Chat] Connection request not accepted:', { 
        id: connection_request_id, 
        status: connDataCheck.status 
      })
      return NextResponse.json({ 
        error: 'Connection request not accepted',
        details: `Status is: ${connDataCheck.status}. Only accepted connections can start video chat.`
      }, { status: 403 })
    }
    
    // Get full connection data
    const { data: connData, error: connError } = await supabase
      .from('talent_connection_requests')
      .select('*')
      .eq('id', connection_request_id)
      .single()
    
    if (connError || !connData) {
      console.error('[Video Chat] Error fetching connection data:', connError)
      return NextResponse.json({ error: 'Failed to fetch connection data' }, { status: 500 })
    }
    
    const talentId = connData.talent_id
    const businessId = connData.business_id
    
    // Verify user has permission
    if (initiated_by === 'talent') {
      const { data: talentProfile } = await supabase
        .from('talent_profiles')
        .select('user_id')
        .eq('id', talentId)
        .single()
      
      if (!talentProfile || talentProfile.user_id !== user.id) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
      }
    } else {
      const { data: businessProfile } = await supabase
        .from('business_profiles')
        .select('user_id')
        .eq('id', businessId)
        .single()
      
      if (!businessProfile || businessProfile.user_id !== user.id) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
      }
    }
    
    // Generate room ID and token (for now, simple UUIDs - replace with Agora/Twilio token generation)
    const roomId = generateUUID()
    const roomToken = generateUUID() // Replace with actual WebRTC service token
    
    // Create video chat session
    const sessionData = {
      talent_id: talentId,
      business_id: businessId,
      connection_request_id: connection_request_id,
      status: 'pending',
      initiated_by: initiated_by,
      initiated_by_user_id: user.id,
      recording_enabled: recording_enabled,
      room_id: roomId,
      room_token: roomToken,
      started_at: null,
      ended_at: null
    }
    
    const { data: videoSession, error: sessionError } = await supabase
      .from('video_chat_sessions')
      .insert(sessionData)
      .select()
      .single()
    
    if (sessionError) {
      console.error('[Video Chat] Error creating session:', sessionError)
      return NextResponse.json({ error: 'Failed to create video chat session' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      session_id: videoSession.id,
      room_id: roomId,
      room_token: roomToken,
      session: videoSession
    })
    
  } catch (error: any) {
    console.error('[Video Chat] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to initiate video chat' }, { status: 500 })
  }
}
