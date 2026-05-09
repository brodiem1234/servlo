import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAILimit, logAICall, checkPerMinuteRateLimit } from "@/lib/ai-limits";

/**
 * POST /api/ai/voice-to-job
 * Accepts a multipart/form-data audio file, transcribes via OpenAI Whisper,
 * then extracts structured job details via Claude.
 *
 * Form fields: audio (file)
 * Returns: { transcript: string, job: { title, description, client_name, address, scheduled_date, estimated_hours, priority } }
 */

type JobExtraction = {
  title: string;
  description: string;
  client_name: string | null;
  address: string | null;
  scheduled_date: string | null;
  estimated_hours: number | null;
  priority: "low" | "medium" | "high";
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [limitCheck, rateOk] = await Promise.all([
    checkAILimit(user.id),
    checkPerMinuteRateLimit(user.id),
  ]);
  if (!rateOk) return NextResponse.json({ error: "rate_limited", message: "Too many requests." }, { status: 429 });
  if (!limitCheck.allowed) return NextResponse.json({ error: "quota_exceeded", message: `AI quota exceeded (${limitCheck.used}/${limitCheck.limit} calls used this month)` }, { status: 429 });

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Stub response when OpenAI key is missing
  if (!openaiKey) {
    return NextResponse.json({
      transcript: "Stub transcript",
      job: {
        title: "Voice Job",
        description: "Created from voice",
        client_name: null,
        address: null,
        scheduled_date: null,
        estimated_hours: 2,
        priority: "medium",
      } satisfies JobExtraction,
    });
  }

  // Parse multipart form data
  let audioFile: File | null = null;
  try {
    const formData = await req.formData();
    audioFile = formData.get("audio") as File | null;
  } catch {
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  if (!audioFile) {
    return NextResponse.json({ error: "audio field is required" }, { status: 400 });
  }

  let transcript: string;

  // Step 1: Transcribe with OpenAI Whisper
  try {
    const whisperForm = new FormData();
    whisperForm.append("file", audioFile, audioFile.name || "audio.webm");
    whisperForm.append("model", "whisper-1");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
      },
      body: whisperForm,
    });

    if (!whisperRes.ok) {
      const errBody = await whisperRes.text();
      throw new Error(`Whisper API error ${whisperRes.status}: ${errBody}`);
    }

    const whisperData = await whisperRes.json() as { text: string };
    transcript = whisperData.text ?? "";
  } catch (err) {
    console.error("[ai/voice-to-job] Whisper error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }

  // Step 2: Extract job details with Claude (or stub if no Anthropic key)
  if (!anthropicKey) {
    return NextResponse.json({
      transcript,
      job: {
        title: "Voice Job",
        description: transcript || "Created from voice",
        client_name: null,
        address: null,
        scheduled_date: null,
        estimated_hours: 2,
        priority: "medium",
      } satisfies JobExtraction,
    });
  }

  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 500,
        system: "You are a job creation assistant for a trades business. Extract job details from voice input and return JSON only.",
        messages: [
          {
            role: "user",
            content: `Extract from this voice note and return JSON with keys: title, description, client_name, address, scheduled_date (YYYY-MM-DD or null), estimated_hours (number or null), priority (low/medium/high). Voice: ${transcript}`,
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
    const job = JSON.parse(jsonMatch[0]) as JobExtraction;

    await logAICall(user.id, null, "ai/voice-to-job", "claude-3-5-haiku-20241022", {
      prompt: claudeData.usage?.input_tokens ?? 0,
      completion: claudeData.usage?.output_tokens ?? 0,
    }, 0);

    return NextResponse.json({ transcript, job });
  } catch (err) {
    console.error("[ai/voice-to-job] Claude error:", err);
    return NextResponse.json({ error: "Job extraction failed" }, { status: 500 });
  }
}
