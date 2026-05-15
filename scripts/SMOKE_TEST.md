# SERVLO Pre-Launch Smoke Test

Run this before flipping Stripe to live mode and announcing the founding 50.
Allocate ~30 minutes. Tick each box. Anything red = fix before launch.

## Environment check

- [ ] `STRIPE_SECRET_KEY` in Vercel starts with `sk_test_` (until KYC complete)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` matches (`pk_test_`)
- [ ] `CRON_SECRET` is set (any 32+ char random string)
- [ ] `RESEND_API_KEY` is set
- [ ] `RESEND_FROM_EMAIL` is `hello@servlo.com.au` (or your verified domain)
- [ ] `NEXT_PUBLIC_APP_URL` is `https://servlo.app` (no localhost, has https://)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` set (optional for launch, important for production)
- [ ] `STRIPE_AUTOMATIC_TAX_ENABLED` is **unset** or `false` until you configure
      Stripe Tax registrations for Australia in the Stripe dashboard

## Stripe dashboard

- [ ] Webhook endpoint configured: `https://servlo.app/api/stripe/webhook`
- [ ] Webhook events subscribed:
      `checkout.session.completed`,
      `customer.subscription.created`,
      `customer.subscription.updated`,
      `customer.subscription.deleted`,
      `invoice.paid`,
      `invoice.payment_failed`,
      `invoice.upcoming`
- [ ] `EARLYACCESS` promotion code created and active
- [ ] Three live price IDs created: Solo $29/mo, Team $79/mo, Business $149/mo
- [ ] Receipt branding configured (logo + business name + ABN)

## Resend / email

- [ ] `servlo.com.au` domain verified (SPF + DKIM + DMARC records added)
- [ ] Send a test email from Resend dashboard → arrives in your inbox, not spam

## Signup flow (live site, incognito)

- [ ] Step 1: name, email, business name, phone, valid ABN, strong password
      → "Continue" works
- [ ] Bad ABN `00 000 000 000` → **rejected** (test ABN bypass is dev-only)
- [ ] Weak password → blocks step 1 advance with clear message
- [ ] Step 2-4: industries, products, plan → all work
- [ ] Step 5: card form loads, EARLYACCESS auto-applied (visible in promo field)
- [ ] Submit with test card `4242 4242 4242 4242` → lands on `/dashboard/owner`
- [ ] Card field SHOWN, not hidden (no "no credit card" claims anywhere)
- [ ] Dashboard shows your business name + ABN without re-entry needed
- [ ] Sidebar shows founder badge (if you're founder #1-50)
- [ ] Stripe dashboard → Customers → your test customer appears with EARLYACCESS coupon

## Core CRUD (logged in)

- [ ] Create a client → appears in Clients tab
- [ ] Create a job → appears in Jobs tab
- [ ] Create a quote → send via email → check inbox
- [ ] Accept the quote → job auto-created (idempotent — accept twice, no duplicates)
- [ ] Convert quote to invoice → invoice appears
- [ ] Mark invoice as paid → status updates
- [ ] Create a team member → invite email arrives → click link → /invite/[token] loads
- [ ] Clock in/out from employee dashboard → timesheet entry appears

## Settings + admin

- [ ] Profile tab → save business info → does not wipe brand accent on Brand tab
- [ ] Brand tab → upload logo → renders in client portal preview
- [ ] Billing tab → cancel/pause/resume subscription works (Stripe portal opens)
- [ ] Admin → launch checklist → all auto-checks pass

## Public surfaces

- [ ] `https://servlo.app` loads + monochrome + founding 50 banner shows spots left
- [ ] `/compare`, `/compare/servicem8`, `/compare/tradify` all load
- [ ] `/guarantee`, `/contact`, `/status`, `/docs`, `/founders` all load
- [ ] `/terms`, `/privacy`, `/refund` all load with TL;DR boxes
- [ ] `/legal/terms` redirects to `/terms` (same for privacy + refund)
- [ ] `/robots.txt` returns valid robots rules
- [ ] `/sitemap.xml` returns valid sitemap

## Security headers + status

- [ ] `securityheaders.com` audit of `servlo.app` returns **A** grade or better
- [ ] DevTools → Network → response headers include HSTS, CSP, X-Frame-Options
- [ ] No "no credit card required" text anywhere on the site
- [ ] No "30-day free trial" text anywhere — only "30-day money-back guarantee"

## Status page health probes

- [ ] `/status` shows all components Operational
- [ ] Database probe returns green (queries `plan_ai_limits`)
- [ ] Billing (Stripe) probe returns green (calls `stripe.balance.retrieve`)

## Mobile + PWA

- [ ] On phone: open `servlo.app` → Add to Home Screen
- [ ] Home screen icon is the SERVLO wordmark on pure-black background
- [ ] Launching PWA goes to landing → can sign in → dashboard works on mobile

## Refund flow (run once with a test card)

- [ ] Sign up, get charged $29 (test mode)
- [ ] Stripe dashboard → click into the test customer → refund the charge
- [ ] Receive refund confirmation email
- [ ] In SERVLO, settings → billing shows subscription status updated correctly

## Backup / recovery drill

- [ ] Supabase dashboard → Database → confirm "Point-in-Time Recovery" is enabled
      (requires Pro plan)
- [ ] Optional: trigger a manual restore in a staging project to confirm it works

## Final pre-flip checklist

- [ ] All boxes above ticked
- [ ] Database is clean (no test rows in production tables)
      → run `scripts/reset-test-data.sql` in Supabase Studio
- [ ] Switch `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `sk_live_*` / `pk_live_*` in Vercel
- [ ] Switch Stripe webhook endpoint signing secret to the live one
      (`STRIPE_WEBHOOK_SECRET`)
- [ ] Push a final commit + verify the deploy goes green
- [ ] Run ONE final signup with your own card (Solo monthly, $29) — this is
      Founder #1
- [ ] Refund yourself immediately to verify the refund flow on live mode
- [ ] You're live.
