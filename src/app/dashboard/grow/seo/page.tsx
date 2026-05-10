import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LocalSeoManager } from "./local-seo-manager";

export const dynamic = "force-dynamic";

export default async function GrowSeoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: business }, { data: profile }, reviewCountRes, clientCountRes] = await Promise.all([
    supabase.from("businesses")
      .select("business_name, abn, address, suburb, state, postcode, phone, email, industries, accent_colour")
      .eq("owner_id", user.id)
      .maybeSingle(),
    supabase.from("profiles")
      .select("industry_tags")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("grow_review_responses")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .is("deleted_at", null),
    supabase.from("clients")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .is("deleted_at", null),
  ]);

  const reviewCount = reviewCountRes.count ?? 0;
  const clientCount = clientCountRes.count ?? 0;

  // Compute an SEO score based on real data
  let score = 30; // baseline
  if (business?.business_name) score += 10;
  if (business?.phone) score += 10;
  if (business?.address && business?.suburb) score += 10;
  if (business?.abn) score += 5;
  if (reviewCount > 0) score += 15;
  if (reviewCount >= 5) score += 10;
  if (clientCount > 10) score += 5;
  if (business?.email) score += 5;
  score = Math.min(100, score);

  const industries = (business?.industries as string[] | null) ?? (profile?.industry_tags as string[] | null) ?? [];
  const suburb = business?.suburb ?? "";
  const state = business?.state ?? "";
  const industryLabel = industries[0] ?? "service business";

  return (
    <LocalSeoManager
      business={{
        name: business?.business_name ?? null,
        phone: business?.phone ?? null,
        address: business?.address ?? null,
        suburb,
        state,
        postcode: business?.postcode ?? null,
        email: business?.email ?? null,
        abn: business?.abn ?? null,
      }}
      industryLabel={industryLabel}
      seoScore={score}
      reviewCount={reviewCount}
      clientCount={clientCount}
    />
  );
}
