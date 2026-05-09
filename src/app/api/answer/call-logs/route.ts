import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data, error } = await supabase
    .from("call_logs")
    .select("id, caller_number, caller_name, direction, duration_seconds, outcome, transcript, ai_summary, called_at")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("called_at", { ascending: false })
    .limit(50);
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ callLogs: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ callLogs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { caller_number, caller_name, direction, duration_seconds, outcome, transcript, ai_summary } = body;
  const { data, error } = await supabase
    .from("call_logs")
    .insert({
      owner_id: user.id,
      caller_number: caller_number || null,
      caller_name: caller_name || null,
      direction: direction || "inbound",
      duration_seconds: duration_seconds || 0,
      outcome: outcome || "answered",
      transcript: transcript || null,
      ai_summary: ai_summary || null,
      called_at: new Date().toISOString(),
    })
    .select("id, caller_number, caller_name, direction, duration_seconds, outcome, ai_summary, called_at")
    .single();
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Table not ready. Apply migrations." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ callLog: data }, { status: 201 });
}
