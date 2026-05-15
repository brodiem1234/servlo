import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/jobs/:id/tracking
 * Public endpoint — no auth required. Returns tracking info for a job.
 * The caller must supply the tracking_token as a query param for verification.
 * e.g. /api/jobs/abc123/tracking?token=xyz
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");

  const admin = createAdminClient();

  const { data: job, error } = await admin
    .from("jobs")
    .select(`
      id,
      title,
      status,
      scheduled_start,
      scheduled_end,
      tracking_token,
      client_id,
      employee_id
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // A tracking token must exist AND match. Treating a null token as
  // "not shareable" — previously a null token bypassed the check and the
  // endpoint leaked job + client + employee names to anyone with the UUID.
  if (!job.tracking_token || !token || token !== job.tracking_token) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
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
    tracking_token: job.tracking_token ?? null,
  });
}
