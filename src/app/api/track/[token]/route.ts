import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/track/:token
 * Public endpoint. Looks up a job by its tracking_token and returns tracking info.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: job, error } = await admin
    .from("jobs")
    .select("id, title, status, scheduled_start, client_id, employee_id, tracking_token")
    .eq("tracking_token", token)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !job) {
    return NextResponse.json({ error: "Tracking link not found or expired" }, { status: 404 });
  }

  // Fetch client name
  let clientName: string | null = null;
  if (job.client_id) {
    const { data: client } = await admin
      .from("clients")
      .select("full_name")
      .eq("id", job.client_id)
      .maybeSingle();
    clientName = client?.full_name ?? null;
  }

  // Fetch employee name
  let employeeName: string | null = null;
  if (job.employee_id) {
    const { data: emp } = await admin
      .from("employees")
      .select("full_name")
      .eq("id", job.employee_id)
      .maybeSingle();
    employeeName = emp?.full_name ?? null;
  }

  return NextResponse.json({
    job_title: job.title ?? "Service Job",
    client_name: clientName,
    status: job.status ?? "scheduled",
    employee_name: employeeName,
    scheduled_start: job.scheduled_start ?? null,
    tracking_token: job.tracking_token,
  });
}
