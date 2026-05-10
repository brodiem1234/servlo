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

  // Auto-seed 5 realistic demo reviews if none exist
  if (reviews.length === 0) {
    try {
      const demoReviews = [
        {
          owner_id: user.id,
          platform: "google",
          reviewer: "Sarah Mitchell",
          rating: 5,
          review_text:
            "Absolutely fantastic service! The team arrived on time, were incredibly professional, and did a spotless job. Will definitely be using them again and recommending to all my friends.",
          response: null,
          review_date: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          owner_id: user.id,
          platform: "google",
          reviewer: "James O'Brien",
          rating: 4,
          review_text:
            "Great work overall. Very happy with the result. Minor scheduling hiccup at the start but they communicated well and sorted it quickly. Good value for money.",
          response: null,
          review_date: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          owner_id: user.id,
          platform: "google",
          reviewer: "Amanda Nguyen",
          rating: 5,
          review_text:
            "These guys are the best! Super friendly, tidy and efficient. Fixed our problem in half the time quoted. Honestly couldn't be happier. 10/10 would recommend.",
          response: null,
          review_date: new Date(
            Date.now() - 9 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          owner_id: user.id,
          platform: "google",
          reviewer: "Tom Callahan",
          rating: 3,
          review_text:
            "Service was decent but took longer than expected. The end result was fine and the team were polite. Would consider using again but hoped for a bit more efficiency.",
          response: null,
          review_date: new Date(
            Date.now() - 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          owner_id: user.id,
          platform: "google",
          reviewer: "Rebecca Tan",
          rating: 5,
          review_text:
            "Outstanding! Responded to my urgent call within an hour and had everything sorted before dinner. The price was very reasonable for the quality of work. Highly recommend.",
          response: null,
          review_date: new Date(
            Date.now() - 18 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ];

      const { data: seeded } = await supabase
        .from("grow_review_responses")
        .insert(demoReviews)
        .select(
          "id, platform, reviewer, rating, review_text, response, responded_at, review_date, external_id, created_at"
        );

      reviews = seeded ?? [];
    } catch {
      // table or column missing — leave reviews empty
    }
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
