import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data, error } = await supabase
    .from("lead_pipeline")
    .select(
      "id, name, email, phone, source, status, estimated_value, notes, ai_score, ai_grade, next_follow_up, created_at, updated_at"
    )
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ leads: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ leads: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, email, phone, source, estimated_value, notes, next_follow_up } =
    body as Record<string, string | number | null | undefined>;

  if (!String(name ?? "").trim())
    return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data, error } = await supabase
    .from("lead_pipeline")
    .insert({
      owner_id: user.id,
      name: String(name).trim(),
      email: email || null,
      phone: phone || null,
      source: source || "manual",
      estimated_value: estimated_value ? Number(estimated_value) : null,
      notes: notes || null,
      next_follow_up: next_follow_up || null,
      status: "new",
    })
    .select(
      "id, name, email, phone, source, status, estimated_value, notes, ai_score, ai_grade, next_follow_up, created_at, updated_at"
    )
    .single();

  if (error) {
    if (error.code === "42P01")
      return NextResponse.json(
        { error: "Table not ready. Apply migrations." },
        { status: 503 }
      );
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ lead: data }, { status: 201 });
}
