import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

/**
 * GET /api/cron/trial-check
 * Called daily via Vercel cron at 07:00 UTC.
 * Sends trial expiry warning emails and marks expired trials.
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

  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString();
  const nowISO = now.toISOString();

  let processed3Day = 0;
  let processed1Day = 0;
  let processedExpired = 0;

  try {
    // ── 1. 3-day warning ─────────────────────────────────────────────────────
    const { data: users3Day } = await admin
      .from("profiles")
      .select("id, email, full_name, trial_end")
      .not("trial_end", "is", null)
      .lte("trial_end", threeDaysFromNow)
      .gte("trial_end", nowISO)
      .eq("trial_expired_notified_3day", false)
      .neq("subscription_status", "active");

    for (const user of users3Day ?? []) {
      if (!user.email) continue;
      const name = user.full_name ?? "there";
      const trialEndDate = new Date(user.trial_end).toLocaleDateString("en-AU", {
        day: "numeric", month: "long", year: "numeric",
      });
      await sendEmail(
        user.email,
        "Your SERVLO trial ends in 3 days",
        trialExpiry3DayEmail(name, trialEndDate)
      );
      await admin
        .from("profiles")
        .update({ trial_expired_notified_3day: true })
        .eq("id", user.id);
      processed3Day++;
    }

    // ── 2. 1-day warning ──���──────────────────────────────────────────────────
    const { data: users1Day } = await admin
      .from("profiles")
      .select("id, email, full_name, trial_end")
      .not("trial_end", "is", null)
      .lte("trial_end", oneDayFromNow)
      .gte("trial_end", nowISO)
      .eq("trial_expired_notified_1day", false)
      .neq("subscription_status", "active");

    for (const user of users1Day ?? []) {
      if (!user.email) continue;
      const name = user.full_name ?? "there";
      const trialEndDate = new Date(user.trial_end).toLocaleDateString("en-AU", {
        day: "numeric", month: "long", year: "numeric",
      });
      await sendEmail(
        user.email,
        "Last day of your SERVLO trial — don't lose your data",
        trialExpiry1DayEmail(name, trialEndDate)
      );
      await admin
        .from("profiles")
        .update({ trial_expired_notified_1day: true })
        .eq("id", user.id);
      processed1Day++;
    }

    // ── 3. Mark expired trials ─────────────────────────────────────────────
    const { data: expiredUsers } = await admin
      .from("profiles")
      .select("id")
      .not("trial_end", "is", null)
      .lt("trial_end", nowISO)
      .is("trial_expired_at", null)
      .neq("subscription_status", "active");

    for (const user of expiredUsers ?? []) {
      await admin
        .from("profiles")
        .update({ trial_expired_at: nowISO, plan: "free" })
        .eq("id", user.id);
      processedExpired++;
    }

    return NextResponse.json({
      ok: true,
      processed3Day,
      processed1Day,
      processedExpired,
    });
  } catch (err) {
    console.error("[cron/trial-check] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ── Email templates ──────────────────────────────────────────────────────────

function trialExpiry3DayEmail(name: string, trialEndDate: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Trial ending soon</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#3B82F6;padding:24px 32px;">
          <span style="color:#fff;font-size:20px;font-weight:bold;">SERVLO</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#0f172a;">Hi ${name}, your access ends in 3 days</h2>
          <p style="color:#475569;line-height:1.6;">Your SERVLO subscription needs attention by <strong>${trialEndDate}</strong>. Update billing to keep accessing your jobs, clients, invoices, and all your business data.</p>
          <p style="color:#475569;line-height:1.6;">Choose a plan and keep growing your business:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/upgrade" style="background:#3B82F6;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
              Choose a plan →
            </a>
          </div>
          <p style="color:#94a3b8;font-size:13px;">Questions? Reply to this email or visit <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#3B82F6;">servlo.app</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function trialExpiry1DayEmail(name: string, trialEndDate: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Last day of trial</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#dc2626;padding:24px 32px;">
          <span style="color:#fff;font-size:20px;font-weight:bold;">SERVLO</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#0f172a;">Hi ${name}, your access ends today</h2>
          <p style="color:#475569;line-height:1.6;">Your SERVLO subscription expires today, <strong>${trialEndDate}</strong>. Update billing now to keep uninterrupted access to all your business data.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/upgrade" style="background:#dc2626;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
              Subscribe now →
            </a>
          </div>
          <p style="color:#94a3b8;font-size:13px;">Need help choosing? Reply to this email — we&apos;re here to help.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
