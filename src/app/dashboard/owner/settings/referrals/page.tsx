import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReferralStats } from "@/lib/referral";
import { ReferralsClient } from "./referrals-client";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { code, referralUrl, stats } = await getReferralStats(user.id);

  return <ReferralsClient code={code} referralUrl={referralUrl} stats={stats} />;
}
