import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function getPlanFromPriceId(priceId: string | null | undefined) {
  if (!priceId) return "trial";
  if (priceId === process.env.STRIPE_SOLO_PRICE_ID) return "solo";
  if (priceId === process.env.STRIPE_TEAM_PRICE_ID) return "team";
  if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) return "business";
  return "trial";
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing Stripe signature config" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    const admin = createAdminClient();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const customerEmail = session.customer_details?.email || session.customer_email;
      const customerId = typeof session.customer === "string" ? session.customer : null;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      let priceId: string | null = null;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["items.data.price"]
        });
        priceId = subscription.items.data[0]?.price?.id ?? null;
      }
      const plan = getPlanFromPriceId(priceId);

      if (customerEmail) {
        await admin
          .from("profiles")
          .update({
            subscription_status: "active",
            stripe_customer_id: customerId,
            plan,
            subscription_tier: plan
          })
          .eq("email", customerEmail);
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      const priceId = subscription.items.data[0]?.price?.id ?? null;
      const plan = getPlanFromPriceId(priceId);
      const status = subscription.status === "active" ? "active" : subscription.status;

      if (customerId) {
        await admin
          .from("profiles")
          .update({
            subscription_status: status,
            stripe_customer_id: customerId,
            plan,
            subscription_tier: plan
          })
          .eq("stripe_customer_id", customerId);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      if (customerId) {
        await admin
          .from("profiles")
          .update({
            subscription_status: "cancelled"
          })
          .eq("stripe_customer_id", customerId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: "Invalid signature", details: String(error) }, { status: 400 });
  }
}


