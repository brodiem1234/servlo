import { NextResponse } from "next/server";
import type { SuburbSuggestion } from "@/lib/suburb-suggestions";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json([] satisfies SuburbSuggestion[]);
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("countrycodes", "au");
    url.searchParams.set("limit", "10");
    url.searchParams.set("q", `${q}, Australia`);

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "ServloDashboard/1.0 (suburb lookup)"
      }
    });

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const data = (await res.json()) as Array<{
      display_name?: string;
      address?: Record<string, string>;
    }>;

    const out: SuburbSuggestion[] = [];
    const seen = new Set<string>();

    for (const hit of data) {
      const a = hit.address ?? {};
      const suburb =
        a.suburb || a.town || a.city || a.village || a.hamlet || a.neighbourhood || a.quarter || "";
      const state = a.state || "";
      const postcode = a.postcode || "";
      if (!suburb && !postcode) continue;
      const label = hit.display_name ?? `${suburb} ${state} ${postcode}`.trim();
      const key = `${suburb}|${state}|${postcode}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        label,
        suburb: suburb || q,
        state,
        postcode
      });
      if (out.length >= 8) break;
    }

    return NextResponse.json(out);
  } catch {
    return NextResponse.json([]);
  }
}
