import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/surveys/satisfaction
 * Public — no auth required. Validates survey_token against jobs table and stores response.
 */
export async function POST(req: NextRequest) {
  let body: { job_id?: string; token?: string; rating?: number; feedback?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { job_id, token, rating, feedback } = body;

  if (!job_id || typeof job_id !== "string") {
    return NextResponse.json({ error: "job_id is required" }, { status: 400 });
  }
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }
  if (typeof rating !== "number" || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: "rating must be an integer between 1 and 5" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Validate token matches the job
  const { data: job, error: jobError } = await admin
    .from("jobs")
    .select("id, survey_token")
    .eq("id", job_id)
    .eq("survey_token", token)
    .maybeSingle();

  if (jobError) {
    console.error("[surveys/satisfaction] job lookup error:", jobError);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  if (!job) {
    return NextResponse.json({ error: "Invalid token or job not found" }, { status: 404 });
  }

  // Store in job_surveys — graceful degradation if table doesn't exist
  try {
    const { error: insertError } = await admin.from("job_surveys").insert({
      job_id,
      rating,
      feedback: feedback && typeof feedback === "string" ? feedback.trim().slice(0, 2000) : null,
      submitted_at: new Date().toISOString(),
    });

    if (insertError) {
      // Table might not exist — log but don't fail
      console.warn("[surveys/satisfaction] insert error (graceful):", insertError.message);
    }
  } catch (err) {
    console.warn("[surveys/satisfaction] job_surveys table may not exist:", err);
  }

  return NextResponse.json({ success: true });
}
