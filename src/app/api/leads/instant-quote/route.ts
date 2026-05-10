/**
 * POST /api/leads/instant-quote
 * AI-generates a draft quote from a lead description in one step.
 * Body: { description, service_type, suburb, estimated_budget, client_name?, client_email? }
 * Returns: { quoteId, title, lineItemCount }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNextQuoteNumber } from "@/lib/sequences";
import crypto from "crypto";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { description, service_type, suburb, estimated_budget, client_name, client_email } = body;

  if (!description) return NextResponse.json({ error: "description required" }, { status: 400 });

  // 1. AI-generate line items
  const aiRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/ai/generate-quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: req.headers.get("cookie") ?? "" },
    body: JSON.stringify({
      job_description: description,
      service_type: service_type ?? undefined,
      address: suburb ? `${suburb}, Australia` : undefined,
    }),
  });

  let title = `${service_type ?? "Service"} Quote`;
  let lineItems: Array<{ description: string; quantity: number; unit_price: number }> = [];

  if (aiRes.ok) {
    const aiData = await aiRes.json() as { title?: string; line_items?: typeof lineItems };
    if (aiData.title) title = aiData.title;
    if (aiData.line_items) lineItems = aiData.line_items;
  }

  if (lineItems.length === 0) {
    lineItems = [
      { description: service_type ?? "Labour", quantity: 2, unit_price: 110 },
      { description: "Materials & consumables", quantity: 1, unit_price: 85 },
    ];
  }

  // 2. Find or create client record
  let clientId: string | null = null;
  if (client_name) {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("owner_id", user.id)
      .ilike("full_name", client_name.trim())
      .is("deleted_at", null)
      .maybeSingle();

    if (existing?.id) {
      clientId = existing.id;
    } else {
      const portalToken = crypto.randomUUID();
      const { data: newClient } = await supabase
        .from("clients")
        .insert({
          owner_id: user.id,
          full_name: client_name.trim(),
          email: client_email ?? null,
          status: "active",
          source: "leads_marketplace",
          portal_token: portalToken,
          is_demo: false,
        })
        .select("id")
        .maybeSingle();
      clientId = newClient?.id ?? null;
    }
  }

  // 3. Compute totals
  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const gst = Math.round(subtotal * 0.1 * 100) / 100;
  const total = Math.round((subtotal + gst) * 100) / 100;

  // 4. Generate quote number and public token
  const quoteNumber = await getNextQuoteNumber(supabase, user.id).catch(() => null);
  const publicToken = crypto.randomUUID();

  // 5. Build line_items JSON column
  const lineItemsJson = lineItems.map((li, idx) => ({
    id: idx + 1,
    description: li.description,
    quantity: li.quantity,
    unit_price: li.unit_price,
    total: li.quantity * li.unit_price,
    gst_included: true,
  }));

  // 6. Insert draft quote
  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      owner_id: user.id,
      client_id: clientId,
      quote_number: quoteNumber,
      status: "draft",
      notes: description,
      line_items: lineItemsJson,
      subtotal,
      gst,
      total,
      public_token: publicToken,
      is_demo: false,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    quoteId: quote?.id,
    title,
    lineItemCount: lineItems.length,
    total,
  });
}
