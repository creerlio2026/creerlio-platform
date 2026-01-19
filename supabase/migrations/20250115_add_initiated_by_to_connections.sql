-- Add initiated_by field to talent_connection_requests
-- This tracks whether the connection was initiated by the talent or the business
-- Values: 'talent' (talent reached out to business) or 'business' (business found talent via search)

DO $$
BEGIN
  -- Add initiated_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'talent_connection_requests'
    AND column_name = 'initiated_by'
  ) THEN
    ALTER TABLE public.talent_connection_requests
    ADD COLUMN initiated_by TEXT DEFAULT 'talent'
    CHECK (initiated_by IN ('talent', 'business'));

    COMMENT ON COLUMN public.talent_connection_requests.initiated_by IS
      'Who initiated the connection: talent (talent reached out) or business (business found talent via map search)';
  END IF;

  -- Add reconnect_message column for storing the message when requesting reconnection
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'talent_connection_requests'
    AND column_name = 'reconnect_message'
  ) THEN
    ALTER TABLE public.talent_connection_requests
    ADD COLUMN reconnect_message TEXT;

    COMMENT ON COLUMN public.talent_connection_requests.reconnect_message IS
      'Message sent when requesting reconnection after a connection was withdrawn';
  END IF;

  -- Add reconnect_requested_by column to track who requested the reconnection
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'talent_connection_requests'
    AND column_name = 'reconnect_requested_by'
  ) THEN
    ALTER TABLE public.talent_connection_requests
    ADD COLUMN reconnect_requested_by TEXT
    CHECK (reconnect_requested_by IN ('talent', 'business', NULL));

    COMMENT ON COLUMN public.talent_connection_requests.reconnect_requested_by IS
      'Who requested reconnection after withdrawal: talent or business (NULL if not a reconnection)';
  END IF;
END $$;

-- Update existing records: assume talent-initiated if selected_sections has content
-- Business-initiated connections typically have empty or minimal selected_sections
UPDATE public.talent_connection_requests
SET initiated_by = CASE
  WHEN selected_sections IS NOT NULL
    AND selected_sections::text != '[]'
    AND selected_sections::text != '{}'
    AND jsonb_array_length(selected_sections) > 0
  THEN 'talent'
  ELSE 'business'
END
WHERE initiated_by IS NULL;
