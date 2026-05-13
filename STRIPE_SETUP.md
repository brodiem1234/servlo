# SERVLO Stripe Setup Guide

## Overview

SERVLO uses Stripe for subscription billing. This guide covers creating products, prices, webhooks, and configuring environment variables.

## Step 1 — Stripe Dashboard Login

Go to https://dashboard.stripe.com and log in.

**IMPORTANT:** Make sure you are in **LIVE mode** (not test mode) before creating products.

---

## Step 2 — Create Products

### Product 1: SERVLO Solo
- Name: `SERVLO Solo`
- Description: `For sole traders — unlimited jobs, invoices, and clients. 1 user.`
- Statement descriptor: `SERVLO SOLO`

### Product 2: SERVLO Team
- Name: `SERVLO Team`
- Description: `For growing trade businesses — unlimited team members, timesheets, SMS automation.`
- Statement descriptor: `SERVLO TEAM`

### Product 3: SERVLO Business
- Name: `SERVLO Business`
- Description: `For established operations — Xero/MYOB integration, advanced analytics, BAS prep.`
- Statement descriptor: `SERVLO BUSINESS`

---

## Step 3 — Create Prices (Per Product)

### Solo Prices
| Billing | Amount | Currency | Type |
|---------|--------|----------|------|
| Monthly | $29.00 | AUD | Recurring monthly |
| Annual  | $290.00 | AUD | Recurring yearly |

**Current Solo Monthly Price ID:** `price_1TTiL8K1tzStyRcJQAfbuJ5n`

### Team Prices
| Billing | Amount | Currency | Type |
|---------|--------|----------|------|
| Monthly | $79.00 | AUD | Recurring monthly |
| Annual  | $790.00 | AUD | Recurring yearly |

**Current Team Monthly Price ID:** `price_1TTiLaK1tzStyRcJNOgCeg0X`

### Business Prices
| Billing | Amount | Currency | Type |
|---------|--------|----------|------|
| Monthly | $149.00 | AUD | Recurring monthly |
| Annual  | $1,490.00 | AUD | Recurring yearly |

**Current Business Monthly Price ID:** `price_1TTiLyK1tzStyRcJ4BVJz0o8`

---

## Step 4 — Create Early Adopter Coupon (Founding 100)

1. Go to **Coupons** → **Create coupon**
2. Name: `EARLYACCESS — Founding 100 (75% off 3 months)`
3. Type: `Percentage`
4. Discount: `75%`
5. Duration: `Repeating`
6. Duration in months: `3`
7. Code: `EARLYACCESS`
8. Redemption limit: `100` (one per customer)

---

## Step 5 — Create Webhook

1. Go to **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://servlo.app/api/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.upcoming`
4. Copy the webhook signing secret

---

## Step 6 — Configure Environment Variables

In Vercel (https://vercel.com/dashboard), set these environment variables:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Stripe Price IDs
STRIPE_SOLO_PRICE_ID=price_1TTiL8K1tzStyRcJQAfbuJ5n
STRIPE_TEAM_PRICE_ID=price_1TTiLaK1tzStyRcJNOgCeg0X
STRIPE_BUSINESS_PRICE_ID=price_1TTiLyK1tzStyRcJ4BVJz0o8
```

---

## Step 7 — Test the Integration

1. Use Stripe test mode first with test price IDs
2. Create a test checkout session via `/api/stripe/checkout`
3. Complete checkout with test card `4242 4242 4242 4242`
4. Verify webhook fires and `profiles.subscription_status` updates to `active`
5. Verify `businesses.stripe_customer_id` and `businesses.plan` are set

---

## Step 8 — Tax Configuration (GST)

1. Go to **Tax** → **Automatic tax** → Enable
2. Set your business address to Australia
3. Enable automatic GST collection for Australian customers
4. Prices should be shown **inclusive of GST** to Australian customers

---

## Founding Member Flow

1. Customer visits `/auth/signup?code=EARLYACCESS`
2. Signup form detects `?code=EARLYACCESS` URL param
3. `setup-business` API sets `businesses.is_founding_member = true`
4. Customer goes through Stripe checkout
5. Apply the `EARLYACCESS` coupon at checkout for 75% off 3 months

---

## Referral Program Flow

1. Owner gets referral link: `https://servlo.app/ref/{code}`
2. New user signs up via referral link
3. `setup-business` API records `businesses.referred_by_code`
4. When referred user subscribes (first payment), the referrer earns 1 free month
5. Free month is applied via `businesses.free_months_balance`
6. On `invoice.upcoming` webhook, if `free_months_balance > 0`, a 100% coupon is applied

---

## Free Month Bug Bounty Flow

1. Owner reports bug at `/dashboard/owner/report-bug`
2. Bug stored in `bug_reports` table
3. Brodie reviews at `/admin/bugs`
4. On verify with "Award free month", `businesses.free_months_balance += 1`
5. Next billing cycle, free month is auto-applied via webhook
