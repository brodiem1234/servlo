import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/feedback/feature-request
 * Body: { title: string, description?: string }
 * Submits a feature request.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { title?: string; description?: string };
  try { body = await req.json(); } catch { body = {}; }

  const title = (body.title ?? "").trim();
  if (!title || title.length < 3) {
    return NextResponse.json({ error: "title must be at least 3 characters" }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "title must be ≤200 chars" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("feature_requests")
    .insert({
      user_id: user.id,
      title,
      description: body.description?.trim().slice(0, 2000) ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("[feedback/feature-request] error:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}

/**
 * GET /api/feedback/feature-request
 * Returns top 10 most upvoted feature requests.
 */
export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("feature_requests")
    .select("id, title, description, upvotes, created_at")
    .order("upvotes", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
