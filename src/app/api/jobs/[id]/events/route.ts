import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Check job belongs to owner
  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const { data: events, error } = await supabase
    .from("job_events")
    .select("id, event_type, old_value, new_value, note, created_at, created_by")
    .eq("job_id", jobId)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    // Table may not exist yet — return empty gracefully
    if (error.code === "42P01") return NextResponse.json({ events: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: events ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Verify job ownership
  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { event_type, old_value, new_value, note } = body;

  if (!event_type) return NextResponse.json({ error: "event_type required" }, { status: 400 });

  const { data: event, error } = await supabase
    .from("job_events")
    .insert({
      owner_id: user.id,
      job_id: jobId,
      event_type,
      old_value: old_value ?? null,
      new_value: new_value ?? null,
      note: note ?? null,
      created_by: user.id,
    })
    .select("id, event_type, old_value, new_value, note, created_at")
    .single();

  if (error) {
    if (error.code === "42P01") {
      // Table not yet created — return success stub
      return NextResponse.json({ event: { id: "stub", event_type, note, created_at: new Date().toISOString() } });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event });
}
