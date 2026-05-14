import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/stripe/validate-promo
 * Body: { code: string }
 *
 * Returns: { valid: boolean, discount?: string, percentOff?: number, amountOff?: number,
 *             currency?: string, error?: string }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: string };
    const code = body.code?.trim();
    if (!code) {
      return NextResponse.json({ valid: false, error: "No promo code provided" });
    }

    const promoCodes = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
      expand: ["data.coupon"],
    });

    if (promoCodes.data.length === 0) {
      return NextResponse.json({ valid: false, error: "Promo code not found or has expired" });
    }

    const promoCode = promoCodes.data[0];
    const coupon = promoCode.coupon;

    // Check redemption limits
    if (
      coupon.max_redemptions !== null &&
      coupon.times_redeemed >= coupon.max_redemptions
    ) {
      return NextResponse.json({ valid: false, error: "This promo code has reached its redemption limit" });
    }

    // Build a human-readable discount string
    let discount = "";
    if (coupon.percent_off) {
      const durationNote =
        coupon.duration === "repeating" && coupon.duration_in_months
          ? ` for ${coupon.duration_in_months} months`
          : coupon.duration === "once"
            ? " for first payment"
            : " forever";
      discount = `${coupon.percent_off}% off${durationNote}`;
    } else if (coupon.amount_off) {
      const currency = (coupon.currency ?? "aud").toUpperCase();
      const amount = (coupon.amount_off / 100).toFixed(2);
      discount = `$${amount} ${currency} off`;
    }

    return NextResponse.json({
      valid: true,
      discount,
      percentOff: coupon.percent_off ?? undefined,
      amountOff: coupon.amount_off ?? undefined,
      currency: coupon.currency ?? undefined,
      duration: coupon.duration,
      durationInMonths: coupon.duration_in_months ?? undefined,
    });
  } catch (err) {
    console.error("[validate-promo] error:", err);
    return NextResponse.json({ valid: false, error: "Unable to validate promo code" }, { status: 500 });
  }
}
