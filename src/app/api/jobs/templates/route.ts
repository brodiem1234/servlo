import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data, error } = await supabase
    .from("job_templates")
    .select("id, name, description, service_type, duration_hrs, line_items, checklist, created_at")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("name");

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ templates: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, description, service_type, duration_hrs, line_items, checklist } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("job_templates")
    .insert({
      owner_id: user.id,
      name: name.trim(),
      description: description ?? null,
      service_type: service_type ?? null,
      duration_hrs: duration_hrs ? Number(duration_hrs) : null,
      line_items: line_items ?? [],
      checklist: checklist ?? [],
    })
    .select("id, name, description, service_type, duration_hrs, line_items, checklist, created_at")
    .single();

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Templates table not yet created. Apply migrations first." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data }, { status: 201 });
}
