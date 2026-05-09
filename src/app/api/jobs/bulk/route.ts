import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = ["scheduled", "in_progress", "completed", "invoiced", "cancelled"];

/**
 * POST /api/jobs/bulk
 * Performs bulk operations on jobs owned by the authenticated user.
 *
 * Body: { job_ids: string[], action: "update_status" | "delete" | "assign_employee", status?, employee_id? }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    job_ids?: string[];
    action?: string;
    status?: string;
    employee_id?: string;
  };

  const { job_ids, action } = body;

  if (!job_ids || !Array.isArray(job_ids) || job_ids.length === 0) {
    return NextResponse.json({ error: "job_ids must be a non-empty array" }, { status: 400 });
  }
  if (job_ids.length > 100) {
    return NextResponse.json({ error: "Maximum 100 jobs per bulk operation" }, { status: 400 });
  }

  if (action === "update_status") {
    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const { error } = await supabase
      .from("jobs")
      .update({ status: body.status })
      .in("id", job_ids)
      .eq("owner_id", user.id)
      .is("deleted_at", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, affected: job_ids.length });
  }

  if (action === "delete") {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("jobs")
      .update({ deleted_at: now })
      .in("id", job_ids)
      .eq("owner_id", user.id)
      .eq("is_demo", false)
      .is("deleted_at", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, affected: job_ids.length });
  }

  if (action === "assign_employee") {
    const { error } = await supabase
      .from("jobs")
      .update({ employee_id: body.employee_id ?? null })
      .in("id", job_ids)
      .eq("owner_id", user.id)
      .is("deleted_at", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, affected: job_ids.length });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
