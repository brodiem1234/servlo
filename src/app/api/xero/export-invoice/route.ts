import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/xero/export-invoice
 * Exports an invoice to Xero. Requires { invoice_id }.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invoice_id } = await req.json().catch(() => ({})) as { invoice_id?: string };
  if (!invoice_id) return NextResponse.json({ error: "invoice_id required" }, { status: 400 });

  const admin = createAdminClient();

  // Load Xero connection
  const { data: conn } = await admin
    .from("accounting_connections")
    .select("access_token, refresh_token, expires_at, tenant_id")
    .eq("owner_id", user.id)
    .eq("provider", "xero")
    .eq("is_active", true)
    .maybeSingle();

  if (!conn) return NextResponse.json({ error: "Xero is not connected. Please connect in Settings → Integrations." }, { status: 422 });

  // Load invoice
  const { data: invoice } = await admin
    .from("invoices")
    .select("id, invoice_number, total, due_date, status, client_id, line_items, xero_invoice_id")
    .eq("id", invoice_id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.xero_invoice_id) return NextResponse.json({ ok: true, note: "Already exported", xero_invoice_id: invoice.xero_invoice_id });

  // Load client
  let contactId: string | null = null;
  if (invoice.client_id) {
    const { data: client } = await admin
      .from("clients")
      .select("full_name, email, xero_contact_id")
      .eq("id", invoice.client_id)
      .maybeSingle();

    if (client?.xero_contact_id) {
      contactId = client.xero_contact_id;
    } else if (client) {
      // Create Xero contact
      try {
        const contactRes = await fetch("https://api.xero.com/api.xro/2.0/Contacts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${conn.access_token}`,
            "Xero-Tenant-Id": conn.tenant_id ?? "",
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ Contacts: [{ Name: client.full_name ?? "Client", EmailAddress: client.email ?? "" }] }),
        });
        if (contactRes.ok) {
          const cd = await contactRes.json() as { Contacts?: Array<{ ContactID: string }> };
          const newContactId = cd.Contacts?.[0]?.ContactID;
          if (newContactId) {
            contactId = newContactId;
            await admin.from("clients").update({ xero_contact_id: newContactId }).eq("id", invoice.client_id);
          }
        }
      } catch { /* best-effort contact creation */ }
    }
  }

  // Build line items
  const lineItems = Array.isArray(invoice.line_items)
    ? (invoice.line_items as Array<{ description?: string; quantity?: number; unit_price?: number }>).map((li) => ({
        Description: li.description ?? "Service",
        Quantity: li.quantity ?? 1,
        UnitAmount: li.unit_price ?? 0,
        AccountCode: "200", // default revenue account
      }))
    : [{ Description: "Service", Quantity: 1, UnitAmount: Number(invoice.total) || 0, AccountCode: "200" }];

  // Create Xero invoice
  try {
    const xeroRes = await fetch("https://api.xero.com/api.xro/2.0/Invoices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${conn.access_token}`,
        "Xero-Tenant-Id": conn.tenant_id ?? "",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        Invoices: [{
          Type: "ACCREC",
          Contact: contactId ? { ContactID: contactId } : { Name: "Client" },
          InvoiceNumber: invoice.invoice_number ?? "",
          DueDate: invoice.due_date ? invoice.due_date.slice(0, 10) : undefined,
          Status: "AUTHORISED",
          LineItems: lineItems,
        }],
      }),
    });

    if (!xeroRes.ok) {
      const errBody = await xeroRes.text();
      console.error("[xero/export-invoice] Xero error:", errBody);
      return NextResponse.json({ error: "Xero returned an error. Please check your connection." }, { status: 502 });
    }

    const xeroData = await xeroRes.json() as { Invoices?: Array<{ InvoiceID: string }> };
    const xeroInvoiceId = xeroData.Invoices?.[0]?.InvoiceID;

    if (xeroInvoiceId) {
      await admin.from("invoices").update({ xero_invoice_id: xeroInvoiceId }).eq("id", invoice_id);
      return NextResponse.json({ ok: true, xero_invoice_id: xeroInvoiceId });
    }

    return NextResponse.json({ error: "Invoice created in Xero but no ID returned." }, { status: 500 });
  } catch (err) {
    console.error("[xero/export-invoice]", err);
    return NextResponse.json({ error: "Failed to export to Xero" }, { status: 500 });
  }
}
