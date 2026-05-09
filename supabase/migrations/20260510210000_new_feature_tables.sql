-- SMS messages table (for two-way SMS threads)
CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  thread_id UUID,
  to_number TEXT,
  from_number TEXT,
  message TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'sent',
  is_stub BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY sms_messages_owner_select ON sms_messages FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY sms_messages_owner_insert ON sms_messages FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY sms_messages_owner_update ON sms_messages FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY sms_messages_owner_delete ON sms_messages FOR DELETE USING (owner_id = auth.uid());

-- Job surveys table (for customer satisfaction surveys)
CREATE TABLE IF NOT EXISTS job_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- No RLS on job_surveys since surveys are submitted without auth
-- But add an index
CREATE INDEX IF NOT EXISTS idx_job_surveys_job_id ON job_surveys(job_id);

-- Add survey_token to jobs if not exists
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS survey_token UUID DEFAULT gen_random_uuid();
CREATE INDEX IF NOT EXISTS idx_jobs_survey_token ON jobs(survey_token);

-- Add tracking_token to jobs if not exists
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tracking_token UUID;
CREATE INDEX IF NOT EXISTS idx_jobs_tracking_token ON jobs(tracking_token);
