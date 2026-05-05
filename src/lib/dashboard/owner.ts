import { createClient } from "@/lib/supabase/server";

export type OwnerMetric = {
  totalJobs: number;
  activeJobs: number;
  totalClients: number;
  revenueThisMonth: number;
  overdueInvoices: number;
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
      .select("id, title, status, scheduled_date")
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
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const safeJobs = jobs ?? [];
  const safeClients = clients ?? [];
  const safeInvoices = invoices ?? [];

  const metrics: OwnerMetric = {
    totalJobs: jobsCount ?? 0,
    activeJobs: safeJobs.filter((job) => !["completed", "cancelled"].includes(job.status ?? "")).length,
    totalClients: safeClients.length,
    revenueThisMonth: safeInvoices
      .filter((invoice) => {
        const paidAt = invoice.due_date ? new Date(invoice.due_date) : null;
        return (
          invoice.status === "paid" &&
          paidAt &&
          paidAt.getMonth() === currentMonth &&
          paidAt.getFullYear() === currentYear
        );
      })
      .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0),
    overdueInvoices: safeInvoices.filter((invoice) => {
      if (!invoice.due_date) return false;
      return invoice.status !== "paid" && new Date(invoice.due_date) < now;
    }).length
  };

  return {
    metrics,
    recentJobs: safeJobs,
    recentInvoices: safeInvoices.slice(0, 5)
  };
}


