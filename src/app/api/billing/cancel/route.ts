import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/billing/cancel
 * Body: { reason?: string }
 * Sets cancel_at_period_end on the Stripe subscription and marks profile accordingly.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as { reason?: string };

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_subscription_id, subscription_status")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }

    const subscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const effectiveAt = new Date((subscription.current_period_end ?? 0) * 1000).toISOString();

    await admin.from("profiles").update({
      cancellation_pending: true,
      cancellation_takes_effect_at: effectiveAt,
      cancellation_reason: body.reason ?? null,
    }).eq("id", user.id);

    return NextResponse.json({
      ok: true,
      cancellationDate: effectiveAt,
    });
  } catch (err) {
    console.error("[billing/cancel] error:", err);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
