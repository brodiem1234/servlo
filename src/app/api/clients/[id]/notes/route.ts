import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  // Verify ownership
  const { data: client } = await supabase.from("clients").select("id").eq("id", clientId).eq("owner_id", user.id).is("deleted_at", null).maybeSingle();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const { data, error } = await supabase.from("client_notes").select("id, note, created_at, created_by").eq("client_id", clientId).eq("owner_id", user.id).is("deleted_at", null).order("created_at", { ascending: false });
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ notes: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data: client } = await supabase.from("clients").select("id").eq("id", clientId).eq("owner_id", user.id).is("deleted_at", null).maybeSingle();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  if (!body.note?.trim()) return NextResponse.json({ error: "Note is required" }, { status: 400 });
  const { data, error } = await supabase.from("client_notes").insert({ owner_id: user.id, client_id: clientId, note: body.note.trim(), created_by: user.id }).select("id, note, created_at").single();
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Table not ready. Apply migrations." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ note: data }, { status: 201 });
}
