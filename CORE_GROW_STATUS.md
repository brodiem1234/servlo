# CORE + GROW Feature Status
**Date:** 2026-05-10  
**Build:** ✅ Zero TypeScript errors · Zero build errors

---

## CORE

### 1. JOBS PAGE
**Status: Working**
- Create job: ✅ Full server action with recurrence rule support
- Edit job: ✅ Server action with field fallback for schema-ahead columns (revenue, recurrence_rule, signoff fields)
- Change status: ✅ `updateJobStatusAction` — auto-creates invoice on complete
- Delete job: ✅ Soft-delete with undo toast
- Calendar/drag reschedule: ✅ Drag-to-day reschedule via `updateJobScheduleAction`
- Recurrence rule: ✅ Column present; recurring job generation via cron + `generateRecurringDates`

### 2. CLIENT PAGE
**Status: Working**
- Add client: ✅ Server action with portal_token generation
- Edit client: ✅ In-page slide-over edit panel
- Delete client: ✅ Soft-delete with confirmation
- Client detail page: ✅ Tabs for Jobs, Invoices, Notes, Properties, SMS

### 3. INVOICES
**Status: Working**
- Create invoice: ✅ With auto-populated client name
- Add line items: ✅ With pricebook autocomplete
- Save as draft: ✅
- Send: ✅ Via Resend with branded email
- Mark as paid: ✅ Sets paid_at timestamp
- PDF generation: ✅ `/api/invoice/[id]/pdf`
- Quick pay link: ✅ Copies to clipboard

### 4. QUOTES
**Status: Working**
- Create quote: ✅ With line items and pricebook picker
- Send for signature: ✅ Generates public token, sends email
- Public quote page `/q/[token]`: ✅ Loads with business branding
- Accept signature: ✅ Saves signature image, sends confirmation email

### 5. CALENDAR
**Status: Working**
- Jobs appear on calendar: ✅ Month calendar with job dots
- Drag to reschedule: ✅ `updateJobScheduleAction` server action
- Click job opens detail: ✅ Opens job slide-over panel

### 6. COMMS
**Status: Working**
- SMS thread: ✅ Displays with stub if Twilio not configured
- Email tab: ✅ Shows connection banner (Gmail/Outlook) or Resend fallback
- Email provider status badge: ✅ Shows "Sending from X@gmail.com via Gmail"

### 7. REPORTS
**Status: Working / Fixed**
- Charts load with real data: ✅ Monthly revenue + job counts
- Date range filter: ✅ 6-month and 12-month periods
- KPI cards: ✅ Revenue, jobs completed, avg job value, new clients
- Status breakdown chart: ✅ Pie/donut of job statuses
- Top clients chart: ✅ By revenue last 6 months
- **Fixed:** Removed non-existent `completed_at` column from SELECT; uses `created_at` for bucketing

### 8. PRICEBOOK
**Status: Working**
- Add item: ✅ Category, price, GST, labour/material toggle
- Edit item: ✅ Inline edit
- Delete item: ✅ With confirmation
- CSV import: ✅ `/api/pricebook/import`
- Template import: ✅ `/api/pricebook/import-template` (12 trade templates, 170+ items)

### 9. TEAM
**Status: Working / Fixed**
- Employees tab: ✅ Add/edit/deactivate employees
- Timesheets tab: ✅ Clock in/out with geofence support
- Performance tab: ✅ Hours, jobs completed, labour cost, utilisation
- Invite flow: ✅ Send invite → email via Resend → accept link → employee appears
- **Fixed:** Jobs query used `assigned_to` instead of `employee_id` — fixed in page.tsx and team-performance.tsx

### 10. SETTINGS
**Status: Working**
- Profile tab: ✅ Business name, ABN, address, contact
- Brand tab: ✅ Accent colour, tagline, brand voice (saves to businesses)
- Notifications tab: ✅ Toggle preferences
- Billing tab: ✅ Stripe portal link, plan display
- Security tab: ✅ Password change
- Integrations tab: ✅ Gmail/Outlook connect, Xero/MYOB, SERVLO Pay

### 11. DASHBOARD
**Status: Working**
- Today's jobs widget: ✅ Filtered by `scheduled_date = today`
- Revenue this month: ✅ Real paid invoice data
- Outstanding invoices: ✅ With "Send Reminder" action
- Morning briefing (AI): ✅ DayBriefingWidget with job/invoice context
- Profitability alerts: ✅ Flags low-margin completed jobs
- Materials reorder: ✅ MaterialsReorderWidget
- Churn risk: ✅ ChurnRiskWidget
- Weekly revenue chart: ✅ Mon–Sun bar chart

---

## GROW

### 1. AI AD STUDIO
**Status: Working / Fixed**
- Wizard completes all 7 steps: ✅
- Campaign saved to `grow_ad_campaigns`: ✅
- Step 7 summary: ✅ Shows created campaign fields
- AI copy generation: ✅ Calls Anthropic claude-3-5-haiku, mock fallback
- **Fixed:** POST response SELECT now includes `ad_copy` and `targeting` fields

### 2. SOCIAL CALENDAR
**Status: Working / Enhanced**
- Create post: ✅ With platform, caption, image URL, schedule date
- AI Generate caption button: ✅ Calls `/api/grow/generate-caption` (Anthropic)
- Calendar grid view: ✅ Month calendar with post dots
- List view: ✅ Table with platform, status, engagement
- Delete post: ✅ Soft-delete via PATCH with `deleted_at`
- Schedule post: ✅ Sets `scheduled_at` and status="scheduled"
- **Added:** "✨ Generate month" button — bulk-generates 30 posts via Anthropic (or mock fallback), spreads across weekdays at 9am, saves all to `grow_social_posts`

### 3. REVIEW HUB
**Status: Working / Enhanced**
- AI respond button: ✅ Calls Anthropic, generates response in business voice
- Save response: ✅ PATCH to `grow_review_responses`
- Send review request: ✅ Email via Resend (hardcoded Google review link — needs business Place ID to personalise)
- **Added:** Auto-seeds 5 realistic demo reviews (Google, ratings 3–5) if table is empty on first visit

### 4. REFERRAL PROGRAM
**Status: Working / Fixed**
- Referral list: ✅ CRUD from `grow_referrals`
- Add referral: ✅ POST with custom referral code
- Status updates: ✅ PATCH to update status (pending → converted → rewarded)
- `/ref/[code]` page: ✅ Loads with business name from `grow_referrals` lookup
- **Fixed:** Referral link now generates dynamically from owner ID (was hardcoded `YOUR-CODE`)

### 5. EMAIL MARKETING
**Status: Working**
- Create campaign: ✅ Name, subject, body, audience type, schedule
- Template selector: ✅ 5 templates pre-fill form fields
- Campaign saves to `grow_campaigns` (type="email"): ✅
- Send test email: ✅ Via Resend
- Audience types: ✅ All clients / Recent 90 days / High value (backend accepts, not yet filtered at DB level)

### 6. LOCAL SEO
**Status: Partial**
- Page loads with business data: ✅ Business name, suburb populated
- GBP mock stats: ✅ Displayed
- Keyword tracker: ✅ Displayed (client-side only, no DB persistence)
- **Remaining:** SEO score and citation tracking are UI-only; no Google Search Console integration

### 7. BRAND KIT
**Status: Working**
- Save brand colour: ✅ Saves to `businesses.accent_colour`
- Tagline save: ✅ Saves to `businesses.tagline`
- Brand voice save: ✅ Saves to `businesses.brand_voice`
- Preview updates in real time: ✅ Invoice and email footer previews
- **Remaining:** Logo upload UI exists (logo_url stored on businesses) but file picker not wired; set logo via URL manually or Supabase dashboard

### 8. AI MARKETING COACH
**Status: Working**
- Sends message: ✅ Chat UI with quick prompts
- Gets Anthropic response: ✅ Calls claude-3-5-haiku with business context
- Business context injected: ✅ business_name, suburb, state, phone, abn in system prompt
- Fallback responses: ✅ Stub if no API key

---

## Remaining Known Issues

| Area | Issue | Severity |
|------|-------|----------|
| Review Hub | Google review link is generic (`g.page/r/review`), not business-specific | Low |
| Local SEO | Citation tracking + SEO score are client-only (no persistence) | Low |
| Brand Kit | Logo upload file picker not wired (logo URL accepted manually) | Low |
| Email Marketing | Audience segmentation accepted but not yet enforced at DB query level | Low |
| Referral `/ref/[code]` | Shows SERVLO sign-up page (platform referral), not business-to-customer referral page | Medium |

---

## Build Verification
```
npm run typecheck  → ✅ No errors
npm run build      → ✅ 169 pages, zero errors
```
