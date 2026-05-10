/**
 * User-to-user referral program utilities.
 */

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Generate an 8-character alphanumeric referral code.
 * Combines the last 4 chars of userId + 4 random chars, uppercase.
 */
export function generateReferralCode(userId: string): string {
  const userSuffix = userId.replace(/-/g, "").slice(-4).toUpperCase();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // excludes confusing chars
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return userSuffix + random;
}

/**
 * Ensure user has a referral code. Generates and saves one if missing.
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .single();

  if (profile?.referral_code) return profile.referral_code;

  // Generate a unique code (retry on collision)
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode(userId);
    const { error } = await admin
      .from("profiles")
      .update({ referral_code: code })
      .eq("id", userId);

    if (!error) return code;
  }

  throw new Error("Failed to generate unique referral code");
}

/**
 * Record a referral when a new user signs up via ?ref=CODE.
 * Called server-side during signup.
 */
export async function processReferral(
  referredEmail: string,
  referralCode: string
): Promise<void> {
  if (!referredEmail || !referralCode) return;

  const admin = createAdminClient();

  // Find referrer by code
  const { data: referrer } = await admin
    .from("profiles")
    .select("id")
    .eq("referral_code", referralCode.toUpperCase())
    .single();

  if (!referrer) {
    console.warn("[referral] Code not found:", referralCode);
    return;
  }

  // Don't self-refer
  const { data: referredProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", referredEmail)
    .single();

  if (referredProfile?.id === referrer.id) return;

  // Insert referral row (ignore duplicate)
  await admin.from("user_referrals").insert({
    referrer_user_id: referrer.id,
    referred_email: referredEmail,
    referred_user_id: referredProfile?.id ?? null,
    status: referredProfile ? "signed_up" : "pending",
  });
}

/**
 * Mark a referral as subscribed when the referred user converts.
 * Called from the Stripe webhook on subscription.created.
 *
 * TODO: Credit both users $20 via Stripe balance_transaction.
 * Currently: logs to console for manual processing.
 */
export async function markReferralSubscribed(referredUserId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: referrals } = await admin
    .from("user_referrals")
    .select("id, referrer_user_id")
    .eq("referred_user_id", referredUserId)
    .neq("status", "subscribed")
    .limit(1);

  if (!referrals?.length) return;

  const referral = referrals[0];
  await admin
    .from("user_referrals")
    .update({ status: "subscribed", converted_at: new Date().toISOString() })
    .eq("id", referral.id);

  // TODO: Apply $20 credit via Stripe balance_transaction for both users
  // For now: log for manual processing
  console.log("[referral] Subscription converted:", {
    referralId: referral.id,
    referrerId: referral.referrer_user_id,
    referredUserId,
    note: "Apply $20 Stripe credit to both users manually",
  });
}

/**
 * Get the referral stats for a user.
 */
export async function getReferralStats(userId: string): Promise<{
  code: string;
  referralUrl: string;
  stats: Array<{ referred_email: string; status: string; created_at: string }>;
}> {
  const admin = createAdminClient();

  const code = await ensureReferralCode(userId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au";
  const referralUrl = `${appUrl}/auth/signup?ref=${code}`;

  const { data: stats } = await admin
    .from("user_referrals")
    .select("referred_email, status, created_at")
    .eq("referrer_user_id", userId)
    .order("created_at", { ascending: false });

  return { code, referralUrl, stats: stats ?? [] };
}
