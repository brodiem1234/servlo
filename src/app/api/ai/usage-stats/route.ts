import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUsageStats } from "@/lib/ai-limits";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const stats = await getUsageStats(user.id);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[ai/usage-stats] error:", err);
    return NextResponse.json({ error: "Failed to fetch usage stats" }, { status: 500 });
  }
}
