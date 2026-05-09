import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmailCampaignsManager } from "./email-campaigns-manager";

export const dynamic = "force-dynamic";

export default async function EmailMarketingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("grow_campaigns")
    .select(
      "id, name, status, subject, recipient_count, open_count, click_count, scheduled_at, sent_at, created_at"
    )
    .eq("owner_id", user.id)
    .eq("type", "email")
    .order("created_at", { ascending: false });

  const campaigns =
    error?.code === "42P01" ? [] : (data ?? []);

  const totalCampaigns = campaigns.length;
  const sentCampaigns = campaigns.filter((c) => c.status === "sent");
  const sentCount = sentCampaigns.length;

  const avgOpenRate =
    sentCampaigns.length > 0
      ? sentCampaigns.reduce((sum, c) => {
          const rc = c.recipient_count ?? 0;
          const oc = c.open_count ?? 0;
          return sum + (rc > 0 ? oc / rc : 0);
        }, 0) / sentCampaigns.length
      : 0;

  const avgClickRate =
    sentCampaigns.length > 0
      ? sentCampaigns.reduce((sum, c) => {
          const rc = c.recipient_count ?? 0;
          const cc = c.click_count ?? 0;
          return sum + (rc > 0 ? cc / rc : 0);
        }, 0) / sentCampaigns.length
      : 0;

  const stats = {
    totalCampaigns,
    sentCount,
    avgOpenRate: Math.round(avgOpenRate * 1000) / 10,
    avgClickRate: Math.round(avgClickRate * 1000) / 10,
  };

  return (
    <>
      <title>SERVLO GROW — Email Marketing</title>
      <EmailCampaignsManager campaigns={campaigns} stats={stats} />
    </>
  );
}
