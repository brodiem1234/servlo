import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TOP_CLIENT_LIMIT = 10;

interface ClientRow {
  id: string;
  full_name: string | null;
  company_name: string | null;
  status: string | null;
  created_at: string | null;
}

interface JobMaxRow {
  client_id: string;
  max_completed_at: string | null;
}

function daysSince(isoDate: string | null): number {
  if (!isoDate) return Infinity;
  const diff = Date.now() - new Date(isoDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function riskLevel(score: number): "high" | "medium" | "low" {
  if (score > 60) return "high";
  if (score > 30) return "medium";
  return "low";
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

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("id, full_name, company_name, status, created_at")
    .eq("owner_id", user.id)
    .is("deleted_at", null);

  if (clientsError) {
    return NextResponse.json({ error: clientsError.message }, { status: 500 });
  }

  const rows = (clients ?? []) as ClientRow[];
  if (rows.length === 0) {
    return NextResponse.json({ clients: [] });
  }

  // Compute last job date per client from the jobs table
  const clientIds = rows.map((c) => c.id);

  const { data: jobMaxRows } = await supabase
    .from("jobs")
    .select("client_id, completed_at")
    .eq("owner_id", user.id)
    .eq("status", "completed")
    .is("deleted_at", null)
    .in("client_id", clientIds);

  // Build a map: client_id → max completed_at
  const lastJobMap = new Map<string, string | null>();
  for (const row of (jobMaxRows ?? []) as { client_id: string | null; completed_at: string | null }[]) {
    if (!row.client_id) continue;
    const current = lastJobMap.get(row.client_id) ?? null;
    if (!current || (row.completed_at && row.completed_at > current)) {
      lastJobMap.set(row.client_id, row.completed_at ?? null);
    }
  }

  const scored = rows.map((client) => {
    const lastJobDate = lastJobMap.get(client.id) ?? null;
    const days = daysSince(lastJobDate);

    let score = 0;

    if (lastJobDate === null || !lastJobMap.has(client.id)) {
      // No jobs ever
      score += 50;
    } else if (days > 180) {
      score += 40;
    } else if (days >= 90) {
      score += 20;
    }

    if (client.status === "inactive") {
      score += 30;
    }

    return {
      id: client.id,
      full_name: client.full_name ?? null,
      company_name: client.company_name ?? null,
      churn_score: score,
      risk_level: riskLevel(score),
      days_since_last_job: isFinite(days) ? days : null,
    };
  });

  // Sort by churn_score desc, take top 10
  scored.sort((a, b) => b.churn_score - a.churn_score);
  const top = scored.slice(0, TOP_CLIENT_LIMIT);

  return NextResponse.json({ clients: top });
}
