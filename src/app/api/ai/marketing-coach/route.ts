import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STUB_REPLIES = [
  "Great question! For Australian trades businesses, the best way to get more Google reviews is to ask right after the job is done. Send a text or email with a direct link to your Google Business Profile review page. Aim for 5 new reviews per month — consistency beats volume.",
  "The best time to run ads for trades in Australia is Tuesday–Thursday between 7am–9am and 5pm–8pm. Homeowners are planning work before their day starts or unwinding in the evening. For emergency services, run 24/7.",
  "Here's a Facebook post for you: '🔧 Job done right, first time. We just wrapped up another happy customer in [your suburb]. No mess left behind, no hidden costs — just quality workmanship. Call us today for a free quote! 📞 [your number]'",
  "To beat local competitors, focus on: 1) More Google reviews (aim for 50+), 2) Faster response time (reply within 1 hour), 3) Show your work — post before/after photos on Google and Facebook weekly, 4) Get listed on hipages and ServiceSeeking with a full profile.",
];

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = (await req.json()) as { message?: string };
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Stub response — rotate through canned replies
    const idx = Math.floor(Math.random() * STUB_REPLIES.length);
    return NextResponse.json({ reply: STUB_REPLIES[idx] });
  }

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
        max_tokens: 400,
        system:
          "You are an AI marketing coach specialising in Australian trades and service businesses. Give specific, actionable advice. Be concise and practical. Use Australian English and examples from Australian cities.",
        messages: [{ role: "user", content: message }],
      }),
    });
    const data = (await res.json()) as {
      content?: Array<{ text: string }>;
    };
    const reply = data.content?.[0]?.text ?? STUB_REPLIES[0];
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: STUB_REPLIES[0] });
  }
}
