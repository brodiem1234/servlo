import { NextResponse } from "next/server";

const MOCK =
  "Thank you so much for your kind review! We're thrilled to hear you had a positive experience with our team. We always strive to provide prompt, professional service, and your feedback means a great deal to us. We look forward to working with you again in the future!";

export async function POST(req: Request) {
  const { reviewText, businessName, trade } = (await req.json()) as {
    reviewText?: string;
    businessName?: string;
    trade?: string;
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ response: MOCK });
  }

  const prompt = `You are writing a professional response to a Google review on behalf of an Australian trade business.

Business: ${businessName ?? "a local trade business"}
Trade: ${trade ?? "general services"}

Review to respond to:
"${reviewText ?? ""}"

Write a genuine, warm, professional response in Australian English. Keep it under 150 words. Do not sound robotic or use generic corporate language. Be specific to what the reviewer said. Return ONLY the response text, no extra commentary.`;

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
        max_tokens: 256,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = (await res.json()) as { content?: Array<{ text: string }> };
    const text = data.content?.[0]?.text?.trim() ?? "";
    return NextResponse.json({ response: text || MOCK });
  } catch {
    return NextResponse.json({ response: MOCK });
  }
}
