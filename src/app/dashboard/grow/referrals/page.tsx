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

  // Generate a stable referral code from the first 8 chars of user.id
  const referralCode = user.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au";
  const referralUrl = `${appUrl}/ref/${referralCode}`;

  return <ReferralManager referrals={referrals} stats={stats} referralUrl={referralUrl} />;
}
