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

## Phase 1 — CORE (Session 1 — pre-compaction)

| Feature | Files | Status |
|---------|-------|--------|
| Morning Briefing Widget | `day-briefing-widget.tsx` + `api/ai/day-briefing` | ✅ PASS |
| Cmd+K Command Palette (expanded) | `command-palette.tsx` | ✅ PASS |
| Voice-to-Job | `voice-to-job-button.tsx` + `api/ai/voice-to-job` | ✅ PASS |
| Photo-to-Quote | `photo-to-quote-button.tsx` + `api/ai/photo-to-quote` | ✅ PASS |
| Profitability Alerts | `profitability-alerts.tsx` + `api/alerts/job-profitability` | ✅ PASS |
| Churn Risk Widget | `churn-risk-widget.tsx` + `api/alerts/churn-risk` | ✅ PASS |
| Satisfaction Survey | `survey/[token]/page.tsx` + `api/surveys/satisfaction` | ✅ PASS |
| SMS Threads (Twilio) | `sms-thread.tsx` + `api/sms/*` | ✅ PASS |
| Quick-Pay SMS Link | `pay/[invoiceId]/page.tsx` + `api/invoices/[id]/quick-pay-sms` | ✅ PASS |
| Live Job Tracking | `track/[token]/page.tsx` + `api/jobs/[id]/tracking` | ✅ PASS |
| Geofenced Clock-In | `geofence-clock.tsx` + `api/timesheets/geofence-clock` | ✅ PASS |
| Materials Reorder Alerts | `materials-reorder-widget.tsx` + `api/alerts/materials-reorder` | ✅ PASS |
| Photo Gallery + Annotator | `photo-gallery.tsx` + `photo-annotator.tsx` | ✅ PASS |
| Team Performance Tab | `team-performance.tsx` | ✅ PASS |
| Pricebook CSV Import | `pricebook-import.tsx` + `api/pricebook/import` | ✅ PASS |
| Compliance Manager (24 templates) | `compliance-manager.tsx` | ✅ PASS |
| Schedule Week View (drag-drop) | `schedule-week-view.tsx` | ✅ PASS |
| Job History Panel | `job-history-panel.tsx` + `api/jobs/[id]/events` | ✅ PASS |
| Onboarding Checklist (rewrite) | `onboarding-checklist.tsx` | ✅ PASS |

### Phase 1 GROW additions
| Feature | Files | Status |
|---------|-------|--------|
| Email Marketing page | `grow/email/page.tsx` | ✅ PASS |
| Local SEO Manager (real data) | `grow/seo/` | ✅ PASS |
| Brand Kit page | `grow/brand/page.tsx` | ✅ PASS |
| AI Marketing Coach | `grow/coach/page.tsx` | ✅ PASS |

### Phase 1 Portal additions
| Feature | Files | Status |
|---------|-------|--------|
| Quote public share + signature | `q/[token]/` + `api/quotes/[id]/sign` + `api/quotes/[id]/token` | ✅ PASS |
| Invoice partial payments | `api/invoices/[id]/payments` | ✅ PASS |
| Client portal enhancements | `portal/[token]/portal-client.tsx` | ✅ PASS |

---

## Phase 2 — Session 2 (2026-05-10 continuation)

| Time | Feature | Files | Status |
|------|---------|-------|--------|
| Widget wiring | `owner/page.tsx` — ChurnRiskWidget, VoiceToJobButton, PhotoToQuoteButton | ✅ PASS |
| Jobs manager photo gallery | `jobs-manager.tsx` — PhotoGallery + GeofenceClock | ✅ PASS |
| Portal Pay Now + View & Sign | `portal/[token]/portal-client.tsx` | ✅ PASS |
| Magic link login page | `portal/login/page.tsx` | ✅ PASS |
| /docs site (20 pages) | `src/app/docs/**` | ✅ PASS |
| HANDOFF_TOMORROW.md updated | `HANDOFF_TOMORROW.md` | ✅ PASS |

### Phase 2 TypeScript gate
All commits: zero `tsc --noEmit` errors ✅

---

## Phase 1 — CORE (legacy — see Phase 1 detail table above)
