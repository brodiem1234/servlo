import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "SERVLO <hello@servlo.com.au>";
const HELLO_FROM = "SERVLO <hello@servlo.com.au>";

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

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapEmail(content: string, accentHex = "#3B82F6", options?: { businessName?: string }) {
  const businessNameCell = options?.businessName
    ? `<td style="font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.85);text-align:right;vertical-align:bottom;">${escHtml(options.businessName)}</td>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>SERVLO</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${accentHex};">
                <tr>
                  <td style="padding:20px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family:Arial,sans-serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">SERVLO</td>
                        ${businessNameCell}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="font-family:Arial,sans-serif;">${content}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-top:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:20px 32px;">
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#94a3b8;">Powered by <strong>SERVLO</strong>. Business management software for Australian service businesses. This email was sent on behalf of your service provider.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function invoiceSentEmailTemplate(args: {
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  issueDate?: string;
  dueDate: string;
  subtotal: string;
  gst: string;
  total: string;
  accentHex?: string;
  appUrl?: string;
  /** Stripe Payment Link URL — when present, a prominent Pay Now button is shown. */
  payNowUrl?: string | null;
}) {
  const accent = args.accentHex ?? "#3B82F6";
  const portalUrl = `${args.appUrl ?? "https://servlo.app"}/dashboard/client`;
  const issueDateCol = args.issueDate
    ? `<td width="33%" style="padding:12px 16px;border-right:1px solid #e2e8f0;">
        <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Issue Date</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;">${escHtml(args.issueDate)}</p>
      </td>`
    : "";
  const colWidth = args.issueDate ? "33%" : "50%";
  const detailGrid = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
      <tr>
        <td width="${colWidth}" style="padding:12px 16px;border-right:1px solid #e2e8f0;">
          <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Invoice No.</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;">${escHtml(args.invoiceNumber)}</p>
        </td>
        ${issueDateCol}
        <td width="${colWidth}" style="padding:12px 16px;">
          <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Due Date</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#dc2626;">${escHtml(args.dueDate)}</p>
        </td>
      </tr>
    </table>`;
  const amountTable = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Subtotal</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#334155;text-align:right;border-bottom:1px solid #f1f5f9;">${escHtml(args.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">GST (10%)</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#334155;text-align:right;border-bottom:1px solid #f1f5f9;">${escHtml(args.gst)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 8px;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#0f172a;border-top:2px solid #e2e8f0;">Total due</td>
        <td style="padding:12px 0 8px;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#0f172a;text-align:right;border-top:2px solid #e2e8f0;">${escHtml(args.total)}</td>
      </tr>
    </table>`;
  const payNowBlock = args.payNowUrl
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 8px;">
        <tr>
          <td style="border-radius:6px;background:#16a34a;">
            <a href="${escHtml(args.payNowUrl)}" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;letter-spacing:0.01em;">Pay Now</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;">Secure payment processed via Stripe.</p>`
    : "";
  const viewBlock = !args.payNowUrl
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 8px;">
        <tr>
          <td style="border-radius:6px;background:${accent};">
            <a href="${escHtml(portalUrl)}" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;">View Invoice</a>
          </td>
        </tr>
      </table>
      <p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;">Or copy this link: ${escHtml(portalUrl)}</p>`
    : `<p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#64748b;">Or <a href="${escHtml(portalUrl)}" style="color:${accent};text-decoration:underline;">view invoice in your portal</a>.</p>`;
  return wrapEmail(`
    <h1 style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0f172a;">Invoice from ${escHtml(args.businessName)}</h1>
    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#475569;">Dear ${escHtml(args.clientName)},</p>
    <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:14px;color:#334155;">Please find your invoice details below. Payment is due by <strong>${escHtml(args.dueDate)}</strong>.</p>
    ${detailGrid}
    ${amountTable}
    ${payNowBlock}
    ${viewBlock}
  `, accent, { businessName: args.businessName });
}

export function quoteSentEmailTemplate(args: {
  clientName: string;
  businessName: string;
  quoteNumber: string;
  issueDate?: string;
  expiryDate?: string | null;
  subtotal: string;
  gst: string;
  total: string;
  accentHex?: string;
  appUrl?: string;
}) {
  const accent = args.accentHex ?? "#3B82F6";
  const portalUrl = `${args.appUrl ?? "https://servlo.app"}/dashboard/client`;
  const colCount = args.issueDate && args.expiryDate ? 3 : args.issueDate ? 2 : 1;
  const colWidth = colCount === 3 ? "33%" : colCount === 2 ? "50%" : "100%";
  const issueDateCol = args.issueDate
    ? `<td width="${colWidth}" style="padding:12px 16px;border-right:1px solid #e2e8f0;">
        <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Issue Date</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;">${escHtml(args.issueDate)}</p>
      </td>`
    : "";
  const expiryCol = args.expiryDate
    ? `<td width="${colWidth}" style="padding:12px 16px;">
        <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Valid Until</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#d97706;">${escHtml(args.expiryDate)}</p>
      </td>`
    : "";
  const detailGrid = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
      <tr>
        <td width="${colWidth}" style="padding:12px 16px;${args.issueDate || args.expiryDate ? "border-right:1px solid #e2e8f0;" : ""}">
          <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Quote No.</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;">${escHtml(args.quoteNumber)}</p>
        </td>
        ${issueDateCol}
        ${expiryCol}
      </tr>
    </table>`;
  const expiryNotice = args.expiryDate
    ? `<p style="margin:16px 0;font-family:Arial,sans-serif;font-size:13px;color:#92400e;background:#fef3c7;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;">This quote is valid until <strong>${escHtml(args.expiryDate)}</strong>. Accept it before then to lock in these prices.</p>`
    : "";
  const amountTable = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Subtotal</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#334155;text-align:right;border-bottom:1px solid #f1f5f9;">${escHtml(args.subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">GST (10%)</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#334155;text-align:right;border-bottom:1px solid #f1f5f9;">${escHtml(args.gst)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 8px;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#0f172a;border-top:2px solid #e2e8f0;">Total</td>
        <td style="padding:12px 0 8px;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#0f172a;text-align:right;border-top:2px solid #e2e8f0;">${escHtml(args.total)}</td>
      </tr>
    </table>`;
  return wrapEmail(`
    <h1 style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0f172a;">Quote from ${escHtml(args.businessName)}</h1>
    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#475569;">Dear ${escHtml(args.clientName)},</p>
    <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:14px;color:#334155;">We have prepared a quote for your review. Please find the details below.</p>
    ${detailGrid}
    ${amountTable}
    ${expiryNotice}
    <table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 8px;">
      <tr>
        <td style="border-radius:6px;background:${accent};">
          <a href="${escHtml(portalUrl)}" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;">View &amp; Accept Your Quote</a>
        </td>
      </tr>
    </table>
    <p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;">Or copy this link: ${escHtml(portalUrl)}</p>
    <p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#64748b;">Questions about this quote? Simply reply to this email and we will get back to you promptly.</p>
  `, accent, { businessName: args.businessName });
}

/** Invoice payment reminder template. */
export function invoiceReminderEmailTemplate(args: {
  clientName: string;
  businessName?: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  payNowUrl: string;
  accentHex?: string;
}) {
  const accent = args.accentHex ?? "#3B82F6";
  const payBlock = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 8px;">
      <tr>
        <td style="border-radius:6px;background:#16a34a;">
          <a href="${escHtml(args.payNowUrl)}" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;">Pay Now</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;">Secure payment processed via Stripe.</p>`;
  return wrapEmail(`
    <h1 style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0f172a;">Friendly Payment Reminder</h1>
    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#475569;">Dear ${escHtml(args.clientName)},</p>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#334155;">
      Just a friendly reminder. <strong>Invoice ${escHtml(args.invoiceNumber)}</strong> is due on <strong>${escHtml(args.dueDate)}</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
      <tr>
        <td width="50%" style="padding:16px;border-right:1px solid #e2e8f0;">
          <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Invoice No.</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;font-weight:600;color:#0f172a;">${escHtml(args.invoiceNumber)}</p>
        </td>
        <td width="50%" style="padding:16px;">
          <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Amount Outstanding</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#0f172a;">${escHtml(args.amount)}</p>
        </td>
      </tr>
    </table>
    ${payBlock}
    <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#64748b;">If you have already made payment, please disregard this reminder. Thank you for your business!</p>
  `, accent, args.businessName ? { businessName: args.businessName } : undefined);
}

/** Legacy follow-up template — kept for cron digest use. */
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
  address?: string | null;
  notes?: string | null;
  accentHex?: string;
}) {
  const accent = args.accentHex ?? "#3B82F6";
  const addressRow = args.address
    ? `<tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Location</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9;">${escHtml(args.address)}</td>
      </tr>`
    : "";
  const notesBlock = args.notes
    ? `<p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#64748b;background:#f8fafc;border-radius:6px;padding:12px 14px;">${escHtml(args.notes)}</p>`
    : "";
  return wrapEmail(`
    <h1 style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0f172a;">New Job Assignment</h1>
    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#475569;">Hi ${escHtml(args.employeeName)},</p>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#334155;">You have been assigned to a new job. Please see the details below.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Job</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9;">${escHtml(args.jobTitle)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Scheduled</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9;">${escHtml(args.scheduledDate)}</td>
      </tr>
      ${addressRow}
    </table>
    ${notesBlock}
    <p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#64748b;">Please check your SERVLO dashboard for full details.</p>
  `, accent);
}

export function portalShareEmailTemplate(args: {
  clientName: string;
  portalUrl: string;
  businessName?: string;
  accentHex?: string;
}) {
  const accent = args.accentHex ?? "#3B82F6";
  return wrapEmail(`
    <h1 style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0f172a;">Your Client Portal</h1>
    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#475569;">Hi ${escHtml(args.clientName)},</p>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#334155;">You now have access to your client portal where you can view your quotes, invoices, and job progress at any time.</p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 8px;">
      <tr>
        <td style="border-radius:6px;background:${accent};">
          <a href="${escHtml(args.portalUrl)}" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;">Open Portal</a>
        </td>
      </tr>
    </table>
    <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;word-break:break-all;">${escHtml(args.portalUrl)}</p>
    <p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#64748b;">Bookmark this link to access your portal anytime. No login required.</p>
  `, accent, args.businessName ? { businessName: args.businessName } : undefined);
}

export function welcomeOwnerEmailTemplate(args: {
  ownerName: string;
  dashboardUrl: string;
  supportUrl: string;
  industryLabel?: string | null;
  highlightFeatures?: string[];
  businessName?: string;
}) {
  const appUrl = args.dashboardUrl.replace(/\/dashboard\/owner$/, "").replace(/\/dashboard$/, "") || "https://servlo.app";
  const clientsUrl = `${appUrl}/dashboard/owner/clients`;
  const jobsUrl = `${appUrl}/dashboard/owner/jobs`;
  const financeUrl = `${appUrl}/dashboard/owner/finance`;
  const dashboardUrl = `${appUrl}/dashboard`;

  const greeting = args.businessName?.trim()
    ? `Welcome to SERVLO, ${args.businessName.trim()}!`
    : `Welcome to SERVLO, ${args.ownerName}!`;

  return wrapEmail(`
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px;font-weight:700;">${greeting}</h2>
    <p style="margin:0 0 20px;color:#64748b;">Hi ${args.ownerName}, your workspace is ready. Here's how to get started in 5 minutes:</p>

    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
      <tr>
        <td style="padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;vertical-align:top;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0f172a;">1. Add your first client</p>
          <p style="margin:0 0 10px;font-size:13px;color:#64748b;">Store contact details and track job history</p>
          <a href="${clientsUrl}" style="font-size:12px;font-weight:600;color:#3B82F6;text-decoration:none;">Go to Clients →</a>
        </td>
      </tr>
      <tr><td style="padding:4px 0;"></td></tr>
      <tr>
        <td style="padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;vertical-align:top;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0f172a;">2. Create your first job</p>
          <p style="margin:0 0 10px;font-size:13px;color:#64748b;">Schedule, assign, and track every job</p>
          <a href="${jobsUrl}" style="font-size:12px;font-weight:600;color:#3B82F6;text-decoration:none;">Go to Jobs →</a>
        </td>
      </tr>
      <tr><td style="padding:4px 0;"></td></tr>
      <tr>
        <td style="padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;vertical-align:top;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0f172a;">3. Send your first invoice</p>
          <p style="margin:0 0 10px;font-size:13px;color:#64748b;">Get paid faster with professional invoices</p>
          <a href="${financeUrl}" style="font-size:12px;font-weight:600;color:#3B82F6;text-decoration:none;">Go to Finance →</a>
        </td>
      </tr>
    </table>

    <p style="text-align:center;margin:24px 0 8px;">
      <a href="${dashboardUrl}" style="display:inline-block;background:#3B82F6;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.01em;">Go to your dashboard →</a>
    </p>

    <p style="margin-top:20px;color:#64748b;font-size:13px;">You can turn modules on or off anytime under Settings → Features.</p>
    <p style="color:#64748b;font-size:13px;">Questions? <a href="${args.supportUrl}" style="color:#3B82F6;font-weight:600;">Contact support</a>.</p>
  `);
}

export function purchaseOrderEmailTemplate(args: {
  supplierName: string;
  businessName: string;
  poNumber: string;
  items: Array<{ description: string; quantity: number; unit_price: number }>;
  total: number;
  notes?: string | null;
  accentHex?: string;
}) {
  const accent = args.accentHex ?? "#3B82F6";
  const rows = args.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:6px 4px;color:#334155;border-bottom:1px solid #f1f5f9;">${item.description}</td>
          <td style="padding:6px 4px;text-align:right;color:#334155;border-bottom:1px solid #f1f5f9;">${item.quantity}</td>
          <td style="padding:6px 4px;text-align:right;color:#334155;border-bottom:1px solid #f1f5f9;">$${Number(item.unit_price).toFixed(2)}</td>
          <td style="padding:6px 4px;text-align:right;font-weight:600;color:#0f172a;border-bottom:1px solid #f1f5f9;">$${(item.quantity * item.unit_price).toFixed(2)}</td>
        </tr>`
    )
    .join("");
  const notesBlock = args.notes
    ? `<p style="color:#64748b;font-size:13px;margin:12px 0 0;">Notes: ${args.notes}</p>`
    : "";
  return wrapEmail(
    `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Purchase Order from ${args.businessName}</h2>
    <p style="margin:0 0 20px;color:#64748b;">Dear ${args.supplierName},</p>
    <p style="color:#334155;">Please find the purchase order details below.</p>
    <p style="margin:16px 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;">PO Number: ${args.poNumber}</p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:8px 4px;text-align:left;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Description</th>
          <th style="padding:8px 4px;text-align:right;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Qty</th>
          <th style="padding:8px 4px;text-align:right;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Unit</th>
          <th style="padding:8px 4px;text-align:right;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="text-align:right;padding:12px 0;border-top:2px solid #e2e8f0;">
      <span style="font-size:16px;font-weight:700;color:#0f172a;">Total: $${args.total.toFixed(2)}</span>
    </div>
    ${notesBlock}
    <p style="color:#334155;margin:16px 0;">Please confirm receipt and proceed with the order. Contact us if you have any questions.</p>
    <p style="color:#64748b;">${args.businessName}</p>
  `,
    accent
  );
}

export function ownerDailyDigestEmailTemplate(args: {
  jobsSection: string;
  invoicesSection: string;
  quotesSection: string;
  dashboardUrl: string;
  accentHex?: string;
}) {
  const accent = args.accentHex ?? "#3B82F6";
  return wrapEmail(`
    <h1 style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0f172a;">Your morning snapshot</h1>
    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:14px;color:#475569;">Here is what needs attention today.</p>
    <h2 style="margin:18px 0 8px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#0f172a;">Jobs scheduled today</h2>
    ${args.jobsSection}
    <h2 style="margin:18px 0 8px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#0f172a;">Outstanding invoices</h2>
    ${args.invoicesSection}
    <h2 style="margin:18px 0 8px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#0f172a;">Quotes awaiting acceptance</h2>
    ${args.quotesSection}
    <table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
      <tr>
        <td style="border-radius:6px;background:${accent};">
          <a href="${escHtml(args.dashboardUrl)}" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;">Open dashboard</a>
        </td>
      </tr>
    </table>
    <p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;">You can turn this email off in Settings &rarr; Notifications.</p>
  `, accent);
}

/** Job completion notification sent to client when a job is marked complete. */
export function jobCompletionEmailTemplate(args: {
  clientName: string;
  businessName: string;
  jobTitle: string;
  completionDate: string;
  signoffName?: string | null;
  jobNotes?: string | null;
  portalUrl?: string | null;
  accentHex?: string;
  businessPhone?: string | null;
}) {
  const accent = args.accentHex ?? "#3B82F6";
  const signoffRow = args.signoffName
    ? `<tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Signed off by</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9;">${escHtml(args.signoffName)}</td>
      </tr>`
    : "";
  const notesBlock = args.jobNotes
    ? `<p style="margin:16px 0;font-family:Arial,sans-serif;font-size:14px;color:#334155;background:#f8fafc;border-radius:6px;padding:12px 14px;">${escHtml(args.jobNotes)}</p>`
    : "";
  const portalBlock = args.portalUrl
    ? `<table cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 8px;">
        <tr>
          <td style="border-radius:6px;background:${accent};">
            <a href="${escHtml(args.portalUrl)}" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;">View in Portal</a>
          </td>
        </tr>
      </table>`
    : "";
  return wrapEmail(`
    <h1 style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0f172a;">Your job is complete!</h1>
    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#475569;">Dear ${escHtml(args.clientName)},</p>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#334155;">Great news. The following job has been completed by <strong>${escHtml(args.businessName)}</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Job</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9;">${escHtml(args.jobTitle)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Completed</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9;">${escHtml(args.completionDate)}</td>
      </tr>
      ${signoffRow}
    </table>
    ${notesBlock}
    ${portalBlock}
    <p style="margin:16px 0;font-family:Arial,sans-serif;font-size:14px;color:#334155;line-height:1.6;">Thank you for choosing ${escHtml(args.businessName)}. We appreciate your business and hope the work meets your expectations. Please do not hesitate to get in touch if you have any questions.</p>
    ${args.businessPhone ? `<p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#64748b;">Phone: <strong>${escHtml(args.businessPhone)}</strong></p>` : ""}
  `, accent, { businessName: args.businessName });
}

/** Trial ending notification for owner accounts — copy varies by daysRemaining (7/3/1). */
export function trialEndingEmailTemplate(args: {
  firstName: string;
  daysRemaining: number;
  upgradeUrl: string;
  accentHex?: string;
}) {
  const accent = args.accentHex ?? "#3B82F6";
  const d = args.daysRemaining;
  let urgencyBanner = "";
  let heading = "";
  let intro = "";
  let mainContent = "";

  if (d >= 7) {
    heading = `Your SERVLO access ends in ${d} day${d === 1 ? "" : "s"}`;
    intro = `Hi ${escHtml(args.firstName)}, your SERVLO subscription needs attention — access wraps up in <strong>${d} days</strong> unless you update your billing. Here's everything you keep when you continue:`;
    mainContent = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-family:Arial,sans-serif;font-size:13px;color:#334155;">&#x2714; All your client records and contact history</td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-family:Arial,sans-serif;font-size:13px;color:#334155;">&#x2714; All jobs, schedules, and job notes</td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-family:Arial,sans-serif;font-size:13px;color:#334155;">&#x2714; All invoices, quotes, and financial history</td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-family:Arial,sans-serif;font-size:13px;color:#334155;">&#x2714; Online invoice payments via Stripe</td></tr>
        <tr><td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:13px;color:#334155;">&#x2714; Automated invoice reminders</td></tr>
      </table>`;
  } else if (d >= 3) {
    urgencyBanner = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;background:#fef3c7;border-radius:6px;border:1px solid #fde68a;">
        <tr><td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#92400e;">Access ends in ${d} days. Update billing to keep your data.</td></tr>
      </table>`;
    heading = `Access ends in ${d} days`;
    intro = `Hi ${escHtml(args.firstName)}, your SERVLO subscription needs your attention — access ends in <strong>${d} days</strong>. After that, you'll lose access to:`;
    mainContent = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;border:1px solid #fecaca;border-radius:8px;overflow:hidden;background:#fef2f2;">
        <tr><td style="padding:12px 16px;border-bottom:1px solid #fee2e2;font-family:Arial,sans-serif;font-size:13px;color:#dc2626;">&#x2715; Your client records and contact history</td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid #fee2e2;font-family:Arial,sans-serif;font-size:13px;color:#dc2626;">&#x2715; All jobs and job scheduling</td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid #fee2e2;font-family:Arial,sans-serif;font-size:13px;color:#dc2626;">&#x2715; Your invoices and financial data</td></tr>
        <tr><td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:13px;color:#dc2626;">&#x2715; All quotes and documents</td></tr>
      </table>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#334155;">Upgrade now to keep everything and continue without disruption.</p>`;
  } else {
    urgencyBanner = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;background:#fef2f2;border-radius:6px;border:1px solid #fecaca;">
        <tr><td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#dc2626;">Access ends tomorrow. Update billing now to keep going.</td></tr>
      </table>`;
    heading = "Access ends tomorrow";
    intro = `Hi ${escHtml(args.firstName)}, this is your final reminder. Your SERVLO access expires <strong>tomorrow</strong> unless you update your billing.`;
    mainContent = `
      <p style="margin:16px 0;font-family:Arial,sans-serif;font-size:14px;color:#334155;">Update billing now to keep access to all your SERVLO data: clients, jobs, invoices, quotes, and everything you've built so far.</p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#334155;">Plans from $29/mo. No lock-in. Cancel anytime.</p>`;
  }

  return wrapEmail(`
    ${urgencyBanner}
    <h1 style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0f172a;">${heading}</h1>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#334155;">${intro}</p>
    ${mainContent}
    <table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
      <tr>
        <td style="border-radius:6px;background:${accent};">
          <a href="${escHtml(args.upgradeUrl)}" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;">Upgrade Your Plan</a>
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#64748b;">Questions about pricing? Reply to this email and we will help you choose the right plan.</p>
  `, accent);
}

