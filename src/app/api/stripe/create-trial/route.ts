import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/** Server-side price ID maps — never trust client-supplied IDs */
const CORE_PRICE_IDS_MONTHLY: Record<string, string | undefined> = {
  solo:     process.env.STRIPE_SOLO_PRICE_ID,
  team:     process.env.STRIPE_TEAM_PRICE_ID,
  business: process.env.STRIPE_BUSINESS_PRICE_ID,
};

const CORE_PRICE_IDS_ANNUAL: Record<string, string | undefined> = {
  solo:     process.env.STRIPE_SOLO_ANNUAL_PRICE_ID,
  team:     process.env.STRIPE_TEAM_ANNUAL_PRICE_ID,
  business: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID,
};

/**
 * Creates a paid subscription immediately. No free trial — customers pay from
 * day 1. The 30-day money-back guarantee in the refund policy is what gives
 * them a risk-free try; that's a refund flow, not a Stripe trial.
 *
 * This also:
 *  - Enables Stripe Tax (automatic GST handling for AU customers).
 *  - Records the customer's ABN against the Stripe customer so tax invoices
 *    show their ABN.
 *  - Rejects duplicate signups by ABN (one active subscription per ABN).
 *
 * Route kept at /api/stripe/create-trial for backwards compat with the signup
 * form's existing fetch URL.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "").trim();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabaseAdmin = createAdminClient();
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as {
      paymentMethodId: string;
      selectedProductCombo: string;
      selectedPlanTier: string;
      promoCode?: string;
      annual?: boolean;
      abn?: string;
    };

    const { paymentMethodId, selectedProductCombo, selectedPlanTier, promoCode, annual, abn } = body;

    const priceMap = annual ? CORE_PRICE_IDS_ANNUAL : CORE_PRICE_IDS_MONTHLY;
    const priceId = priceMap[selectedPlanTier];
    if (!priceId) {
      return NextResponse.json(
        { error: `No ${annual ? "annual" : "monthly"} price configured for plan "${selectedPlanTier}".` },
        { status: 400 }
      );
    }

    // ── ABN dedup check ────────────────────────────────────────────────────
    // One active subscription per ABN. Stops multi-account abuse where someone
    // signs up with a different email but the same business.
    const cleanAbn = (abn ?? "").replace(/\s/g, "");
    if (cleanAbn) {
      const { data: existing } = await supabaseAdmin
        .from("businesses")
        .select("owner_id, subscription_status")
        .eq("abn", cleanAbn)
        .in("subscription_status", ["active", "trialing", "past_due"])
        .neq("owner_id", user.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: "An active subscription already exists for this ABN. If this is your business, please log into the existing account." },
          { status: 409 }
        );
      }
    }

    const email = user.email ?? "";

    // Create Stripe customer with ABN attached as tax ID
    const customer = await stripe.customers.create({
      email,
      metadata: { supabase_user_id: user.id },
      // Pass ABN as au_abn tax ID so Stripe Tax can compute GST correctly
      // and tax invoices show the customer's ABN.
      ...(cleanAbn
        ? { tax_id_data: [{ type: "au_abn" as const, value: cleanAbn }] }
        : {}),
    });

    // Attach payment method and set as default
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Retrieve card details for display
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    const card_last4 = pm.card?.last4 ?? null;
    const card_brand = pm.card?.brand ?? null;

    // Resolve promotion code if provided (accept any active Stripe promo code)
    let resolvedPromoCodeId: string | undefined;
    if (promoCode) {
      const promoCodes = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 });
      if (promoCodes.data.length > 0) {
        resolvedPromoCodeId = promoCodes.data[0].id;
      } else {
        console.warn(`[create-trial] promo code "${promoCode}" not found or inactive — ignoring`);
      }
    }

    // Stripe Tax is opt-in via env var. Default OFF because enabling it before
    // you've configured tax registrations in the Stripe dashboard causes
    // subscriptions.create to reject every signup. Set
    // `STRIPE_AUTOMATIC_TAX_ENABLED=true` once you've gone through
    // Stripe → Tax → Registrations and added AU.
    const automaticTaxEnabled =
      process.env.STRIPE_AUTOMATIC_TAX_ENABLED === "true";

    // Create subscription — billed from day 1, NO free trial.
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      payment_behavior: "error_if_incomplete",
      ...(automaticTaxEnabled ? { automatic_tax: { enabled: true } } : {}),
      ...(resolvedPromoCodeId ? { discounts: [{ promotion_code: resolvedPromoCodeId }] } : {}),
      metadata: {
        supabase_user_id: user.id,
        selected_products: selectedProductCombo,
        plan_tier: selectedPlanTier,
        billing_frequency: annual ? "annual" : "monthly",
        signup_date: new Date().toISOString(),
      },
    });
    const subscriptionStatus = subscription.status === "active" ? "active" : subscription.status;

    // Persist subscription + plan data on profiles.
    // trial_started_at is repurposed as "subscription_started_at" — used for
    // the 30-day money-back window in the refund policy.
    await supabaseAdmin
      .from("profiles")
      .update({
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        plan: selectedPlanTier,
        subscription_tier: selectedPlanTier,
        subscription_status: subscriptionStatus,
        selected_products: selectedProductCombo,
        plan_tier: selectedPlanTier,
        trial_started_at: new Date().toISOString(),
        card_last4,
        card_brand,
      })
      .eq("id", user.id);

    await supabaseAdmin
      .from("businesses")
      .update({
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        plan: selectedPlanTier,
        subscription_status: subscriptionStatus,
      })
      .eq("owner_id", user.id);

    return NextResponse.json({ success: true, subscriptionId: subscription.id });
  } catch (err) {
    console.error("[create-trial] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
