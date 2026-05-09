import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReviewHubManager from "./review-hub-manager";

export const dynamic = "force-dynamic";

export default async function ReviewHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let reviews: any[] = [];

  try {
    const { data, error } = await supabase
      .from("grow_review_responses")
      .select(
        "id, platform, reviewer, rating, review_text, response, responded_at, review_date, external_id, created_at"
      )
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .order("review_date", { ascending: false })
      .limit(50);

    if (error && error.code !== "42P01") throw error;
    reviews = data ?? [];
  } catch {
    reviews = [];
  }

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? reviews.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) /
        totalReviews
      : 0;
  const respondedCount = reviews.filter(
    (r: any) => r.response && r.response.trim() !== ""
  ).length;
  const pendingCount = reviews.filter(
    (r: any) => !r.response || r.response.trim() === ""
  ).length;

  const stats = {
    totalReviews,
    avgRating: Math.round(avgRating * 10) / 10,
    respondedCount,
    pendingCount,
  };

  return <ReviewHubManager reviews={reviews} stats={stats} />;
}
