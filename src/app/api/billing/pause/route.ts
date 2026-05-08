import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/billing/pause
 * Body: { months: 1 | 2 | 3 }
 * Pauses subscription collection for the specified number of months.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { months } = (await req.json()) as { months?: number };
    if (!months || ![1, 2, 3].includes(months)) {
      return NextResponse.json({ error: "months must be 1, 2, or 3" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }

    const pauseEnd = new Date();
    pauseEnd.setMonth(pauseEnd.getMonth() + months);
    const resumesAt = Math.floor(pauseEnd.getTime() / 1000);

    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      pause_collection: {
        behavior: "void",
        resumes_at: resumesAt,
      },
    });

    await admin.from("profiles").update({
      paused: true,
      pause_starts_at: new Date().toISOString(),
      pause_ends_at: pauseEnd.toISOString(),
    }).eq("id", user.id);

    return NextResponse.json({ ok: true, resumesAt: pauseEnd.toISOString() });
  } catch (err) {
    console.error("[billing/pause] error:", err);
    return NextResponse.json({ error: "Failed to pause subscription" }, { status: 500 });
  }
}
