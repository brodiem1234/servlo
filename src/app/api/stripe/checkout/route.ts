import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { priceId, email } = await req.json();
    if (!priceId || !email) {
      return NextResponse.json({ error: "Missing priceId or email" }, { status: 400 });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || "http://localhost:3000";

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
    return NextResponse.json(
      { error: "Failed to create checkout session", details: String(error) },
      { status: 500 }
    );
  }
}

