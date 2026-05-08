import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAILimit, logAICall, checkPerMinuteRateLimit } from "@/lib/ai-limits";

/**
 * POST /api/ai/generate-quote
 * Uses Claude to generate quote line items and a description from a natural-language job summary.
 *
 * Body: { job_description, service_type?, address?, pricebook_items? }
 * Returns: { title, description, line_items: [{description, quantity, unit_price}] }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Rate + usage limits
  const [limitCheck, rateOk] = await Promise.all([
    checkAILimit(user.id),
    checkPerMinuteRateLimit(user.id),
  ]);
  if (!rateOk) return NextResponse.json({ error: "rate_limited", message: "Too many requests." }, { status: 429 });
  if (!limitCheck.allowed) return NextResponse.json({ error: "quota_exceeded", message: `AI quota exceeded (${limitCheck.used}/${limitCheck.limit} calls used this month)` }, { status: 429 });

  const body = await req.json().catch(() => ({})) as {
    job_description?: string;
    service_type?: string;
    address?: string;
    pricebook_items?: Array<{ name: string; unit_price: number; unit?: string }>;
  };

  const { job_description, service_type, address, pricebook_items } = body;
  if (!job_description?.trim()) return NextResponse.json({ error: "job_description is required" }, { status: 400 });

  const pricebookContext = pricebook_items && pricebook_items.length > 0
    ? `\n\nAvailable pricebook items (use these where relevant):\n${pricebook_items.map((p) => `- ${p.name}: $${p.unit_price}/${p.unit ?? "each"}`).join("\n")}`
    : "";

  const prompt = `You are a helpful assistant for Australian trade and service businesses. Generate a professional quote based on the following job description.

Job description: ${job_description}
${service_type ? `Service type: ${service_type}` : ""}
${address ? `Location: ${address}` : ""}
${pricebookContext}

Return a JSON object with this exact structure:
{
  "title": "Short job title (max 60 chars)",
  "description": "Professional quote description (2-3 sentences)",
  "line_items": [
    { "description": "Item description", "quantity": 1, "unit_price": 150.00 }
  ]
}

Rules:
- Use Australian dollars (AUD), round to nearest $5 for labour
- Include GST in prices (prices are GST-inclusive)
- Use 2-4 line items typically
- Be specific and professional
- Only return the JSON, nothing else`;

  if (!apiKey) {
    // Fallback mock for dev without API key
    return NextResponse.json({
      title: `${service_type ?? "Service"} at ${address ?? "client site"}`,
      description: `Professional ${service_type ?? "service"} as described. All work carried out by licensed and insured technicians.`,
      line_items: [
        { description: service_type ?? "Labour", quantity: 2, unit_price: 110 },
        { description: "Materials", quantity: 1, unit_price: 85 },
      ],
    });
  }

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
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
    const data = await res.json() as { content: Array<{ text: string }>; usage?: { input_tokens: number; output_tokens: number } };
    const raw = data.content?.[0]?.text ?? "{}";

    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const result = JSON.parse(jsonMatch[0]) as { title: string; description: string; line_items: Array<{ description: string; quantity: number; unit_price: number }> };

    await logAICall(user.id, null, "ai/generate-quote", "claude-3-5-haiku-20241022", {
      prompt: data.usage?.input_tokens ?? 0,
      completion: data.usage?.output_tokens ?? 0,
    }, 0);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[ai/generate-quote]", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
