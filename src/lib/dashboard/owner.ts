import { createClient } from "@/lib/supabase/server";

export type OwnerMetric = {
  totalJobs: number;
  scheduledThisWeek: number;
  totalClients: number;
  totalInvoicedAmount: number;
  outstandingAmount: number;
};

export async function getOwnerContext() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { user: null, businessName: "SERVLO Business" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, trial_end, subscription_tier")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    businessName: profile?.business_name ?? "SERVLO Business",
    trialEnd: profile?.trial_end ?? null,
    subscriptionTier: profile?.subscription_tier ?? "solo"
  };
}

export async function getOwnerDashboardData(ownerId: string) {
  const supabase = await createClient();

  const [{ data: jobs }, { count: jobsCount }, { data: clients }, { data: invoices }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, status, scheduled_date, client_name, clients:clients(full_name)")
      .eq("owner_id", ownerId)
      .order("scheduled_date", { ascending: false })
      .limit(5),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId),
    supabase
      .from("clients")
      .select("id")
      .eq("owner_id", ownerId),
    supabase
      .from("invoices")
      .select("id, invoice_number, amount, due_date, status")
      .eq("owner_id", ownerId)
      .order("due_date", { ascending: true })
  ]);

  const now = new Date();
  const weekStart = new Date(now);
  const day = weekStart.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const safeJobs = (jobs ?? []).map((job: any) => ({
    ...job,
    client_name: job.client_name ?? job.clients?.full_name ?? null
  }));
  const safeClients = clients ?? [];
  const safeInvoices = invoices ?? [];

  const { data: weekJobs } = await supabase
    .from("jobs")
    .select("id, scheduled_date")
    .eq("owner_id", ownerId)
    .gte("scheduled_date", weekStart.toISOString().slice(0, 10))
    .lt("scheduled_date", weekEnd.toISOString().slice(0, 10));

  const metrics: OwnerMetric = {
    totalJobs: jobsCount ?? 0,
    scheduledThisWeek: (weekJobs ?? []).filter((job) => Boolean(job.scheduled_date)).length,
    totalClients: safeClients.length,
    totalInvoicedAmount: safeInvoices.reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0),
    outstandingAmount: safeInvoices
      .filter((invoice) => (invoice.status ?? "").toLowerCase() === "unpaid")
      .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0)
  };

  return {
    metrics,
    recentJobs: safeJobs,
    recentInvoices: safeInvoices.slice(0, 5)
  };
}


