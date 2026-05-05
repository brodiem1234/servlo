import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "SERVLO <no-reply@servlo.com.au>";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!to) return { ok: false, error: "Missing recipient email" };
  if (!resend) {
    console.error("Email send skipped: RESEND_API_KEY missing");
    return { ok: false, error: "RESEND_API_KEY missing" };
  }
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
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

