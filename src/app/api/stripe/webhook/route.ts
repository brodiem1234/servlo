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

      // --- Invoice payment via Payment Link ---
      // When a client pays an invoice via a Stripe Payment Link, the session
      // carries metadata.invoice_id set at link creation time.
      const invoiceId = session.metadata?.invoice_id;
      if (invoiceId && session.payment_link) {
        const amountTotal = session.amount_total ?? 0;
        await admin
          .from("invoices")
          .update({
            status: "paid",
            amount_paid: amountTotal / 100
          })
          .eq("id", invoiceId);
        // Early return — this is an invoice payment, not a subscription checkout.
        return NextResponse.json({ received: true });
      }

      // --- Subscription checkout ---
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

    // Founding Member 100 check — on first subscription, assign founder number if < 100 slots filled
    if (event.type === "customer.subscription.created") {
      const subscription = event.data.object;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      if (customerId) {
        // Find the user by stripe_customer_id
        const { data: profile } = await admin
          .from("profiles")
          .select("id, email, is_founding_member")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile && !profile.is_founding_member) {
          // Count existing founders
          const { count } = await admin
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("is_founding_member", true);

          const founderCount = count ?? 0;
          if (founderCount < 100) {
            const founderNumber = founderCount + 1;
            await admin.from("profiles").update({
              is_founding_member: true,
              founder_number: founderNumber,
              founding_joined_at: new Date().toISOString(),
            }).eq("id", profile.id);

            // Send "Welcome Founder #N" email
            const { sendEmail } = await import("@/lib/email");
            await sendEmail(
              profile.email ?? "",
              `Welcome, SERVLO Founding Member #${founderNumber}!`,
              `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
                <h2 style="color:#d97706">🏅 You are Founding Member #${founderNumber}</h2>
                <p>Thank you for being one of the first 100 businesses to subscribe to SERVLO.</p>
                <p>As a Founding Member, you receive:</p>
                <ul>
                  <li>Founder badge on your dashboard</li>
                  <li>Direct input into our roadmap — your requests get priority</li>
                  <li>Early access to every new feature</li>
                  <li>Locked-in pricing for life (your plan rate never increases)</li>
                  <li>Permanent recognition in our Founders page</li>
                </ul>
                <p>We are building SERVLO with you. Thank you for believing in us early.</p>
                <p style="color:#64748b">— The SERVLO team</p>
              </div>`
            );
          }
        }
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


