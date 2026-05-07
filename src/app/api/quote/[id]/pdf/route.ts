import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: quote } = await supabase
      .from("quotes")
      .select("*, clients(name, email, address)")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();

    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    const { data: business } = await supabase
      .from("businesses")
      .select("business_name, abn, address, suburb, state, postcode, phone, email, accent_colour")
      .eq("owner_id", user.id)
      .single();

    // Generate HTML for PDF
    const accent = business?.accent_colour || "#3B82F6";
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Quote ${quote.quote_number || quote.id}</title>
<style>
  body { font-family: Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .brand { font-size: 28px; font-weight: 800; color: ${accent}; }
  .quote-title { text-align: right; }
  .quote-title h1 { font-size: 36px; color: ${accent}; margin: 0; }
  .quote-title .number { color: #666; font-size: 14px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: ${accent}; color: white; padding: 12px; text-align: left; }
  td { padding: 10px 12px; border-bottom: 1px solid #eee; }
  .total-row td { font-weight: bold; font-size: 16px; border-bottom: none; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .badge-accepted { background: #dcfce7; color: #166534; }
  .badge-draft { background: #f3f4f6; color: #374151; }
  .badge-sent { background: #dbeafe; color: #1d4ed8; }
  .badge-declined { background: #fee2e2; color: #991b1b; }
  .validity { background: #fef9c3; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #78350f; }
  .footer { margin-top: 60px; border-top: 2px solid ${accent}; padding-top: 20px; color: #666; font-size: 12px; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="brand">${business?.business_name || "SERVLO"}</div>
    ${business?.abn ? `<div style="color:#666;font-size:13px;margin-top:4px">ABN ${business.abn}</div>` : ""}
    <div style="color:#666;font-size:13px;margin-top:8px">${[business?.address, business?.suburb, business?.state, business?.postcode].filter(Boolean).join(", ")}</div>
    ${business?.phone ? `<div style="color:#666;font-size:13px">${business.phone}</div>` : ""}
    ${business?.email ? `<div style="color:#666;font-size:13px">${business.email}</div>` : ""}
  </div>
  <div class="quote-title">
    <h1>QUOTE</h1>
    <div class="number"># ${quote.quote_number || quote.id.slice(0, 8).toUpperCase()}</div>
    <div style="margin-top:8px;color:#666;font-size:13px">Date: ${new Date(quote.created_at).toLocaleDateString("en-AU")}</div>
    ${quote.valid_until ? `<div style="color:#666;font-size:13px">Valid until: ${new Date(quote.valid_until).toLocaleDateString("en-AU")}</div>` : ""}
    <div style="margin-top:8px"><span class="badge badge-${quote.status || "draft"}">${(quote.status || "draft").toUpperCase()}</span></div>
  </div>
</div>
<div class="grid">
  <div>
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#666;margin-bottom:8px">Quote For</div>
    <div style="font-weight:600">${(quote.clients as { name?: string } | null)?.name || quote.client_name || "Client"}</div>
    ${(quote.clients as { email?: string } | null)?.email ? `<div style="color:#666;font-size:13px">${(quote.clients as { email?: string }).email}</div>` : ""}
    ${(quote.clients as { address?: string } | null)?.address ? `<div style="color:#666;font-size:13px">${(quote.clients as { address?: string }).address}</div>` : ""}
  </div>
</div>
${quote.valid_until ? `<div class="validity">This quote is valid until ${new Date(quote.valid_until).toLocaleDateString("en-AU")}. Please accept within this period to lock in the quoted price.</div>` : ""}
<table>
  <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>
    ${((quote.line_items as Array<{description:string;amount:number}> | null) || [{ description: quote.description || "Services as discussed", amount: quote.total || 0 }]).map((item: {description:string;amount:number}) => `
    <tr><td>${item.description}</td><td style="text-align:right">$${Number(item.amount || 0).toFixed(2)}</td></tr>
    `).join("")}
  </tbody>
  <tfoot>
    <tr><td style="text-align:right;color:#666">Subtotal</td><td style="text-align:right">$${(Number(quote.total || 0) / 1.1).toFixed(2)}</td></tr>
    <tr><td style="text-align:right;color:#666">GST (10%)</td><td style="text-align:right">$${(Number(quote.total || 0) - Number(quote.total || 0) / 1.1).toFixed(2)}</td></tr>
    <tr class="total-row"><td style="text-align:right">Total (inc. GST)</td><td style="text-align:right;color:${accent}">$${Number(quote.total || 0).toFixed(2)}</td></tr>
  </tfoot>
</table>
${quote.notes ? `<div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:8px;font-size:13px;color:#666"><strong>Notes:</strong> ${quote.notes}</div>` : ""}
<div class="footer">
  <p>This quote is subject to acceptance within the validity period. Prices include GST.</p>
  <p>Generated by SERVLO · servlo.com.au</p>
</div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="quote-${quote.quote_number || id.slice(0, 8)}.html"`,
      },
    });
  } catch (err) {
    console.error("Quote PDF error:", err);
    return NextResponse.json({ error: "Failed to generate quote" }, { status: 500 });
  }
}
