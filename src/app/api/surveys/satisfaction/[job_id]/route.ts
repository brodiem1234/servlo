import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/surveys/satisfaction/[job_id]
 * Auth-gated. Returns survey results for a job owned by the authenticated user.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ job_id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { job_id } = await params;

  // Verify the job belongs to this owner
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", job_id)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Fetch surveys — graceful degradation if table doesn't exist
  try {
    const admin = createAdminClient();
    const { data: surveys, error: surveysError } = await admin
      .from("job_surveys")
      .select("rating, feedback, submitted_at")
      .eq("job_id", job_id)
      .order("submitted_at", { ascending: false });

    if (surveysError) {
      console.warn("[surveys/satisfaction/[job_id]] query error:", surveysError.message);
      return NextResponse.json({ surveys: [] });
    }

    return NextResponse.json({ surveys: surveys ?? [] });
  } catch (err) {
    console.warn("[surveys/satisfaction/[job_id]] job_surveys table may not exist:", err);
    return NextResponse.json({ surveys: [] });
  }
}
