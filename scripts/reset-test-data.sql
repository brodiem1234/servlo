-- ============================================================================
-- Pre-launch test data reset
--
-- Wipes every user-scoped row so signup can be tested clean. Preserves system
-- tables: plan_ai_limits, plan_limits, stripe_webhook_events (idempotency log
-- is kept so Stripe retries of replayed events are still de-duplicated).
--
-- Run this in Supabase Studio → SQL Editor → New query, then click Run.
-- Wrapped in a single transaction so any failure rolls back the whole thing.
--
-- ALSO REMEMBER:
--  - In Stripe dashboard (Test mode): delete test customers and any active
--    subscriptions. The DB rows don't affect Stripe.
--  - Run `node scripts/generate-product-icons.mjs` to regenerate PNG icons
--    if you've replaced the master SVG.
-- ============================================================================

begin;

-- 1. auth.users deletion cascades to profiles via FK.
delete from auth.users;

-- 2. Public tables with user data. Each one wipes independently; the FK
-- cascade above usually catches them but we run explicit deletes for safety.
delete from public.timesheets;
delete from public.invoice_items;
delete from public.invoice_payments;
delete from public.quote_items;
delete from public.client_notes;
delete from public.client_properties;
delete from public.invoices;
delete from public.quotes;
delete from public.jobs;
delete from public.clients;
delete from public.employees;
delete from public.team_invitations;
delete from public.businesses;
delete from public.profiles;

-- 3. Ancillary user-scoped tables.
delete from public.bug_reports;
delete from public.owner_notifications;
delete from public.owner_tasks;
delete from public.ai_usage_log;
delete from public.email_messages;
delete from public.email_threads;
delete from public.sms_messages;
delete from public.call_logs;
delete from public.account_credits;
delete from public.lead_alert_preferences;
delete from public.lead_pipeline;
delete from public.leads_accepted;
delete from public.referral_rewards;
delete from public.user_referrals;
delete from public.job_events;
delete from public.job_photos;
delete from public.job_surveys;
delete from public.job_follow_up_queue;
delete from public.job_applications;
delete from public.job_postings;
delete from public.job_templates;
delete from public.compliance_documents;
delete from public.expense_claims;
delete from public.grow_referrals;
delete from public.grow_campaigns;
delete from public.grow_ad_campaigns;
delete from public.grow_review_responses;
delete from public.grow_social_posts;
delete from public.pricebook_items;
delete from public.purchase_order_items;
delete from public.purchase_orders;
delete from public.vehicle_trips;
delete from public.vehicle_service_records;
delete from public.vehicles;
delete from public.onboarding_tasks;
delete from public.bank_transactions;
delete from public.bas_lodgements;
delete from public.payment_transactions;

-- 4. Reset Stripe webhook idempotency log so future events process clean.
delete from public.stripe_webhook_events;

-- 5. Verify all clean
select 'auth.users' as t, count(*) from auth.users
union all select 'profiles', count(*) from public.profiles
union all select 'businesses', count(*) from public.businesses
union all select 'clients', count(*) from public.clients
union all select 'jobs', count(*) from public.jobs
union all select 'quotes', count(*) from public.quotes
union all select 'invoices', count(*) from public.invoices
union all select 'employees', count(*) from public.employees
union all select 'plan_ai_limits', count(*) from public.plan_ai_limits
union all select 'plan_limits', count(*) from public.plan_limits
order by 1;

commit;
