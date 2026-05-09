/**
 * Professional email templates for SERVLO.
 * All HTML uses inline styles only and table-based layouts for email client compatibility.
 * No flexbox, no CSS classes.
 */

const DEFAULT_ACCENT = "#3B82F6";

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHeader(accent: string, businessName?: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${accent};">
      <tr>
        <td style="padding:20px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-family:Arial,sans-serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">SERVLO</td>
              ${businessName ? `<td style="font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.85);text-align:right;vertical-align:bottom;">${escHtml(businessName)}</td>` : ""}
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function buildFooter(opts: {
  businessName?: string;
  businessAbn?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
}): string {
  const lines: string[] = [];
  if (opts.businessName) lines.push(`<strong>${escHtml(opts.businessName)}</strong>`);
  if (opts.businessAbn) lines.push(`ABN: ${escHtml(opts.businessAbn)}`);
  if (opts.businessPhone) lines.push(`Phone: ${escHtml(opts.businessPhone)}`);
  if (opts.businessEmail) lines.push(`Email: ${escHtml(opts.businessEmail)}`);

  const contactHtml = lines.length
    ? `<p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;color:#475569;line-height:1.6;">${lines.join(" &nbsp;·&nbsp; ")}</p>`
    : "";

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-top:1px solid #e2e8f0;">
      <tr>
        <td style="padding:20px 32px;">
          ${contactHtml}
          <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#94a3b8;">Powered by <strong>SERVLO</strong> — business management software for Australian service businesses.</p>
        </td>
      </tr>
    </table>`;
}

function wrapTemplate(header: string, body: string, footer: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>SERVLO</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr><td>${header}</td></tr>
          <tr>
            <td style="padding:32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="font-family:Arial,sans-serif;">${body}</td></tr>
              </table>
            </td>
          </tr>
          <tr><td>${footer}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function lineItemsTable(
  lineItems: Array<{ description: string; qty: number; unitPrice: number; total: number }>,
  subtotal: number,
  gstAmount: number,
  total: number
): string {
  const rows = lineItems
    .map(
      (li) => `
        <tr>
          <td style="padding:8px 6px;font-family:Arial,sans-serif;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9;">${escHtml(li.description)}</td>
          <td style="padding:8px 6px;font-family:Arial,sans-serif;font-size:13px;color:#334155;text-align:center;border-bottom:1px solid #f1f5f9;">${li.qty}</td>
          <td style="padding:8px 6px;font-family:Arial,sans-serif;font-size:13px;color:#334155;text-align:right;border-bottom:1px solid #f1f5f9;">${fmt(li.unitPrice)}</td>
          <td style="padding:8px 6px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9;">${fmt(li.total)}</td>
        </tr>`
    )
    .join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:10px 6px;font-family:Arial,sans-serif;font-size:12px;font-weight:600;color:#64748b;text-align:left;border-bottom:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.05em;">Description</th>
          <th style="padding:10px 6px;font-family:Arial,sans-serif;font-size:12px;font-weight:600;color:#64748b;text-align:center;border-bottom:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.05em;">Qty</th>
          <th style="padding:10px 6px;font-family:Arial,sans-serif;font-size:12px;font-weight:600;color:#64748b;text-align:right;border-bottom:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.05em;">Unit Price</th>
          <th style="padding:10px 6px;font-family:Arial,sans-serif;font-size:12px;font-weight:600;color:#64748b;text-align:right;border-bottom:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.05em;">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding:8px 6px;font-family:Arial,sans-serif;font-size:13px;color:#64748b;text-align:right;border-top:1px solid #e2e8f0;">Subtotal</td>
          <td style="padding:8px 6px;font-family:Arial,sans-serif;font-size:13px;color:#334155;text-align:right;border-top:1px solid #e2e8f0;">${fmt(subtotal)}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding:8px 6px;font-family:Arial,sans-serif;font-size:13px;color:#64748b;text-align:right;">GST (10%)</td>
          <td style="padding:8px 6px;font-family:Arial,sans-serif;font-size:13px;color:#334155;text-align:right;">${fmt(gstAmount)}</td>
        </tr>
        <tr style="background:#f8fafc;">
          <td colspan="3" style="padding:10px 6px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#0f172a;text-align:right;border-top:2px solid #e2e8f0;">Total</td>
          <td style="padding:10px 6px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#0f172a;text-align:right;border-top:2px solid #e2e8f0;">${fmt(total)}</td>
        </tr>
      </tfoot>
    </table>`;
}

function simpleAmountTable(subtotal: number, gstAmount: number, total: number): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Subtotal</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#334155;text-align:right;border-bottom:1px solid #f1f5f9;">${fmt(subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">GST (10%)</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#334155;text-align:right;border-bottom:1px solid #f1f5f9;">${fmt(gstAmount)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 8px;font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:#0f172a;border-top:2px solid #e2e8f0;">Total due</td>
        <td style="padding:12px 0 8px;font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:#0f172a;text-align:right;border-top:2px solid #e2e8f0;">${fmt(total)}</td>
      </tr>
    </table>`;
}

function ctaButton(label: string, url: string, accent: string): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
      <tr>
        <td style="border-radius:6px;background:${accent};">
          <a href="${escHtml(url)}" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;letter-spacing:0.01em;">${label}</a>
        </td>
      </tr>
    </table>`;
}

// ---------------------------------------------------------------------------
// Invoice email
// ---------------------------------------------------------------------------

export function invoiceEmailHtml(args: {
  clientName: string;
  businessName: string;
  businessAbn?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  lineItems?: Array<{ description: string; qty: number; unitPrice: number; total: number }> | null;
  subtotal: number;
  gstAmount: number;
  total: number;
  accentHex?: string;
  payNowUrl?: string | null;
  appUrl?: string;
}): string {
  const accent = args.accentHex ?? DEFAULT_ACCENT;

  const detailGrid = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
      <tr>
        <td width="33%" style="padding:12px 16px;border-right:1px solid #e2e8f0;">
          <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Invoice No.</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;">${escHtml(args.invoiceNumber)}</p>
        </td>
        <td width="33%" style="padding:12px 16px;border-right:1px solid #e2e8f0;">
          <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Issue Date</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;">${escHtml(args.issueDate)}</p>
        </td>
        <td width="33%" style="padding:12px 16px;">
          <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Due Date</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#dc2626;">${escHtml(args.dueDate)}</p>
        </td>
      </tr>
    </table>`;

  const amountSection =
    args.lineItems && args.lineItems.length > 0
      ? lineItemsTable(args.lineItems, args.subtotal, args.gstAmount, args.total)
      : simpleAmountTable(args.subtotal, args.gstAmount, args.total);

  const payNowSection = args.payNowUrl
    ? ctaButton("Pay Now", args.payNowUrl, "#16a34a") +
      `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;">Secure payment processed via Stripe.</p>`
    : "";

  const portalUrl = `${args.appUrl ?? "https://servlo.com.au"}/dashboard/client`;
  const viewSection = !args.payNowUrl
    ? ctaButton("View Invoice", portalUrl, accent)
    : `<p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#64748b;">
        Or <a href="${escHtml(portalUrl)}" style="color:${accent};text-decoration:underline;">view invoice in your portal</a>.
      </p>`;

  const body = `
    <h1 style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0f172a;">Invoice from ${escHtml(args.businessName)}</h1>
    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#475569;">Dear ${escHtml(args.clientName)},</p>
    <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:14px;color:#334155;">Please find your invoice details below. Payment is due by <strong>${escHtml(args.dueDate)}</strong>.</p>
    ${detailGrid}
    ${amountSection}
    ${payNowSection}
    ${viewSection}`;

  return wrapTemplate(
    buildHeader(accent, args.businessName),
    body,
    buildFooter({
      businessName: args.businessName,
      businessAbn: args.businessAbn,
      businessPhone: args.businessPhone,
      businessEmail: args.businessEmail,
    })
  );
}

// ---------------------------------------------------------------------------
// Quote email
// ---------------------------------------------------------------------------

export function quoteEmailHtml(args: {
  clientName: string;
  businessName: string;
  businessAbn?: string | null;
  quoteNumber: string;
  issueDate: string;
  expiryDate?: string | null;
  total: number;
  subtotal: number;
  gstAmount: number;
  lineItems?: Array<{ description: string; qty: number; unitPrice: number; total: number }> | null;
  accentHex?: string;
  viewUrl?: string;
}): string {
  const accent = args.accentHex ?? DEFAULT_ACCENT;

  const expiryCol = args.expiryDate
    ? `<td width="33%" style="padding:12px 16px;">
          <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Valid Until</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#d97706;">${escHtml(args.expiryDate)}</p>
        </td>`
    : "";

  const detailGrid = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
      <tr>
        <td width="${args.expiryDate ? "33%" : "50%"}" style="padding:12px 16px;border-right:1px solid #e2e8f0;">
          <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Quote No.</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;">${escHtml(args.quoteNumber)}</p>
        </td>
        <td width="${args.expiryDate ? "33%" : "50%"}" style="padding:12px 16px;${args.expiryDate ? "border-right:1px solid #e2e8f0;" : ""}">
          <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Issue Date</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;">${escHtml(args.issueDate)}</p>
        </td>
        ${expiryCol}
      </tr>
    </table>`;

  const amountSection =
    args.lineItems && args.lineItems.length > 0
      ? lineItemsTable(args.lineItems, args.subtotal, args.gstAmount, args.total)
      : simpleAmountTable(args.subtotal, args.gstAmount, args.total);

  const expiryNotice = args.expiryDate
    ? `<p style="margin:16px 0;font-family:Arial,sans-serif;font-size:13px;color:#92400e;background:#fef3c7;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;">
        This quote is valid until <strong>${escHtml(args.expiryDate)}</strong>. Accept it before then to lock in these prices.
      </p>`
    : "";

  const ctaUrl = args.viewUrl ?? "https://servlo.com.au/dashboard/client";
  const ctaSection =
    ctaButton("View &amp; Accept Your Quote", ctaUrl, accent) +
    `<p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;">Or copy this link: ${escHtml(ctaUrl)}</p>`;

  const body = `
    <h1 style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0f172a;">Quote from ${escHtml(args.businessName)}</h1>
    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#475569;">Dear ${escHtml(args.clientName)},</p>
    <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:14px;color:#334155;">We have prepared a quote for your review. Please find the details below.</p>
    ${detailGrid}
    ${amountSection}
    ${expiryNotice}
    ${ctaSection}
    <p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#64748b;">Questions about this quote? Simply reply to this email and we will get back to you promptly.</p>`;

  return wrapTemplate(
    buildHeader(accent, args.businessName),
    body,
    buildFooter({ businessName: args.businessName, businessAbn: args.businessAbn })
  );
}

// ---------------------------------------------------------------------------
// Invoice reminder email
// ---------------------------------------------------------------------------

export function invoiceReminderEmailHtml(args: {
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  dueDate: string;
  totalOutstanding: number;
  accentHex?: string;
  payNowUrl?: string | null;
}): string {
  const accent = args.accentHex ?? DEFAULT_ACCENT;

  const paySection = args.payNowUrl
    ? ctaButton("Pay Now", args.payNowUrl, "#16a34a") +
      `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;">Secure payment processed via Stripe.</p>`
    : "";

  const body = `
    <h1 style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0f172a;">Friendly Payment Reminder</h1>
    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#475569;">Dear ${escHtml(args.clientName)},</p>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#334155;">
      Just a friendly reminder — <strong>Invoice ${escHtml(args.invoiceNumber)}</strong> from ${escHtml(args.businessName)} is due on <strong>${escHtml(args.dueDate)}</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
      <tr>
        <td width="50%" style="padding:16px;border-right:1px solid #e2e8f0;">
          <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Invoice No.</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;font-weight:600;color:#0f172a;">${escHtml(args.invoiceNumber)}</p>
        </td>
        <td width="50%" style="padding:16px;">
          <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Amount Outstanding</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#0f172a;">${fmt(args.totalOutstanding)}</p>
        </td>
      </tr>
    </table>
    ${paySection}
    <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#64748b;">If you have already made payment, please disregard this reminder. Thank you for your business!</p>`;

  return wrapTemplate(
    buildHeader(accent, args.businessName),
    body,
    buildFooter({ businessName: args.businessName })
  );
}

// ---------------------------------------------------------------------------
// Invoice overdue email
// ---------------------------------------------------------------------------

export function invoiceOverdueEmailHtml(args: {
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  dueDate: string;
  daysOverdue: number;
  totalOutstanding: number;
  accentHex?: string;
  payNowUrl?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
}): string {
  const accent = args.accentHex ?? DEFAULT_ACCENT;

  const paySection = args.payNowUrl
    ? ctaButton("Pay Now", args.payNowUrl, "#dc2626") +
      `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;">Secure payment processed via Stripe.</p>`
    : "";

  const contactLines: string[] = [];
  if (args.businessPhone) contactLines.push(`<strong>Phone:</strong> ${escHtml(args.businessPhone)}`);
  if (args.businessEmail) contactLines.push(`<strong>Email:</strong> ${escHtml(args.businessEmail)}`);
  const contactBlock =
    contactLines.length > 0
      ? `<p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#334155;">
          To discuss payment, please contact us: ${contactLines.join(" &nbsp;|&nbsp; ")}
        </p>`
      : `<p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#334155;">Please reply to this email to discuss payment arrangements.</p>`;

  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;background:#fef2f2;border-radius:6px;border:1px solid #fecaca;">
      <tr>
        <td style="padding:14px 18px;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#dc2626;">Invoice ${escHtml(args.invoiceNumber)} is now ${args.daysOverdue} day${args.daysOverdue === 1 ? "" : "s"} overdue.</p>
        </td>
      </tr>
    </table>
    <h1 style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0f172a;">Overdue Invoice — Action Required</h1>
    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#475569;">Dear ${escHtml(args.clientName)},</p>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#334155;">
      Our records show that <strong>Invoice ${escHtml(args.invoiceNumber)}</strong> from ${escHtml(args.businessName)} was due on <strong>${escHtml(args.dueDate)}</strong> and remains unpaid.
      It is now <strong>${args.daysOverdue} day${args.daysOverdue === 1 ? "" : "s"} overdue</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
      <tr>
        <td width="50%" style="padding:16px;border-right:1px solid #e2e8f0;">
          <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Invoice No.</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;font-weight:600;color:#0f172a;">${escHtml(args.invoiceNumber)}</p>
        </td>
        <td width="50%" style="padding:16px;">
          <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Total Outstanding</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#dc2626;">${fmt(args.totalOutstanding)}</p>
        </td>
      </tr>
    </table>
    ${paySection}
    ${contactBlock}
    <p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#64748b;">If payment has already been made, please disregard this notice and accept our apologies for any inconvenience.</p>`;

  return wrapTemplate(
    buildHeader(accent, args.businessName),
    body,
    buildFooter({
      businessName: args.businessName,
      businessPhone: args.businessPhone,
      businessEmail: args.businessEmail,
    })
  );
}

// ---------------------------------------------------------------------------
// Welcome owner email
// ---------------------------------------------------------------------------

export function welcomeOwnerEmailHtml(args: {
  firstName: string;
  businessName: string;
  dashboardUrl: string;
  accentHex?: string;
}): string {
  const accent = args.accentHex ?? DEFAULT_ACCENT;

  const steps = [
    {
      icon: "&#x1F3E2;",
      title: "Add your first client",
      desc: "Build your client list — all their details in one place.",
      url: `${args.dashboardUrl}/clients`,
      label: "Add a Client",
    },
    {
      icon: "&#x1F527;",
      title: "Create your first job",
      desc: "Schedule work, assign staff, and track progress easily.",
      url: `${args.dashboardUrl}/jobs`,
      label: "Create a Job",
    },
    {
      icon: "&#x1F4B0;",
      title: "Send your first invoice",
      desc: "Professional invoices with online payment — get paid faster.",
      url: `${args.dashboardUrl}/finance`,
      label: "Send an Invoice",
    },
  ];

  const stepRows = steps
    .map(
      (step, i) => `
      <tr>
        <td style="padding:16px;border-bottom:${i < steps.length - 1 ? "1px solid #f1f5f9" : "none"};">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="48" style="vertical-align:top;padding-right:16px;">
                <div style="width:40px;height:40px;background:#f1f5f9;border-radius:8px;text-align:center;line-height:40px;font-size:20px;">${step.icon}</div>
              </td>
              <td style="vertical-align:top;">
                <p style="margin:0 0 2px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#0f172a;">${step.title}</p>
                <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#64748b;">${step.desc}</p>
              </td>
              <td width="120" style="vertical-align:middle;text-align:right;">
                <a href="${escHtml(step.url)}" style="display:inline-block;padding:8px 14px;font-family:Arial,sans-serif;font-size:12px;font-weight:600;color:${accent};border:1.5px solid ${accent};border-radius:5px;text-decoration:none;">${step.label}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  const body = `
    <h1 style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:24px;font-weight:700;color:#0f172a;">Welcome to SERVLO, ${escHtml(args.firstName)}!</h1>
    <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:15px;color:#475569;">Your workspace for <strong>${escHtml(args.businessName)}</strong> is ready. Here is how to get started in 5 minutes.</p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      ${stepRows}
    </table>

    ${ctaButton("Go to your dashboard &rarr;", args.dashboardUrl, accent)}

    <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#334155;line-height:1.6;">
      We are here to help you grow your business. Reply to this email any time — a real person will get back to you.
    </p>
    <p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;">Welcome aboard,<br><strong>The SERVLO Team</strong></p>`;

  return wrapTemplate(
    buildHeader(accent),
    body,
    buildFooter({ businessName: "SERVLO" })
  );
}

// ---------------------------------------------------------------------------
// Trial ending email
// ---------------------------------------------------------------------------

export function trialEndingEmailHtml(args: {
  firstName: string;
  daysRemaining: number;
  upgradeUrl: string;
  accentHex?: string;
}): string {
  const accent = args.accentHex ?? DEFAULT_ACCENT;
  const d = args.daysRemaining;

  let urgencyBanner = "";
  let heading = "";
  let intro = "";
  let mainContent = "";

  if (d >= 7) {
    // Day 7 — friendly, value-focused
    heading = `Your free trial ends in ${d} day${d === 1 ? "" : "s"}`;
    intro = `Hi ${escHtml(args.firstName)}, we hope you have been enjoying SERVLO! Your 30-day free trial wraps up in <strong>${d} days</strong>. Here is everything you keep when you upgrade to a paid plan:`;
    mainContent = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-family:Arial,sans-serif;font-size:13px;color:#334155;">&#x2714; All your client records and contact history</td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-family:Arial,sans-serif;font-size:13px;color:#334155;">&#x2714; All jobs, schedules, and job notes</td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-family:Arial,sans-serif;font-size:13px;color:#334155;">&#x2714; All invoices, quotes, and financial history</td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-family:Arial,sans-serif;font-size:13px;color:#334155;">&#x2714; Online invoice payments via Stripe</td></tr>
        <tr><td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:13px;color:#334155;">&#x2714; Automated invoice reminders</td></tr>
      </table>`;
  } else if (d >= 3) {
    // Day 3 — moderate urgency
    urgencyBanner = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;background:#fef3c7;border-radius:6px;border:1px solid #fde68a;">
        <tr><td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#92400e;">Your trial ends in ${d} days — upgrade to keep your data.</td></tr>
      </table>`;
    heading = `Your trial ends in ${d} days`;
    intro = `Hi ${escHtml(args.firstName)}, your SERVLO free trial ends in <strong>${d} days</strong>. After that, you will lose access to:`;
    mainContent = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;border:1px solid #fecaca;border-radius:8px;overflow:hidden;background:#fef2f2;">
        <tr><td style="padding:12px 16px;border-bottom:1px solid #fee2e2;font-family:Arial,sans-serif;font-size:13px;color:#dc2626;">&#x2715; Your client records and contact history</td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid #fee2e2;font-family:Arial,sans-serif;font-size:13px;color:#dc2626;">&#x2715; All jobs and job scheduling</td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid #fee2e2;font-family:Arial,sans-serif;font-size:13px;color:#dc2626;">&#x2715; Your invoices and financial data</td></tr>
        <tr><td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:13px;color:#dc2626;">&#x2715; All quotes and documents</td></tr>
      </table>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#334155;">Upgrade now to keep everything and continue without disruption.</p>`;
  } else {
    // Day 1 — direct
    urgencyBanner = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;background:#fef2f2;border-radius:6px;border:1px solid #fecaca;">
        <tr><td style="padding:12px 16px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#dc2626;">Your trial ends tomorrow. Upgrade now to keep access.</td></tr>
      </table>`;
    heading = "Your trial ends tomorrow";
    intro = `Hi ${escHtml(args.firstName)}, this is your final reminder — your SERVLO free trial expires <strong>tomorrow</strong>.`;
    mainContent = `
      <p style="margin:16px 0;font-family:Arial,sans-serif;font-size:14px;color:#334155;">Upgrade now to keep access to all your SERVLO data — clients, jobs, invoices, quotes, and everything you have built over your trial.</p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#334155;">Plans start from a low monthly fee with no lock-in contract.</p>`;
  }

  const body = `
    ${urgencyBanner}
    <h1 style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0f172a;">${heading}</h1>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#334155;">${intro}</p>
    ${mainContent}
    ${ctaButton("Upgrade Your Plan", args.upgradeUrl, accent)}
    <p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#64748b;">Questions about pricing? Reply to this email and we will help you choose the right plan.</p>`;

  return wrapTemplate(
    buildHeader(accent),
    body,
    buildFooter({ businessName: "SERVLO" })
  );
}

// ---------------------------------------------------------------------------
// Job completion email
// ---------------------------------------------------------------------------

export function jobCompletionEmailHtml(args: {
  clientName: string;
  businessName: string;
  jobTitle: string;
  completionDate: string;
  jobDescription?: string | null;
  signoffName?: string | null;
  invoiceUrl?: string | null;
  accentHex?: string;
  businessPhone?: string | null;
}): string {
  const accent = args.accentHex ?? DEFAULT_ACCENT;

  const descBlock = args.jobDescription
    ? `<p style="margin:12px 0;font-family:Arial,sans-serif;font-size:14px;color:#334155;line-height:1.6;">${escHtml(args.jobDescription)}</p>`
    : "";

  const signoffBlock = args.signoffName
    ? `<tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Signed off by</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9;">${escHtml(args.signoffName)}</td>
      </tr>`
    : "";

  const invoiceBlock = args.invoiceUrl
    ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background:#f0fdf4;border-radius:6px;border:1px solid #bbf7d0;">
        <tr>
          <td style="padding:14px 18px;">
            <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#166534;">Invoice created</p>
            <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#15803d;">An invoice has been created for this work. <a href="${escHtml(args.invoiceUrl)}" style="color:#166534;font-weight:600;">View invoice &rarr;</a></p>
          </td>
        </tr>
      </table>`
    : "";

  const body = `
    <h1 style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#0f172a;">Your job is complete!</h1>
    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#475569;">Dear ${escHtml(args.clientName)},</p>
    <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#334155;">
      Great news — the following job has been completed by <strong>${escHtml(args.businessName)}</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
      <tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Job</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9;">${escHtml(args.jobTitle)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Completed</td>
        <td style="padding:8px 0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9;">${escHtml(args.completionDate)}</td>
      </tr>
      ${signoffBlock}
    </table>
    ${descBlock}
    ${invoiceBlock}
    <p style="margin:16px 0;font-family:Arial,sans-serif;font-size:14px;color:#334155;line-height:1.6;">
      Thank you for choosing ${escHtml(args.businessName)}. We appreciate your business and hope the work meets your expectations. Please do not hesitate to get in touch if you have any questions.
    </p>
    ${args.businessPhone ? `<p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#64748b;">Phone: <strong>${escHtml(args.businessPhone)}</strong></p>` : ""}`;

  return wrapTemplate(
    buildHeader(accent, args.businessName),
    body,
    buildFooter({
      businessName: args.businessName,
      businessPhone: args.businessPhone,
    })
  );
}
