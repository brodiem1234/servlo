import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    name?: string;
    goal?: string;
    target_suburb?: string;
    target_radius?: number;
    headline?: string | null;
    primary_text?: string | null;
    cta?: string | null;
    status?: string;
  };

  const { data, error } = await supabase.from("grow_campaigns").insert({
    owner_id: user.id,
    name: body.name ?? "Untitled Campaign",
    goal: body.goal ?? null,
    target_suburb: body.target_suburb ?? null,
    target_radius: body.target_radius ?? 10,
    headline: body.headline ?? null,
    primary_text: body.primary_text ?? null,
    cta: body.cta ?? null,
    status: body.status ?? "draft",
  }).select().single();

  if (error) {
    console.error("[save-campaign]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ campaign: data });
}
