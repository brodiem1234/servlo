import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshGmailToken } from "@/lib/email/gmail";
import { refreshOutlookToken } from "@/lib/email/outlook";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET ?? ""}` && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: businesses } = await admin
    .from("businesses")
    .select("owner_id, email_provider, email_connected_address")
    .eq("email_sync_enabled", true)
    .not("email_provider", "is", null);

  if (!businesses?.length) {
    return NextResponse.json({ ok: true, synced: 0 });
  }

  let synced = 0;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  for (const biz of businesses) {
    try {
      // Just refresh token to keep it alive; full sync would fetch new messages and upsert
      if (biz.email_provider === "gmail") {
        await refreshGmailToken(biz.owner_id);
      } else if (biz.email_provider === "outlook") {
        await refreshOutlookToken(biz.owner_id);
      }

      // Mark last sync time on businesses
      await admin
        .from("businesses")
        .update({ updated_at: new Date().toISOString() } as Record<string, unknown>)
        .eq("owner_id", biz.owner_id);

      synced++;
    } catch (err) {
      console.error(`[sync-emails] failed for ${biz.owner_id}:`, err);
    }
  }

  void since; // used in future full message sync
  return NextResponse.json({ ok: true, synced });
}
