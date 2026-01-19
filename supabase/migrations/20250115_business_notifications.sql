-- Create business_notifications table for talent-to-business notifications
-- This allows talents to send reconnection requests to businesses

CREATE TABLE IF NOT EXISTS business_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  talent_id UUID NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  connection_request_id UUID REFERENCES talent_connection_requests(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL DEFAULT 'reconnect_request', -- 'reconnect_request', 'message', 'application', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS business_notifications_business_id_idx ON business_notifications(business_id);
CREATE INDEX IF NOT EXISTS business_notifications_business_unread_idx ON business_notifications(business_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS business_notifications_created_at_idx ON business_notifications(created_at DESC);

-- RLS Policies
ALTER TABLE business_notifications ENABLE ROW LEVEL SECURITY;

-- Businesses can view their own notifications
CREATE POLICY "business_notifications_select_own"
  ON business_notifications
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM business_profiles WHERE user_id = auth.uid()
    )
  );

-- Businesses can update their own notifications (mark as read)
CREATE POLICY "business_notifications_update_own"
  ON business_notifications
  FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM business_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM business_profiles WHERE user_id = auth.uid()
    )
  );

-- Businesses can delete their own notifications
CREATE POLICY "business_notifications_delete_own"
  ON business_notifications
  FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM business_profiles WHERE user_id = auth.uid()
    )
  );

-- Talents can insert notifications for businesses they have/had connections with
CREATE POLICY "business_notifications_talent_insert"
  ON business_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    talent_id IN (
      SELECT id FROM talent_profiles WHERE user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM talent_connection_requests tcr
      WHERE tcr.talent_id = business_notifications.talent_id
      AND tcr.business_id = business_notifications.business_id
    )
  );

-- Comment on table
COMMENT ON TABLE business_notifications IS 'Notifications sent from talents to businesses, including reconnection requests';
