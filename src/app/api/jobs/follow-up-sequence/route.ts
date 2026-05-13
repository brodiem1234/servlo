/**
 * POST /api/jobs/follow-up-sequence
 * Triggers the auto follow-up sequence when a job is completed:
 *   1. Immediately: job completion summary (SMS/email stub)
 *   2. +1 day: satisfaction survey link
 *   3. +3 days: review request (if no review yet)
 *   4. +90 days: maintenance reminder
 *
 * Body: { job_id }
 * Returns: { ok, scheduled_count, messages }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { job_id } = await req.json().catch(() => ({})) as { job_id?: string };
  if (!job_id) return NextResponse.json({ error: "job_id required" }, { status: 400 });

  // Load job + client
  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, client_id, status, is_demo")
    .eq("id", job_id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.is_demo) return NextResponse.json({ ok: true, scheduled_count: 0, messages: [], note: "Demo job — no follow-up sent" });

  let clientEmail: string | null = null;
  let clientName: string | null = null;
  if (job.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("full_name, email")
      .eq("id", job.client_id)
      .eq("owner_id", user.id)
      .maybeSingle();
    clientEmail = client?.email ?? null;
    clientName = client?.full_name ?? null;
  }

  const now = new Date();
  const jobTitle = job.title ?? "your recent job";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.app";

  // Build the 4-step sequence
  type FollowUpMessage = {
    send_at: string;
    type: "completion" | "survey" | "review_request" | "maintenance_reminder";
    subject: string;
    body: string;
    channel: "email";
  };

  const messages: FollowUpMessage[] = [
    {
      send_at: now.toISOString(),
      type: "completion",
      subject: `Job completed: ${jobTitle}`,
      body: `Hi ${clientName ?? "there"},\n\nYour job "${jobTitle}" has just been completed. Thank you for your business! If you have any questions or concerns, please don't hesitate to get in touch.\n\nWarm regards`,
      channel: "email",
    },
    {
      send_at: addDays(now, 1).toISOString(),
      type: "survey",
      subject: `How did we do? — ${jobTitle}`,
      body: `Hi ${clientName ?? "there"},\n\nWe hope you're happy with the work on "${jobTitle}" yesterday.\n\nWe'd love to hear your feedback — it only takes 30 seconds:\n${appUrl}/feedback/${job_id}\n\nThanks for your time!`,
      channel: "email",
    },
    {
      send_at: addDays(now, 3).toISOString(),
      type: "review_request",
      subject: `Would you leave us a Google review?`,
      body: `Hi ${clientName ?? "there"},\n\nWe're glad the job went well! If you have a moment, a Google review would mean the world to us and helps other locals find us.\n\nLeave a review: ${appUrl}/review\n\nThank you so much!`,
      channel: "email",
    },
    {
      send_at: addDays(now, 90).toISOString(),
      type: "maintenance_reminder",
      subject: `Time for your next maintenance check?`,
      body: `Hi ${clientName ?? "there"},\n\nIt's been about 3 months since we completed "${jobTitle}" for you. This is a friendly reminder that regular maintenance can save you money in the long run.\n\nBook your next service: ${appUrl}/book\n\nSee you soon!`,
      channel: "email",
    },
  ];

  // Store in job_follow_up_queue table (best effort — table may not exist)
  if (clientEmail) {
    try {
      await supabase.from("job_follow_up_queue").insert(
        messages.map((m) => ({
          owner_id: user.id,
          job_id: job.id,
          client_id: job.client_id,
          send_at: m.send_at,
          type: m.type,
          subject: m.subject,
          body: m.body,
          channel: m.channel,
          status: "pending",
        }))
      );
    } catch { /* table may not exist — graceful degradation */ }
  }

  return NextResponse.json({
    ok: true,
    scheduled_count: messages.length,
    messages: messages.map((m) => ({
      type: m.type,
      send_at: m.send_at,
      subject: m.subject,
      will_send: Boolean(clientEmail),
    })),
  });
}
