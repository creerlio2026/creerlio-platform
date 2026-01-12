-- Video Chat System for Talent-Business Connections
-- Supports video calls, recording, and AI-powered conversation summaries

-- Video Chat Sessions Table
CREATE TABLE IF NOT EXISTS public.video_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_id UUID NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    connection_request_id UUID REFERENCES public.talent_connection_requests(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'ended', 'cancelled')) DEFAULT 'pending',
    initiated_by TEXT NOT NULL CHECK (initiated_by IN ('talent', 'business')),
    initiated_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    recording_enabled BOOLEAN DEFAULT false,
    recording_started_at TIMESTAMPTZ,
    room_token TEXT, -- For WebRTC service (e.g., Agora, Twilio)
    room_id TEXT, -- Room identifier for WebRTC
    extra_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Video Recordings Table
CREATE TABLE IF NOT EXISTS public.video_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.video_chat_sessions(id) ON DELETE CASCADE,
    recording_type TEXT NOT NULL CHECK (recording_type IN ('full', 'audio_only', 'video_only')) DEFAULT 'full',
    storage_path TEXT, -- Path in Supabase Storage
    storage_bucket TEXT DEFAULT 'video-recordings',
    file_size_bytes BIGINT,
    duration_seconds INTEGER,
    file_format TEXT DEFAULT 'mp4',
    transcription_path TEXT, -- Path to transcription file if available
    transcription_text TEXT, -- Full transcription text
    processing_status TEXT NOT NULL CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    extra_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversation Summaries Table
CREATE TABLE IF NOT EXISTS public.conversation_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.video_chat_sessions(id) ON DELETE CASCADE,
    recording_id UUID REFERENCES public.video_recordings(id) ON DELETE SET NULL,
    summary_type TEXT NOT NULL CHECK (summary_type IN ('ai_generated', 'user_notes')) DEFAULT 'ai_generated',
    summary_text TEXT NOT NULL,
    key_points JSONB DEFAULT '[]'::jsonb, -- Array of key discussion points
    action_items JSONB DEFAULT '[]'::jsonb, -- Array of action items
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    ai_model_used TEXT, -- e.g., 'gpt-4-turbo-preview'
    processing_status TEXT NOT NULL CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    extra_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_chat_sessions_talent_id ON public.video_chat_sessions(talent_id);
CREATE INDEX IF NOT EXISTS idx_video_chat_sessions_business_id ON public.video_chat_sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_video_chat_sessions_status ON public.video_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_video_chat_sessions_connection_request_id ON public.video_chat_sessions(connection_request_id);
CREATE INDEX IF NOT EXISTS idx_video_recordings_session_id ON public.video_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_video_recordings_processing_status ON public.video_recordings(processing_status);
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_session_id ON public.conversation_summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_recording_id ON public.conversation_summaries(recording_id);

-- Enable RLS
ALTER TABLE public.video_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_chat_sessions
-- Talent can view their own sessions
CREATE POLICY "Talent can view own video chat sessions"
ON public.video_chat_sessions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.talent_profiles tp
        WHERE tp.id = video_chat_sessions.talent_id
        AND tp.user_id = auth.uid()
    )
);

-- Business can view their own sessions
CREATE POLICY "Business can view own video chat sessions"
ON public.video_chat_sessions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.business_profiles bp
        WHERE bp.id = video_chat_sessions.business_id
        AND bp.user_id = auth.uid()
    )
);

-- Users can create sessions if they have an accepted connection
CREATE POLICY "Users can create video chat sessions for accepted connections"
ON public.video_chat_sessions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.talent_connection_requests tcr
        WHERE tcr.id = video_chat_sessions.connection_request_id
        AND tcr.status = 'accepted'
        AND (
            (video_chat_sessions.initiated_by = 'talent' AND 
             EXISTS (SELECT 1 FROM public.talent_profiles tp WHERE tp.id = video_chat_sessions.talent_id AND tp.user_id = auth.uid()))
            OR
            (video_chat_sessions.initiated_by = 'business' AND 
             EXISTS (SELECT 1 FROM public.business_profiles bp WHERE bp.id = video_chat_sessions.business_id AND bp.user_id = auth.uid()))
        )
    )
);

-- Users can update their own sessions
CREATE POLICY "Users can update own video chat sessions"
ON public.video_chat_sessions FOR UPDATE
USING (
    initiated_by_user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.talent_profiles tp
        WHERE tp.id = video_chat_sessions.talent_id
        AND tp.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.business_profiles bp
        WHERE bp.id = video_chat_sessions.business_id
        AND bp.user_id = auth.uid()
    )
);

-- RLS Policies for video_recordings
-- Users can view recordings for their sessions
CREATE POLICY "Users can view recordings for own sessions"
ON public.video_recordings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.video_chat_sessions vcs
        WHERE vcs.id = video_recordings.session_id
        AND (
            EXISTS (
                SELECT 1 FROM public.talent_profiles tp
                WHERE tp.id = vcs.talent_id AND tp.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.business_profiles bp
                WHERE bp.id = vcs.business_id AND bp.user_id = auth.uid()
            )
        )
    )
);

-- Users can insert recordings for their sessions
CREATE POLICY "Users can create recordings for own sessions"
ON public.video_recordings FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.video_chat_sessions vcs
        WHERE vcs.id = video_recordings.session_id
        AND (
            EXISTS (
                SELECT 1 FROM public.talent_profiles tp
                WHERE tp.id = vcs.talent_id AND tp.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.business_profiles bp
                WHERE bp.id = vcs.business_id AND bp.user_id = auth.uid()
            )
        )
    )
);

-- Users can update recordings for their sessions
CREATE POLICY "Users can update recordings for own sessions"
ON public.video_recordings FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.video_chat_sessions vcs
        WHERE vcs.id = video_recordings.session_id
        AND (
            EXISTS (
                SELECT 1 FROM public.talent_profiles tp
                WHERE tp.id = vcs.talent_id AND tp.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.business_profiles bp
                WHERE bp.id = vcs.business_id AND bp.user_id = auth.uid()
            )
        )
    )
);

-- RLS Policies for conversation_summaries
-- Users can view summaries for their sessions
CREATE POLICY "Users can view summaries for own sessions"
ON public.conversation_summaries FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.video_chat_sessions vcs
        WHERE vcs.id = conversation_summaries.session_id
        AND (
            EXISTS (
                SELECT 1 FROM public.talent_profiles tp
                WHERE tp.id = vcs.talent_id AND tp.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.business_profiles bp
                WHERE bp.id = vcs.business_id AND bp.user_id = auth.uid()
            )
        )
    )
);

-- Users can create summaries for their sessions
CREATE POLICY "Users can create summaries for own sessions"
ON public.conversation_summaries FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.video_chat_sessions vcs
        WHERE vcs.id = conversation_summaries.session_id
        AND (
            EXISTS (
                SELECT 1 FROM public.talent_profiles tp
                WHERE tp.id = vcs.talent_id AND tp.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM public.business_profiles bp
                WHERE bp.id = vcs.business_id AND bp.user_id = auth.uid()
            )
        )
    )
);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_video_chat_sessions
    BEFORE UPDATE ON public.video_chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_video_recordings
    BEFORE UPDATE ON public.video_recordings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_conversation_summaries
    BEFORE UPDATE ON public.conversation_summaries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
