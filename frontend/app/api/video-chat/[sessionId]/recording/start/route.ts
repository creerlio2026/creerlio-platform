import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    
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
    
    // Verify session exists and is active
    const { data: videoSession, error: sessionError } = await supabase
      .from('video_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('status', 'active')
      .single()
    
    if (sessionError || !videoSession) {
      return NextResponse.json({ error: 'Active video chat session not found' }, { status: 404 })
    }
    
    if (!videoSession.recording_enabled) {
      return NextResponse.json({ error: 'Recording is not enabled for this session' }, { status: 400 })
    }
    
    // Update session with recording started
    const { data: updatedSession, error: updateError } = await supabase
      .from('video_chat_sessions')
      .update({
        recording_started_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()
    
    if (updateError) {
      return NextResponse.json({ error: 'Failed to start recording' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      session: updatedSession,
      message: 'Recording started'
    })
    
  } catch (error: any) {
    console.error('[Video Chat] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to start recording' }, { status: 500 })
  }
}
