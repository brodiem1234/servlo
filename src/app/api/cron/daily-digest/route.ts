import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ownerDailyDigestEmailTemplate, sendEmail } from "@/lib/email";

/** Scheduled via external cron (e.g. 7:00) with Authorization: Bearer CRON_SECRET */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const todayKey = new Date().toISOString().slice(0, 10);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au";

  const { data: profiles, error } = await admin.from("profiles").select("id, email_digest_enabled, role").eq("role", "owner");

  if (error) {
    console.error("[cron/daily-digest] profiles query failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const owners = (profiles ?? []).filter((p: { email_digest_enabled?: boolean | null }) => p.email_digest_enabled !== false);

  let sent = 0;
  for (const row of owners) {
    const ownerId = row.id as string;
    const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(ownerId);
    if (authErr || !authUser.user?.email) continue;
    const email = authUser.user.email;

    const [{ data: jobs }, { data: unpaid }, { data: quotes }] = await Promise.all([
      admin
        .from("jobs")
        .select("title, scheduled_start")
        .eq("owner_id", ownerId)
        .eq("scheduled_date", todayKey)
        .order("scheduled_start", { ascending: true }),
      admin
        .from("invoices")
        .select("invoice_number, amount, due_date")
        .eq("owner_id", ownerId)
        .eq("status", "unpaid")
        .order("due_date", { ascending: true })
        .limit(10),
      admin
        .from("quotes")
        .select("quote_number, status, created_at, total")
        .eq("owner_id", ownerId)
        .in("status", ["sent", "pending"])
        .order("created_at", { ascending: true })
        .limit(25)
    ]);

    const jobsHtml =
      jobs && jobs.length > 0
        ? `<ul style="margin:0;padding-left:18px;color:#334155;">${jobs
            .map((j: { title?: string | null; scheduled_start?: string | null }) => `<li>${j.title ?? "Job"} · ${(j.scheduled_start ?? "").slice(0, 5) || "—"}</li>`)
            .join("")}</ul>`
        : `<p style="color:#64748b;">No jobs scheduled for ${todayKey}.</p>`;

    const invHtml =
      unpaid && unpaid.length > 0
        ? `<ul style="margin:0;padding-left:18px;color:#334155;">${unpaid
            .map(
              (i: { invoice_number?: string | null; amount?: number | null; due_date?: string | null }) =>
                `<li>${i.invoice_number ?? "Invoice"} · $${Number(i.amount ?? 0).toFixed(2)} · due ${i.due_date ?? "—"}</li>`
            )
            .join("")}</ul>`
        : `<p style="color:#64748b;">No unpaid invoices right now.</p>`;

    const staleQuotes = (quotes ?? []).filter((q: { created_at?: string | null }) => {
      if (!q.created_at) return false;
      const ageDays = Math.floor((Date.now() - new Date(q.created_at).getTime()) / (1000 * 60 * 60 * 24));
      return ageDays >= 3;
    });

    const qHtml =
      staleQuotes.length > 0
        ? `<ul style="margin:0;padding-left:18px;color:#334155;">${staleQuotes
            .map(
              (q: { quote_number?: string | null; total?: number | null }) =>
                `<li>${q.quote_number ?? "Quote"} · awaiting · $${Number(q.total ?? 0).toFixed(2)}</li>`
            )
            .join("")}</ul>`
        : `<p style="color:#64748b;">No quotes stuck awaiting acceptance (3+ days).</p>`;

    await sendEmail(
      email,
      "SERVLO daily digest",
      ownerDailyDigestEmailTemplate({
        jobsSection: jobsHtml,
        invoicesSection: invHtml,
        quotesSection: qHtml,
        dashboardUrl: `${baseUrl}/dashboard/owner`
      })
    );
    sent += 1;
  }

  // ── Welcome email sequence (day 3 and day 7 after signup) ─────────────────
  // For each owner, check how many days since trial_start and send the
  // appropriate sequence email if it hasn't been sent yet.
  const allOwnerRows = (profiles ?? []).filter((p: { role?: string }) => p.role === "owner");
  let sequencesSent = 0;

  for (const row of allOwnerRows) {
    const ownerId = row.id as string;
    const { data: profileDetail } = await admin
      .from("profiles")
      .select("trial_start, welcome_day3_sent, welcome_day7_sent, email, full_name")
      .eq("id", ownerId)
      .maybeSingle();

    if (!profileDetail?.trial_start) continue;

    const { data: authUser } = await admin.auth.admin.getUserById(ownerId);
    const email = authUser?.user?.email;
    if (!email) continue;

    const name = profileDetail.full_name || email.split("@")[0];
    const trialStart = new Date(profileDetail.trial_start);
    const daysSince = Math.floor((Date.now() - trialStart.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince >= 3 && !profileDetail.welcome_day3_sent) {
      await sendEmail(
        email,
        "3 things to do in SERVLO this week",
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
          <h2 style="color:#3B82F6">Hi ${name} — here are 3 quick wins for your first week</h2>
          <p>You signed up 3 days ago. Here are the three things that make the biggest difference for service businesses like yours:</p>
          <ol style="color:#334155;line-height:1.8">
            <li><strong>Create your first quote</strong> — send it in under 2 minutes. <a href="${baseUrl}/dashboard/owner/quotes">Go to Quotes →</a></li>
            <li><strong>Add your clients</strong> — import from a spreadsheet or add them one by one. <a href="${baseUrl}/dashboard/owner/clients">Go to Clients →</a></li>
            <li><strong>Schedule a job</strong> — plan your week and keep your team in sync. <a href="${baseUrl}/dashboard/owner/jobs">Go to Jobs →</a></li>
          </ol>
          <p>Questions? Just reply to this email — we read every one.</p>
          <p style="color:#64748b">— The SERVLO team</p>
        </div>`
      );
      await admin.from("profiles").update({ welcome_day3_sent: true }).eq("id", ownerId);
      sequencesSent += 1;
    }

    if (daysSince >= 7 && !profileDetail.welcome_day7_sent) {
      await sendEmail(
        email,
        "How is SERVLO working for you?",
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
          <h2 style="color:#3B82F6">One week in — how is it going?</h2>
          <p>Hi ${name},</p>
          <p>It has been a week since you joined SERVLO. We hope it is already saving you time.</p>
          <p>A few features worth exploring if you haven't yet:</p>
          <ul style="color:#334155;line-height:1.8">
            <li><strong>Recurring jobs</strong> — set up weekly or monthly jobs that generate automatically</li>
            <li><strong>Online booking</strong> — let clients book directly from your website</li>
            <li><strong>Job automations</strong> — send automatic emails when jobs change status</li>
          </ul>
          <p>Your trial has ${30 - daysSince} days left. If you have any questions or feedback, reply to this email — we'd love to hear from you.</p>
          <p><a href="${baseUrl}/dashboard/owner" style="display:inline-block;background:#3B82F6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Open my dashboard</a></p>
          <p style="color:#64748b">— The SERVLO team</p>
        </div>`
      );
      await admin.from("profiles").update({ welcome_day7_sent: true }).eq("id", ownerId);
      sequencesSent += 1;
    }
  }

  return NextResponse.json({ ok: true, owners: owners.length, emailsAttempted: sent, sequencesSent });
}
