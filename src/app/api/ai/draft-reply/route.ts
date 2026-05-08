import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAILimit, logAICall, checkPerMinuteRateLimit } from "@/lib/ai-limits";

/**
 * POST /api/ai/draft-reply
 * Generates a professional email/SMS reply to a client message.
 *
 * Body: { client_message, tone?, business_name?, context? }
 * Returns: { reply, subject? }
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
    client_message?: string;
    tone?: "professional" | "friendly" | "brief";
    business_name?: string;
    context?: string;
    format?: "email" | "sms";
  };

  if (!body.client_message?.trim()) {
    return NextResponse.json({ error: "client_message is required" }, { status: 400 });
  }

  const tone = body.tone ?? "professional";
  const format = body.format ?? "email";

  if (!apiKey) {
    return NextResponse.json({
      reply: `Thank you for your message. We've received your enquiry and will be in touch shortly to confirm the details. Please don't hesitate to call if you have any questions.`,
      subject: "Re: Your enquiry",
    });
  }

  const prompt = `You are an AI assistant for an Australian trade/service business${body.business_name ? ` called "${body.business_name}"` : ""}.

A client sent the following message:
"${body.client_message}"
${body.context ? `\nContext: ${body.context}` : ""}

Write a ${tone} ${format === "sms" ? "SMS reply (under 160 characters)" : "email reply"} on behalf of the business.
${format === "email" ? 'Also provide a short subject line.' : ""}

Return a JSON object:
{
  "reply": "The reply text",
  ${format === "email" ? '"subject": "Email subject line"' : '"subject": null'}
}

Rules:
- Use Australian English
- Be helpful, warm and professional
- Do not make specific promises about dates/times without confirmation
- Keep email replies concise (3-5 sentences max)
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
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
    const data = await res.json() as { content: Array<{ text: string }>; usage?: { input_tokens: number; output_tokens: number } };
    const raw = data.content?.[0]?.text ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const result = JSON.parse(jsonMatch[0]);

    await logAICall(user.id, null, "ai/draft-reply", "claude-3-5-haiku-20241022", {
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
      cached: false,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[ai/draft-reply]", err);
    return NextResponse.json({ error: "AI draft generation failed" }, { status: 500 });
  }
}
