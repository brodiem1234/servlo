import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAILimit, logAICall, checkPerMinuteRateLimit } from "@/lib/ai-limits";

const MOCK_COPIES = [
  {
    headline: "Fast & Reliable Plumbing",
    primaryText:
      "Need a plumber in [suburb]? We're available 7 days, fixed-price quotes, and over 200 five-star reviews. Call now for a free quote.",
    cta: "Call Now",
  },
  {
    headline: "Same-Day Service Available",
    primaryText:
      "Don't let a leaking pipe ruin your day. Our licensed plumbers are ready today — guaranteed workmanship on every job in [suburb].",
    cta: "Book Today",
  },
  {
    headline: "Trusted Local Tradies",
    primaryText:
      "Join 500+ happy customers across [suburb]. Licensed, insured, and local — we show up when we say we will. Get a free quote today.",
    cta: "Get Quote",
  },
];

export async function POST(req: Request) {
  const { businessName, trade, suburb, goal, specialty } = (await req.json()) as {
    businessName?: string;
    trade?: string;
    suburb?: string;
    goal?: string;
    specialty?: string;
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Check AI limits for authenticated users
  if (apiKey) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [limitCheck, rateOk] = await Promise.all([
          checkAILimit(user.id),
          checkPerMinuteRateLimit(user.id),
        ]);
        if (!rateOk) {
          return NextResponse.json({ error: "rate_limited", message: "Too many requests. Please wait a moment." }, { status: 429 });
        }
        if (!limitCheck.allowed) {
          return NextResponse.json({
            error: "ai_limit_reached",
            used: limitCheck.used,
            limit: limitCheck.limit,
            resetDate: limitCheck.resetDate,
            upgradeUrl: "/dashboard/owner/settings?tab=billing",
          }, { status: 429 });
        }
      }
    } catch { /* non-blocking — if limit check fails, allow the call */ }
  }

  if (!apiKey) {
    return NextResponse.json({
      variations: MOCK_COPIES.map((c) => ({
        ...c,
        primaryText: c.primaryText.replace(/\[suburb\]/g, suburb ?? "your area"),
      })),
    });
  }

  const prompt = `You are an expert ad copywriter for Australian trade businesses. Generate 3 ad copy variations for:
Business: ${businessName ?? "a local tradie"}
Trade: ${trade ?? "general services"}
Location: ${suburb ?? "local area"}
Goal: ${goal ?? "Lead Generation"}
Specialty: ${specialty ?? ""}
Return ONLY a JSON array of 3 objects, each with: headline (max 30 chars), primaryText (max 125 chars), cta (max 20 chars). No other text.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = (await res.json()) as { content?: Array<{ text: string }>; usage?: { input_tokens?: number; output_tokens?: number } };
    const text = data.content?.[0]?.text ?? "";
    const match = text.match(/\[[\s\S]*\]/);
    const variations = match ? (JSON.parse(match[0]) as typeof MOCK_COPIES) : [];
    // Log the AI call (non-blocking)
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await logAICall(user.id, null, "grow/generate-ad-copy", "claude-3-5-haiku-20241022", {
          prompt: data.usage?.input_tokens ?? 0,
          completion: data.usage?.output_tokens ?? 0,
        }, 0);
      }
    } catch { /* non-blocking */ }
    return NextResponse.json({ variations: variations.length ? variations : MOCK_COPIES });
  } catch {
    return NextResponse.json({ variations: MOCK_COPIES });
  }
}
