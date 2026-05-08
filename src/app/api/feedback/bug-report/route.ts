import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/feedback/bug-report
 * Body: { whatDoing, whatWentWrong, currentUrl, browserInfo, consoleErrors }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    whatDoing?: string;
    whatWentWrong?: string;
    currentUrl?: string;
    browserInfo?: unknown;
    consoleErrors?: unknown;
  };
  try { body = await req.json(); } catch { body = {}; }

  if (!body.whatDoing || String(body.whatDoing).trim().length < 5) {
    return NextResponse.json({ error: "whatDoing is required (min 5 chars)" }, { status: 400 });
  }
  if (!body.whatWentWrong || String(body.whatWentWrong).trim().length < 5) {
    return NextResponse.json({ error: "whatWentWrong is required (min 5 chars)" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Save to DB
  const { error } = await admin.from("bug_reports").insert({
    user_id: user.id,
    what_doing: String(body.whatDoing).trim().slice(0, 2000),
    what_went_wrong: String(body.whatWentWrong).trim().slice(0, 2000),
    current_url: body.currentUrl ? String(body.currentUrl).slice(0, 500) : null,
    browser_info: body.browserInfo ?? null,
    console_errors: body.consoleErrors ?? null,
  });

  if (error) {
    console.error("[feedback/bug-report] DB error:", error);
  }

  // Get user email for the notification
  const { data: profile } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();

  // Email the support team
  const emailHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 20px">
      <h2 style="color:#dc2626">Bug Report from ${profile?.full_name ?? "Unknown User"}</h2>
      <p><strong>User:</strong> ${profile?.email ?? user.id}</p>
      <p><strong>URL:</strong> ${body.currentUrl ?? "Unknown"}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
      <p><strong>What were they doing:</strong></p>
      <blockquote style="border-left:3px solid #e2e8f0;padding-left:12px;color:#475569">${String(body.whatDoing).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</blockquote>
      <p><strong>What went wrong:</strong></p>
      <blockquote style="border-left:3px solid #e2e8f0;padding-left:12px;color:#475569">${String(body.whatWentWrong).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</blockquote>
      ${body.browserInfo ? `<p><strong>Browser:</strong> <code style="font-size:12px">${JSON.stringify(body.browserInfo).slice(0, 300)}</code></p>` : ""}
      ${Array.isArray(body.consoleErrors) && (body.consoleErrors as string[]).length > 0
        ? `<p><strong>Console errors:</strong></p><pre style="background:#f8fafc;padding:12px;border-radius:6px;font-size:12px;overflow:auto">${(body.consoleErrors as string[]).join("\n").slice(0, 1000)}</pre>`
        : ""
      }
    </div>
  `;

  await sendEmail(
    "hello@servlo.com.au",
    `Bug Report: ${String(body.whatWentWrong).slice(0, 60)}`,
    emailHtml
  );

  return NextResponse.json({ ok: true });
}
