import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LeadsPipeline from "./leads-pipeline";

export const dynamic = "force-dynamic";

export type LeadPipelineItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  estimated_value: number | null;
  notes: string | null;
  ai_score: number | null;
  ai_grade: string | null;
  next_follow_up: string | null;
  created_at: string;
  updated_at: string | null;
};

export type PipelineStats = {
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  pipelineValue: number;
  conversionRate: number;
};

export default async function LeadsPipelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("lead_pipeline")
    .select(
      "id, name, email, phone, source, status, estimated_value, notes, ai_score, ai_grade, next_follow_up, created_at, updated_at"
    )
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  let leads: LeadPipelineItem[] = [];
  if (error) {
    if (error.code !== "42P01") {
      console.error("[leads/pipeline] fetch error:", error.message);
    }
    // 42P01 = table doesn't exist yet — treat as empty
  } else {
    leads = (data ?? []) as LeadPipelineItem[];
  }

  const activeLeads = leads.filter(
    (l) => l.status !== "won" && l.status !== "lost"
  );
  const wonLeads = leads.filter((l) => l.status === "won");
  const lostLeads = leads.filter((l) => l.status === "lost");
  const pipelineValue = activeLeads.reduce(
    (sum, l) => sum + (l.estimated_value ?? 0),
    0
  );
  const conversionRate =
    leads.length > 0
      ? Math.round((wonLeads.length / leads.length) * 100)
      : 0;

  const stats: PipelineStats = {
    totalLeads: leads.length,
    wonLeads: wonLeads.length,
    lostLeads: lostLeads.length,
    pipelineValue,
    conversionRate,
  };

  return <LeadsPipeline leads={leads} stats={stats} />;
}
