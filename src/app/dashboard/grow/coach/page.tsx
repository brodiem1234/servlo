import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import CoachClient, { type BusinessContext } from "./coach-client";

export default async function AiCoachPage() {
  const { user, supabase } = await requireOwnerWorkspaceFeatures();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [bizRes, jobsRes, invoicesRes, reviewsRes] = await Promise.allSettled([
    supabase
      .from("businesses")
      .select("business_name, suburb, state, phone")
      .eq("owner_id", user.id)
      .maybeSingle(),
    supabase
      .from("jobs")
      .select("job_type, created_at, materials_cost, labour_hours, hourly_rate, revenue")
      .eq("owner_id", user.id)
      .gte("created_at", monthStart)
      .is("deleted_at", null),
    supabase
      .from("invoices")
      .select("total, status")
      .eq("owner_id", user.id)
      .neq("status", "paid")
      .is("deleted_at", null),
    supabase
      .from("grow_reviews")
      .select("rating")
      .eq("owner_id", user.id),
  ]);

  const biz = bizRes.status === "fulfilled" ? bizRes.value.data : null;
  const jobs = jobsRes.status === "fulfilled" ? (jobsRes.value.data ?? []) : [];
  const invoices = invoicesRes.status === "fulfilled" ? (invoicesRes.value.data ?? []) : [];
  const reviews = reviewsRes.status === "fulfilled" ? (reviewsRes.value.data ?? []) : [];

  const jobsThisMonth = jobs.length;
  const totalRevenue = jobs.reduce((s, j) => {
    const jobRev = Number(j.revenue ?? 0);
    if (jobRev > 0) return s + jobRev;
    return s + Number(j.materials_cost ?? 0) + Number(j.labour_hours ?? 0) * Number(j.hourly_rate ?? 0);
  }, 0);
  const unpaidInvoices = invoices.reduce((s, i) => s + Number(i.total ?? 0), 0);
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0
    ? reviews.reduce((s, r) => s + Number(r.rating ?? 0), 0) / reviewCount
    : null;

  // Top service type
  const typeCounts = new Map<string, number>();
  for (const j of jobs) {
    const t = j.job_type ?? "General";
    typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
  }
  const topServiceType = typeCounts.size > 0
    ? [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
    : null;

  const ctx: BusinessContext = {
    businessName: biz?.business_name ?? "your business",
    suburb: biz?.suburb ?? "your area",
    state: biz?.state ?? "Australia",
    phone: biz?.phone ?? null,
    jobsThisMonth,
    totalRevenue,
    unpaidInvoices,
    reviewCount,
    avgRating,
    topServiceType,
  };

  return (
    <>
      <title>SERVLO GROW — AI Marketing Coach</title>
      <CoachClient ctx={ctx} />
    </>
  );
}
