import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReviewHubClient from "./review-hub-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SERVLO Grow — Google Reviews",
};

export default async function GrowReviewsPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: savedResponses }, { data: business }] = await Promise.all([
    sb
      .from("grow_review_responses")
      .select("id, reviewer_name, rating, review_text, response_draft, response_status, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    sb
      .from("businesses")
      .select("business_name")
      .eq("owner_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <ReviewHubClient
      savedResponses={savedResponses ?? []}
      businessName={business?.business_name ?? "Your Business"}
    />
  );
}
