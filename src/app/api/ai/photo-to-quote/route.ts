import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAILimit, logAICall, checkPerMinuteRateLimit } from "@/lib/ai-limits";

/**
 * POST /api/ai/photo-to-quote
 * Accepts a multipart/form-data image file, uses Claude vision to analyse it
 * and extract structured quote line items.
 *
 * Form fields: photo (image/*)
 * Returns: { description, line_items: [{description, quantity, unit_price}], notes }
 */

type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

type QuoteExtraction = {
  description: string;
  line_items: LineItem[];
  notes: string;
};

const STUB_RESPONSE: QuoteExtraction = {
  description: "Bathroom renovation",
  line_items: [
    { description: "Labour", quantity: 8, unit_price: 120 },
    { description: "Materials", quantity: 1, unit_price: 450 },
  ],
  notes: "Stub quote from photo",
};

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
  if (!limitCheck.allowed) return NextResponse.json({ error: "quota_exceeded", message: `AI quota exceeded (${limitCheck.used}/${limitCheck.limit} calls used this month)` }, { status: 429 });

  if (!apiKey) {
    return NextResponse.json(STUB_RESPONSE);
  }

  // Parse multipart form data
  let photoFile: File | null = null;
  try {
    const formData = await req.formData();
    photoFile = formData.get("photo") as File | null;
  } catch {
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  if (!photoFile) {
    return NextResponse.json({ error: "photo field is required" }, { status: 400 });
  }

  // Convert image to base64
  let base64: string;
  let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  try {
    const buffer = await photoFile.arrayBuffer();
    base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const rawType = photoFile.type || "image/jpeg";
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
    mediaType = allowedTypes.includes(rawType as typeof allowedTypes[number])
      ? (rawType as typeof allowedTypes[number])
      : "image/jpeg";
  } catch {
    return NextResponse.json({ error: "Failed to read image file" }, { status: 400 });
  }

  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 800,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64,
                },
              },
              {
                type: "text",
                text: 'You are a quoting assistant for a trades/service business. Analyze this photo and extract all line items for a quote. Return JSON only with: { "description": string, "line_items": [{"description": string, "quantity": number, "unit_price": number}], "notes": string }',
              },
            ],
          },
        ],
      }),
    });

    if (!claudeRes.ok) throw new Error(`Claude API error: ${claudeRes.status}`);

    const claudeData = await claudeRes.json() as {
      content: Array<{ text: string }>;
      usage?: { input_tokens: number; output_tokens: number };
    };
    const raw = claudeData.content?.[0]?.text ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Claude response");
    const quote = JSON.parse(jsonMatch[0]) as QuoteExtraction;

    await logAICall(user.id, null, "ai/photo-to-quote", "claude-3-5-sonnet-20241022", {
      prompt: claudeData.usage?.input_tokens ?? 0,
      completion: claudeData.usage?.output_tokens ?? 0,
    }, 0);

    return NextResponse.json(quote);
  } catch (err) {
    console.error("[ai/photo-to-quote] Claude error:", err);
    return NextResponse.json({ error: "Quote extraction failed" }, { status: 500 });
  }
}
