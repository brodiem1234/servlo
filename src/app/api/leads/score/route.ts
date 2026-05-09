import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface LeadInput {
  service_type: string;
  urgency: string;
  estimated_budget: number;
  description: string;
  suburb: string;
}

interface ScoreResult {
  score: number;
  reason: string;
  grade: "A" | "B" | "C" | "D";
}

function gradeFromScore(score: number): "A" | "B" | "C" | "D" {
  if (score >= 75) return "A";
  if (score >= 55) return "B";
  if (score >= 35) return "C";
  return "D";
}

function computeFallbackScore(lead: LeadInput): ScoreResult {
  const budget = lead.estimated_budget ?? 0;
  const urgency = (lead.urgency ?? "").toLowerCase();

  let score: number;
  if (budget > 2000) {
    score = 80;
  } else if (urgency === "today") {
    score = 70;
  } else {
    score = 50;
  }

  // Nudge score slightly based on description length (more detail = higher quality)
  if (lead.description && lead.description.length > 100) {
    score = Math.min(100, score + 5);
  }

  const grade = gradeFromScore(score);
  const reason =
    budget > 2000
      ? "High budget job with strong commercial value"
      : urgency === "today"
        ? "Urgent request requiring immediate attention"
        : "Standard lead with flexible timeline";

  return { score, reason, grade };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth gate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: { lead: LeadInput };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { lead } = body;
  if (!lead) {
    return NextResponse.json({ error: "Missing lead in body" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Fallback: simple formula score
    const result = computeFallbackScore(lead);
    return NextResponse.json(result);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 200,
        system:
          'You are a lead scoring AI for an Australian trades business. Score this lead 1-100 based on: budget size, urgency (today=high, this_week=medium, flexible=low), description clarity, and job complexity. Return JSON only: { "score": number, "reason": "string (max 15 words)", "grade": "A"|"B"|"C"|"D" }',
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              service_type: lead.service_type,
              urgency: lead.urgency,
              estimated_budget: lead.estimated_budget,
              description: lead.description,
              suburb: lead.suburb,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      const fallback = computeFallbackScore(lead);
      return NextResponse.json(fallback);
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text ?? "";

    // Parse JSON from response — strip any markdown code fences
    const cleaned = text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    const parsed: ScoreResult = JSON.parse(cleaned);

    // Validate and coerce
    const score = Math.max(1, Math.min(100, Number(parsed.score) || 50));
    const grade = (["A", "B", "C", "D"].includes(parsed.grade)
      ? parsed.grade
      : gradeFromScore(score)) as "A" | "B" | "C" | "D";
    const reason =
      typeof parsed.reason === "string" && parsed.reason.length > 0
        ? parsed.reason
        : "Score computed from lead details";

    return NextResponse.json({ score, reason, grade });
  } catch {
    // Any API/parse error → fall back to formula
    const fallback = computeFallbackScore(lead);
    return NextResponse.json(fallback);
  }
}
