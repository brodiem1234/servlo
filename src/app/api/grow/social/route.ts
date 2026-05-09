import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data, error } = await supabase
    .from("grow_social_posts")
    .select("id, platform, caption, image_url, status, scheduled_at, published_at, like_count, comment_count, reach, created_at")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: false });
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ posts: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await req.json().catch(() => ({})) as {
    platform?: string;
    caption?: string;
    image_url?: string | null;
    scheduled_at?: string | null;
  };
  const { platform, caption, image_url, scheduled_at } = body;
  if (!caption?.trim()) return NextResponse.json({ error: "Caption required" }, { status: 400 });
  if (!platform) return NextResponse.json({ error: "Platform required" }, { status: 400 });
  const status = scheduled_at ? "scheduled" : "draft";
  const { data, error } = await supabase
    .from("grow_social_posts")
    .insert({
      owner_id: user.id,
      platform,
      caption: caption.trim(),
      image_url: image_url || null,
      scheduled_at: scheduled_at || null,
      status,
    })
    .select("id, platform, caption, image_url, status, scheduled_at, published_at, like_count, comment_count, reach, created_at")
    .single();
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Table not ready. Apply migrations." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ post: data }, { status: 201 });
}
