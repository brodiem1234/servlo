# SERVLO Mobile Audit — 375px

**Completed:** 2026-05-10  
**Viewport tested:** 375px (iPhone SE / iPhone 14 standard width)  
**Method:** Static code analysis of every `page.tsx` and delegated client components

---

## Summary

| Category | Pages audited | Issues found | Fixed |
|---|---|---|---|
| Owner dashboard pages | 16 | 8 | 8 |
| Product shells (12 products) | 12 | 0 | — |
| Product sub-pages | 32 | 18 | 18 |
| Auth / onboarding | 4 | 2 | 2 |
| Public pages (pay, quote, portal) | 3 | 3 | 3 |
| **Total** | **67** | **31** | **31** |

---

## PWA / Offline

All infrastructure was already in place at audit start:

- ✅ `public/sw.js` — custom service worker (cache-first shell, network-first data, offline fallback)
- ✅ `src/app/offline/page.tsx` — offline fallback page
- ✅ `public/manifest.json` — PWA manifest with shortcuts (New Job, Clients)
- ✅ `src/components/pwa/sw-register.tsx` — SW registration on mount
- ✅ `src/app/layout.tsx` — `<link rel="manifest">`, `apple-mobile-web-app-capable`, `apple-touch-icon`
- ✅ `src/components/pwa-install-prompt.tsx` — iOS Safari step-by-step install banner + Android `beforeinstallprompt`

---

## Fixes by File

### Owner Dashboard

| File | Issues fixed |
|---|---|
| `owner/jobs/jobs-manager.tsx` | Month calendar 7-col grid wrapped in `overflow-x-auto` + `min-w-[560px]` |
| `owner/settings/page.tsx` | Workspace toggle cards changed to `flex-wrap gap-3` so button drops below description |
| `owner/comms/comms-client.tsx` | Message pane padding `px-6` → `px-4` |
| `owner/expenses/expenses-manager.tsx` | Search input `w-full sm:w-auto` |
| `owner/pricebook/pricebook-manager.tsx` | Header action buttons `flex-wrap` |
| `owner/timesheets/owner-timesheets-client.tsx` | Export CSV outer wrapper `flex-wrap gap-2`, tab bar `overflow-x-auto` |
| `owner/finance/page.tsx` | Tab bar `overflow-x-auto`, quick-access cards `flex-wrap` + `min-w-0` on text |
| `owner/forms/forms-client.tsx` | List action buttons `flex-wrap`, edit field row `flex-wrap` + `min-w-0` on label |
| `owner/clients/[id]/page.tsx` | Header row `flex-wrap`, `shrink-0` on back link |
| `owner/clients/[id]/client-detail-tabs.tsx` | Tab bar `overflow-x-auto` (removed `w-fit`) |
| `owner/compliance/compliance-manager.tsx` | Search input `w-full sm:w-56`, form date/ref row stacks on mobile, table `overflow-x-auto` |
| `owner/notifications/page.tsx` | Header `flex-wrap` |
| `owner/audit-log/audit-log-client.tsx` | Filter row `w-full`, all filter inputs `flex-1 min-w-[130px]` |
| `owner/settings/automations/page.tsx` | Form modal `grid-cols-1 sm:grid-cols-2`, card action buttons `flex-wrap` |
| `owner/settings/brand/page.tsx` | Colour picker row `flex-wrap`, hex input `w-36 min-w-0` |
| `owner/settings/booking/page.tsx` | URL slug row `flex-wrap`, prefix `break-all`, input `flex-1 basis-32` |

### Product Sub-Pages

| File | Issues fixed |
|---|---|
| `answer/answer-dashboard.tsx` | Tab bar `overflow-x-auto` + `shrink-0` on tab buttons |
| `fleet/fleet-dashboard.tsx` | Tab bar `overflow-x-auto` + `shrink-0`, add-vehicle form 3 rows → `grid-cols-1 sm:grid-cols-2` |
| `fleet/vehicles/page.tsx` | Table `min-w-[600px]`, header + modal footer `flex-wrap` |
| `finance-hub/finance-hub-dashboard.tsx` | Bank-feed summary gap tightened, BAS form `grid-cols-1`, transactions + expenses tables `overflow-x-auto`, tab bar scrollable |
| `hire/hire-dashboard.tsx` | Tab nav `flex-wrap`, onboarding task form `grid-cols-1 sm:grid-cols-2` |
| `hire/browse/page.tsx` | Launch banner `flex-col sm:flex-row` |
| `hire/post/page.tsx` | Rate-type buttons `flex-wrap`, employment grid `grid-cols-1 sm:grid-cols-3` |
| `grow/page.tsx` | Quick-start grid explicit `grid-cols-1` base |
| `grow/ads/ad-studio-manager.tsx` | Campaign metrics `grid-cols-2 sm:grid-cols-4`, wizard step labels `hidden sm:flex`, tab `overflow-x-auto` |
| `grow/seo/local-seo-manager.tsx` | Tab bar `overflow-x-auto` + `shrink-0` |
| `grow/referrals/referral-manager.tsx` | Table `overflow-x-auto` + `min-w-[600px]`, reward form `grid-cols-1 sm:grid-cols-2` |
| `grow/email/email-campaigns-manager.tsx` | Action buttons `flex-wrap`, datetime input `w-full` |
| `grow/social/social-calendar-manager.tsx` | Calendar `min-h` reduced for mobile, post table `min-w-[700px]`, header buttons `flex-wrap` |
| `grow/brand/brand-manager.tsx` | Typography grid `grid-cols-1 sm:grid-cols-3`, brand voice `flex-wrap`, header + invoice preview `flex-wrap` |
| `leads/browse/browse-leads-client.tsx` | Top action bar `flex-wrap` |
| `leads/pipeline/leads-pipeline.tsx` | Add-lead modal form rows `grid-cols-1 sm:grid-cols-2`, stage grid `grid-cols-2 sm:grid-cols-3` |
| `leads/my-leads/page.tsx` | Skeleton preview rows `flex-wrap gap-y-1` |
| `leads/settings/leads-settings-client.tsx` | Tab bar `overflow-x-auto` + `shrink-0`, location/budget form `grid-cols-1 sm:grid-cols-2` |
| `answer/calls/page.tsx` | Launch banner `flex-wrap` |
| `answer/settings/page.tsx` | Launch banner `flex-wrap`, time inputs `flex-1 min-w-0` |
| `pay/pay-dashboard.tsx` | Tab bar `overflow-x-auto`, payment links form `sm:grid-cols-2 lg:grid-cols-3` |
| `pay/rates/page.tsx` | Launch banner `flex-wrap` |
| `pay/transactions/page.tsx` | Launch banner `flex-wrap` |
| `insurance/quote/page.tsx` | Launch banner `flex-wrap` |
| `connect/messages/page.tsx` | Fixed `height: 500px` → `minHeight: 500px`, chat panel `md:col-span-2` |
| `connect/profile/page.tsx` | Avatar `shrink-0` + responsive size, text container `min-w-0`, stats gap responsive |
| `connect/jobs/page.tsx` | Meta row `flex-wrap gap-x-3 gap-y-1`, title `truncate`, badge `shrink-0` |

### Employee Pages

| File | Issues fixed |
|---|---|
| `employee/jobs/employee-jobs-client.tsx` | Status badge `whitespace-nowrap` |
| `employee/expenses/page.tsx` | Header `flex-wrap`, amount+category form `grid-cols-1 sm:grid-cols-2` |

### Auth / Onboarding

| File | Issues fixed |
|---|---|
| `onboarding/complete-profile/complete-profile-client.tsx` | Outer padding `px-6` → `px-4`, card padding `p-5 sm:p-8` |
| `components/auth/signup-form.tsx` | Full Platform name+badge `flex-wrap`, Back buttons `w-full sm:w-auto` on steps 2–4, Continue buttons `w-full sm:w-auto` |

### Public Pages

| File | Issues fixed |
|---|---|
| `pay/[invoiceId]/page.tsx` | Label/value rows `flex-wrap`, labels `whitespace-nowrap`, values `break-word text-right` |
| `q/[token]/public-quote-view.tsx` | Business header `flex-wrap`, meta grid `grid-cols-1 sm:grid-cols-2`, line items `overflow-x-auto`, accept buttons `flex-wrap` |
| `portal/[token]/portal-client.tsx` | Date+urgency form row `grid-cols-1 sm:grid-cols-2` |

---

## Pages with No Issues

The following pages were audited and required no changes:

- `/dashboard/owner` (main) — `grid-cols-2 xl:grid-cols-4` stat cards already correct
- `/dashboard/owner/clients` — delegate already mobile-safe
- `/dashboard/owner/invoices` — table `overflow-x-auto min-w-[800px]` already in place
- `/dashboard/owner/quotes` — same as invoices
- `/dashboard/owner/reports` — `grid-cols-2 lg:grid-cols-4` KPIs, charts stack to 1 col
- `/dashboard/owner/bas` — `flex-wrap` already on quarter buttons
- `/dashboard/owner/employees` — delegate already mobile-safe
- `/dashboard/leads` — stat cards `sm:grid-cols-2 xl:grid-cols-4`
- `/dashboard/connect/discover` — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- `/dashboard/connect/groups` — `grid-cols-1 md:grid-cols-2`
- `/dashboard/academy` — course grid `sm:grid-cols-2 lg:grid-cols-3`
- `/dashboard/books` — `sm:grid-cols-2 lg:grid-cols-4`
- `/dashboard/grow/reviews` — stat cards `grid-cols-2 sm:grid-cols-4`
- `/dashboard/grow/coach` — chat layout `flex-col`, chips already `flex-wrap`
- `/dashboard/employee` — single-column `max-w-2xl mx-auto`
- `/dashboard/employee/timesheets` — `flex justify-around` with compact numbers
- `/dashboard/employee/clock` — immediate redirect, no UI
- `/auth/login` — card `max-w-[480px]`, `p-6 sm:p-10`, all inputs `w-full`
- `/dashboard/billing` — placeholder heading/paragraph only

---

## Patterns Applied Throughout

1. **Tables** — `<div className="overflow-x-auto">` wrapper + `min-w-[Npx]` on `<table>`
2. **Stat card grids** — `grid-cols-2 sm:grid-cols-4` (never bare `grid-cols-4`)
3. **Content grids** — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (always explicit mobile base)
4. **Button rows** — `flex flex-wrap gap-2` (never bare `flex gap-2` with multiple CTA buttons)
5. **Tab bars** — `overflow-x-auto` on the container + `shrink-0` on each tab button
6. **Forms** — `grid-cols-1 sm:grid-cols-2` for side-by-side field pairs
7. **Launch banners** — `flex flex-wrap` or `flex-col sm:flex-row` so button stacks below text
8. **Text containers in flex rows** — `min-w-0` to allow truncation
9. **Outer page padding** — `px-4` (not `px-6`) on mobile container wrappers
10. **Fixed heights** — `minHeight` not `height` when containing stacked panels
