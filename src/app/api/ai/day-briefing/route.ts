import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayIso = isoLocal(new Date());

  const [{ data: todayJobs }, { data: overdueInvoices }, { data: recentActivity }] =
    await Promise.all([
      sb
        .from("jobs")
        .select("id, title, status, scheduled_start, address, suburb")
        .eq("owner_id", user.id)
        .eq("scheduled_date", todayIso)
        .is("deleted_at", null)
        .order("scheduled_start")
        .limit(10),
      sb
        .from("invoices")
        .select("id, invoice_number, total, due_date")
        .eq("owner_id", user.id)
        .eq("status", "unpaid")
        .is("deleted_at", null)
        .lt("due_date", todayIso)
        .limit(5),
      sb
        .from("jobs")
        .select("id, title, status, created_at")
        .eq("owner_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    // Stub briefing when key is missing
    const jobCount = (todayJobs ?? []).length;
    const overdueCount = (overdueInvoices ?? []).length;
    const stub =
      `Good morning! You have ${jobCount} job${jobCount !== 1 ? "s" : ""} scheduled for today.` +
      (overdueCount > 0
        ? ` There ${overdueCount === 1 ? "is" : "are"} ${overdueCount} overdue invoice${overdueCount !== 1 ? "s" : ""} that need attention.`
        : " No overdue invoices — great work!") +
      " Have a productive day.";
    return NextResponse.json({ briefing: stub });
  }

  // Build context for the AI
  const jobLines = (todayJobs ?? [])
    .map((j) => `- ${j.title ?? "Untitled"} (${j.status ?? "pending"})${j.scheduled_start ? ` at ${j.scheduled_start.slice(0, 5)}` : ""}${j.address ? ` — ${j.address}${j.suburb ? ", " + j.suburb : ""}` : ""}`)
    .join("\n");

  const invoiceLines = (overdueInvoices ?? [])
    .map((inv) => `- ${inv.invoice_number ?? "Invoice"}: $${inv.total ?? 0} overdue`)
    .join("\n");

  const recentLines = (recentActivity ?? [])
    .map((j) => `- ${j.title ?? "Job"} (${j.status ?? "pending"})`)
    .join("\n");

  const prompt = `You are a concise business assistant for an Australian service business owner. Write a brief, friendly morning run sheet in plain text (no markdown, ~100 words) covering:
- Today's ${(todayJobs ?? []).length} scheduled job(s)
- ${(overdueInvoices ?? []).length} overdue invoice(s) needing follow-up
- Any recent activity to be aware of

Today's jobs:
${jobLines || "None"}

Overdue invoices:
${invoiceLines || "None"}

Recent activity:
${recentLines || "None"}

Keep it upbeat, practical, and under 120 words. Address the owner directly.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const json = await response.json();
    const text =
      json?.content?.[0]?.type === "text" ? (json.content[0].text as string) : "No briefing available.";

    return NextResponse.json({ briefing: text });
  } catch (err) {
    console.error("[day-briefing] Anthropic call failed:", err);
    return NextResponse.json(
      { briefing: "Unable to generate briefing right now. Check back soon!" },
      { status: 200 }
    );
  }
}
