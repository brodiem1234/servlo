import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";

const PRICE_IDS: Record<string, string | undefined> = {
  solo: process.env.STRIPE_SOLO_PRICE_ID,
  team: process.env.STRIPE_TEAM_PRICE_ID,
  business: process.env.STRIPE_BUSINESS_PRICE_ID,
};

/**
 * GET /api/billing/checkout?plan=solo
 *
 * Compatibility route for existing upgrade-page links. It creates a hosted
 * Stripe Checkout session using the authenticated Supabase cookie session.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const rateLimitResponse = await checkRateLimit("billingRoutes", user.id);
  if (rateLimitResponse) return rateLimitResponse;

  const plan = (req.nextUrl.searchParams.get("plan") ?? "").toLowerCase();
  const priceId = PRICE_IDS[plan];
  const suppliedPriceId = req.nextUrl.searchParams.get("priceId");

  if (!priceId) {
    return NextResponse.json(
      { error: "plan must be one of: solo, team, business" },
      { status: 400 }
    );
  }

  if (suppliedPriceId && suppliedPriceId !== priceId) {
    return NextResponse.json({ error: "priceId does not match plan" }, { status: 400 });
  }

  if (!user.email) {
    return NextResponse.json({ error: "Authenticated user has no email address" }, { status: 422 });
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://servlo.app";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      ...(process.env.STRIPE_AUTOMATIC_TAX_ENABLED === "true"
        ? { automatic_tax: { enabled: true } as const, tax_id_collection: { enabled: true } as const }
        : {}),
      client_reference_id: user.id,
      metadata: { user_id: user.id, email: user.email, plan },
      subscription_data: {
        metadata: { user_id: user.id, email: user.email, plan },
      },
      success_url: `${appUrl}/dashboard/owner/settings?tab=billing&success=true`,
      cancel_url: `${appUrl}/dashboard/upgrade`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 502 });
    }

    return NextResponse.redirect(session.url);
  } catch (err) {
    console.error("[billing/checkout] Stripe error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
