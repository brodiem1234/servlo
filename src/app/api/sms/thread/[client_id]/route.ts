import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/sms/thread/:client_id
 * Returns SMS messages between the owner and a specific client.
 * Gracefully returns empty array if sms_messages table doesn't exist yet.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ client_id: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { client_id } = await params;
  if (!client_id) return NextResponse.json({ messages: [] });

  try {
    const { data: messages, error } = await supabase
      .from("sms_messages")
      .select("id, message, direction, sent_at, status, is_stub, from_number, to_number")
      .eq("owner_id", user.id)
      .eq("client_id", client_id)
      .order("sent_at", { ascending: true })
      .limit(200);

    if (error) {
      // Table doesn't exist or other error — return stub response
      return NextResponse.json({ messages: [], stub: true });
    }

    return NextResponse.json({ messages: messages ?? [] });
  } catch {
    return NextResponse.json({ messages: [], stub: true });
  }
}
