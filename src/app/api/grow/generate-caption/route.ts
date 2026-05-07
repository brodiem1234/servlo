import { NextResponse } from "next/server";

type CaptionType = "recent_jobs" | "seasonal" | "promotion" | "testimonial" | "recent_job" | "trade_tip" | "behind_scenes" | "testimonial_request" | "ideas";

interface ContentIdea {
  hookLine: string;
  caption: string;
  hashtags: string[];
}

const MOCK_CAPTIONS: Record<string, string[]> = {
  recent_jobs: [
    "Another job done right! 🔧 Our crew wrapped up a full bathroom renovation this week — on time, on budget, and spotless. Swipe to see the before & after. Got a project in mind? Drop us a message and we'll come out for a free quote. #AdelaideTradie #BathroomReno #LocalTradies",
    "Happy client in Norwood this week! ✅ We completed a full re-pipe on an older home — old corroded pipes out, brand-new copper throughout. The difference is night and day. Licensed, insured, and trusted by 500+ Adelaide homeowners. Call us today! #AdelaideTradie #Plumbing #HomeMaintenance",
    "Big week for the team! 💪 Three jobs across the metro area — hot water system install, blocked drain clear, and a leaky roof repair. No job too big or small. We're available 7 days a week for callouts. DM us or tap the link in bio to book. #ServiceBusiness #AustralianTradies",
  ],
  seasonal: [
    "Winter's here and your heating needs a check-up! 🥶❄️ Before the cold really bites, let us service your ducted heating, reverse-cycle or gas heating unit. Book before 30 June and get 10% off any service call. Spots are filling fast — DM us or call today! #WinterReady #AdelaideHeating #SeasonalOffer",
    "Spring is the perfect time to tackle those home maintenance jobs you've been putting off! 🌸 Whether it's a leaky tap, gutters full of leaves, or a deck that needs attention — our team is ready. Limited spring bookings available — get in early! #SpringCleaning #HomeMaintenanceAdelaide",
    "It's storm season ⚡ — is your home ready? Make sure your gutters are clear, drainage is flowing, and your electrical safety switches are working. Call us for a pre-storm check before the weather turns. Better safe than sorry! #StormSeason #AdelaideWeather #HomeSafety",
  ],
  promotion: [
    "🎉 SPECIAL OFFER — Book this week and save! We're running a limited-time deal for new customers: 15% off your first job. Whether it's plumbing, electrical, or general maintenance — now's the time to book. Offer ends Friday. Call or DM us to lock it in! #SpecialOffer #AdelaideTradies #NewCustomerDeal",
    "FREE no-obligation quote — anywhere in Adelaide metro! 📋 Not sure what a job will cost? We'll come out, assess, and give you a fixed-price quote at no charge. No surprises, no hidden fees. Tap the link in bio or call us today. #FreeQuote #AdelaideServices #Transparent",
    "Same-day service available this week! 🚨 We've had cancellations and can fit in urgent jobs TODAY. Hot water system down? Electrical fault? Blocked drain? Don't wait — call us now and we'll be there this afternoon. Spots limited! #SameDayService #Emergency #AdelaideTradie",
  ],
  testimonial: [
    "\"Arrived on time, did an amazing job, and left everything cleaner than when they arrived. I'd recommend them to anyone in Adelaide!\" — Sarah M. ⭐⭐⭐⭐⭐ Reviews like this are why we do what we do. Thank you, Sarah! Book online via the link in bio. #5StarReview #CustomerLove #AdelaideTradie",
    "This one made our day! 🙏 \"Best tradies I've ever used. Fair price, great communication, and outstanding workmanship.\" — James T. ⭐⭐⭐⭐⭐ We're proud of every job we do. If you're looking for reliable local tradies, reach out today. #HappyCustomer #TestimonialTuesday",
    "Real feedback from a real customer 💬 \"They showed up when they said they would, explained everything clearly, and the price was exactly what was quoted. Will definitely be using them again.\" — Michael R. ⭐⭐⭐⭐⭐ That's the SERVLO standard. #CustomerReview #AustralianTradies #TrustLocal",
  ],
};

const MOCK_IDEAS: ContentIdea[] = [
  {
    hookLine: "Had a call at 6am about a burst pipe — another Monday sorted ✅",
    caption: "Had a call at 6am about a burst pipe in Norwood — another Monday sorted ✅ Quick response, clean fix, happy client. This is what we do every single day. If you've got a plumbing emergency, give us a call any time — we're on 7 days.",
    hashtags: ["tradie", "plumber", "Adelaide", "emergency", "plumbing"],
  },
  {
    hookLine: "Before & after you didn't know you needed to see 👀",
    caption: "Before & after you didn't know you needed to see 👀 Replaced a 30-year-old hot water system this week — the old one was barely holding on. New unit installed, fully compliant, and the client has proper hot showers again. Job done right.",
    hashtags: ["hotwater", "plumbing", "beforeandafter", "AdelaideTradie", "local"],
  },
  {
    hookLine: "With the cooler months here, your hot water is working overtime.",
    caption: "With the cooler months here, your hot water system is working overtime. Now's a great time to get it checked before it gives out in the middle of winter. We're booking inspections this week — DM us to lock in a time.",
    hashtags: ["winter", "hotwater", "maintenance", "Adelaide", "plumber"],
  },
  {
    hookLine: "Trade tip: know where your mains water shutoff is BEFORE you need it.",
    caption: "Trade tip: know where your mains water shutoff is BEFORE you need it 💡 Most people find out the hard way — mid-burst, water going everywhere. Take 2 minutes this weekend to locate yours. It can save you thousands. Share this with a mate who needs to know.",
    hashtags: ["tradetip", "plumbing", "homeowner", "DIY", "AustralianTradie"],
  },
  {
    hookLine: "Five-star review just came in and honestly made the whole week 🙌",
    caption: "Five-star review just came in and honestly made the whole week 🙌 \"Arrived on time, explained everything, and the price was exactly what was quoted. Highly recommend.\" — this is what we work for every day. Thank you to everyone who takes the time to leave feedback.",
    hashtags: ["5star", "review", "tradie", "Adelaide", "customerservice"],
  },
];

export async function POST(req: Request) {
  const body = (await req.json()) as {
    type?: CaptionType;
    businessName?: string;
    trade?: string;
    suburb?: string;
    state?: string;
    season?: string;
    dayOfWeek?: string;
    platform?: string;
    richPrompt?: string;
  };

  const { type, businessName, trade, suburb, state, season, dayOfWeek, platform, richPrompt } = body;
  const captionType = type ?? "recent_jobs";
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // ── Ideas mode ──────────────────────────────────────────────────────────────
  if (captionType === "ideas") {
    if (!apiKey) {
      return NextResponse.json({ ideas: MOCK_IDEAS });
    }

    const prompt = richPrompt ?? `Generate 5 social media post ideas for an Australian trade business called "${businessName ?? "a local trade business"}" (${trade ?? "general services"}) in ${suburb ?? "Adelaide"}, ${state ?? "Australia"}.

Return as JSON array with exactly 5 items, each with: { hookLine, caption, hashtags: string[] }`;

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
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = (await res.json()) as { content?: Array<{ text: string }> };
      const text = data.content?.[0]?.text ?? "";
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const ideas = JSON.parse(match[0]) as ContentIdea[];
        if (Array.isArray(ideas) && ideas.length > 0) {
          return NextResponse.json({ ideas });
        }
      }
      return NextResponse.json({ ideas: MOCK_IDEAS });
    } catch {
      return NextResponse.json({ ideas: MOCK_IDEAS });
    }
  }

  // ── Caption mode ─────────────────────────────────────────────────────────────
  const normalizedType = (captionType as string).replace(/_request$/, "").replace("recent_job", "recent_jobs").replace("trade_tip", "seasonal").replace("behind_scenes", "recent_jobs").replace("testimonial_request", "testimonial") as keyof typeof MOCK_CAPTIONS;

  if (!apiKey) {
    return NextResponse.json({ captions: MOCK_CAPTIONS[normalizedType] ?? MOCK_CAPTIONS.recent_jobs });
  }

  const typeDescriptions: Record<string, string> = {
    recent_jobs: "showcasing recent completed jobs",
    recent_job: "showcasing a recent completed job",
    seasonal: `seasonal content for ${season ?? "the current season"}`,
    trade_tip: "sharing a useful trade tip",
    promotion: "promoting a special offer or deal",
    testimonial: "sharing a customer testimonial or positive feedback",
    testimonial_request: "asking customers to leave a review or testimonial",
    behind_scenes: "behind-the-scenes content showing daily work life",
  };

  const prompt = `You are a social media content expert for Australian trade businesses. Generate 3 engaging social media captions for:
Business: ${businessName ?? "a local trade business"}
Trade: ${trade ?? "general services"}
Location: ${suburb ?? "Adelaide"}, ${state ?? "Australia"}
Platform: ${platform ?? "Facebook and Instagram"}
Content type: ${typeDescriptions[captionType as string] ?? "general post"}
${season ? `Season: ${season} in Australia` : ""}
${dayOfWeek ? `Day: ${dayOfWeek}` : ""}

Requirements:
- Write in a genuine, casual Australian voice — first person ("we" or "I")
- Avoid corporate language and buzzwords
- Include relevant hashtags at the end
- Max 2200 characters each
- Reference real trade scenarios and local details where possible
- Use emojis appropriately but not excessively

Return ONLY a JSON array of 3 caption strings. No other text.`;

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
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = (await res.json()) as { content?: Array<{ text: string }> };
    const text = data.content?.[0]?.text ?? "";
    const match = text.match(/\[[\s\S]*\]/);
    const captions = match ? (JSON.parse(match[0]) as string[]) : [];
    return NextResponse.json({
      captions: captions.length ? captions : (MOCK_CAPTIONS[normalizedType] ?? MOCK_CAPTIONS.recent_jobs),
    });
  } catch {
    return NextResponse.json({ captions: MOCK_CAPTIONS[normalizedType] ?? MOCK_CAPTIONS.recent_jobs });
  }
}
