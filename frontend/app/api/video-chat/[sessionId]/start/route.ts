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
    
    // Get session
    const { data: videoSession, error: sessionError } = await supabase
      .from('video_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !videoSession) {
      return NextResponse.json({ error: 'Video chat session not found' }, { status: 404 })
    }
    
    // Verify user has permission
    const isTalent = await supabase
      .from('talent_profiles')
      .select('id')
      .eq('id', videoSession.talent_id)
      .eq('user_id', user.id)
      .single()
    
    const isBusiness = await supabase
      .from('business_profiles')
      .select('id')
      .eq('id', videoSession.business_id)
      .eq('user_id', user.id)
      .single()
    
    if (!isTalent.data && !isBusiness.data) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }
    
    // Update session to active
    const { data: updatedSession, error: updateError } = await supabase
      .from('video_chat_sessions')
      .update({
        status: 'active',
        started_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()
    
    if (updateError) {
      return NextResponse.json({ error: 'Failed to start session' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      session: updatedSession,
      room_id: videoSession.room_id,
      room_token: videoSession.room_token
    })
    
  } catch (error: any) {
    console.error('[Video Chat] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to start video chat' }, { status: 500 })
  }
}
