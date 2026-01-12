-- Update messaging system to work with talent_connection_requests instead of talent_access_grants
-- This allows messaging between talent and business when they have an accepted connection

-- Ensure conversations table exists
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL,
  business_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (talent_id, business_id)
);

-- Ensure messages table exists
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('talent', 'business')),
  sender_user_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraints if they don't exist (with defensive error handling)
DO $$
BEGIN
  -- Add foreign key to talent_profiles if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversations_talent_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE public.conversations 
      ADD CONSTRAINT conversations_talent_id_fkey 
      FOREIGN KEY (talent_id) REFERENCES public.talent_profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create foreign key to talent_profiles: %', SQLERRM;
    END;
  END IF;

  -- Add foreign key to business_profiles if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversations_business_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE public.conversations 
      ADD CONSTRAINT conversations_business_id_fkey 
      FOREIGN KEY (business_id) REFERENCES public.business_profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create foreign key to business_profiles: %', SQLERRM;
    END;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS conversations_talent_id_idx ON public.conversations(talent_id);
CREATE INDEX IF NOT EXISTS conversations_business_id_idx ON public.conversations(business_id);
CREATE INDEX IF NOT EXISTS messages_conversation_id_created_at_idx ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop old policies that use talent_access_grants
DROP POLICY IF EXISTS "conversations_select_with_active_grant" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_with_active_grant" ON public.conversations;
DROP POLICY IF EXISTS "messages_select_via_conversation" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_with_active_grant_and_role" ON public.messages;

-- Drop old helper function if it exists
DROP FUNCTION IF EXISTS public._has_active_talent_access_for_pair(UUID, UUID);

-- Create new helper function that checks for accepted connection requests
CREATE OR REPLACE FUNCTION public._has_accepted_connection(_talent_id UUID, _business_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.talent_connection_requests tcr
    WHERE tcr.talent_id = _talent_id
      AND tcr.business_id = _business_id
      AND tcr.status = 'accepted'
  );
$$;

-- Conversations: SELECT only if you're the talent owner or business owner AND connection is accepted
CREATE POLICY "conversations_select_with_accepted_connection"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  public._has_accepted_connection(talent_id, business_id)
  AND (
    EXISTS (
      SELECT 1 FROM public.talent_profiles tp 
      WHERE tp.id = conversations.talent_id 
      AND tp.user_id::text = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM public.business_profiles bp 
      WHERE bp.id = conversations.business_id 
      AND bp.user_id::text = auth.uid()::text
    )
  )
);

-- Conversations: INSERT only if you're the talent owner or business owner AND connection is accepted
CREATE POLICY "conversations_insert_with_accepted_connection"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  public._has_accepted_connection(talent_id, business_id)
  AND (
    EXISTS (
      SELECT 1 FROM public.talent_profiles tp 
      WHERE tp.id = conversations.talent_id 
      AND tp.user_id::text = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM public.business_profiles bp 
      WHERE bp.id = conversations.business_id 
      AND bp.user_id::text = auth.uid()::text
    )
  )
);

-- Messages: SELECT only if you can SELECT the parent conversation (and connection is accepted)
CREATE POLICY "messages_select_via_conversation"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND public._has_accepted_connection(c.talent_id, c.business_id)
      AND (
        EXISTS (
          SELECT 1 FROM public.talent_profiles tp 
          WHERE tp.id = c.talent_id 
          AND tp.user_id::text = auth.uid()::text
        )
        OR EXISTS (
          SELECT 1 FROM public.business_profiles bp 
          WHERE bp.id = c.business_id 
          AND bp.user_id::text = auth.uid()::text
        )
      )
  )
);

-- Messages: INSERT only if sender matches your role AND you can access the parent conversation (and connection is accepted)
CREATE POLICY "messages_insert_with_accepted_connection_and_role"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND public._has_accepted_connection(c.talent_id, c.business_id)
      AND (
        (messages.sender_type = 'talent'
          AND EXISTS (
            SELECT 1 FROM public.talent_profiles tp 
            WHERE tp.id = c.talent_id 
            AND tp.user_id::text = auth.uid()::text
            AND messages.sender_user_id::text = auth.uid()::text
          )
        )
        OR
        (messages.sender_type = 'business'
          AND EXISTS (
            SELECT 1 FROM public.business_profiles bp 
            WHERE bp.id = c.business_id 
            AND bp.user_id::text = auth.uid()::text
            AND messages.sender_user_id::text = auth.uid()::text
          )
        )
      )
  )
);

-- Add updated_at trigger for conversations
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conversations_updated_at_trigger ON public.conversations;
CREATE TRIGGER conversations_updated_at_trigger
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();
