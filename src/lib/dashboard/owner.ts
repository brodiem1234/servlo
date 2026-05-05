import { createClient } from "@/lib/supabase/server";

export type OwnerMetric = {
  revenueThisMonth: number;
  outstandingAmount: number;
  jobsCompletedThisWeek: number;
  activeClientsCount: number;
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

  const [{ data: jobs }, { data: clients }, { data: invoices }, { data: allJobs }, { data: unpaidInvoices }, { data: quotes }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, status, scheduled_date, client_name, clients:clients(full_name)")
      .eq("owner_id", ownerId)
      .order("scheduled_date", { ascending: false })
      .limit(5),
    supabase
      .from("clients")
      .select("id, status")
      .eq("owner_id", ownerId),
    supabase
      .from("invoices")
      .select("id, invoice_number, amount, due_date, status, client_id, clients:clients(full_name), created_at, last_reminder_sent")
      .eq("owner_id", ownerId)
      .order("due_date", { ascending: true }),
    supabase
      .from("jobs")
      .select("id, status, scheduled_date")
      .eq("owner_id", ownerId),
    supabase
      .from("invoices")
      .select("id, invoice_number, amount, due_date, status, client_id, clients:clients(full_name), last_reminder_sent")
      .eq("owner_id", ownerId)
      .eq("status", "unpaid")
      .order("due_date", { ascending: true }),
    supabase
      .from("quotes")
      .select("id, quote_number, status, created_at, client_name, clients:clients(full_name), last_reminder_sent")
      .eq("owner_id", ownerId)
      .neq("status", "accepted")
      .order("created_at", { ascending: true })
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
  const safeAllJobs = allJobs ?? [];
  const safeUnpaid = unpaidInvoices ?? [];
  const safeQuotes = quotes ?? [];

  const metrics: OwnerMetric = {
    revenueThisMonth: safeInvoices
      .filter((invoice) => {
        if ((invoice.status ?? "").toLowerCase() !== "paid") return false;
        if (!invoice.created_at) return false;
        const date = new Date(invoice.created_at);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0),
    outstandingAmount: safeInvoices
      .filter((invoice) => (invoice.status ?? "").toLowerCase() === "unpaid")
      .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0),
    jobsCompletedThisWeek: safeAllJobs.filter((job) => {
      if ((job.status ?? "").toLowerCase() !== "completed") return false;
      if (!job.scheduled_date) return false;
      const date = new Date(job.scheduled_date);
      return date >= weekStart && date < weekEnd;
    }).length,
    activeClientsCount: safeClients.filter((client) => (client.status ?? "active") !== "inactive").length
  };

  const topClientsMap = new Map<string, { client_name: string; total: number }>();
  for (const invoice of safeInvoices) {
    const id = invoice.client_id ?? "unknown";
    const current = topClientsMap.get(id) ?? {
      client_name: (invoice as any).client_name ?? (invoice as any).clients?.full_name ?? "Unknown client",
      total: 0
    };
    current.total += Number(invoice.amount ?? 0);
    topClientsMap.set(id, current);
  }
  const topClients = Array.from(topClientsMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const chaseInvoices = safeUnpaid.map((invoice: any) => ({
    ...invoice,
    client_name: invoice.client_name ?? invoice.clients?.full_name ?? "Unknown client"
  }));
  const quotesFollowUp = safeQuotes
    .filter((quote: any) => {
      if (!quote.created_at) return false;
      const ageDays = Math.floor((Date.now() - new Date(quote.created_at).getTime()) / (1000 * 60 * 60 * 24));
      return ageDays >= 3;
    })
    .map((quote: any) => ({
      ...quote,
      client_name: quote.client_name ?? quote.clients?.full_name ?? "Unknown client"
    }));

  return {
    metrics,
    recentJobs: safeJobs,
    recentInvoices: safeInvoices.slice(0, 5),
    topClients,
    chaseInvoices,
    quotesFollowUp
  };
}


