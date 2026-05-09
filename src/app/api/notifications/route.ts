import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data, error } = await supabase.from("owner_notifications").select("id, type, title, body, link, read, created_at").eq("owner_id", user.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(30);
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ notifications: [], unreadCount: 0 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const notifications = data ?? [];
  return NextResponse.json({ notifications, unreadCount: notifications.filter(n => !n.read).length });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { type, title, notifBody, link } = body;
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const { data, error } = await supabase.from("owner_notifications").insert({ owner_id: user.id, type: type || "info", title: title.trim(), body: notifBody || null, link: link || null }).select("id, type, title, body, link, read, created_at").single();
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Table not ready." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ notification: data }, { status: 201 });
}
