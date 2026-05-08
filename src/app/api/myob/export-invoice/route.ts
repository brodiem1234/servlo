import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/myob/export-invoice
 * Exports an invoice to MYOB AccountRight. Requires { invoice_id }.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invoice_id } = await req.json().catch(() => ({})) as { invoice_id?: string };
  if (!invoice_id) return NextResponse.json({ error: "invoice_id required" }, { status: 400 });

  const admin = createAdminClient();

  // Load MYOB connection
  const { data: conn } = await admin
    .from("accounting_connections")
    .select("access_token, tenant_id")
    .eq("owner_id", user.id)
    .eq("provider", "myob")
    .eq("is_active", true)
    .maybeSingle();

  if (!conn) return NextResponse.json({ error: "MYOB is not connected. Please connect in Settings → Integrations." }, { status: 422 });

  // Load invoice
  const { data: invoice } = await admin
    .from("invoices")
    .select("id, invoice_number, total, due_date, client_id, line_items, myob_invoice_id")
    .eq("id", invoice_id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.myob_invoice_id) return NextResponse.json({ ok: true, note: "Already exported", myob_invoice_id: invoice.myob_invoice_id });

  // Load client
  let customerUID: string | null = null;
  if (invoice.client_id) {
    const { data: client } = await admin
      .from("clients")
      .select("full_name, email, phone, myob_contact_id")
      .eq("id", invoice.client_id)
      .maybeSingle();

    if (client?.myob_contact_id) {
      customerUID = client.myob_contact_id;
    } else if (client) {
      // Create MYOB customer contact
      try {
        const contactRes = await fetch(`https://api.myob.com/accountright/${conn.tenant_id}/Contact/Customer`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${conn.access_token}`,
            "x-myobapi-key": process.env.MYOB_CLIENT_ID ?? "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            CompanyName: client.full_name ?? "Client",
            IsIndividual: true,
            FirstName: (client.full_name ?? "").split(" ")[0] ?? "Client",
            LastName: (client.full_name ?? "").split(" ").slice(1).join(" ") || ".",
            EmailAddress: client.email ?? "",
          }),
        });
        if (contactRes.ok) {
          const cd = await contactRes.json() as { UID?: string };
          if (cd.UID) {
            customerUID = cd.UID;
            await admin.from("clients").update({ myob_contact_id: cd.UID }).eq("id", invoice.client_id);
          }
        }
      } catch { /* best-effort */ }
    }
  }

  // Build MYOB invoice lines
  const lines = Array.isArray(invoice.line_items)
    ? (invoice.line_items as Array<{ description?: string; quantity?: number; unit_price?: number }>).map((li) => ({
        Type: "Transaction",
        Description: li.description ?? "Service",
        UnitCount: li.quantity ?? 1,
        UnitPrice: li.unit_price ?? 0,
        Total: (li.quantity ?? 1) * (li.unit_price ?? 0),
        TaxCode: { Code: "GST" },
        Account: { DisplayID: "4-0000" }, // default income account
      }))
    : [{
        Type: "Transaction",
        Description: "Service",
        UnitCount: 1,
        UnitPrice: Number(invoice.total) || 0,
        Total: Number(invoice.total) || 0,
        TaxCode: { Code: "GST" },
        Account: { DisplayID: "4-0000" },
      }];

  try {
    const myobRes = await fetch(`https://api.myob.com/accountright/${conn.tenant_id}/Sale/Invoice/Service`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${conn.access_token}`,
        "x-myobapi-key": process.env.MYOB_CLIENT_ID ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Number: invoice.invoice_number ?? "",
        Date: new Date().toISOString().slice(0, 10),
        CustomerPurchaseOrderNumber: invoice.invoice_number ?? "",
        Customer: customerUID ? { UID: customerUID } : { CompanyName: "Client" },
        Lines: lines,
        IsTaxInclusive: true,
        AmountPaid: 0,
      }),
    });

    if (!myobRes.ok) {
      const errBody = await myobRes.text();
      console.error("[myob/export-invoice] MYOB error:", errBody);
      return NextResponse.json({ error: "MYOB returned an error. Please check your connection." }, { status: 502 });
    }

    const myobData = await myobRes.json() as { UID?: string };
    const myobInvoiceId = myobData.UID;

    if (myobInvoiceId) {
      await admin.from("invoices").update({ myob_invoice_id: myobInvoiceId }).eq("id", invoice_id);
      return NextResponse.json({ ok: true, myob_invoice_id: myobInvoiceId });
    }

    return NextResponse.json({ error: "Invoice created in MYOB but no ID returned." }, { status: 500 });
  } catch (err) {
    console.error("[myob/export-invoice]", err);
    return NextResponse.json({ error: "Failed to export to MYOB" }, { status: 500 });
  }
}
