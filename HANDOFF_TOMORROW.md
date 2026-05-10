# SERVLO — Overnight Build Handoff

**Session date:** 2026-05-10  
**Branch:** `claude/wonderful-sinoussi-445f19` → commit `2055a5bc`  
**Supabase project:** isqnfuvgovzhyhkuynma  
**Build status:** ✓ Compiled successfully (zero TypeScript errors)  
**Files changed:** 53 files, +6,178 / -242 lines

---

## 🚨 CRITICAL: DB Migration Required

Apply this migration before merging to production:

**File:** `supabase/migrations/20260510210000_new_feature_tables.sql`

Go to: https://supabase.com/dashboard/project/isqnfuvgovzhyhkuynma/editor

Adds:
- `sms_messages` table (for two-way SMS threads)
- `job_surveys` table (for satisfaction surveys)
- `survey_token` column on `jobs`
- `tracking_token` column on `jobs`

Also still pending from previous session:
- `supabase/migrations/20260510130000_add_deleted_at_to_all_soft_delete_tables.sql`

---

## ✅ What Was Built This Session

### CORE — Phase 1 Polish

| Feature | Files | Status |
|---------|-------|--------|
| Morning Briefing Widget | `src/components/dashboard/day-briefing-widget.tsx` + `src/app/api/ai/day-briefing/route.ts` | ✅ Done |
| Cmd+K Command Palette | `src/components/dashboard/command-palette.tsx` — expanded with quick nav + quotes search | ✅ Done |
| Voice-to-Job | `src/app/api/ai/voice-to-job/route.ts` + `src/components/dashboard/voice-to-job-button.tsx` | ✅ Done |
| Photo-to-Quote | `src/app/api/ai/photo-to-quote/route.ts` + `src/components/dashboard/photo-to-quote-button.tsx` | ✅ Done |
| Job Profitability Alerts | `src/app/api/alerts/job-profitability/route.ts` + `src/components/dashboard/profitability-alerts.tsx` | ✅ Done |
| Customer Churn Scoring | `src/app/api/alerts/churn-risk/route.ts` + `src/components/dashboard/churn-risk-widget.tsx` | ✅ Done |
| Satisfaction Survey | `src/app/api/surveys/satisfaction/route.ts` + `src/app/survey/[token]/page.tsx` | ✅ Done |
| SMS Threads | `src/app/api/sms/send/route.ts` + `src/app/api/sms/thread/[client_id]/route.ts` + `src/components/dashboard/sms-thread.tsx` | ✅ Done |
| Quick-Pay SMS Link | `src/app/api/invoices/[id]/quick-pay-sms/route.ts` + `src/app/pay/[invoiceId]/page.tsx` | ✅ Done |
| Live Tracking Link | `src/app/api/jobs/[id]/tracking/route.ts` + `src/app/track/[token]/page.tsx` | ✅ Done |
| Geofenced Clock-In/Out | `src/app/api/timesheets/geofence-clock/route.ts` + `src/components/dashboard/geofence-clock.tsx` | ✅ Done |
| Materials Reorder Alerts | `src/app/api/alerts/materials-reorder/route.ts` + `src/components/dashboard/materials-reorder-widget.tsx` | ✅ Done |
| Photo Annotations | `src/components/dashboard/photo-annotator.tsx` + `src/components/dashboard/photo-gallery.tsx` | ✅ Done |

### GROW — Phase 2 MVP

| Section | Status |
|---------|--------|
| Ad Studio (7-step wizard) | ✅ Already built |
| Social Calendar | ✅ Already built |
| Review Hub | ✅ Already built |
| Referral Program + QR codes | ✅ Already built |
| Email Marketing | ✅ Built this session (`src/app/dashboard/grow/email/page.tsx`) |
| Local SEO | ✅ Built this session (`src/app/dashboard/grow/seo/page.tsx`) |
| Brand Kit | ✅ Built this session (`src/app/dashboard/grow/brand/page.tsx`) |
| AI Marketing Coach | ✅ Built this session (`src/app/dashboard/grow/coach/page.tsx`) |

### LEADS — Phase 3

| Feature | Status |
|---------|--------|
| Pipeline Kanban (drag-drop) | ✅ Already built |
| Browse marketplace leads | ✅ Already built |
| AI Lead Scoring | ✅ Built this session (`src/app/api/leads/score/route.ts`) |
| Score badge UI on browse page | ✅ Built this session |

### Product Scaffolds (Phases 4-8)

All products upgraded from LockedOverlay → real demoable scaffolds:

| Product | Path | Status |
|---------|------|--------|
| ANSWER | `src/app/dashboard/answer/page.tsx` | ✅ Rebuilt |
| PAY | `src/app/dashboard/pay/page.tsx` | ✅ Rebuilt |
| FLEET | `src/app/dashboard/fleet/page.tsx` | ✅ Rebuilt |
| FINANCE HUB | `src/app/dashboard/finance-hub/page.tsx` | ✅ Rebuilt |
| HIRE | `src/app/dashboard/hire/page.tsx` | ✅ Rebuilt |

### Cross-Product Polish

- **ProductSwitcher** — moved ANSWER/PAY/FLEET/FINANCE/HIRE to Active section (8/13 active)
- **GROW nav** — added Email, SEO, Brand Kit, AI Coach nav items to grow-shell.tsx

---

## 🔧 Integration Stubs (need real keys to activate)

| Integration | Env Var | What it unlocks |
|-------------|---------|-----------------|
| Twilio SMS | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Real two-way SMS, tracking link SMS, quick-pay SMS |
| OpenAI Whisper | `OPENAI_API_KEY` | Voice-to-job transcription |
| Anthropic (already set?) | `ANTHROPIC_API_KEY` | Day briefing, voice parsing, photo-to-quote, AI coach, churn, profitability |

---

## 🗺 What's Still TODO

### High priority (carry-over items — see session 2 additions below)
1. ~~**Wire up new widgets to dashboard**~~ ✅ Done in session 2
2. ~~**Photo annotations in jobs-manager**~~ ✅ Done in session 2
3. ~~**SMS tab in comms**~~ ✅ Done in session 2 (already wired)

### DB schema
- Apply both pending migrations (see CRITICAL section above)
- The `pricebook_items` table may need `quantity_on_hand` and `reorder_threshold` columns for materials alerts to work on real data (currently stubs)

### Remaining build (not started this session)
- `/dashboard/grow/social` — already has the full social calendar client; just needs the layout page to not be a `"use client"` redirect
- HIRE ATS kanban — has basic structure; could use drag-drop like LEADS pipeline
- FLEET GPS integration — needs a real GPS provider (e.g. Trak Global)

---

## 🏗 Architecture Notes

### New public routes added
- `/survey/[token]` — Customer satisfaction survey (no auth)
- `/track/[token]` — Live job tracking (no auth)
- `/pay/[invoiceId]` — Quick-pay landing page (no auth, uses admin client)

### API patterns used
All new API routes follow existing patterns:
- Auth: `createClient()` from `@/lib/supabase/server`
- Admin: `createAdminClient()` for public routes needing DB access
- AI rate limiting: uses `checkAILimit` + `logAICall` from existing lib
- Soft deletes: `.is('deleted_at', null)` on all SELECTs ✓

---

## 🧪 Demo walkthrough for "Bob's Plumbing"

1. Log in → dashboard shows Morning Briefing widget, Today's Jobs, stats
2. Press `Cmd+K` → shows quick nav + search with quotes support
3. Go to Jobs → job cards have photo gallery with annotation capability
4. Go to Comms → email threads + SMS thread tab (stub mode banner)
5. Go to GROW → full Ad Studio, Social Calendar, Review Hub, new Email/SEO/Brand Kit/AI Coach
6. Go to LEADS → browse marketplace + AI score button, kanban pipeline
7. Go to ANSWER/PAY/FLEET/FINANCE/HIRE → demoable scaffolds (no LockedOverlay)
8. ProductSwitcher → shows 8/13 products active

---

---

## Session 2 additions (2026-05-10 continuation)

| Feature | Files | Status |
|---------|-------|--------|
| Widget wiring (ChurnRisk, VoiceToJob, PhotoToQuote) | `src/app/dashboard/owner/page.tsx` | ✅ Done |
| PhotoGallery + GeofenceClock in jobs-manager | `src/app/dashboard/owner/jobs/jobs-manager.tsx` | ✅ Done |
| Quote public-token link & invoice pay button | `src/app/portal/[token]/portal-client.tsx` | ✅ Done |
| Magic link login page | `src/app/portal/login/page.tsx` | ✅ Done |
| Local SEO manager (real data) | `src/app/dashboard/grow/seo/` | ✅ Done |
| Quote public share link | `src/app/api/quotes/[id]/token/route.ts` + `src/app/q/[token]/` | ✅ Done |
| Invoice partial payments | `src/app/api/invoices/[id]/payments/route.ts` | ✅ Done |
| Job history panel | `src/app/dashboard/owner/jobs/job-history-panel.tsx` | ✅ Done |
| Onboarding checklist rewrite | `src/components/dashboard/onboarding-checklist.tsx` | ✅ Done |
| Pricebook CSV import | `src/app/dashboard/owner/pricebook/pricebook-import.tsx` | ✅ Done |
| Compliance manager rewrite | `src/app/dashboard/owner/compliance/compliance-manager.tsx` | ✅ Done |
| Schedule week view | `src/app/dashboard/schedule/schedule-week-view.tsx` | ✅ Done |
| Team performance tab | `src/app/dashboard/owner/team/team-performance.tsx` | ✅ Done |

### Still pending for next session
- FLEET GPS integration stub (real GPS provider)
- Apply pending DB migrations via Supabase SQL editor (3 new migrations this session)

---

## Session 4 additions (2026-05-10 continuation)

| Feature | Files | Status |
|---------|-------|--------|
| Loading skeletons — 38 routes | `dashboard/**/loading.tsx` | ✅ Done |
| Fix `owner_notifications` table name (was `notifications`) | All notification files | ✅ Fixed |
| Fix notification columns: `link`, `title`, `read` | All notification files | ✅ Fixed |
| Add `paid_at` + owner notification on Stripe invoice payment | `api/stripe/webhook/route.ts` | ✅ Done |
| `user_referrals` migration | `supabase/migrations/20260517120000_user_referrals.sql` | ✅ Done |
| Add `deleted_at` filter to schedule page | `dashboard/schedule/page.tsx` | ✅ Fixed |
| Graceful 42P01 for `audit_log` | `owner/audit-log/page.tsx` | ✅ Fixed |
| Fix weekly-summary cron `link` column | `api/cron/weekly-summary/route.ts` | ✅ Fixed |

### Migrations to apply
1. `supabase/migrations/20260517100000_expense_claims_employee_id.sql`
2. `supabase/migrations/20260516100000_businesses_brand_fields.sql`
3. `supabase/migrations/20260517120000_user_referrals.sql`

_Generated by Claude — overnight build session 2026-05-10 (session 4)_

---

## Session 5 additions (2026-05-10 continuation)

| Feature | Files | Status |
|---------|-------|--------|
| Add `deleted_at` to all owner dashboard queries | `src/lib/dashboard/owner.ts` | ✅ Fixed |
| Fix `invoices.amount` → `total` in daily-digest cron | `api/cron/daily-digest/route.ts` | ✅ Fixed |
| Add `deleted_at` + `is_demo` to cron routes | `daily-digest`, `weekly-summary`, `bas-helper` | ✅ Fixed |
| Referral landing page `/ref/[code]` | `src/app/ref/[code]/page.tsx` | ✅ Done |
| Referral redirect `/refer/[code]` | `src/app/refer/[code]/page.tsx` | ✅ Done |
| Referral code lookup API | `api/grow/referrals/code/[code]/route.ts` | ✅ Done |
| Wire referral tracking through signup + setup-business | `signup-form.tsx`, `api/setup-business/route.ts` | ✅ Done |
| Fix referralUrl to point at `/auth/signup?ref=` | `src/lib/referral.ts` | ✅ Fixed |
| Disambiguate user_referrals vs grow_referrals in setup-business | `api/setup-business/route.ts` | ✅ Fixed |
| Loading skeletons — 14 remaining routes | `connect`, `admin`, `client`, `academy`, `insurance` | ✅ Done |
| Fix `clients.name` → `full_name` in invoice/quote PDF | `api/invoice/[id]/pdf`, `api/quote/[id]/pdf` | ✅ Fixed |
| Fix dropped `quotes.client_name` in sign route | `api/quotes/[id]/sign/route.ts` | ✅ Fixed |
| Fix employee expense ownerId undefined bug | `api/employee/expenses/route.ts` | ✅ Fixed |
| Add `deleted_at` to client export + automations trigger | `api/export/clients`, `api/automations/trigger` | ✅ Fixed |

### Migrations to apply (unchanged from Session 4)
1. `supabase/migrations/20260517100000_expense_claims_employee_id.sql`
2. `supabase/migrations/20260516100000_businesses_brand_fields.sql`
3. `supabase/migrations/20260517120000_user_referrals.sql`

_Generated by Claude — overnight build session 2026-05-10 (session 5)_
