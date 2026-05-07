import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReferralClient from "./referral-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SERVLO Grow — Referral Tracking",
};

function generateReferralCode(ownerId: string): string {
  // Deterministic short code from the owner UUID suffix
  const hex = ownerId.replace(/-/g, "").slice(-8).toUpperCase();
  return `SRV${hex}`;
}

export default async function GrowReferralsPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch business (including referral_code)
  const { data: business } = await sb
    .from("businesses")
    .select("referral_code, business_name")
    .eq("owner_id", user.id)
    .maybeSingle();

  // Generate + save referral code if missing
  let referralCode = business?.referral_code ?? null;
  if (!referralCode) {
    referralCode = generateReferralCode(user.id);
    await sb
      .from("businesses")
      .update({ referral_code: referralCode })
      .eq("owner_id", user.id);
  }

  // Fetch referrals
  const { data: referrals } = await sb
    .from("grow_referrals")
    .select("id, referred_email, status, reward_amount, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <ReferralClient
      referralCode={referralCode ?? ""}
      referrals={referrals ?? []}
      businessName={business?.business_name ?? "Your Business"}
    />
  );
}
