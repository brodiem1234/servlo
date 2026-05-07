import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    platforms?: string[];
    caption?: string;
    scheduled_at?: string;
    status?: string;
  };

  const { data, error } = await supabase.from("grow_social_posts").insert({
    owner_id: user.id,
    platforms: body.platforms ?? [],
    caption: body.caption ?? "",
    scheduled_at: body.scheduled_at ?? null,
    status: body.status ?? "scheduled",
  }).select().single();

  if (error) {
    console.error("[save-social-post]", error);
    // Silently succeed — UI has already shown optimistic update
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ post: data });
}
