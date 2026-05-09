# SERVLO V2 Build Log

> Format: `[HH:MM] <product> · <feature> · <files touched> · <gate status>`

## Phase 0 — Prep & Infrastructure

| Time | Product | Feature | Files | Status |
|------|---------|---------|-------|--------|
| 02:00 | INFRA | DB audit — deleted_at on all 7 core tables | verified via REST API | ✅ PASS |
| 02:05 | INFRA | New tables migration written | `supabase/migrations/20260510220000_v2_feature_tables.sql` | ✅ WRITTEN |
| 02:10 | INFRA | Migration application script | `scripts/apply-migrations.mjs` | ⚠️ MANUAL — needs SUPABASE_ACCESS_TOKEN |
| 02:15 | INFRA | BUILD_LOG.md created | `BUILD_LOG.md` | ✅ PASS |

### Phase 0 DB Status

Core tables (deleted_at verified ✅): businesses, jobs, clients, invoices, quotes, employees, timesheets

New tables in migration (need manual SQL application):
- `job_events`, `job_templates`, `owner_notifications`
- `sms_messages`, `job_surveys` 
- `pricebook_items`, `client_notes`, `client_properties`
- `compliance_documents`
- `grow_campaigns`, `grow_social_posts`, `grow_review_responses`, `grow_referrals`, `grow_ad_campaigns`
- `marketplace_leads`, `leads_accepted`, `lead_pipeline`
- `vehicles`, `vehicle_service_records`, `vehicle_trips`
- `bank_transactions`, `expense_claims`, `bas_lodgements`
- `job_postings`, `job_applications`, `onboarding_tasks`
- `call_logs`, `payment_transactions`

**To apply**: Open https://supabase.com/dashboard/project/isqnfuvgovzhyhkuynma/editor
and run `supabase/migrations/20260510220000_v2_feature_tables.sql`

### Phase 0 Env Vars Status
- `SUPABASE_SERVICE_ROLE_KEY` ✅ present
- `ANTHROPIC_API_KEY` ❌ missing — AI features will use mock responses  
- `OPENAI_API_KEY` ❌ missing — Voice transcription will stub
- `TWILIO_*` ❌ missing — SMS will stub gracefully
- `RESEND_API_KEY` ❌ missing — Email sending will stub
- `STRIPE_SECRET_KEY` ✅ present (LIVE — caution)

---

## Phase 1 — CORE

| Time | Product | Feature | Files | Status |
|------|---------|---------|-------|--------|
