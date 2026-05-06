import { createClient } from "@/lib/supabase/server";
import { excludeDemoFinancial, filterDemoEntities } from "@/lib/demo/visibility";

export type OwnerMetric = {
  revenueThisMonth: number;
  outstandingAmount: number;
  jobsCompletedThisWeek: number;
  activeClientsCount: number;
};

export type DashboardActivityItem = {
  id: string;
  kind: "job" | "client" | "invoice" | "quote";
  label: string;
  at: string;
};

export type GlanceJobRow = {
  id: string;
  title: string | null;
  scheduled_date: string | null;
  scheduled_start: string | null;
  status: string | null;
  client_name: string | null;
};

function toLocalDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function bucketJobStatus(status: string | null): "pending" | "in_progress" | "completed" | "cancelled" {
  const k = (status ?? "").toLowerCase().replace("-", "_");
  if (k === "completed" || k === "complete") return "completed";
  if (k === "in_progress") return "in_progress";
  if (k === "cancelled") return "cancelled";
  return "pending";
}

export async function getOwnerContext() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { user: null, businessName: "SERVLO Business" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, trial_start, trial_end, subscription_tier, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  let trialEnd = profile?.trial_end ?? null;
  if (!trialEnd) {
    if (profile?.trial_start) {
      const fallback = new Date(profile.trial_start);
      fallback.setDate(fallback.getDate() + 30);
      trialEnd = fallback.toISOString();
    } else if ((profile?.subscription_status ?? "trialing") === "trialing") {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 30);
      trialEnd = fallback.toISOString();
    }
  }

  return {
    user,
    businessName: profile?.business_name ?? "SERVLO Business",
    trialEnd,
    subscriptionTier: profile?.subscription_tier ?? "solo"
  };
}

export async function getOwnerDashboardData(ownerId: string) {
  const supabase = await createClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    { data: clients },
    { data: invoices },
    { data: allJobs },
    { data: unpaidInvoices },
    { data: quotes },
    { data: paidInvoicesWeek },
    { data: recentJobsActivity },
    { data: recentClientsActivity },
    { data: recentInvoicesActivity },
    { data: recentQuotesActivity }
  ] = await Promise.all([
    supabase.from("clients").select("id, status, is_demo").eq("owner_id", ownerId),
    supabase
      .from("invoices")
      .select(
        "id, invoice_number, amount, due_date, status, client_id, is_demo, clients:clients(full_name), created_at, last_reminder_sent"
      )
      .eq("owner_id", ownerId)
      .order("due_date", { ascending: true }),
    supabase
      .from("jobs")
      .select(
        "id, title, status, scheduled_date, scheduled_start, client_name, is_demo, clients:clients(full_name)"
      )
      .eq("owner_id", ownerId),
    supabase
      .from("invoices")
      .select("id, invoice_number, amount, due_date, status, client_id, is_demo, clients:clients(full_name), last_reminder_sent")
      .eq("owner_id", ownerId)
      .eq("status", "unpaid")
      .order("due_date", { ascending: true }),
    supabase
      .from("quotes")
      .select("id, quote_number, status, created_at, client_name, is_demo, clients:clients(full_name), last_reminder_sent")
      .eq("owner_id", ownerId)
      .neq("status", "accepted")
      .order("created_at", { ascending: true }),
    supabase
      .from("invoices")
      .select("amount, created_at, is_demo")
      .eq("owner_id", ownerId)
      .eq("status", "paid")
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabase
      .from("jobs")
      .select("id, title, created_at, is_demo")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("clients")
      .select("id, full_name, created_at, is_demo")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("invoices")
      .select("id, invoice_number, created_at, is_demo")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("quotes")
      .select("id, quote_number, created_at, is_demo")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(8)
  ]);

  const now = new Date();
  const weekStart = new Date(now);
  const day = weekStart.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const safeClients = clients ?? [];
  const safeInvoices = invoices ?? [];
  const safeAllJobs = (allJobs ?? []).map((job: any) => ({
    ...job,
    client_name: job.client_name ?? job.clients?.full_name ?? null
  }));
  const safeUnpaid = unpaidInvoices ?? [];
  const safeQuotes = quotes ?? [];

  const visibleClients = filterDemoEntities(safeClients as Array<{ is_demo?: boolean | null }>);
  const visibleJobs = filterDemoEntities(safeAllJobs as Array<{ is_demo?: boolean | null }>);
  const invoicesMoney = excludeDemoFinancial(safeInvoices);
  const paidWeekMoney = excludeDemoFinancial(paidInvoicesWeek ?? []);

  const jobNonDemoCount = safeAllJobs.filter((j: any) => !j.is_demo).length;
  const clientNonDemoCount = safeClients.filter((c: any) => !c.is_demo).length;
  const invoiceNonDemoCount = safeInvoices.filter((inv: any) => !inv.is_demo).length;
  const quoteNonDemoCount = safeQuotes.filter((q: any) => !q.is_demo).length;

  const recentJobs = [...visibleJobs]
    .sort((a: any, b: any) => String(b.scheduled_date ?? "").localeCompare(String(a.scheduled_date ?? "")))
    .slice(0, 5)
    .map((job: any) => ({
      id: job.id,
      title: job.title ?? null,
      status: job.status ?? null,
      scheduled_date: job.scheduled_date ?? null,
      client_name: job.client_name ?? job.clients?.full_name ?? null
    }));

  const todayKey = toLocalDateKey(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toLocalDateKey(tomorrow);

  const glanceToday: GlanceJobRow[] = [];
  const glanceTomorrow: GlanceJobRow[] = [];
  for (const job of visibleJobs as any[]) {
    const row: GlanceJobRow = {
      id: job.id,
      title: job.title ?? null,
      scheduled_date: job.scheduled_date ?? null,
      scheduled_start: job.scheduled_start ?? null,
      status: job.status ?? null,
      client_name: job.client_name ?? job.clients?.full_name ?? null
    };
    const d = job.scheduled_date ? String(job.scheduled_date).slice(0, 10) : "";
    if (d === todayKey) glanceToday.push(row);
    else if (d === tomorrowKey) glanceTomorrow.push(row);
  }
  const sortByStart = (a: GlanceJobRow, b: GlanceJobRow) =>
    String(a.scheduled_start ?? "").localeCompare(String(b.scheduled_start ?? ""));
  glanceToday.sort(sortByStart);
  glanceTomorrow.sort(sortByStart);

  const jobsByStatus = { pending: 0, inProgress: 0, completed: 0 };
  for (const job of visibleJobs as any[]) {
    const b = bucketJobStatus(job.status ?? null);
    if (b === "cancelled") continue;
    if (b === "completed") jobsByStatus.completed += 1;
    else if (b === "in_progress") jobsByStatus.inProgress += 1;
    else jobsByStatus.pending += 1;
  }

  const revenueByDay: number[] = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(sevenDaysAgo);
    day.setDate(sevenDaysAgo.getDate() + i);
    revenueByDay.push(0);
    const key = toLocalDateKey(day);
    for (const inv of paidWeekMoney) {
      if (!inv.created_at) continue;
      const invKey = String(inv.created_at).slice(0, 10);
      if (invKey === key) {
        revenueByDay[i] += Number(inv.amount ?? 0);
      }
    }
  }

  const activityCandidates: DashboardActivityItem[] = [];
  for (const j of recentJobsActivity ?? []) {
    if (!j.created_at) continue;
    if ((j as { is_demo?: boolean }).is_demo && jobNonDemoCount > 0) continue;
    activityCandidates.push({
      id: `job-${j.id}`,
      kind: "job",
      label: `Job created: ${j.title ?? "Untitled"}`,
      at: j.created_at
    });
  }
  for (const c of recentClientsActivity ?? []) {
    if (!c.created_at) continue;
    if ((c as { is_demo?: boolean }).is_demo && clientNonDemoCount > 0) continue;
    activityCandidates.push({
      id: `client-${c.id}`,
      kind: "client",
      label: `Client added: ${c.full_name ?? "New client"}`,
      at: c.created_at
    });
  }
  for (const inv of recentInvoicesActivity ?? []) {
    if (!inv.created_at) continue;
    if ((inv as { is_demo?: boolean }).is_demo && invoiceNonDemoCount > 0) continue;
    activityCandidates.push({
      id: `invoice-${inv.id}`,
      kind: "invoice",
      label: `Invoice ${inv.invoice_number ?? inv.id} added`,
      at: inv.created_at
    });
  }
  for (const q of recentQuotesActivity ?? []) {
    if (!q.created_at) continue;
    if ((q as { is_demo?: boolean }).is_demo && quoteNonDemoCount > 0) continue;
    activityCandidates.push({
      id: `quote-${q.id}`,
      kind: "quote",
      label: `Quote ${q.quote_number ?? q.id} added`,
      at: q.created_at
    });
  }
  activityCandidates.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const recentActivity = activityCandidates.slice(0, 5);

  const metrics: OwnerMetric = {
    revenueThisMonth: invoicesMoney
      .filter((invoice) => {
        if ((invoice.status ?? "").toLowerCase() !== "paid") return false;
        if (!invoice.created_at) return false;
        const date = new Date(invoice.created_at);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0),
    outstandingAmount: invoicesMoney
      .filter((invoice) => (invoice.status ?? "").toLowerCase() === "unpaid")
      .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0),
    jobsCompletedThisWeek: (visibleJobs as any[]).filter((job) => {
      if ((job.status ?? "").toLowerCase() !== "completed") return false;
      if (!job.scheduled_date) return false;
      const date = new Date(job.scheduled_date);
      return date >= weekStart && date < weekEnd;
    }).length,
    activeClientsCount: visibleClients.filter((client: any) => (client.status ?? "active") !== "inactive").length
  };

  const topClientsMap = new Map<string, { client_name: string; total: number }>();
  for (const invoice of invoicesMoney) {
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

  const chaseInvoices = excludeDemoFinancial(safeUnpaid as Array<{ is_demo?: boolean | null }>).map((invoice: any) => ({
    ...invoice,
    client_name: invoice.client_name ?? invoice.clients?.full_name ?? "Unknown client"
  }));
  const quotesFollowUp = excludeDemoFinancial(safeQuotes as Array<{ is_demo?: boolean | null }>)
    .filter((quote: any) => {
      if (!quote.created_at) return false;
      const ageDays = Math.floor((Date.now() - new Date(quote.created_at).getTime()) / (1000 * 60 * 60 * 24));
      return ageDays >= 3;
    })
    .map((quote: any) => ({
      ...quote,
      client_name: quote.client_name ?? quote.clients?.full_name ?? "Unknown client"
    }));

  const visibleInvoicesList = filterDemoEntities(safeInvoices as Array<{ is_demo?: boolean | null }>);

  return {
    metrics,
    recentJobs,
    recentInvoices: visibleInvoicesList.slice(0, 5),
    topClients,
    chaseInvoices,
    quotesFollowUp,
    revenueLast7Days: revenueByDay,
    glanceToday,
    glanceTomorrow,
    jobsByStatus,
    recentActivity
  };
}


