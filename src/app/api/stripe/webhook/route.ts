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

/** Returns the base plan price ID from a list of subscription items (ignores Grow add-on). */
function getBasePriceId(
  items: Array<{ price?: { id?: string } | null }>
): string | null {
  const growId = process.env.STRIPE_GROW_PRICE_ID;
  const base = items.find((item) => {
    const id = item.price?.id;
    return id && id !== growId;
  });
  return base?.price?.id ?? null;
}

/** Returns true if the subscription includes the Grow add-on. */
function hasGrowAddon(
  items: Array<{ price?: { id?: string } | null }>
): boolean {
  const growId = process.env.STRIPE_GROW_PRICE_ID;
  if (!growId) return false;
  return items.some((item) => item.price?.id === growId);
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
        const { data: updatedInvoice } = await admin
          .from("invoices")
          .update({
            status: "paid",
            amount_paid: amountTotal / 100,
            paid_at: new Date().toISOString(),
          })
          .eq("id", invoiceId)
          .select("owner_id, invoice_number, total")
          .maybeSingle();

        // Notify owner
        if (updatedInvoice?.owner_id) {
          const num = updatedInvoice.invoice_number ?? invoiceId.slice(0, 8);
          const amt = Number(updatedInvoice.total ?? amountTotal / 100);
          void admin.from("owner_notifications").insert({
            owner_id: updatedInvoice.owner_id,
            type: "invoice_paid",
            title: `Invoice ${num} paid`,
            body: `$${amt.toFixed(2)} received via payment link`,
            link: `/dashboard/owner/invoices`,
            read: false,
          });
        }

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

        // Also update businesses table with stripe customer id and plan
        const { data: prof } = await admin
          .from("profiles")
          .select("id")
          .eq("email", customerEmail)
          .maybeSingle();
        if (prof?.id) {
          await admin
            .from("businesses")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan,
              subscription_status: "active",
            })
            .eq("owner_id", prof.id);
        }
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      const items = subscription.items.data as Array<{ price?: { id?: string } | null }>;
      const basePriceId = getBasePriceId(items);
      const plan = getPlanFromPriceId(basePriceId);
      const status = subscription.status === "active" ? "active" : subscription.status;
      const growEnabled = hasGrowAddon(items);

      if (customerId) {
        await admin
          .from("profiles")
          .update({
            subscription_status: status,
            stripe_customer_id: customerId,
            plan,
            subscription_tier: plan,
          })
          .eq("stripe_customer_id", customerId);

        // Sync Grow add-on state to businesses table
        const { data: prof } = await admin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (prof?.id) {
          await admin
            .from("businesses")
            .update({ grow_addon_enabled: growEnabled })
            .eq("owner_id", prof.id);
        }
      }
    }

    // Referral program — mark referral as subscribed when a new subscription is created
    if (event.type === "customer.subscription.created") {
      const subForReferral = event.data.object;
      const customerIdForReferral = typeof subForReferral.customer === "string" ? subForReferral.customer : null;
      if (customerIdForReferral) {
        try {
          const { data: profileForReferral } = await admin
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerIdForReferral)
            .maybeSingle();
          if (profileForReferral?.id) {
            const { markReferralSubscribed } = await import("@/lib/referral");
            await markReferralSubscribed(profileForReferral.id);
          }
        } catch (err) {
          console.error("[webhook] referral mark error:", err);
        }
      }
    }

    // Founding Member 50 check — on first subscription, assign founder number if < 50 slots filled
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
          if (founderCount < 50) {
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
                <p>Thank you for being one of the first 50 businesses to subscribe to SERVLO.</p>
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

    // ── Failed payment dunning ──────────────────────────────────────────────
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
      const attemptCount = invoice.attempt_count ?? 1;
      const amountDue = (invoice.amount_due ?? 0) / 100;
      const currency = (invoice.currency ?? "aud").toUpperCase();

      if (customerId) {
        const { data: profile } = await admin
          .from("profiles")
          .select("id, email, full_name, plan, stripe_subscription_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile?.email) {
          // Update subscription_status to past_due in profiles
          await admin
            .from("profiles")
            .update({ subscription_status: "past_due" })
            .eq("stripe_customer_id", customerId);

          const { sendEmail } = await import("@/lib/email");
          const name = profile.full_name || "there";

          let subject: string;
          let body: string;

          if (attemptCount === 1) {
            subject = "Action required: Payment failed for your SERVLO subscription";
            body = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
              <h2 style="color:#dc2626">Payment failed</h2>
              <p>Hi ${name},</p>
              <p>We were unable to process your SERVLO subscription payment of <strong>${currency} $${amountDue.toFixed(2)}</strong>.</p>
              <p>This sometimes happens when a card expires or has insufficient funds. Your access is still active while we retry.</p>
              <p><strong>What to do:</strong> Update your payment method in your billing portal to avoid any interruption to your service.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/portal" style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Update payment method</a></p>
              <p style="color:#64748b;font-size:13px">We will automatically retry in a few days. If the payment continues to fail, your subscription will be suspended.</p>
              <p style="color:#64748b">— The SERVLO team</p>
            </div>`;
          } else if (attemptCount === 2) {
            subject = "Second payment attempt failed — please update your billing details";
            body = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
              <h2 style="color:#dc2626">Second payment attempt failed</h2>
              <p>Hi ${name},</p>
              <p>We tried again to collect your SERVLO subscription payment of <strong>${currency} $${amountDue.toFixed(2)}</strong> but it was unsuccessful.</p>
              <p>Please update your payment details now to keep your account active.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/portal" style="display:inline-block;background:#dc2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Update payment method now</a></p>
              <p style="color:#64748b;font-size:13px">One more retry remains. If this fails your subscription will be cancelled and you may lose access to your data.</p>
              <p style="color:#64748b">— The SERVLO team</p>
            </div>`;
          } else {
            // 3rd attempt or more — final warning
            subject = "Final notice: Your SERVLO subscription is at risk of cancellation";
            body = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
              <h2 style="color:#dc2626">⚠️ Final payment attempt failed</h2>
              <p>Hi ${name},</p>
              <p>We have been unable to collect your SERVLO subscription payment of <strong>${currency} $${amountDue.toFixed(2)}</strong> after ${attemptCount} attempts.</p>
              <p>Your subscription is at immediate risk of cancellation. Update your payment method right now to avoid losing access to your business data.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/portal" style="display:inline-block;background:#dc2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Restore my subscription</a></p>
              <p style="color:#64748b;font-size:13px">Need help? Reply to this email or contact <a href="mailto:support@servlo.com.au">support@servlo.com.au</a>.</p>
              <p style="color:#64748b">— The SERVLO team</p>
            </div>`;
          }

          await sendEmail(profile.email, subject, body);
        }
      }
    }

    // ── Free months application — apply credit before billing ───────────────
    // invoice.upcoming fires ~1 hour before an invoice is finalized
    if (event.type === "invoice.upcoming") {
      const upcomingInvoice = event.data.object;
      const customerId = typeof upcomingInvoice.customer === "string" ? upcomingInvoice.customer : null;
      const subscriptionId = typeof upcomingInvoice.subscription === "string" ? upcomingInvoice.subscription : null;

      if (customerId && subscriptionId) {
        try {
          // Look up owner by stripe_customer_id in businesses table
          const { data: biz } = await admin
            .from("businesses")
            .select("owner_id, free_months_balance, free_months_used, stripe_customer_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();

          // Also try profiles if not found in businesses
          let ownerId = (biz as { owner_id?: string } | null)?.owner_id;
          let freeBalance = (biz as { free_months_balance?: number } | null)?.free_months_balance ?? 0;

          if (!ownerId) {
            const { data: prof } = await admin
              .from("profiles")
              .select("id")
              .eq("stripe_customer_id", customerId)
              .maybeSingle();
            ownerId = prof?.id;
          }

          if (ownerId && freeBalance > 0) {
            // Apply a discount coupon or credit via Stripe
            try {
              // Create a one-time credit coupon for 100% off one invoice
              const coupon = await stripe.coupons.create({
                percent_off: 100,
                duration: "once",
                name: "SERVLO Free Month Reward",
                max_redemptions: 1,
              });

              await stripe.subscriptions.update(subscriptionId, {
                coupon: coupon.id,
              });

              // Decrement free months balance
              const currentBalance = freeBalance;
              const newBalance = Math.max(0, currentBalance - 1);
              const { data: bizForUpdate } = await admin
                .from("businesses")
                .select("free_months_used")
                .eq("owner_id", ownerId)
                .single();
              const currentUsed = (bizForUpdate as { free_months_used?: number } | null)?.free_months_used ?? 0;

              await admin
                .from("businesses")
                .update({
                  free_months_balance: newBalance,
                  free_months_used: currentUsed + 1,
                })
                .eq("owner_id", ownerId);

              console.log(`[webhook] Applied free month for owner ${ownerId}, balance: ${currentBalance} -> ${newBalance}`);
            } catch (stripeErr) {
              console.error("[webhook] Failed to apply free month coupon:", stripeErr);
            }
          }
        } catch (err) {
          console.error("[webhook] invoice.upcoming free months error:", err);
        }
      }
    }

    // ── Payment recovered (invoice paid after dunning) ──────────────────────
    if (event.type === "invoice.paid") {
      const invoice = event.data.object;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
      // Only send recovery email if this was a previously-failed invoice (attempt_count > 1)
      if (customerId && (invoice.attempt_count ?? 1) > 1) {
        const { data: profile } = await admin
          .from("profiles")
          .select("id, email, full_name")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile?.email) {
          await admin
            .from("profiles")
            .update({ subscription_status: "active" })
            .eq("stripe_customer_id", customerId);

          const { sendEmail } = await import("@/lib/email");
          await sendEmail(
            profile.email,
            "Payment received — your SERVLO subscription is active",
            `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
              <h2 style="color:#16a34a">Payment received ✓</h2>
              <p>Hi ${profile.full_name || "there"},</p>
              <p>We have successfully processed your SERVLO subscription payment. Your account is fully active.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/owner" style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Go to dashboard</a></p>
              <p style="color:#64748b">— The SERVLO team</p>
            </div>`
          );
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: "Invalid signature", details: String(error) }, { status: 400 });
  }
}


