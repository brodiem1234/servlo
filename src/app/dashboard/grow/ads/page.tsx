import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdStudioManager, { type AdCampaign, type AdStudioStats } from "./ad-studio-manager";

export const dynamic = "force-dynamic";

export default async function AdStudioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch campaigns
  let campaigns: AdCampaign[] = [];
  const { data, error } = await supabase
    .from("grow_ad_campaigns")
    .select(
      "id, name, platform, objective, status, budget_daily, budget_total, spend, impressions, clicks, conversions, start_date, end_date, ad_copy, targeting, created_at"
    )
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    // 42P01 = relation does not exist — table not yet migrated
    if (error.code !== "42P01") {
      console.error("grow_ad_campaigns fetch error:", error.message);
    }
    // Leave campaigns as empty array
  } else {
    campaigns = (data ?? []) as AdCampaign[];
  }

  // Compute stats
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend ?? 0), 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions ?? 0), 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions ?? 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks ?? 0), 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const stats: AdStudioStats = {
    activeCampaigns,
    totalSpend,
    totalConversions,
    avgCTR,
  };

  return <AdStudioManager campaigns={campaigns} stats={stats} />;
}
