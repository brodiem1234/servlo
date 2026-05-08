-- Account deletion grace period fields on profiles
-- Migration: 20260509100500_account_deletion.sql

alter table profiles add column if not exists deletion_requested_at timestamptz;
alter table profiles add column if not exists deletion_completes_at timestamptz;

-- TODO: Set up Supabase cron job or scheduled function:
-- Every day: delete users where deletion_completes_at < now()
-- Before deletion: anonymize records for legal retention (set user_id=null, anonymize PII)
-- Use service_role for this job:
--
-- SELECT cron.schedule(
--   'account-deletion-check',
--   '0 2 * * *',
--   $$
--   DELETE FROM auth.users WHERE id IN (
--     SELECT id FROM profiles
--     WHERE deletion_completes_at IS NOT NULL
--     AND deletion_completes_at < now()
--   );
--   $$
-- );
