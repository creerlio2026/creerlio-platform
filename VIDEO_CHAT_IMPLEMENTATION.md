# Video Chat Implementation Guide

## Overview

A complete video chat system has been implemented for connected Talent and Businesses, including:
- Video calls using WebRTC
- Recording functionality
- AI-powered conversation summaries
- Storage for recordings and summaries

## Database Schema

The following tables have been created:

### `video_chat_sessions`
- Stores video chat session metadata
- Tracks session status (pending, active, ended, cancelled)
- Records initiation details, duration, and recording status

### `video_recordings`
- Stores recording metadata
- Links to session and storage path
- Includes transcription text and processing status

### `conversation_summaries`
- Stores AI-generated conversation summaries
- Includes key points, action items, sentiment analysis
- Links to session and recording

**Migration:** Run `supabase/migrations/2025122518_create_video_chat_system.sql` in Supabase SQL Editor

## API Endpoints

### Next.js API Routes (Frontend)
- `POST /api/video-chat/initiate` - Initiate a video chat session
- `POST /api/video-chat/[sessionId]/start` - Start an active session
- `POST /api/video-chat/[sessionId]/end` - End a session
- `POST /api/video-chat/[sessionId]/recording/start` - Start recording
- `POST /api/video-chat/[sessionId]/recording/stop` - Stop recording and save
- `GET /api/video-chat/[sessionId]/summary` - Get conversation summary

### FastAPI Backend Endpoints (AI Summarization)
- `POST /api/video-chat/{session_id}/generate-summary` - Generate AI summary from transcription

## Frontend Components

### VideoChat Component (`frontend/src/components/VideoChat.tsx`)
- Full-screen video chat interface
- WebRTC peer connection (basic implementation)
- Local and remote video streams
- Mute/unmute and video on/off controls
- Recording start/stop functionality
- Call duration display
- Automatic session management

### ConversationSummary Component (`frontend/src/components/ConversationSummary.tsx`)
- Displays AI-generated conversation summary
- Shows key points, action items, topics, and sentiment
- Allows manual summary generation if not auto-generated
- Beautiful modal UI

## UI Integration

### Business Dashboard
- "Video Chat" button next to "Message" button in Connections tab
- Opens video chat modal when clicked
- Automatically enables recording

### Talent Dashboard
- "Video Chat" button next to "Messages" button in Connections tab
- Opens video chat modal when clicked
- Automatically enables recording

## Features

### ✅ Implemented
1. Video chat session management
2. Database schema and RLS policies
3. Recording infrastructure
4. AI conversation summarization (using OpenAI GPT-4)
5. Summary display after call ends
6. UI buttons and modals

### ⚠️ Needs Enhancement for Production

1. **WebRTC Implementation**
   - Current: Basic WebRTC with STUN servers
   - Recommended: Use Agora, Twilio, or similar service for:
     - Better connection reliability
     - Automatic recording
     - Built-in transcription
     - Better scaling

2. **Recording**
   - Current: Infrastructure in place, but actual recording needs MediaRecorder implementation or service integration
   - Recommended: Use Agora/Twilio recording APIs or implement MediaRecorder with upload to Supabase Storage

3. **Transcription**
   - Current: Expects transcription text to be provided
   - Recommended: Use service like:
     - Agora Cloud Recording (includes transcription)
     - Twilio Media Streams (includes transcription)
     - AssemblyAI or Deepgram for standalone transcription

4. **Room Token Generation**
   - Current: Simple UUIDs
   - Recommended: Generate actual tokens from WebRTC service (Agora/Twilio)

## Next Steps

1. **Run the migration:**
   ```sql
   -- Run supabase/migrations/2025122518_create_video_chat_system.sql in Supabase SQL Editor
   ```

2. **Set up WebRTC Service (Recommended):**
   - Sign up for Agora.io or Twilio
   - Update `VideoChat.tsx` to use service SDK
   - Update room token generation in `/api/video-chat/initiate`

3. **Implement Actual Recording:**
   - Option A: Use Agora/Twilio Cloud Recording (recommended)
   - Option B: Implement MediaRecorder API in VideoChat component
   - Upload recordings to Supabase Storage
   - Pass transcription to stop recording endpoint

4. **Test the Flow:**
   - Connect as Talent to a Business
   - Accept connection
   - Click "Video Chat" button
   - Start recording
   - End call
   - View conversation summary

## Configuration

### Environment Variables

Add to `.env.local` (frontend):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000  # For AI summarization
```

Add to `.env` (backend):
```env
OPENAI_API_KEY=your_openai_key  # For conversation summarization
OPENAI_MODEL=gpt-4-turbo-preview  # Optional, defaults to gpt-4-turbo-preview
```

## Notes

- The current WebRTC implementation is basic and intended for development
- For production, integrate with a professional WebRTC service
- Recording and transcription should be handled by the WebRTC service or a dedicated transcription service
- The AI summarization requires OpenAI API key and will automatically generate summaries when transcription is available
