import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/cron/weekly-summary
 * Called every Monday at 08:00 UTC via Vercel cron.
 * Creates a weekly_summary notification for each active owner.
 *
 * Protect with CRON_SECRET header.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get all owners (role = 'owner')
  const { data: owners } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "owner");

  let processed = 0;

  for (const owner of owners ?? []) {
    try {
      // Pull metrics for this owner over the last 7 days
      const [jobsResult, invoicesResult, clientsResult] = await Promise.all([
        admin
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", owner.id)
          .eq("status", "completed")
          .gte("updated_at", sevenDaysAgo),
        admin
          .from("invoices")
          .select("total", { count: "exact" })
          .eq("owner_id", owner.id)
          .eq("status", "paid")
          .gte("updated_at", sevenDaysAgo)
          .eq("is_demo", false),
        admin
          .from("clients")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", owner.id)
          .gte("created_at", sevenDaysAgo),
      ]);

      const jobsCompleted = jobsResult.count ?? 0;
      const newClients = clientsResult.count ?? 0;
      const revenue = ((invoicesResult.data ?? []) as { total?: number }[]).reduce(
        (sum, inv) => sum + (inv.total ?? 0),
        0
      );

      const bodyParts: string[] = [];
      if (jobsCompleted > 0) bodyParts.push(`${jobsCompleted} job${jobsCompleted !== 1 ? "s" : ""} completed`);
      if (revenue > 0) bodyParts.push(`$${revenue.toFixed(0)} invoiced`);
      if (newClients > 0) bodyParts.push(`${newClients} new client${newClients !== 1 ? "s" : ""}`);

      const body = bodyParts.length > 0
        ? bodyParts.join(" · ")
        : "A quiet week — time to follow up on open quotes.";

      // Insert notification
      await admin.from("owner_notifications").insert({
        owner_id: owner.id,
        type: "weekly_summary",
        title: "Your week in review",
        body,
        href: "/dashboard/reports",
        read: false,
      });

      processed++;
    } catch (err) {
      console.error(`[cron/weekly-summary] error for owner ${owner.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, processed });
}
