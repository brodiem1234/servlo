-- Add external_id column to sms_messages for Twilio SID tracking
ALTER TABLE sms_messages ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sms_messages_owner_client ON sms_messages (owner_id, client_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_messages_external_id ON sms_messages (external_id) WHERE external_id IS NOT NULL;
