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
    };

    const { paymentMethodId, selectedProductCombo, selectedPlanTier, promoCode, annual } = body;

    const priceMap = annual ? CORE_PRICE_IDS_ANNUAL : CORE_PRICE_IDS_MONTHLY;
    const priceId = priceMap[selectedPlanTier];
    if (!priceId) {
      return NextResponse.json(
        { error: `No ${annual ? "annual" : "monthly"} price configured for plan "${selectedPlanTier}".` },
        { status: 400 }
      );
    }

    const email = user.email ?? "";

    // Create (or reuse) Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: { supabase_user_id: user.id },
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

    // Create subscription with 30-day trial
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_period_days: 30,
      default_payment_method: paymentMethodId,
      ...(resolvedPromoCodeId ? { discounts: [{ promotion_code: resolvedPromoCodeId }] } : {}),
      metadata: {
        supabase_user_id: user.id,
        selected_products: selectedProductCombo,
        plan_tier: selectedPlanTier,
        billing_frequency: annual ? "annual" : "monthly",
      },
    });

    // Persist trial + plan data on profiles
    await supabaseAdmin
      .from("profiles")
      .update({
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        selected_products: selectedProductCombo,
        plan_tier: selectedPlanTier,
        trial_started_at: new Date().toISOString(),
        card_last4,
        card_brand,
      })
      .eq("id", user.id);

    return NextResponse.json({ success: true, subscriptionId: subscription.id });
  } catch (err) {
    console.error("[create-trial] error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
