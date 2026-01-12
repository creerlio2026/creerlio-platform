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
    
    const body = await request.json().catch(() => ({}))
    const duration_seconds = body.duration_seconds || null
    
    // Get session
    const { data: videoSession, error: sessionError } = await supabase
      .from('video_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !videoSession) {
      return NextResponse.json({ error: 'Video chat session not found' }, { status: 404 })
    }
    
    // Calculate duration if not provided
    let finalDuration = duration_seconds
    if (!finalDuration && videoSession.started_at) {
      const started = new Date(videoSession.started_at)
      const ended = new Date()
      finalDuration = Math.floor((ended.getTime() - started.getTime()) / 1000)
    }
    
    // Update session to ended
    const { data: updatedSession, error: updateError } = await supabase
      .from('video_chat_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        duration_seconds: finalDuration || 0
      })
      .eq('id', sessionId)
      .select()
      .single()
    
    if (updateError) {
      return NextResponse.json({ error: 'Failed to end session' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      session: updatedSession
    })
    
  } catch (error: any) {
    console.error('[Video Chat] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to end video chat' }, { status: 500 })
  }
}
