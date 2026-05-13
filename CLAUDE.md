## Project identity
SERVLO — business management SaaS for Australian service businesses.
Supabase project: isqnfuvgovzhyhkuynma
Supabase URL: https://isqnfuvgovzhyhkuynma.supabase.co

## Stripe price IDs
Solo: price_1TTiL8K1tzStyRcJQAfbuJ5n
Team: price_1TTiLaK1tzStyRcJNOgCeg0X
Business: price_1TTiLyK1tzStyRcJ4BVJz0o8
Grow add-on: not yet created — create recurring $10/mo AUD price in Stripe dashboard, then set STRIPE_GROW_PRICE_ID in env

## Standing rules
- Never add schema-fallback branches — fix the schema with a migration instead
- All new tables need owner_id = auth.uid() RLS policies (4 policies: select/insert/update/delete)
- timesheets uses clock_in/clock_out/total_hours — no timesheet_entries table
- businesses is canonical for all business identity fields — never write business fields to profiles

--- everything /init generated below this line ---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — `next lint` (ESLint via `next/core-web-vitals` + `next/typescript`)
- `npm run typecheck` — `tsc --noEmit` (strict mode, no emit)

There is no test runner configured.

Path alias: `@/*` → `src/*`. Next.js has `experimental.typedRoutes` enabled, so `Link`/`redirect` typecheck against the route map; new routes need a build before TS recognises them.

Supabase migrations live in `supabase/migrations/`. The most recent name pattern is timestamped (`YYYYMMDDHHMMSS_*.sql`); the earliest are `0001_…`–`0005_…`. Apply them in order against the Supabase project. `supabase/sql/` holds ad-hoc helper scripts that aren't part of the migration sequence.

Required env (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.

## Architecture

### Stack
Next.js 14 App Router (RSC-first) + TypeScript, Supabase (auth + Postgres with RLS), Stripe (subscription billing), Resend (transactional email), Tailwind + shadcn-style UI primitives. No client-side state library — server actions and RSC handle data flow.

### Auth and role-based routing
Three roles live on `profiles.role`: `owner`, `employee`, `client`. The auth flow:

1. `src/middleware.ts` matches `/dashboard/:path*` and redirects unauthenticated users to `/auth/login`.
2. `src/app/dashboard/page.tsx` reads `profiles.role` and redirects to `/dashboard/owner`, `/dashboard/employee`, or `/dashboard/client`. There is no `/dashboard/owner` middleware enforcement beyond this — server components in each route reload the user and re-check.
3. `src/lib/auth.ts:canAccessPath` is a small UI helper; real authorisation is RLS in Postgres.

There are **three** Supabase client factories, and they are not interchangeable:
- `src/lib/supabase/server.ts` — RSC/server actions, reads/writes auth cookies.
- `src/lib/supabase/browser.ts` — client components.
- `src/lib/supabase/admin.ts` — `SUPABASE_SERVICE_ROLE_KEY`, bypasses RLS. Used by `/api/setup-business` and similar privileged routes. Never import from a client component.

### Owner workspace shell and feature flags
Owner-facing pages render inside `src/app/dashboard/owner-shell-layout.tsx` (re-exported by `src/app/dashboard/owner/layout.tsx` and used by sibling routes like `/dashboard/contractors`). The shell:

- Loads the user's business + industry tags + workspace feature flags.
- Filters the sidebar via `nav-config.ts` against the enabled feature set.
- Loads owner-side alerts (unpaid invoices, stale quotes) and owner_tasks.

Workspace features are stored on `businesses.feature_flags` as `{ enabled: string[] }`. The canonical id list lives in `src/lib/workspace-features.ts:WORKSPACE_FEATURE_IDS`. Adding/removing a feature requires updating that list, the `FEATURE_LABELS`/`FEATURE_DESCRIPTIONS` maps, and the `RECOMMENDED`/`OPTIONAL` per-industry maps in the same file. Two helpers fan out into route gating:

- `src/lib/workspace-feature-guard.ts` — `guardWorkspaceNav` redirects to `/dashboard/owner` when a route's required feature isn't enabled. Use it at the top of owner page server components.
- Composite gates: `schedulingEnabled` (jobs OR appointments) and `reportsBundleEnabled` (CRM/project/equipment) — used both for nav visibility and for `req: "scheduling" | "reports_bundle"` in `nav-config.ts`.

`resolveEffectiveFeatures` treats `null`/missing flags as **all features on** for legacy rows; new rows always serialise an explicit enabled list via `serializeFeatureFlags`.

### Industries
`src/lib/industries.ts` defines the closed slug set (`trades`, `cleaning`, `events`, `marketing`, `health`, `field_services`, `other`). Industries drive: recommended/optional features at signup, the personalised Getting Started checklist, and onboarding copy. They are stored as a JSON array on `profiles.industry_tags` and (for newer rows) on `businesses.industries`.

### Database canonicalisation (read this before touching SQL)
The schema went through a corrective consolidation — see `supabase/migrations/20260507123500_corrective_schema_consolidation.sql` and the most recent commit on `master`:

- `businesses` is keyed on `owner_id` only. The legacy `user_id` mirror has been dropped; do **not** reintroduce it. RLS policies on `businesses` and child tables match `owner_id = auth.uid()`.
- Profile business fields (`business_name`, `abn`, `address`, `suburb`, `state`, `postcode`) were migrated into `businesses` and dropped from `profiles`. Read business identity from `businesses`, not `profiles`.
- Trial fields are canonical on `profiles.trial_start` / `profiles.trial_end`. The old `trial_end_date` column is gone.
- `invoices.amount`/`invoices.gst_amount`, `quotes.gst_amount`/`quotes.client_name` were dropped as duplicates — derive these.

When adding a new owner-scoped table, follow the pattern of the later RLS migrations (`20260509160000_clients_rls_manage_own.sql`, `20260510200000_jobs_rls_owner_scope.sql`): enable RLS, add `owner_id uuid not null references auth.users(id)`, and write `*_owner_select|insert|update|delete` policies keyed on `auth.uid() = owner_id`.

### Demo data
Owner accounts can be seeded with demo records via `src/lib/demo/seed-owner-demo.ts`. Demo rows carry `is_demo = true`. The visibility rules (in `src/lib/demo/visibility.ts`) are deliberately asymmetric:

- **List views** show real + demo rows together (badged with `DemoBadge`). `filterDemoEntities` is currently a passthrough — keep it that way unless changing the product rule.
- **Financial aggregates** must use `excludeDemoFinancial` so demo rows never inflate revenue, outstanding amounts, etc.

When you add a new owner-side aggregate (totals, counts that feed money/reminders), apply `excludeDemoFinancial` before summing. New tables that participate in demo seeding need an `is_demo` column.

### Brand accent colour
`businesses.accent_colour` is rendered into a CSS custom property at the top of the dashboard tree (`src/app/dashboard/layout.tsx` → `AccentInlineScript` for SSR + `AccentColourProvider` for client updates). When you need the accent in a server component, read it from `businesses` directly; on the client use `useAccentColour`. `DEFAULT_ACCENT_HEX` and `normalizeAccentHexForCss` live in `src/lib/brand-accent.ts`.

### Signup / onboarding bootstrap
The signup flow (`/auth/signup` → `/onboarding/complete-profile`) writes industries to `auth.user_metadata` first, then `/api/setup-business` (service-role) creates the `businesses` row, calls `bootstrapSignupProfiles`, optionally seeds demo data, and sends the welcome email. Errors that need to surface to `/onboarding/complete-profile` go through the `ONBOARDING_FLASH_COOKIE` cookie (`src/lib/onboarding-flash.ts`) rather than the URL.
