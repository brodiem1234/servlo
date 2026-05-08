import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/billing/reactivate
 * Removes cancel_at_period_end and clears cancellation_pending flag.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: "No subscription found" }, { status: 400 });
    }

    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    await admin.from("profiles").update({
      cancellation_pending: false,
      cancellation_takes_effect_at: null,
    }).eq("id", user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[billing/reactivate] error:", err);
    return NextResponse.json({ error: "Failed to reactivate subscription" }, { status: 500 });
  }
}
