import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Fetch real business context
  const { data: biz } = await supabase
    .from("businesses")
    .select("business_name, suburb, state, phone, abn")
    .eq("owner_id", user.id)
    .maybeSingle();

  const businessName = biz?.business_name ?? "your business";
  const suburb = biz?.suburb ?? "your area";
  const state = biz?.state ?? "Australia";
  const phone = biz?.phone ?? null;
  const locationStr = suburb !== "your area" ? `${suburb}, ${state}` : state;

  const systemPrompt = `You are an AI marketing coach for ${businessName}, an Australian service business based in ${locationStr}.
${phone ? `Their phone number is ${phone}.` : ""}
Give specific, actionable advice personalised to this business. Use their actual suburb and business name in examples.
Be concise, practical, and use Australian English. When writing social media posts or ad copy, use the real business name and location — never use placeholder brackets like [your suburb] or [your number].`;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Stub response — use real business context
    const stubs = [
      `Great question! For ${businessName} in ${locationStr}, the best way to get more Google reviews is to ask right after the job is done. Send a text with a direct review link. Aim for 5 new reviews per month — consistency beats volume.`,
      `The best time to run ads for ${businessName} is Tuesday–Thursday between 7am–9am and 5pm–8pm. Homeowners in ${suburb} are planning work before their day starts or unwinding in the evening.`,
      `Here's a Facebook post for ${businessName}: '🔧 Job done right, first time. We just wrapped up another happy customer in ${suburb}. No mess left behind, no hidden costs — just quality workmanship. ${phone ? `Call us today on ${phone}!` : "DM us for a free quote!"}'`,
      `To beat local competitors in ${locationStr}: 1) Get to 50+ Google reviews, 2) Reply within 1 hour, 3) Post before/after photos weekly, 4) Full profile on hipages and ServiceSeeking.`,
    ];
    return NextResponse.json({ reply: stubs[Math.floor(Math.random() * stubs.length)] });
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
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: message }],
      }),
    });
    const data = (await res.json()) as {
      content?: Array<{ text: string }>;
    };
    const reply = data.content?.[0]?.text ?? `Here's advice for ${businessName}: focus on Google reviews and response time in ${suburb}.`;
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: `Here's advice for ${businessName}: focus on Google reviews and fast response time in ${locationStr}.` });
  }
}
