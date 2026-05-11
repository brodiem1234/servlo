import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "brodies.mcdonald@gmail.com";

/**
 * POST /api/bugs/verify
 * Admin-only: verify a bug report and optionally award a free month.
 * Body: { bugId, status, adminNotes, awardFreeMonth }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only Brodie can verify bugs
  if (user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let body: {
    bugId?: string;
    status?: string;
    adminNotes?: string;
    awardFreeMonth?: boolean;
  };

  try { body = await req.json(); } catch { body = {}; }

  if (!body.bugId) {
    return NextResponse.json({ error: "bugId is required" }, { status: 400 });
  }

  const validStatuses = ["pending", "verified", "duplicate", "fixed", "rejected"];
  const status = validStatuses.includes(body.status ?? "") ? body.status! : "verified";

  const admin = createAdminClient();

  // Get the bug report
  const { data: bug, error: fetchError } = await admin
    .from("bug_reports")
    .select("id, owner_id, status, free_month_awarded")
    .eq("id", body.bugId)
    .single();

  if (fetchError || !bug) {
    return NextResponse.json({ error: "Bug report not found" }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = {
    status,
    admin_notes: body.adminNotes ?? null,
    resolved_at: ["fixed", "rejected", "duplicate"].includes(status) ? new Date().toISOString() : null,
  };

  // Award free month if requested and not already awarded
  if (body.awardFreeMonth && status === "verified" && !bug.free_month_awarded) {
    updatePayload.free_month_awarded = true;
    updatePayload.awarded_at = new Date().toISOString();

    // Credit the owner with 1 free month
    const { data: biz } = await admin
      .from("businesses")
      .select("free_months_balance, valid_bugs_count")
      .eq("owner_id", bug.owner_id)
      .single();

    const currentBalance = (biz as { free_months_balance?: number } | null)?.free_months_balance ?? 0;
    const currentBugs = (biz as { valid_bugs_count?: number } | null)?.valid_bugs_count ?? 0;

    await admin
      .from("businesses")
      .update({
        free_months_balance: currentBalance + 1,
        valid_bugs_count: currentBugs + 1,
      })
      .eq("owner_id", bug.owner_id);

    // Record the credit
    await admin.from("account_credits").insert({
      owner_id: bug.owner_id,
      amount_cents: 0, // tracked as free months, not dollar amount
      reason: `Bug bounty reward — bug report #${body.bugId.slice(0, 8)}`,
    });
  }

  const { error } = await admin
    .from("bug_reports")
    .update(updatePayload)
    .eq("id", body.bugId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status });
}
