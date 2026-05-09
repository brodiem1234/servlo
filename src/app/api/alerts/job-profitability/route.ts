import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const LABOUR_COST_PER_HOUR = 85;
const RECENT_JOB_LIMIT = 10;
const LOW_MARGIN_THRESHOLD = 20;

interface JobRow {
  id: string;
  title: string | null;
  total_price: number | null;
  actual_hours: number | null;
  estimated_hours: number | null;
  client_id: string | null;
  completed_at: string | null;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, title, total_price, actual_hours, estimated_hours, client_id, completed_at")
    .eq("owner_id", user.id)
    .eq("status", "completed")
    .is("deleted_at", null)
    .order("completed_at", { ascending: false })
    .limit(RECENT_JOB_LIMIT);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (jobs ?? []) as JobRow[];

  const alerts = rows.map((job) => {
    const revenue = job.total_price ?? 0;
    const cost = (job.actual_hours ?? 0) * LABOUR_COST_PER_HOUR;
    const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;

    let flag: "loss" | "low_margin" | "ok";
    if (margin < 0) {
      flag = "loss";
    } else if (margin < LOW_MARGIN_THRESHOLD) {
      flag = "low_margin";
    } else {
      flag = "ok";
    }

    return {
      id: job.id,
      title: job.title ?? "Untitled",
      revenue,
      cost,
      margin: Math.round(margin * 10) / 10,
      flag,
      completed_at: job.completed_at,
    };
  });

  const marginValues = alerts.map((a) => a.margin);
  const avg_margin =
    marginValues.length > 0
      ? Math.round((marginValues.reduce((s, v) => s + v, 0) / marginValues.length) * 10) / 10
      : 0;

  const loss_count = alerts.filter((a) => a.flag === "loss").length;
  const low_margin_count = alerts.filter((a) => a.flag === "low_margin").length;

  return NextResponse.json({
    alerts,
    summary: { avg_margin, loss_count, low_margin_count },
  });
}
