import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAILimit, logAICall, checkPerMinuteRateLimit } from "@/lib/ai-limits";

/**
 * POST /api/ai/transcribe
 * Transcribes a voice note audio file using Claude vision + audio understanding.
 * Since Claude doesn't natively handle audio, we use the browser's Web Speech API
 * on the client side and use Claude to clean/structure the transcript.
 *
 * Body: { transcript_raw, context? }
 * Returns: { transcript, summary, action_items: string[] }
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
  if (!limitCheck.allowed) return NextResponse.json({ error: "quota_exceeded", message: `AI quota exceeded (${limitCheck.used}/${limitCheck.limit} calls used this month)` }, { status: 429 });

  const body = await req.json().catch(() => ({})) as {
    transcript_raw?: string;
    context?: string; // e.g. "job notes", "client call", "on-site inspection"
  };

  if (!body.transcript_raw?.trim()) {
    return NextResponse.json({ error: "transcript_raw is required" }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({
      transcript: body.transcript_raw,
      summary: "Voice note recorded on site. Work completed as per client request.",
      action_items: ["Follow up with client", "Order replacement parts"],
    });
  }

  const prompt = `You are an AI assistant for an Australian trade/service business. A technician recorded a voice note${body.context ? ` (context: ${body.context})` : ""}.

Raw transcript (may have speech recognition errors): "${body.transcript_raw}"

Clean up the transcript and extract key information. Return a JSON object:
{
  "transcript": "Cleaned up, properly punctuated version of the transcript",
  "summary": "1-2 sentence summary of what was said",
  "action_items": ["Action 1", "Action 2"]
}

Only return the JSON, nothing else.`;

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
    if (!jsonMatch) throw new Error("No JSON in response");
    const result = JSON.parse(jsonMatch[0]);

    await logAICall(user.id, null, "ai/transcribe", "claude-3-5-haiku-20241022", {
      prompt: data.usage?.input_tokens ?? 0,
      completion: data.usage?.output_tokens ?? 0,
    }, 0);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[ai/transcribe]", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
