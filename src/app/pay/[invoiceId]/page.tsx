import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrencyFromDollars, formatDateAU } from "@/lib/format-au";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ invoiceId: string }>;
};

export default async function QuickPayPage({ params }: Props) {
  const { invoiceId } = await params;

  const admin = createAdminClient();

  // Fetch invoice with owner info
  const { data: invoice } = await admin
    .from("invoices")
    .select("id, invoice_number, total, due_date, status, owner_id, client_id, notes")
    .eq("id", invoiceId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!invoice) notFound();

  // Fetch business info
  const { data: business } = await admin
    .from("businesses")
    .select("business_name, phone, email, accent_colour, logo_url")
    .eq("owner_id", invoice.owner_id)
    .maybeSingle();

  // Fetch client name
  const { data: client } = invoice.client_id
    ? await admin
        .from("clients")
        .select("full_name, email, phone")
        .eq("id", invoice.client_id)
        .maybeSingle()
    : { data: null };

  const businessName = business?.business_name ?? "Your Service Provider";
  const accentColour = business?.accent_colour ?? "#2563eb";
  const total = formatCurrencyFromDollars(invoice.total ?? 0);
  const dueDate = formatDateAU(invoice.due_date);
  const invoiceNum = invoice.invoice_number ?? invoiceId.slice(0, 8).toUpperCase();
  const contactEmail = business?.email ?? null;
  const contactPhone = business?.phone ?? null;

  const isPaid = invoice.status === "paid";

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Invoice #{invoiceNum} · {businessName}</title>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #111; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
          .card { background: white; border-radius: 1rem; box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 480px; width: 100%; overflow: hidden; }
          .header { padding: 2rem 2rem 1.5rem; text-align: center; }
          .business-name { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem; }
          .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
          .badge-pending { background: #fef3c7; color: #92400e; }
          .badge-paid { background: #d1fae5; color: #065f46; }
          .divider { height: 1px; background: #f0f0f0; }
          .body { padding: 1.5rem 2rem; }
          .row { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
          .label { font-size: 0.875rem; color: #6b7280; white-space: nowrap; }
          .value { font-size: 0.875rem; font-weight: 500; color: #111; word-break: break-word; text-align: right; }
          .amount-row { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f0f0f0; }
          .amount-label { font-size: 1rem; font-weight: 600; }
          .amount-value { font-size: 1.5rem; font-weight: 800; }
          .cta { padding: 1.5rem 2rem 2rem; }
          .pay-btn { display: block; width: 100%; padding: 0.875rem; border-radius: 0.75rem; border: none; font-size: 1rem; font-weight: 700; color: white; cursor: pointer; text-align: center; text-decoration: none; background: var(--accent); }
          .pay-btn:hover { opacity: 0.9; }
          .contact { margin-top: 1rem; text-align: center; font-size: 0.8125rem; color: #6b7280; }
          .contact a { color: var(--accent); text-decoration: none; }
          .paid-notice { text-align: center; padding: 1rem; background: #d1fae5; color: #065f46; border-radius: 0.75rem; font-weight: 600; }
          .logo { max-height: 48px; max-width: 160px; object-fit: contain; margin-bottom: 0.75rem; }
        `}</style>
      </head>
      <body style={{ "--accent": accentColour } as React.CSSProperties}>
        <div className="card">
          <div className="header">
            {business?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={business.logo_url} alt={businessName} className="logo" />
            ) : null}
            <div className="business-name">{businessName}</div>
            <div style={{ marginTop: "0.5rem" }}>
              <span className={`badge ${isPaid ? "badge-paid" : "badge-pending"}`}>
                {isPaid ? "Paid" : invoice.status ?? "Pending"}
              </span>
            </div>
          </div>

          <div className="divider" />

          <div className="body">
            <div className="row">
              <span className="label">Invoice</span>
              <span className="value">#{invoiceNum}</span>
            </div>
            {client?.full_name ? (
              <div className="row">
                <span className="label">Client</span>
                <span className="value">{client.full_name}</span>
              </div>
            ) : null}
            {invoice.due_date ? (
              <div className="row">
                <span className="label">Due date</span>
                <span className="value">{dueDate}</span>
              </div>
            ) : null}
            <div className="row amount-row">
              <span className="label amount-label">Amount due</span>
              <span className="value amount-value">{total}</span>
            </div>
          </div>

          <div className="cta">
            {isPaid ? (
              <div className="paid-notice">This invoice has been paid. Thank you!</div>
            ) : (
              <>
                <div style={{ marginBottom: "0.75rem", fontSize: "0.8125rem", color: "#6b7280", textAlign: "center" }}>
                  To pay this invoice, please contact us directly:
                </div>
                {contactPhone || contactEmail ? (
                  <div className="contact" style={{ fontSize: "0.9375rem" }}>
                    {contactPhone ? (
                      <div style={{ marginBottom: "0.5rem" }}>
                        <a href={`tel:${contactPhone}`} style={{ fontWeight: 600 }}>📞 {contactPhone}</a>
                      </div>
                    ) : null}
                    {contactEmail ? (
                      <div>
                        <a href={`mailto:${contactEmail}`} style={{ fontWeight: 600 }}>✉️ {contactEmail}</a>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="contact">Contact {businessName} to arrange payment.</p>
                )}
              </>
            )}
          </div>

          <div className="divider" />
          <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.75rem", color: "#9ca3af" }}>
            Powered by SERVLO
          </div>
        </div>
      </body>
    </html>
  );
}
