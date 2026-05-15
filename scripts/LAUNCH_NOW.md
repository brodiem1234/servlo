# SERVLO — LAUNCH NOW

Five steps. Do them in order. Don't skip one.

---

## STEP 1 — Push every pending change

```bash
cd L:\projects\servlo
git rm --cached -r .claude/worktrees 2>$null
git rm --cached -r .vercel 2>$null
git rm --cached .next-dev.log 2>$null
git rm --cached all-migrations.sql 2>$null
git rm --cached run-migration.js 2>$null
git add -A
git commit -m "feat(launch): final pre-launch polish + gitignore cleanup"
git push
```

Watch the Vercel dashboard until the new deploy shows "Ready" (~60-90s).

---

## STEP 2 — Create the EARLYACCESS Stripe coupon

Without this, the Founding 50 auto-apply silently fails and signup errors out at submit.

1. Stripe dashboard → toggle **Test mode** (top right)
2. **Products** → **Coupons** → **+ New**
3. Settings:
   - **Type**: Percentage discount → `100%` (free first month) OR fixed amount off
   - **Duration**: pick one:
     - "Once" — discount applies for the first invoice only
     - "Forever" — discount applies for every invoice for life (recommended for founder offer)
   - **Limit redemption date**: tick → set redeem-by to `30 June 2026`
4. Save the coupon
5. Click the coupon → **Promotion codes** → **+ Add code**
   - **Code**: `EARLYACCESS` (uppercase, exact)
   - **Customer redemption limit**: `1`
   - **Active**: yes
6. Save

---

## STEP 3 — Verify Stripe keys in Vercel

Vercel → Settings → Environment Variables → Production:

| Key | Must start with |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_` |
| `STRIPE_AUTOMATIC_TAX_ENABLED` | unset, or `false` |
| `CRON_SECRET` | any 32+ char string |
| `RESEND_API_KEY` | set |
| `RESEND_FROM_EMAIL` | `hello@servlo.com.au` |
| `NEXT_PUBLIC_APP_URL` | `https://servlo.app` |

If anything changed: Vercel → Deployments → latest → ... → **Redeploy**.

---

## STEP 4 — Smoke test

1. Open `https://servlo.app/auth/signup` in **incognito**
2. Hard refresh (Ctrl+Shift+R)
3. Fill in step 1:
   - Name: any
   - Email: `test+launch@yourgmail.com` (unique each test)
   - Business name: any
   - ABN: `33 102 417 032` (real registered ABN, safe test value)
   - Phone: any AU mobile
   - Password: 8+ chars mixed case + number
4. Continue through steps 2, 3, 4
5. **Step 5**:
   - Green **"Founding 50 discount applied"** banner shows at top
   - `EARLYACCESS` is visible pre-filled in the promo field
   - Card form loads within 2 seconds (no "Loading card input..." spinner)
   - Use test card `4242 4242 4242 4242`, expiry `12/30`, CVC `123`
6. Tick T&C, click Sign Up
7. Should land at `/dashboard/owner`
8. Open Settings → Profile → confirm business name + ABN + phone are pre-filled
9. Stripe dashboard → Customers → confirm new customer with EARLYACCESS coupon applied

If any step fails, screenshot the error + open chat.

---

## STEP 5 — Final state before going live

After the test signup works:

1. **Reset the database** so launch starts clean:
   Supabase Studio → SQL Editor → paste contents of `scripts/reset-test-data.sql` → Run
2. **Switch Stripe to live mode** (only when you're 100% ready to take real money):
   - Stripe → Developers → API keys → reveal live keys
   - In Vercel env vars, swap `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to the `sk_live_*` / `pk_live_*` versions
   - Stripe → Developers → Webhooks → add `https://servlo.app/api/stripe/webhook` as a live endpoint
   - Subscribe to: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
   - Copy the live webhook signing secret → set `STRIPE_WEBHOOK_SECRET` in Vercel
3. **Re-create EARLYACCESS coupon in Stripe LIVE mode** (test mode coupons don't carry over)
4. **Redeploy** Vercel
5. **Sign up Founder #1** with your real card to verify live flow
6. **Refund yourself** immediately to test the refund flow

You're live.

---

## Hard things you still need to organise (not blockers but soon)

- ASIC business name registration ($44/yr, asic.gov.au)
- Pty Ltd registration if going company ($597 + accountant)
- Lawyer review of T&C / Privacy / Refund (Sprintlaw or LawPath)
- Insurance: public liability + professional indemnity
- ATO GST registration
- `hello@servlo.com.au` mailbox actually forwards to your inbox

These don't block taking your first customer in test mode but should be done before charging real money.
