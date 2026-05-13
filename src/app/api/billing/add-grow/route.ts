import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/billing/add-grow
 * Adds SERVLO Grow as a subscription item to the user's existing Stripe subscription.
 * Prorated charge is applied immediately.
 */
export async function POST(req: NextRequest) {
  void req;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimitResponse = await checkRateLimit("billingRoutes", user.id);
  if (rateLimitResponse) return rateLimitResponse;

  const growPriceId = process.env.STRIPE_GROW_PRICE_ID;
  if (!growPriceId) {
    return NextResponse.json(
      { error: "Grow add-on is not yet available. Contact support@servlo.com.au." },
      { status: 503 }
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_subscription_id, plan, subscription_status")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json(
      { error: "No active subscription found. Subscribe to a plan first." },
      { status: 400 }
    );
  }

  if (profile.subscription_status !== "active") {
    return NextResponse.json(
      { error: "Subscription is not currently active." },
      { status: 400 }
    );
  }

  try {
    // Retrieve existing subscription to check for duplicate
    const subscription = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id,
      { expand: ["items.data.price"] }
    );

    const alreadyHasGrow = subscription.items.data.some(
      (item) => (item.price as { id?: string } | null)?.id === growPriceId
    );

    if (alreadyHasGrow) {
      return NextResponse.json(
        { error: "Grow is already added to your subscription." },
        { status: 400 }
      );
    }

    // Add Grow as a new subscription item — prorate immediately
    await stripe.subscriptionItems.create({
      subscription: profile.stripe_subscription_id,
      price: growPriceId,
      proration_behavior: "always_invoice",
    });

    // Sync to DB — webhook will also fire and confirm this
    await admin
      .from("businesses")
      .update({ grow_addon_enabled: true })
      .eq("owner_id", user.id);

    return NextResponse.json({
      success: true,
      message:
        "Grow add-on activated. A prorated charge has been applied for this billing period.",
    });
  } catch (err) {
    const stripeError = err as { message?: string };
    console.error("[billing/add-grow] POST error:", err);
    return NextResponse.json(
      { error: stripeError?.message ?? "Failed to add Grow add-on" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/billing/add-grow
 * Removes the Grow subscription item. No proration — access continues to period end.
 */
export async function DELETE(req: NextRequest) {
  void req;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimitResponse = await checkRateLimit("billingRoutes", user.id);
  if (rateLimitResponse) return rateLimitResponse;

  const growPriceId = process.env.STRIPE_GROW_PRICE_ID;
  if (!growPriceId) {
    return NextResponse.json(
      { error: "Grow add-on configuration missing." },
      { status: 503 }
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_subscription_id, subscription_status")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: "No active subscription found." }, { status: 400 });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id,
      { expand: ["items.data.price"] }
    );

    const growItem = subscription.items.data.find(
      (item) => (item.price as { id?: string } | null)?.id === growPriceId
    );

    if (!growItem) {
      return NextResponse.json(
        { error: "Grow is not currently added to your subscription." },
        { status: 400 }
      );
    }

    // Remove item — no proration, access continues until period end
    await stripe.subscriptionItems.del(growItem.id, {
      proration_behavior: "none",
    });

    // Sync to DB immediately
    await admin
      .from("businesses")
      .update({ grow_addon_enabled: false })
      .eq("owner_id", user.id);

    const periodEnd = new Date((subscription.current_period_end ?? 0) * 1000);
    const periodEndStr = periodEnd.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return NextResponse.json({
      success: true,
      message: `Grow removed. You'll keep access until ${periodEndStr}.`,
    });
  } catch (err) {
    const stripeError = err as { message?: string };
    console.error("[billing/add-grow] DELETE error:", err);
    return NextResponse.json(
      { error: stripeError?.message ?? "Failed to remove Grow add-on" },
      { status: 500 }
    );
  }
}
