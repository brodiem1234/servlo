-- Core Round 1 migrations
-- Run in order against the Supabase project.

-- Feature: Pay Now button on invoice emails
-- Stores the Stripe Payment Link URL generated at invoice creation time.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_link text;

-- Feature: Photo upload on jobs — quick filtering flag
-- Set to true by the server action whenever a photo is uploaded to a job.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS has_photos boolean NOT NULL DEFAULT false;

-- Feature: Connected job flow — quote → job linkage
-- Allows a job to be traced back to the quote it was created from.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL;

-- Storage bucket:
-- The "job-photos" bucket must be created via Supabase Dashboard or CLI.
-- Dashboard: Storage → New bucket → Name: job-photos, Public: true
-- CLI:  supabase storage create-bucket job-photos --public
