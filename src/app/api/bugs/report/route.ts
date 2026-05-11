import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/bugs/report
 * Submit a bug report for the bug bounty program.
 * Verified bugs earn 1 free month of SERVLO.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    title?: string;
    description?: string;
    page_url?: string;
    severity?: string;
    screenshot_url?: string;
  };

  try { body = await req.json(); } catch { body = {}; }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!title || title.length < 5) {
    return NextResponse.json({ error: "Title is required (min 5 chars)" }, { status: 400 });
  }
  if (!description || description.length < 10) {
    return NextResponse.json({ error: "Description is required (min 10 chars)" }, { status: 400 });
  }

  const validSeverities = ["low", "medium", "high", "critical"];
  const severity = validSeverities.includes(body.severity ?? "") ? body.severity : "medium";

  const admin = createAdminClient();

  const { data, error } = await admin.from("bug_reports").insert({
    owner_id: user.id,
    title: title.slice(0, 200),
    description: description.slice(0, 5000),
    page_url: body.page_url ? String(body.page_url).slice(0, 500) : null,
    severity,
    screenshot_url: body.screenshot_url ? String(body.screenshot_url).slice(0, 1000) : null,
    status: "pending",
  }).select("id").single();

  if (error) {
    console.error("[bugs/report] insert failed:", error);
    return NextResponse.json({ error: "Failed to submit bug report" }, { status: 500 });
  }

  // Increment bugs_reported counter on businesses
  try {
    const { data: biz } = await admin
      .from("businesses")
      .select("bugs_reported")
      .eq("owner_id", user.id)
      .single();
    const current = (biz as { bugs_reported?: number } | null)?.bugs_reported ?? 0;
    await admin
      .from("businesses")
      .update({ bugs_reported: current + 1 })
      .eq("owner_id", user.id);
  } catch {
    // Non-fatal — bugs_reported may not exist yet
  }

  return NextResponse.json({ ok: true, id: data?.id });
}

/**
 * GET /api/bugs/report
 * Returns the current user's bug reports.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bug_reports")
    .select("id, title, severity, status, free_month_awarded, created_at, resolved_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: data ?? [] });
}
