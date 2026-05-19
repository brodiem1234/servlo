import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";

const MONTHLY_PRICE_IDS: Record<string, string | undefined> = {
  solo:     process.env.STRIPE_SOLO_PRICE_ID,
  team:     process.env.STRIPE_TEAM_PRICE_ID,
  business: process.env.STRIPE_BUSINESS_PRICE_ID,
};

const ANNUAL_PRICE_IDS: Record<string, string | undefined> = {
  solo:     process.env.STRIPE_SOLO_ANNUAL_PRICE_ID,
  team:     process.env.STRIPE_TEAM_ANNUAL_PRICE_ID,
  business: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID,
};

const VALID_PLANS = new Set(["solo", "team", "business"]);

const PLAN_ORDER: Record<string, number> = {
  free: 0, trial: 0, solo: 1, team: 2, business: 3, enterprise: 4,
};

/**
 * POST /api/billing/change-plan
 * Body: { targetPlan: 'solo' | 'team' | 'business' }
 * Upgrades or downgrades the active Stripe subscription.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimitResponse = await checkRateLimit("billingRoutes", user.id);
  if (rateLimitResponse) return rateLimitResponse;

  let body: { targetPlan?: string };
  try { body = await req.json(); } catch { body = {}; }

  const targetPlan = (body.targetPlan ?? "").toLowerCase();
  if (!VALID_PLANS.has(targetPlan)) {
    return NextResponse.json(
      { error: "targetPlan must be one of: solo, team, business" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_subscription_id, plan, subscription_status")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
  }

  if (profile.subscription_status !== "active") {
    return NextResponse.json({ error: "Subscription is not currently active" }, { status: 400 });
  }

  const currentPlan = (profile.plan ?? "free").toLowerCase();
  const currentOrder = PLAN_ORDER[currentPlan] ?? 0;
  const targetOrder = PLAN_ORDER[targetPlan] ?? 0;
  const isUpgrade = targetOrder > currentOrder;

  try {
    // Retrieve current subscription to get the item ID
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const growPriceId = process.env.STRIPE_GROW_PRICE_ID;
    const baseItem =
      subscription.items.data.find((item) => item.price.id !== growPriceId) ??
      subscription.items.data[0];
    const subscriptionItemId = baseItem?.id;

    if (!subscriptionItemId) {
      return NextResponse.json({ error: "Could not find subscription item" }, { status: 500 });
    }

    const currentInterval =
      baseItem?.price.recurring?.interval === "year" ? "annual" : "monthly";
    const targetPriceId =
      (currentInterval === "annual" ? ANNUAL_PRICE_IDS : MONTHLY_PRICE_IDS)[targetPlan];
    if (!targetPriceId) {
      return NextResponse.json(
        { error: `No ${currentInterval} Stripe price configured for ${targetPlan}.` },
        { status: 503 }
      );
    }

    let effectiveDate: string;

    if (isUpgrade) {
      // Upgrade: prorate immediately
      const updated = await stripe.subscriptions.update(profile.stripe_subscription_id, {
        items: [{ id: subscriptionItemId, price: targetPriceId }],
        proration_behavior: "always_invoice",
      });
      effectiveDate = new Date().toISOString();

      await admin.from("profiles").update({ plan: targetPlan, subscription_tier: targetPlan }).eq("id", user.id);

      const proratedCharge = Math.max(
        0,
        (updated.items.data[0]?.price?.unit_amount ?? 0) / 100
      );

      return NextResponse.json({
        success: true,
        effectiveDate,
        isUpgrade: true,
        proratedCharge,
        message: `Upgraded to ${targetPlan} — prorated charge applied immediately.`,
      });
    } else {
      // Downgrade: takes effect at period end
      const updated = await stripe.subscriptions.update(profile.stripe_subscription_id, {
        items: [{ id: subscriptionItemId, price: targetPriceId }],
        proration_behavior: "none",
        billing_cycle_anchor: "unchanged",
      });
      const periodEnd = new Date((updated.current_period_end ?? 0) * 1000).toISOString();
      effectiveDate = periodEnd;

      // Update plan in DB — takes effect after next billing date
      await admin.from("profiles").update({ plan: targetPlan, subscription_tier: targetPlan }).eq("id", user.id);

      return NextResponse.json({
        success: true,
        effectiveDate,
        isUpgrade: false,
        message: `Downgraded to ${targetPlan} — change takes effect on ${new Date(periodEnd).toLocaleDateString("en-AU")}.`,
      });
    }
  } catch (err) {
    const stripeError = err as { message?: string };
    console.error("[billing/change-plan] Stripe error:", err);
    return NextResponse.json(
      { error: stripeError?.message ?? "Failed to change plan" },
      { status: 500 }
    );
  }
}
