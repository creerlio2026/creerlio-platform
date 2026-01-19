-- Create talent_notifications table for business-to-talent notifications
-- This allows businesses to send opportunity notifications to talents who have withdrawn

CREATE TABLE IF NOT EXISTS talent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  connection_request_id UUID REFERENCES talent_connection_requests(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL DEFAULT 'opportunity', -- 'opportunity', 'reconnect_invite', 'job_match', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS talent_notifications_talent_id_idx ON talent_notifications(talent_id);
CREATE INDEX IF NOT EXISTS talent_notifications_talent_unread_idx ON talent_notifications(talent_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS talent_notifications_created_at_idx ON talent_notifications(created_at DESC);

-- RLS Policies
ALTER TABLE talent_notifications ENABLE ROW LEVEL SECURITY;

-- Talents can view their own notifications
CREATE POLICY "talent_notifications_select_own"
  ON talent_notifications
  FOR SELECT
  TO authenticated
  USING (
    talent_id IN (
      SELECT id FROM talent_profiles WHERE user_id = auth.uid()
    )
  );

-- Talents can update their own notifications (mark as read)
CREATE POLICY "talent_notifications_update_own"
  ON talent_notifications
  FOR UPDATE
  TO authenticated
  USING (
    talent_id IN (
      SELECT id FROM talent_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    talent_id IN (
      SELECT id FROM talent_profiles WHERE user_id = auth.uid()
    )
  );

-- Talents can delete their own notifications
CREATE POLICY "talent_notifications_delete_own"
  ON talent_notifications
  FOR DELETE
  TO authenticated
  USING (
    talent_id IN (
      SELECT id FROM talent_profiles WHERE user_id = auth.uid()
    )
  );

-- Businesses can insert notifications for talents they have/had connections with
CREATE POLICY "talent_notifications_business_insert"
  ON talent_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT id FROM business_profiles WHERE user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM talent_connection_requests tcr
      WHERE tcr.talent_id = talent_notifications.talent_id
      AND tcr.business_id = talent_notifications.business_id
    )
  );

-- Comment on table
COMMENT ON TABLE talent_notifications IS 'Notifications sent from businesses to talents, including opportunity invitations for withdrawn connections';
