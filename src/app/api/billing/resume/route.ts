import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

/**
 * POST /api/billing/resume
 * Removes pause_collection from the subscription.
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

    // Stripe requires passing empty string to remove pause_collection
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      pause_collection: "" as unknown as Stripe.SubscriptionUpdateParams.PauseCollection,
    });

    await admin.from("profiles").update({
      paused: false,
      pause_starts_at: null,
      pause_ends_at: null,
    }).eq("id", user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[billing/resume] error:", err);
    return NextResponse.json({ error: "Failed to resume subscription" }, { status: 500 });
  }
}
