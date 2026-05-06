import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "SERVLO <no-reply@servlo.com.au>";

export async function sendEmail(to: string, subject: string, html: string, fromOverride?: string) {
  if (!to) return { ok: false, error: "Missing recipient email" };
  if (!resend) {
    console.error("Email send skipped: RESEND_API_KEY missing");
    return { ok: false, error: "RESEND_API_KEY missing" };
  }
  try {
    await resend.emails.send({
      from: fromOverride ?? FROM_EMAIL,
      to,
      subject,
      html
    });
    return { ok: true };
  } catch (error) {
    console.error("Resend sendEmail error", error);
    return { ok: false, error: String(error) };
  }
}

function wrapEmail(content: string) {
  return `
    <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
      <div style="max-width:640px; margin:0 auto; background:white; border:1px solid #e2e8f0; border-radius:12px; padding:24px;">
        <h1 style="margin:0 0 16px; color:#1e3a5f;">SERVLO</h1>
        ${content}
      </div>
    </div>
  `;
}

export function invoiceReminderEmailTemplate(args: {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  payNowUrl: string;
}) {
  return wrapEmail(`
    <h2 style="margin:0 0 12px; color:#0f172a;">Invoice Reminder</h2>
    <p>Hi ${args.clientName},</p>
    <p>This is a friendly reminder for invoice <strong>${args.invoiceNumber}</strong>.</p>
    <p>Amount: <strong>${args.amount}</strong><br/>Due date: <strong>${args.dueDate}</strong></p>
    <p><a href="${args.payNowUrl}" style="background:#1e3a5f;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;">Pay Now</a></p>
    <p style="color:#64748b;">Thank you,<br/>SERVLO Team</p>
  `);
}

export function quoteFollowUpEmailTemplate(args: {
  clientName: string;
  quoteNumber: string;
  quoteDate: string;
}) {
  return wrapEmail(`
    <h2 style="margin:0 0 12px; color:#0f172a;">Quote Follow-up</h2>
    <p>Hi ${args.clientName},</p>
    <p>We are following up on quote <strong>${args.quoteNumber}</strong> sent on ${args.quoteDate}.</p>
    <p>Please let us know if you would like to proceed or need any changes.</p>
    <p style="color:#64748b;">Thanks,<br/>SERVLO Team</p>
  `);
}

export function employeeAssignmentEmailTemplate(args: {
  employeeName: string;
  jobTitle: string;
  scheduledDate: string;
}) {
  return wrapEmail(`
    <h2 style="margin:0 0 12px; color:#0f172a;">New Job Assignment</h2>
    <p>Hi ${args.employeeName},</p>
    <p>You have been assigned to <strong>${args.jobTitle}</strong>.</p>
    <p>Scheduled date: <strong>${args.scheduledDate}</strong></p>
    <p style="color:#64748b;">Please check your SERVLO dashboard for details.</p>
  `);
}

export function portalShareEmailTemplate(args: {
  clientName: string;
  portalUrl: string;
}) {
  return wrapEmail(`
    <h2 style="margin:0 0 12px; color:#0f172a;">Your SERVLO Client Portal</h2>
    <p>Hi ${args.clientName},</p>
    <p>You can view your quotes, invoices, and jobs using the portal link below:</p>
    <p><a href="${args.portalUrl}" style="background:#1e3a5f;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;">Open Portal</a></p>
    <p style="word-break:break-all;color:#64748b;">${args.portalUrl}</p>
  `);
}

export function welcomeOwnerEmailTemplate(args: {
  ownerName: string;
  dashboardUrl: string;
  supportUrl: string;
  industryLabel?: string | null;
  highlightFeatures?: string[];
}) {
  const industryLine =
    args.industryLabel?.trim() ?
      `<p style="color:#334155;">We&apos;ve tailored your workspace for <strong>${args.industryLabel.trim()}</strong>.</p>`
    : "";
  const highlights =
    args.highlightFeatures?.filter(Boolean).slice(0, 3) ?? [];
  const bullets =
    highlights.length > 0 ?
      `<ul style="margin:8px 0;padding-left:18px;color:#334155;line-height:1.6;">${highlights.map((h) => `<li>${h}</li>`).join("")}</ul>`
    : `<ul style="margin:8px 0;padding-left:18px;color:#334155;line-height:1.6;">
        <li>Add your first client and create a job so your calendar fills up.</li>
        <li>Send quotes from SERVLO so follow-ups stay organised.</li>
        <li>Use invoices with reminders to get paid on time.</li>
      </ul>`;

  return wrapEmail(`
    <h2 style="margin:0 0 12px; color:#0f172a;">Welcome to SERVLO</h2>
    <p>Hi ${args.ownerName},</p>
    ${industryLine}
    <p style="color:#334155;">Your workspace is ready — here are three highlights we&apos;ve switched on for you:</p>
    ${bullets}
    <p><a href="${args.dashboardUrl}" style="background:#1e3a5f;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;">Go to dashboard</a></p>
    <p style="margin-top:16px;color:#334155;">You can turn modules on or off anytime under Settings → Features.</p>
    <p style="margin-top:16px;color:#334155;">Questions? <a href="${args.supportUrl}" style="color:#1e3a5f;font-weight:600;">Contact support</a>.</p>
    <p style="color:#64748b;">— SERVLO</p>
  `);
}

export function ownerDailyDigestEmailTemplate(args: {
  jobsSection: string;
  invoicesSection: string;
  quotesSection: string;
  dashboardUrl: string;
}) {
  return wrapEmail(`
    <h2 style="margin:0 0 12px; color:#0f172a;">Your SERVLO morning snapshot</h2>
    <p style="color:#334155;">Here is what needs attention today.</p>
    <h3 style="margin:18px 0 8px;color:#0f172a;font-size:15px;">Jobs scheduled today</h3>
    ${args.jobsSection}
    <h3 style="margin:18px 0 8px;color:#0f172a;font-size:15px;">Outstanding invoices</h3>
    ${args.invoicesSection}
    <h3 style="margin:18px 0 8px;color:#0f172a;font-size:15px;">Quotes awaiting acceptance</h3>
    ${args.quotesSection}
    <p style="margin-top:20px;"><a href="${args.dashboardUrl}" style="background:#1e3a5f;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;">Open dashboard</a></p>
    <p style="color:#64748b;font-size:12px;">You can turn this email off in Settings → Notifications.</p>
  `);
}

