import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

const PLATFORMS = ["Facebook", "Instagram", "Google Business"] as const;

const MOCK_POSTS = [
  { platform: "Facebook", caption: "Another great job done for a happy client! Our team takes pride in every project, big or small. Thanks for trusting us with your home. 🏠✨ #LocalBusiness #TradeLife #QualityWork" },
  { platform: "Instagram", caption: "Before and after — what a transformation! Swipe to see the results. Our team delivers every time. 📸 #BeforeAndAfter #Trades #HomeImprovement" },
  { platform: "Google Business", caption: "We're proud to serve the local community. If you need reliable, professional service — give us a call or book online today. ⭐⭐⭐⭐⭐" },
  { platform: "Facebook", caption: "Did you know? Regular maintenance can save you thousands in the long run. Ask us about our service plans — tailored for Australian homes and businesses. 🔧" },
  { platform: "Instagram", caption: "Meet the team! The people behind every job — skilled, licensed, and passionate about what they do. DM us to book. 👷‍♂️👷‍♀️ #Team #LocalTrades" },
];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { businessName = "our business", suburb = "your area", state: bizState = "Australia" } = body;

  // Generate scheduled dates: one per weekday for next 30 days, starting tomorrow
  function getNextWeekdays(count: number): string[] {
    const dates: string[] = [];
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (dates.length < count) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) {
        dates.push(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0).toISOString());
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  }

  let posts: { platform: string; caption: string; scheduled_at: string }[] = [];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const prompt = `You are a social media content creator for an Australian service business called "${businessName}" based in ${suburb}, ${bizState}.

Generate exactly 30 social media posts spread across Facebook, Instagram, and Google Business profile. Each post should be engaging, professional, and relevant to a local Australian service business. Vary the topics: job showcases, team highlights, tips & advice, seasonal promotions, community involvement, customer spotlights, before/after, FAQs, and calls to action.

Return ONLY a JSON array of exactly 30 objects, each with:
- "platform": one of "Facebook", "Instagram", "Google Business"
- "caption": the post text (max 280 chars for Twitter-safe, include relevant hashtags for Facebook/Instagram)

No explanation, no markdown — only the raw JSON array.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 8000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json() as { content?: Array<{ type: string; text: string }> };
        const text = data.content?.find((c) => c.type === "text")?.text ?? "";
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]) as { platform: string; caption: string }[];
          const scheduledDates = getNextWeekdays(parsed.length);
          posts = parsed.map((p, i) => ({
            platform: PLATFORMS.includes(p.platform as typeof PLATFORMS[number]) ? p.platform : "Facebook",
            caption: String(p.caption ?? "").slice(0, 500),
            scheduled_at: scheduledDates[i] ?? new Date().toISOString(),
          }));
        }
      }
    } catch {
      // fall through to mock
    }
  }

  // Fallback: generate 30 posts from mock template
  if (posts.length === 0) {
    const scheduledDates = getNextWeekdays(30);
    posts = Array.from({ length: 30 }, (_, i) => {
      const template = MOCK_POSTS[i % MOCK_POSTS.length]!;
      return {
        platform: template.platform,
        caption: template.caption.replace("our business", businessName).replace("local community", `${suburb} community`),
        scheduled_at: scheduledDates[i] ?? new Date().toISOString(),
      };
    });
  }

  // Bulk insert into grow_social_posts
  const rows = posts.map((p) => ({
    owner_id: user.id,
    platform: p.platform,
    caption: p.caption,
    status: "scheduled",
    scheduled_at: p.scheduled_at,
    image_url: null,
  }));

  const { data: inserted, error } = await supabase
    .from("grow_social_posts")
    .insert(rows)
    .select("id, platform, caption, image_url, status, scheduled_at, published_at, like_count, comment_count, reach, created_at");

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Table not ready. Apply migrations." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: inserted ?? [], count: (inserted ?? []).length });
}
