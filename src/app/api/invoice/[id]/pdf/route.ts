import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBusinessBrand } from "@/lib/business-brand";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: invoice } = await supabase
      .from("invoices")
      .select("*, clients(full_name, email, address)")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const [businessResult, brand] = await Promise.all([
      supabase
        .from("businesses")
        .select("business_name, abn, address, suburb, state, postcode, phone, email, accent_colour, gst_registered")
        .eq("owner_id", user.id)
        .single(),
      getBusinessBrand(user.id),
    ]);
    const business = businessResult.data;

    // Generate HTML for PDF — use brand settings with fallback to business row
    const accent = brand.colorPrimary || business?.accent_colour || "#3B82F6";
    const displayName = brand.businessName || business?.business_name || "SERVLO";
    const logoUrl = brand.logoUrl;
    const displayAddress = brand.address || [business?.address, business?.suburb, business?.state, business?.postcode].filter(Boolean).join(", ");
    const displayPhone = brand.phone || business?.phone;
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice ${invoice.invoice_number || invoice.id}</title>
<style>
  body { font-family: Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .brand { font-size: 28px; font-weight: 800; color: ${accent}; }
  .invoice-title { text-align: right; }
  .invoice-title h1 { font-size: 36px; color: ${accent}; margin: 0; }
  .invoice-title .number { color: #666; font-size: 14px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: ${accent}; color: white; padding: 12px; text-align: left; }
  td { padding: 10px 12px; border-bottom: 1px solid #eee; }
  .total-row td { font-weight: bold; font-size: 16px; border-bottom: none; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .badge-paid { background: #dcfce7; color: #166534; }
  .badge-unpaid { background: #fef9c3; color: #854d0e; }
  .badge-overdue { background: #fee2e2; color: #991b1b; }
  .footer { margin-top: 60px; border-top: 2px solid ${accent}; padding-top: 20px; color: #666; font-size: 12px; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div>
    ${logoUrl ? `<img src="${logoUrl}" alt="${displayName}" style="max-height:60px;max-width:200px;margin-bottom:8px;display:block;" />` : `<div class="brand">${displayName}</div>`}
    ${business?.abn ? `<div style="color:#666;font-size:13px;margin-top:4px">ABN ${business.abn}</div>` : ""}
    ${displayAddress ? `<div style="color:#666;font-size:13px;margin-top:8px">${displayAddress}</div>` : ""}
    ${displayPhone ? `<div style="color:#666;font-size:13px">${displayPhone}</div>` : ""}
    ${business?.email ? `<div style="color:#666;font-size:13px">${business.email}</div>` : ""}
  </div>
  <div class="invoice-title">
    <h1>INVOICE</h1>
    <div class="number"># ${invoice.invoice_number || invoice.id.slice(0, 8).toUpperCase()}</div>
    <div style="margin-top:8px;color:#666;font-size:13px">Date: ${new Date(invoice.created_at).toLocaleDateString("en-AU")}</div>
    ${invoice.due_date ? `<div style="color:#666;font-size:13px">Due: ${new Date(invoice.due_date).toLocaleDateString("en-AU")}</div>` : ""}
    <div style="margin-top:8px"><span class="badge badge-${invoice.status === "paid" ? "paid" : invoice.status === "overdue" ? "overdue" : "unpaid"}">${(invoice.status || "unpaid").toUpperCase()}</span></div>
  </div>
</div>
<div class="grid">
  <div>
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#666;margin-bottom:8px">Bill To</div>
    <div style="font-weight:600">${(invoice.clients as { full_name?: string } | null)?.full_name || "Client"}</div>
    ${(invoice.clients as { email?: string } | null)?.email ? `<div style="color:#666;font-size:13px">${(invoice.clients as { email?: string }).email}</div>` : ""}
    ${(invoice.clients as { address?: string } | null)?.address ? `<div style="color:#666;font-size:13px">${(invoice.clients as { address?: string }).address}</div>` : ""}
  </div>
</div>
<table>
  <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>
    ${((invoice.line_items as Array<{description:string;amount:number}> | null) || [{ description: invoice.description || "Services rendered", amount: invoice.total || 0 }]).map((item: {description:string;amount:number}) => `
    <tr><td>${item.description}</td><td style="text-align:right">$${Number(item.amount || 0).toFixed(2)}</td></tr>
    `).join("")}
  </tbody>
  <tfoot>
    ${(business as { gst_registered?: boolean } | null)?.gst_registered !== false
      ? `<tr><td style="text-align:right;color:#666">Subtotal</td><td style="text-align:right">$${(Number(invoice.total || 0) / 1.1).toFixed(2)}</td></tr>
    <tr><td style="text-align:right;color:#666">GST (10%)</td><td style="text-align:right">$${(Number(invoice.total || 0) - Number(invoice.total || 0) / 1.1).toFixed(2)}</td></tr>`
      : `<tr><td style="text-align:right;color:#666;font-size:11px" colspan="2">GST not registered — prices do not include GST</td></tr>`
    }
    <tr class="total-row"><td style="text-align:right">Total</td><td style="text-align:right;color:${accent}">$${Number(invoice.total || 0).toFixed(2)}</td></tr>
  </tfoot>
</table>
<div class="footer">
  <p>Thank you for your business. Payment due within 14 days of invoice date.</p>
  <p>Generated by SERVLO · servlo.com.au</p>
</div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="invoice-${invoice.invoice_number || id.slice(0, 8)}.html"`,
      },
    });
  } catch (err) {
    console.error("PDF error:", err);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}
