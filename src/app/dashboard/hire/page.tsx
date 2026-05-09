import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HireDashboard } from "./hire-dashboard";

export const dynamic = "force-dynamic";

async function fetchSafe<T>(
  fn: () => PromiseLike<{ data: T | null; error: { code?: string; message: string } | null }>
): Promise<T | null> {
  const { data, error } = await fn();
  if (error) {
    if (error.code === "42P01") return null;
    console.error("[hire] fetch error:", error.message);
    return null;
  }
  return data;
}

export default async function HirePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [postings, applications, onboardingTasks] = await Promise.all([
    fetchSafe(() =>
      supabase
        .from("job_postings")
        .select("id, title, employment_type, status, location, published_at, closes_at, created_at")
        .eq("owner_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
    ),
    fetchSafe(() =>
      supabase
        .from("job_applications")
        .select("id, posting_id, applicant_name, stage, applied_at, rating")
        .eq("owner_id", user.id)
        .is("deleted_at", null)
        .order("applied_at", { ascending: false })
    ),
    fetchSafe(() =>
      supabase
        .from("onboarding_tasks")
        .select("id, employee_id, task, category, completed, due_date")
        .eq("owner_id", user.id)
        .is("deleted_at", null)
        .order("due_date", { ascending: true })
    ),
  ]);

  const postingsList = (postings ?? []) as Record<string, unknown>[];
  const applicationsList = (applications ?? []) as Record<string, unknown>[];
  const onboardingList = (onboardingTasks ?? []) as Record<string, unknown>[];

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats = {
    activePostings: postingsList.filter((p) => p.status === "published").length,
    totalApplicants: applicationsList.length,
    newApplicants: applicationsList.filter((a) => {
      if (a.stage !== "applied") return false;
      const appliedAt = a.applied_at ? new Date(a.applied_at as string) : null;
      return appliedAt && appliedAt >= sevenDaysAgo;
    }).length,
    offersMade: applicationsList.filter((a) => a.stage === "offer").length,
  };

  return (
    <HireDashboard
      postings={postingsList}
      applications={applicationsList}
      onboardingTasks={onboardingList}
      stats={stats}
    />
  );
}
