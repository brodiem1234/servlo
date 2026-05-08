import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/cron/generate-recurring-jobs
 * Scheduled daily via Vercel Cron (see vercel.json).
 * Looks ahead 14 days for recurring jobs that need new instances generated.
 *
 * Logic:
 * - Find all jobs with recurrence_rule != null
 * - For each, find the latest instance (by scheduled_date)
 * - If the latest instance is less than 14 days from now, generate the next one
 * - Never duplicate: check for existing job on the same date with same recurrence_rule
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lookahead = new Date(today);
  lookahead.setDate(lookahead.getDate() + 14);

  // Fetch all jobs with a recurrence rule (latest per owner+rule+title group)
  const { data: recurringJobs, error } = await admin
    .from("jobs")
    .select("id, owner_id, title, description, client_id, employee_id, job_type, scheduled_date, scheduled_start, scheduled_end, address, suburb, state, priority, notes, materials_cost, labour_hours, hourly_rate, revenue, recurrence_rule")
    .not("recurrence_rule", "is", null)
    .not("recurrence_rule", "eq", "")
    .is("deleted_at", null)
    .order("scheduled_date", { ascending: false });

  if (error) {
    console.error("[cron/generate-recurring-jobs] query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!recurringJobs || recurringJobs.length === 0) {
    return NextResponse.json({ generated: 0, message: "No recurring jobs found" });
  }

  // Deduplicate: keep only the latest scheduled_date per (owner_id, title, recurrence_rule)
  type RecurringJob = typeof recurringJobs[0];
  const latestByGroup = new Map<string, RecurringJob>();
  for (const job of recurringJobs) {
    const key = `${job.owner_id}||${job.title}||${job.recurrence_rule}`;
    if (!latestByGroup.has(key)) {
      latestByGroup.set(key, job);
    }
  }

  let generated = 0;
  const insertRows: Record<string, unknown>[] = [];

  for (const job of latestByGroup.values()) {
    if (!job.scheduled_date || !job.recurrence_rule) continue;

    const latestDate = new Date(job.scheduled_date + "T00:00:00");
    const nextDate = advanceDate(latestDate, job.recurrence_rule);
    if (!nextDate) continue;

    // Only generate if the next occurrence falls within the lookahead window
    if (nextDate > lookahead) continue;
    // Don't generate past jobs
    if (nextDate < today) continue;

    const nextDateStr = toDateStr(nextDate);

    // Check for existing instance on that date to avoid duplicates
    const { data: existing } = await admin
      .from("jobs")
      .select("id")
      .eq("owner_id", job.owner_id)
      .eq("recurrence_rule", job.recurrence_rule)
      .eq("scheduled_date", nextDateStr)
      .is("deleted_at", null)
      .maybeSingle();

    if (existing) continue; // Already generated

    insertRows.push({
      owner_id: job.owner_id,
      title: job.title,
      description: job.description,
      client_id: job.client_id,
      employee_id: job.employee_id,
      job_type: job.job_type,
      scheduled_date: nextDateStr,
      scheduled_start: job.scheduled_start,
      scheduled_end: job.scheduled_end,
      address: job.address,
      suburb: job.suburb,
      state: job.state,
      priority: job.priority,
      notes: job.notes,
      materials_cost: job.materials_cost,
      labour_hours: job.labour_hours,
      hourly_rate: job.hourly_rate,
      revenue: job.revenue,
      recurrence_rule: job.recurrence_rule,
      status: "scheduled",
      is_demo: false,
    });
    generated++;
  }

  if (insertRows.length > 0) {
    const { error: insertError } = await admin.from("jobs").insert(insertRows);
    if (insertError) {
      console.error("[cron/generate-recurring-jobs] insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  console.log(`[cron/generate-recurring-jobs] generated ${generated} jobs`);
  return NextResponse.json({ generated });
}

function advanceDate(base: Date, rule: string): Date | null {
  const d = new Date(base);
  switch (rule) {
    case "weekly":     d.setDate(d.getDate() + 7); break;
    case "fortnightly": d.setDate(d.getDate() + 14); break;
    case "monthly":    d.setMonth(d.getMonth() + 1); break;
    case "quarterly":  d.setMonth(d.getMonth() + 3); break;
    case "annually":   d.setFullYear(d.getFullYear() + 1); break;
    default: return null;
  }
  return d;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
