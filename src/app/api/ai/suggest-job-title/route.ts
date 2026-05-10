import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

const MOCK_TITLES: Record<string, string> = {
  plumb: "Kitchen Tap Replacement & Pressure Test",
  electric: "Electrical Fault Diagnosis & Repair",
  clean: "Deep Clean — Kitchen & Bathrooms",
  garden: "Garden Maintenance & Lawn Mowing",
  paint: "Interior Repaint — Living Areas",
  roof: "Roof Leak Inspection & Repair",
  air: "Split System AC Service & Filter Clean",
  carpet: "Carpet Steam Clean — 3 Bedrooms",
  pest: "General Pest Treatment — Full Property",
  tile: "Bathroom Retile & Grout Refresh",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { description = "", job_type = "" } = body;
  const input = `${job_type} ${description}`.trim();

  if (!input) return NextResponse.json({ title: "" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
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
          max_tokens: 60,
          messages: [
            {
              role: "user",
              content: `Generate a concise, professional job title (max 8 words) for an Australian trades/service business. The job is: "${input}". Return ONLY the title, no punctuation, no explanation.`,
            },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json() as { content?: Array<{ type: string; text: string }> };
        const text = data.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
        if (text) return NextResponse.json({ title: text.replace(/^["']|["']$/g, "").slice(0, 80) });
      }
    } catch {
      // fall through to mock
    }
  }

  // Mock fallback: match on keywords
  const lower = input.toLowerCase();
  for (const [key, title] of Object.entries(MOCK_TITLES)) {
    if (lower.includes(key)) return NextResponse.json({ title });
  }
  return NextResponse.json({ title: "Service & Maintenance Job" });
}
