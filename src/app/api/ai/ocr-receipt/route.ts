import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAILimit, logAICall, checkPerMinuteRateLimit } from "@/lib/ai-limits";

/**
 * POST /api/ai/ocr-receipt
 * Accepts a base64-encoded image of a receipt and extracts structured cost data.
 * Uses Claude's vision capability.
 *
 * Body: { image_base64, media_type? }
 * Returns: { vendor, date, total, gst, line_items: [{description, amount}] }
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
    image_base64?: string;
    media_type?: string;
  };

  if (!body.image_base64) return NextResponse.json({ error: "image_base64 is required" }, { status: 400 });

  const mediaType = (body.media_type ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  if (!apiKey) {
    // Mock response for dev
    return NextResponse.json({
      vendor: "Hardware Store",
      date: new Date().toISOString().slice(0, 10),
      total: 87.50,
      gst: 7.95,
      line_items: [
        { description: "PVC pipe fittings x4", amount: 32.00 },
        { description: "Copper tape 10m", amount: 28.50 },
        { description: "Silicone sealant", amount: 18.90 },
        { description: "Other items", amount: 8.10 },
      ],
    });
  }

  const prompt = `You are a receipt scanner. Extract all information from this receipt image.

Return a JSON object with this exact structure:
{
  "vendor": "Store name",
  "date": "YYYY-MM-DD or null",
  "total": 123.45,
  "gst": 11.22,
  "line_items": [
    { "description": "Item name", "amount": 12.34 }
  ]
}

Rules:
- All amounts in AUD
- date in YYYY-MM-DD format or null if not readable
- GST is 10% of the pre-GST amount; if total shown is GST-inclusive, calculate GST = total / 11
- Include all line items you can read
- Only return the JSON, nothing else`;

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
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: body.image_base64,
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
    const data = await res.json() as { content: Array<{ text: string }>; usage?: { input_tokens: number; output_tokens: number } };
    const raw = data.content?.[0]?.text ?? "{}";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const result = JSON.parse(jsonMatch[0]);

    await logAICall(user.id, null, "ai/ocr-receipt", "claude-3-5-haiku-20241022", {
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
      cached: false,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[ai/ocr-receipt]", err);
    return NextResponse.json({ error: "OCR failed" }, { status: 500 });
  }
}
