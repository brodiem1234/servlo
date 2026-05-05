import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      console.error("Stripe checkout error: STRIPE_SECRET_KEY is not configured");
      return NextResponse.json({ error: "STRIPE_SECRET_KEY is not configured" }, { status: 500 });
    }

    const { priceId, email } = await req.json();
    if (!priceId || !email) {
      return NextResponse.json({ error: "Missing priceId or email" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://servlo.com.au";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/owner/settings?success=true`,
      cancel_url: `${appUrl}/dashboard/owner/settings`
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

