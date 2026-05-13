import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReferralManager from "./referral-manager";

export const dynamic = "force-dynamic";

export default async function ReferralProgramPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let referrals: any[] = [];

  try {
    const { data, error } = await supabase
      .from("grow_referrals")
      .select(
        "id, referred_name, referred_email, referred_phone, status, reward_type, reward_amount, referral_code, created_at"
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error && error.code !== "42P01") throw error;
    referrals = data ?? [];
  } catch {
    referrals = [];
  }

  const totalReferrals = referrals.length;
  const convertedCount = referrals.filter((r: any) => r.status === "converted").length;
  const pendingCount = referrals.filter((r: any) => r.status === "pending").length;
  const totalRewardsValue = referrals
    .filter((r: any) => r.status === "rewarded" && r.reward_amount)
    .reduce((sum: number, r: any) => sum + Number(r.reward_amount), 0);

  const stats = { totalReferrals, convertedCount, pendingCount, totalRewardsValue };

  // Try to get referral_code from businesses table, fall back to user.id-derived code
  let referralCode: string = user.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  let freeMonthsBalance = 0;
  try {
    const { data: biz } = await supabase
      .from("businesses")
      .select("referral_code, free_months_balance")
      .eq("owner_id", user.id)
      .single();
    if ((biz as { referral_code?: string | null } | null)?.referral_code) {
      referralCode = (biz as { referral_code: string }).referral_code;
    }
    freeMonthsBalance = (biz as { free_months_balance?: number | null } | null)?.free_months_balance ?? 0;
  } catch {
    // fall back to user.id-derived code
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.app";
  const referralUrl = `${appUrl}/ref/${referralCode}`;

  return <ReferralManager referrals={referrals} stats={stats} referralUrl={referralUrl} referralCode={referralCode} freeMonthsBalance={freeMonthsBalance} />;
}
