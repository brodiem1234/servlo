import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/email/thread/[id]
 * Returns all messages in a thread (owner-scoped).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify thread belongs to this owner (RLS also enforces this)
  const { data: thread } = await supabase
    .from("email_threads")
    .select("id, owner_id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!thread) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: messages, error } = await supabase
    .from("email_messages")
    .select("id, direction, from_email, to_email, subject, body_html, body_text, status, sent_at, received_at, created_at")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: messages ?? [] });
}
