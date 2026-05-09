export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SocialCalendarManager from "./social-calendar-manager";

export interface SocialPost {
  id: string;
  platform: string;
  caption: string;
  image_url: string | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  like_count: number | null;
  comment_count: number | null;
  reach: number | null;
  created_at: string;
}

export interface SocialStats {
  totalPosts: number;
  scheduledCount: number;
  publishedCount: number;
  totalReach: number;
}

export default async function SocialCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  let posts: SocialPost[] = [];

  const { data, error } = await supabase
    .from("grow_social_posts")
    .select(
      "id, platform, caption, image_url, status, scheduled_at, published_at, like_count, comment_count, reach, created_at"
    )
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: false })
    .limit(100);

  if (error) {
    if ((error as { code?: string }).code !== "42P01") {
      console.error("grow_social_posts fetch error:", error.message);
    }
  } else {
    posts = data ?? [];
  }

  const publishedPosts = posts.filter((p) => p.status === "published");
  const stats: SocialStats = {
    totalPosts: posts.length,
    scheduledCount: posts.filter((p) => p.status === "scheduled").length,
    publishedCount: publishedPosts.length,
    totalReach: publishedPosts.reduce((sum, p) => sum + (p.reach ?? 0), 0),
  };

  return <SocialCalendarManager posts={posts} stats={stats} />;
}
