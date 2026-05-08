import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAILimit, logAICall, checkPerMinuteRateLimit } from "@/lib/ai-limits";

/**
 * POST /api/ai/bas-helper
 * Calculates BAS (Business Activity Statement) figures from the owner's invoice and
 * expense data for a given quarter, and uses Claude to explain the result.
 *
 * Body: { quarter_start, quarter_end }
 * Returns: {
 *   g1_total_sales, g2_gst_free_exports, g10_capital_purchases,
 *   g11_non_capital_purchases, gst_collected, gst_paid, net_gst,
 *   summary, tips
 * }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;

  const [limitCheck, rateOk] = await Promise.all([
    checkAILimit(user.id),
    checkPerMinuteRateLimit(user.id),
  ]);
  if (!rateOk) return NextResponse.json({ error: "rate_limited", message: "Too many requests." }, { status: 429 });
  if (!limitCheck.allowed) return NextResponse.json({ error: "quota_exceeded", message: limitCheck.message }, { status: 429 });

  const body = await req.json().catch(() => ({})) as {
    quarter_start?: string; // YYYY-MM-DD
    quarter_end?: string;
  };

  // Default to current quarter if not provided
  const now = new Date();
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
  const defaultStart = new Date(now.getFullYear(), quarterMonth, 1).toISOString().slice(0, 10);
  const defaultEnd = new Date(now.getFullYear(), quarterMonth + 3, 0).toISOString().slice(0, 10);

  const qStart = body.quarter_start ?? defaultStart;
  const qEnd = body.quarter_end ?? defaultEnd;

  const admin = createAdminClient();

  // Get invoices for the period (excluding demos)
  const { data: invoices } = await admin
    .from("invoices")
    .select("total, gst_rate, status")
    .eq("owner_id", user.id)
    .eq("is_demo", false)
    .gte("created_at", qStart)
    .lte("created_at", qEnd + "T23:59:59Z")
    .in("status", ["paid", "sent", "overdue", "partial"]);

  // Get purchase orders / expenses for the period
  const { data: purchaseOrders } = await admin
    .from("purchase_orders")
    .select("total")
    .eq("owner_id", user.id)
    .gte("created_at", qStart)
    .lte("created_at", qEnd + "T23:59:59Z")
    .not("status", "eq", "cancelled")
    .then((r) => r, () => ({ data: null }));

  const totalSalesIncGst = (invoices ?? []).reduce((s, inv) => s + Number(inv.total ?? 0), 0);
  const gstRate = 0.1;
  const gstCollected = totalSalesIncGst - totalSalesIncGst / (1 + gstRate);
  const totalPurchasesIncGst = (purchaseOrders ?? []).reduce((s, po) => s + Number(po.total ?? 0), 0);
  const gstPaid = totalPurchasesIncGst - totalPurchasesIncGst / (1 + gstRate);
  const netGst = gstCollected - gstPaid;

  const financials = {
    g1_total_sales: Math.round(totalSalesIncGst * 100) / 100,
    gst_collected: Math.round(gstCollected * 100) / 100,
    total_purchases: Math.round(totalPurchasesIncGst * 100) / 100,
    gst_paid: Math.round(gstPaid * 100) / 100,
    net_gst: Math.round(netGst * 100) / 100,
    quarter: `${qStart} to ${qEnd}`,
  };

  if (!apiKey) {
    return NextResponse.json({
      ...financials,
      summary: `For the quarter ${qStart} to ${qEnd}, your total sales were $${financials.g1_total_sales.toFixed(2)} (inc. GST). You collected $${financials.gst_collected.toFixed(2)} in GST and paid $${financials.gst_paid.toFixed(2)} in input tax credits. Your net GST ${netGst >= 0 ? "payable" : "refund"} is $${Math.abs(financials.net_gst).toFixed(2)}.`,
      tips: [
        "Ensure all invoices are recorded before lodging",
        "Keep receipts for all business purchases",
        "Lodge your BAS by the due date to avoid penalties",
      ],
    });
  }

  const prompt = `You are an Australian tax assistant helping a small business owner understand their BAS (Business Activity Statement).

Here are their figures for the quarter ${qStart} to ${qEnd}:
- Total sales (inc. GST): $${financials.g1_total_sales.toFixed(2)}
- GST collected on sales: $${financials.gst_collected.toFixed(2)}
- Total purchases (inc. GST): $${financials.total_purchases.toFixed(2)}
- GST paid on purchases: $${financials.gst_paid.toFixed(2)}
- Net GST ${netGst >= 0 ? "payable" : "refund"}: $${Math.abs(financials.net_gst).toFixed(2)}

Write a brief, plain-English summary and 3 practical tips. Return JSON:
{
  "summary": "2-3 sentence plain-English summary of their BAS position",
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}

Important: Always remind users to consult a registered BAS agent or accountant. Only return the JSON.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
    const data = await res.json() as { content: Array<{ text: string }>; usage?: { input_tokens: number; output_tokens: number } };
    const raw = data.content?.[0]?.text ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const aiResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: "", tips: [] };

    await logAICall(user.id, null, "ai/bas-helper", "claude-3-5-haiku-20241022", {
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
      cached: false,
    });

    return NextResponse.json({ ...financials, ...aiResult });
  } catch (err) {
    console.error("[ai/bas-helper]", err);
    // Return raw financials without AI summary on error
    return NextResponse.json({
      ...financials,
      summary: `Quarter ${qStart} to ${qEnd}: $${financials.g1_total_sales.toFixed(2)} sales, net GST ${netGst >= 0 ? "payable" : "refund"} $${Math.abs(financials.net_gst).toFixed(2)}.`,
      tips: ["Consult a registered BAS agent for your lodgement."],
    });
  }
}
