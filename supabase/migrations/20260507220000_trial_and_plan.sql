-- Trial and plan selection columns
--
-- Adds product/plan selection data captured at signup and the Stripe trial
-- state written by /api/stripe/create-trial.
--
-- selected_products  — e.g. "core", "core+grow", "core+grow+leads"
-- plan_tier          — e.g. "solo", "team", "business", "enterprise",
--                      "starter", "pro", "agency"
-- trial_started_at   — UTC timestamp set when Stripe trial subscription is created
-- card_last4         — last 4 digits of the trial card (display only)
-- card_brand         — Stripe card brand string, e.g. "visa", "mastercard"
-- stripe_subscription_id — Stripe subscription ID written by create-trial endpoint

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS selected_products     text,
  ADD COLUMN IF NOT EXISTS plan_tier             text,
  ADD COLUMN IF NOT EXISTS trial_started_at      timestamptz,
  ADD COLUMN IF NOT EXISTS card_last4            text,
  ADD COLUMN IF NOT EXISTS card_brand            text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
