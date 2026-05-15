/**
 * Subscription-state guards for API routes.
 *
 * Two helpers:
 *  - `isSubscriptionBlocked(userId)` — boolean check, fail-open on error.
 *  - `assertSubscriptionActive(userId)` — returns a 402 NextResponse if the
 *    subscription is in a blocking state; returns null if ok to proceed.
 *
 * Usage in a route:
 *   const block = await assertSubscriptionActive(user.id);
 *   if (block) return block;
 *
 * Blocking states:
 *  - "cancelled" — subscription ended, read-only
 *  - "paused" — pause_collection active, write-locked
 *  - "incomplete_expired" — never paid first invoice
 *  - "unpaid" — Stripe gave up after dunning
 *
 * NOT blocking (still allowed to write):
 *  - "active" — normal
 *  - "trialing" — trial period (kept for legacy data; we don't offer trials now)
 *  - "past_due" — Stripe dunning grace period (30 days typically)
 *  - null / unset — pre-billing or admin
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BLOCKED_STATUSES = new Set([
  "cancelled",
  "canceled",
  "paused",
  "incomplete_expired",
  "unpaid",
]);

/**
 * Returns true if writes should be blocked for this user.
 * Fail-open: on DB error, returns false (don't block legitimate users).
 */
export async function isSubscriptionBlocked(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("subscription_status")
      .eq("id", userId)
      .single();
    const status = (data as { subscription_status?: string | null } | null)?.subscription_status;
    return status ? BLOCKED_STATUSES.has(status) : false;
  } catch (err) {
    console.error("[pause-check] DB error — failing open:", err);
    return false;
  }
}

/**
 * For use in route handlers. Returns a 402 NextResponse if writes should be
 * blocked; returns null if ok to proceed.
 *
 *   const block = await assertSubscriptionActive(user.id);
 *   if (block) return block;
 */
export async function assertSubscriptionActive(
  userId: string
): Promise<NextResponse | null> {
  const blocked = await isSubscriptionBlocked(userId);
  if (!blocked) return null;

  return NextResponse.json(
    {
      error: "Subscription required",
      message:
        "Your subscription is not currently active. Update your billing details in Settings to continue.",
      code: "subscription_inactive",
    },
    { status: 402 }
  );
}

/**
 * DEPRECATED — kept for backwards compat with any caller still using it.
 * Returns true if NOT paused. Switch new code to `isSubscriptionBlocked`.
 */
export async function checkNotPaused(userId: string): Promise<boolean> {
  return !(await isSubscriptionBlocked(userId));
}
