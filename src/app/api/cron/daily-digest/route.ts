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
        .select("invoice_number, total, due_date")
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
              (i: { invoice_number?: string | null; total?: number | null; due_date?: string | null }) =>
                `<li>${i.invoice_number ?? "Invoice"} · $${Number(i.total ?? 0).toFixed(2)} · due ${i.due_date ?? "—"}</li>`
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

  return NextResponse.json({ ok: true, owners: owners.length, emailsAttempted: sent });
}
