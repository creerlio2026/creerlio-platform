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
    
    const body = await request.json()
    const { storage_path, transcription_text } = body
    
    if (!storage_path) {
      return NextResponse.json({ error: 'Storage path is required' }, { status: 400 })
    }
    
    // Verify session exists
    const { data: videoSession, error: sessionError } = await supabase
      .from('video_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !videoSession) {
      return NextResponse.json({ error: 'Video chat session not found' }, { status: 404 })
    }
    
    // Create recording record
    const recordingData: any = {
      session_id: sessionId,
      recording_type: 'full',
      storage_path: storage_path,
      processing_status: transcription_text ? 'pending' : 'processing'
    }
    
    if (transcription_text) {
      recordingData.transcription_text = transcription_text
    }
    
    const { data: recording, error: recordingError } = await supabase
      .from('video_recordings')
      .insert(recordingData)
      .select()
      .single()
    
    if (recordingError) {
      console.error('[Video Chat] Error saving recording:', recordingError)
      return NextResponse.json({ error: 'Failed to save recording' }, { status: 500 })
    }
    
    // If transcription is available, generate summary automatically
    let summaryId = null
    if (transcription_text) {
      try {
        // Call FastAPI backend to generate summary
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
        const summaryResponse = await fetch(`${backendUrl}/api/video-chat/${sessionId}/generate-summary?email=${encodeURIComponent(session.user.email || '')}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json()
          summaryId = summaryData.summary?.id || null
        }
      } catch (summaryError) {
        console.error('[Video Chat] Error generating summary:', summaryError)
        // Continue without summary - it can be generated later
      }
    }
    
    return NextResponse.json({
      success: true,
      recording: recording,
      summary_id: summaryId,
      message: 'Recording stopped and saved'
    })
    
  } catch (error: any) {
    console.error('[Video Chat] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to stop recording' }, { status: 500 })
  }
}
