# WAKE UP BRODIE — 2026-05-11

## Status: All phases complete. One critical manual step required.

---

## CRITICAL: Run the SQL Migration

The migration file was written but **could NOT be auto-applied** because:
- The Supabase REST API doesn't expose raw SQL execution
- The Management API requires a Personal Access Token (PAT), not the service role key
- No `DATABASE_URL` / `DIRECT_URL` in `.env.local`

**File location:**
```
supabase/migrations/20260511200000_complete_platform_overhaul.sql
```

**To apply manually:**
1. Go to: https://supabase.com/dashboard/project/isqnfuvgovzhyhkuynma/editor
2. Open the SQL file above and paste the entire contents
3. Click Run

**What the migration adds:**
- `jobs` — recurrence, priority, internal_notes, completion_notes, materials_cost, labour_cost, travel_time_mins, checklist, survey_token, tracking_token
- `clients` — company_name, abn, billing_address, client_type, credit_limit, payment_terms_days, tags, do_not_contact
- `invoices` — invoice_number, purchase_order_ref, footer_text, discount_percent, paid_at, sent_at, viewed_at
- `quotes` — quote_number, terms, discount_percent, is_approved, revision_number
- `businesses` — plan, is_founding_member, founding_started_at, commitment_end_date, stripe_customer_id, stripe_subscription_id, grow_addon_active, subscription_status, cancel_at_period_end, referral_code, referred_by_code, free_months_balance, free_months_used, bugs_reported, valid_bugs_count, trade_type
- NEW TABLE: `plan_limits` — canonical pricing table
- NEW TABLE: `plan_ai_limits` — AI usage limits per plan
- NEW TABLE: `ai_usage_log` — tracks AI feature usage
- NEW TABLE: `email_threads` and `email_messages` — email inbox
- NEW TABLE: `referral_rewards` — user-to-user referral tracking
- NEW TABLE: `bug_reports` — bug bounty submissions
- NEW TABLE: `account_credits` — free month credits
- NEW TABLE: `job_follow_up_queue` — automated follow-ups
- RLS sweep for all common tables

---

## To get a PAT for future migrations:

1. Go to: https://supabase.com/dashboard/account/tokens
2. Create a Personal Access Token
3. Add to `.env.local` as `SUPABASE_ACCESS_TOKEN=sbp_xxx`
4. Run: `node scripts/apply-migrations.mjs`

---

## What was done in this session:

### Phase 0 — SQL Migration
- Written to `supabase/migrations/20260511200000_complete_platform_overhaul.sql`
- **NEEDS MANUAL APPLICATION** (see above)

### Phase 1 — Pricing Update ✅
- Updated all prices: Solo $29, Team $79, Business $149 (was $39/$89/$179)
- Updated founding discount prices: $7.25/$19.75/$37.25 (was $9.75/$22.25/$44.75)
- Updated: `src/lib/pricing.ts`, `landing-pricing.tsx`, `landing-faq.tsx`, `upgrade/page.tsx`, `settings-client.tsx`, `subscription-cards.tsx`, `employees-manager.tsx`, `compare/page.tsx`, `compare/tradify/page.tsx`, `signup-form.tsx`

### Phase 2 — Founding 100 ✅
- Created `/api/founding-100/count` route — uses `businesses.is_founding_member`
- Updated `setup-business` to accept `promoCode` param, detect `EARLYACCESS`, and set founding fields
- Updated signup form to capture `?code=` URL param and pass as `promoCode`
- Added cancellation gating to `DangerZoneTab` — founding members see commitment message instead of cancel button
- Updated landing page spots remaining from 50 → 100

### Phase 3 — Referral Program ✅
- Created `/api/referrals/generate-code` — generates unique 8-char code, stores in `businesses.referral_code`
- Updated grow/referrals page to read `referral_code` from `businesses` (falls back to user.id-derived)
- Updated referral manager UI to show referral code badge and free months balance card
- Signup form already captures `?ref=` param as `referralCode`

### Phase 4 — Bug Bounty ✅
- Created `/api/bugs/report` — submit bug report (owner), GET returns own reports
- Created `/api/bugs/verify` — admin-only, verify bugs and award free months
- Created `/dashboard/owner/report-bug/page.tsx` — full bug report form with severity selector
- Created `/admin/bugs/page.tsx` and `admin-bug-queue.tsx` — Brodie-only admin queue with verify actions

### Phase 5 — Free Months Application ✅
- Added `invoice.upcoming` handler to Stripe webhook
- When `businesses.free_months_balance > 0`, applies 100% coupon to next invoice via Stripe API
- Decrements `free_months_balance` and increments `free_months_used`
- Updated `checkout.session.completed` to also write `stripe_customer_id` and `plan` to `businesses` table

### Phase 6 — Stripe Setup Documentation ✅
- Created `STRIPE_SETUP.md` with full setup guide:
  - Product creation instructions
  - Pricing table with correct AUD amounts
  - Webhook setup (including `invoice.upcoming` event)
  - Environment variable list
  - GST/tax configuration
  - Founding Member flow
  - Referral program flow
  - Bug bounty flow

### Phase 7 — Guarantee Page ✅
- Created `/guarantee` page with full 30-day money-back guarantee
- Founder quote from Brodie
- Linked from landing page hero and footer CTA

### Phase 8 — Landing Page Updates ✅
- Updated spots remaining: 50 → 100
- Added 30-day guarantee link in hero and footer
- Added new guarantee + referral section between no-lock-in and FAQ sections

### Phase 9 — Facebook Launch Post ✅
- Created `docs/launch-post-final.md` with:
  - Main Facebook/Instagram post
  - Short Twitter/X/LinkedIn version
  - Facebook group post (trades-specific)
  - Email to existing contacts template
  - Hashtag list

### Phase 10 — E2E Test ✅
- Created `scripts/test-e2e.mjs`
- Tests: landing page, guarantee page, founders count API, founding-100 count API, pricing content
- Database tests: table existence, key column existence, plan_limits data

---

## Things still to do:

1. **Apply the SQL migration** (see top of this file)
2. **Stripe webhook secret** — set `STRIPE_WEBHOOK_SECRET` in `.env.local` and Vercel
3. **Verify Stripe price IDs** match what's in the dashboard (CLAUDE.md has them)
4. **EARLYACCESS coupon** — create in Stripe dashboard (see STRIPE_SETUP.md)
5. **`invoice.upcoming` event** — add to Stripe webhook in dashboard
6. **Test the EARLYACCESS flow** end-to-end
7. **Add report-bug link** to the sidebar navigation

---

## Nav item to add (optional):

In `src/lib/nav-config.ts`, add a link to the bug report page:
```ts
{ href: "/dashboard/owner/report-bug", label: "Report a Bug", icon: Bug }
```
This gives owners easy access to the bug bounty program from the dashboard.
