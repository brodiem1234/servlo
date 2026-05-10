import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ContextPayload = {
  businessName?: string;
  suburb?: string;
  state?: string;
  phone?: string | null;
  jobsThisMonth?: number;
  totalRevenue?: number;
  unpaidInvoices?: number;
  reviewCount?: number;
  avgRating?: number | null;
  topServiceType?: string | null;
};

type HistoryMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { message?: string; context?: ContextPayload; history?: HistoryMessage[] };
  const { message, context: clientCtx, history = [] } = body;
  if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  // Merge client-provided context (already computed server-side in page.tsx) with a quick DB check
  const { data: biz } = await supabase
    .from("businesses")
    .select("business_name, suburb, state, phone")
    .eq("owner_id", user.id)
    .maybeSingle();

  const businessName = clientCtx?.businessName ?? biz?.business_name ?? "your business";
  const suburb = clientCtx?.suburb ?? biz?.suburb ?? "your area";
  const state = clientCtx?.state ?? biz?.state ?? "Australia";
  const phone = clientCtx?.phone ?? biz?.phone ?? null;
  const locationStr = suburb !== "your area" ? `${suburb}, ${state}` : state;

  // Build rich context paragraph
  const metricLines: string[] = [];
  if ((clientCtx?.jobsThisMonth ?? 0) > 0) metricLines.push(`${clientCtx!.jobsThisMonth} jobs booked this month`);
  if ((clientCtx?.totalRevenue ?? 0) > 0) metricLines.push(`$${clientCtx!.totalRevenue!.toLocaleString("en-AU")} revenue tracked this month`);
  if ((clientCtx?.unpaidInvoices ?? 0) > 0) metricLines.push(`$${clientCtx!.unpaidInvoices!.toLocaleString("en-AU")} in unpaid invoices`);
  if ((clientCtx?.reviewCount ?? 0) > 0) {
    const ratingStr = clientCtx?.avgRating ? ` (avg ${clientCtx.avgRating.toFixed(1)} stars)` : "";
    metricLines.push(`${clientCtx!.reviewCount} Google reviews${ratingStr}`);
  }
  if (clientCtx?.topServiceType) metricLines.push(`most common job type: ${clientCtx.topServiceType}`);

  const metricsSection = metricLines.length > 0
    ? `\nCurrent business metrics: ${metricLines.join(", ")}.`
    : "";

  const systemPrompt = `You are an AI marketing coach for ${businessName}, an Australian service business based in ${locationStr}.${phone ? ` Their phone number is ${phone}.` : ""}${metricsSection}

Give specific, actionable advice personalised to this business. Use their actual suburb, business name, and metrics in examples. Be concise, practical, and use Australian English. When writing social media posts or ad copy, use the real business name, location, and phone number — never placeholder brackets like [your suburb] or [your number].

When you suggest posting on social media, writing an ad, or sending an email campaign, end with a sentence like "I can help you do this in the Social Calendar" or "Head to Ad Studio to set this up" so the user knows where to go.`;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Build messages array with conversation history
  const conversationHistory = history.slice(-8).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  conversationHistory.push({ role: "user" as const, content: message });

  if (!apiKey) {
    // Rich stub responses using real context
    const stubs = [
      `Great question for ${businessName}! You currently have ${clientCtx?.reviewCount ?? 0} Google reviews${clientCtx?.avgRating ? ` averaging ${clientCtx.avgRating.toFixed(1)} stars` : ""}. To grow faster: text your last 10 clients a direct review link right after the job. Aim for 5 new reviews per week — in ${suburb} that'll put you ahead of most competitors. I can help you set this up in Review Hub.`,
      `For ${businessName} in ${suburb}, ${state}, the best Facebook post right now: "🔧 Another happy customer in ${suburb}! ${clientCtx?.topServiceType ?? "Quality service"} done right — no mess, no hidden costs.${phone ? ` Call ${phone}` : " DM us"} for a free quote." Post Tuesday–Thursday between 7–9am or 5–8pm for best reach. Head to Social Calendar to schedule it.`,
      `Looking at your ${locationStr} market — your top opportunity is faster quote response. Businesses that respond within 1 hour win 80% of jobs. You've done ${clientCtx?.jobsThisMonth ?? 0} jobs this month. A quick-response ad campaign with "Same-day quotes" targeting ${suburb} homeowners would convert well right now. Head to Ad Studio to set this up.`,
      `To dominate ${locationStr}: 1) Get to 50+ Google reviews (you're at ${clientCtx?.reviewCount ?? 0}), 2) Reply to all reviews within 24h, 3) Post 3 before/after photos per week on Facebook, 4) Keep your hipages profile up to date. Your ${clientCtx?.topServiceType ?? "service"} niche has strong local demand — focus on being the most reviewed business in ${suburb}.`,
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
        max_tokens: 600,
        system: systemPrompt,
        messages: conversationHistory,
      }),
    });
    const data = (await res.json()) as { content?: Array<{ text: string }> };
    const reply = data.content?.[0]?.text ?? `Here's advice for ${businessName}: focus on Google reviews and response time in ${suburb}.`;
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: `Here's advice for ${businessName}: focus on Google reviews and fast response time in ${locationStr}.` });
  }
}
