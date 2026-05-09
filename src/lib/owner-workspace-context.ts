import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isIndustrySlug, type IndustrySlug } from "@/lib/industries";
import { loadWorkspaceFeatureSet, type WorkspaceFeatureId } from "@/lib/workspace-features";
import type { User } from "@supabase/supabase-js";

export async function requireOwnerWorkspaceFeatures(): Promise<{
  user: User;
  enabled: ReadonlySet<WorkspaceFeatureId>;
  supabase: Awaited<ReturnType<typeof createClient>>;
}> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, industry_tags")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role && profile.role !== "owner") {
    redirect("/dashboard/owner");
  }

  const tags = Array.isArray((profile as { industry_tags?: unknown } | null)?.industry_tags)
    ? ((profile as { industry_tags: string[] }).industry_tags ?? []).filter((t): t is IndustrySlug => isIndustrySlug(t))
    : [];

  const enabled = await loadWorkspaceFeatureSet(supabase, user.id, tags);
  return { user, enabled, supabase };
}
