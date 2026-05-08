import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

/**
 * POST /api/billing/retention-offer
 * Applies a one-month discount coupon when a user tries to cancel (retention offer).
 * Body: { offer_type: "pause" | "discount" }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!stripe) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 501 });
  }

  const body = await req.json().catch(() => ({})) as { offer_type?: string };
  const offerType = body.offer_type ?? "discount";

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
  }

  try {
    if (offerType === "pause") {
      // Pause collection for 30 days
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        pause_collection: {
          behavior: "void",
          resumes_at: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        },
      });
      return NextResponse.json({ ok: true, offer: "pause", message: "Your subscription has been paused for 30 days." });
    }

    if (offerType === "discount") {
      // Create a 50% off for 1 month coupon
      let coupon;
      try {
        coupon = await stripe.coupons.retrieve("SERVLO_RETENTION_50OFF1M");
      } catch {
        coupon = await stripe.coupons.create({
          id: "SERVLO_RETENTION_50OFF1M",
          percent_off: 50,
          duration: "once",
          name: "Retention offer — 50% off next month",
        });
      }
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        coupon: coupon.id,
      });
      return NextResponse.json({ ok: true, offer: "discount", message: "50% discount applied to your next invoice." });
    }

    return NextResponse.json({ error: "Unknown offer type" }, { status: 400 });
  } catch (err) {
    console.error("[billing/retention-offer]", err);
    return NextResponse.json({ error: "Could not apply offer. Please contact support." }, { status: 500 });
  }
}
