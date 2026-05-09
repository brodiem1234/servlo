import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data, error } = await supabase
    .from("grow_campaigns")
    .select("id, name, type, status, subject, recipient_count, open_count, click_count, scheduled_at, sent_at, created_at")
    .eq("owner_id", user.id)
    .eq("type", "email")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ campaigns: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { name, subject, body: emailBody, audience_type, scheduled_at } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (!subject?.trim()) return NextResponse.json({ error: "Subject required" }, { status: 400 });
  const status = scheduled_at ? "scheduled" : "draft";
  const { data, error } = await supabase
    .from("grow_campaigns")
    .insert({
      owner_id: user.id,
      name: name.trim(),
      type: "email",
      status,
      subject: subject.trim(),
      body: emailBody || null,
      audience_type: audience_type || "all",
      scheduled_at: scheduled_at || null,
    })
    .select("id, name, type, status, subject, recipient_count, open_count, click_count, scheduled_at, sent_at, created_at")
    .single();
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Table not ready. Apply migrations." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ campaign: data }, { status: 201 });
}
