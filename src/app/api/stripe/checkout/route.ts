import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

/**
 * Hosted Checkout flow for existing users (e.g. upgrading from settings).
 * Differences from /api/stripe/create-trial:
 *  - User confirms payment on Stripe-hosted page (no card iframe in our app)
 *  - Uses client_reference_id so the webhook can match back to our user
 *  - Enables Stripe Tax + asks Stripe to collect tax IDs (ABN)
 */
export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      console.error("Stripe checkout error: STRIPE_SECRET_KEY is not configured");
      return NextResponse.json({ error: "STRIPE_SECRET_KEY is not configured" }, { status: 500 });
    }

    // Verify the caller is authenticated so we can pass their user.id to Stripe.
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "").trim();
    let userId: string | null = null;
    if (token) {
      const admin = createAdminClient();
      const { data: { user } } = await admin.auth.getUser(token);
      userId = user?.id ?? null;
    }

    const { priceId, email } = await req.json();
    if (!priceId || !email) {
      return NextResponse.json({ error: "Missing priceId or email" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://servlo.app";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      // Stripe Tax opt-in via env var. Off by default — enabling before tax
      // registrations are configured causes every checkout to reject.
      ...(process.env.STRIPE_AUTOMATIC_TAX_ENABLED === "true"
        ? { automatic_tax: { enabled: true } as const, tax_id_collection: { enabled: true } as const }
        : {}),
      // Match-back keys so the webhook doesn't have to guess by email.
      ...(userId ? { client_reference_id: userId } : {}),
      metadata: { user_id: userId ?? "", email },
      subscription_data: {
        metadata: { user_id: userId ?? "", email },
      },
      success_url: `${appUrl}/dashboard/owner/settings?success=true`,
      cancel_url: `${appUrl}/dashboard/owner/settings`
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
