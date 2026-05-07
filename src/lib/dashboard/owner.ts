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
  isDemo?: boolean;
};

export type GlanceJobRow = {
  id: string;
  title: string | null;
  scheduled_date: string | null;
  scheduled_start: string | null;
  status: string | null;
  client_name: string | null;
  is_demo?: boolean | null;
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

function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const trimmed = value.slice(0, 5);
  const [hours, minutes] = trimmed.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function jobScheduledHours(job: {
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  labour_hours?: number | null;
}): number {
  const a = parseTimeToMinutes(job.scheduled_start ?? null);
  const b = parseTimeToMinutes(job.scheduled_end ?? null);
  if (a != null && b != null && b > a) return (b - a) / 60;
  const lh = Number(job.labour_hours ?? 0);
  if (Number.isFinite(lh) && lh > 0) return lh;
  return 0;
}

function invoiceBucket(invoice: {
  status?: string | null;
  due_date?: string | null;
}): "draft" | "unpaid" | "overdue" | "paid" {
  const status = (invoice.status ?? "").toLowerCase();
  if (status === "paid") return "paid";
  const overdue =
    status !== "paid" &&
    Boolean(invoice.due_date) &&
    new Date(invoice.due_date as string).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
  if (overdue) return "overdue";
  if (status === "draft") return "draft";
  return "unpaid";
}

function quoteBucket(statusRaw: string | null | undefined): "draft" | "awaiting" | "accepted" | "declined" {
  const s = (statusRaw ?? "").toLowerCase();
  if (s === "draft") return "draft";
  if (s === "accepted") return "accepted";
  if (s === "declined" || s === "rejected") return "declined";
  return "awaiting";
}

export async function getOwnerContext() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { user: null, businessName: "SERVLO Core" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_start, trial_end, subscription_tier, subscription_status")
    .eq("id", user.id)
    .maybeSingle();
  const { data: businessRow } = await supabase
    .from("businesses")
    .select("business_name")
    .eq("owner_id", user.id)
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
    businessName: businessRow?.business_name ?? "SERVLO Core",
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
    { data: recentQuotesActivity },
    { count: employeeHeadcount }
  ] = await Promise.all([
    supabase.from("clients").select("id, full_name, status, is_demo").eq("owner_id", ownerId),
    supabase
      .from("invoices")
      .select("id, invoice_number, total, due_date, status, client_id, is_demo, created_at, last_reminder_sent")
      .eq("owner_id", ownerId)
      .order("due_date", { ascending: true }),
    supabase
      .from("jobs")
      .select("id, title, status, scheduled_date, scheduled_start, scheduled_end, address, suburb, state, labour_hours, client_id, is_demo")
      .eq("owner_id", ownerId),
    supabase
      .from("invoices")
      .select("id, invoice_number, total, due_date, status, client_id, is_demo, last_reminder_sent")
      .eq("owner_id", ownerId)
      .eq("status", "unpaid")
      .order("due_date", { ascending: true }),
    supabase
      .from("quotes")
      .select("id, quote_number, status, created_at, total, client_id, is_demo, last_reminder_sent")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: true }),
    supabase
      .from("invoices")
      .select("total, created_at, is_demo")
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
      .limit(8),
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("owner_id", ownerId)
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
  const clientNameById = new Map(
    (safeClients as Array<{ id: string; full_name?: string | null }>).map((c) => [c.id, c.full_name ?? null])
  );
  const safeInvoices = (invoices ?? []).map((invoice: any) => ({
    ...invoice,
    client_name: invoice.client_id ? clientNameById.get(invoice.client_id) ?? "Unknown client" : "Unknown client"
  }));
  const safeAllJobs = (allJobs ?? []).map((job: any) => ({
    ...job,
    client_name: job.client_id ? clientNameById.get(job.client_id) ?? null : null
  }));
  const safeUnpaid = (unpaidInvoices ?? []).map((invoice: any) => ({
    ...invoice,
    client_name: invoice.client_id ? clientNameById.get(invoice.client_id) ?? "Unknown client" : "Unknown client"
  }));
  const safeQuotes = (quotes ?? []).map((quote: any) => ({
    ...quote,
    client_name: quote.client_id ? clientNameById.get(quote.client_id) ?? "Unknown client" : "Unknown client"
  }));

  const visibleClients = filterDemoEntities(safeClients as Array<{ is_demo?: boolean | null }>);
  const visibleJobs = filterDemoEntities(safeAllJobs as Array<{ is_demo?: boolean | null }>);
  const invoicesMoney = excludeDemoFinancial(safeInvoices);
  const paidWeekMoney = excludeDemoFinancial(paidInvoicesWeek ?? []);

  const recentJobs = [...visibleJobs]
    .sort((a: any, b: any) => String(b.scheduled_date ?? "").localeCompare(String(a.scheduled_date ?? "")))
    .slice(0, 5)
    .map((job: any) => ({
      id: job.id,
      title: job.title ?? null,
      status: job.status ?? null,
      scheduled_date: job.scheduled_date ?? null,
      client_name: job.client_name ?? job.clients?.full_name ?? null,
      is_demo: job.is_demo ?? null
    }));

  const todayKey = toLocalDateKey(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toLocalDateKey(tomorrow);

  const glanceToday: GlanceJobRow[] = [];
  const glanceTomorrow: GlanceJobRow[] = [];
  let jobsTodayHoursTotal = 0;
  let jobsTomorrowHoursTotal = 0;
  const mapJobsToday: Array<{ id: string; title: string | null; addressLine: string }> = [];

  for (const job of visibleJobs as any[]) {
    const row: GlanceJobRow = {
      id: job.id,
      title: job.title ?? null,
      scheduled_date: job.scheduled_date ?? null,
      scheduled_start: job.scheduled_start ?? null,
      status: job.status ?? null,
      client_name: job.client_name ?? job.clients?.full_name ?? null,
      is_demo: job.is_demo ?? null
    };
    const d = job.scheduled_date ? String(job.scheduled_date).slice(0, 10) : "";
    const hrs = jobScheduledHours(job);
    if (d === todayKey) {
      glanceToday.push(row);
      jobsTodayHoursTotal += hrs;
      const parts = [job.address, job.suburb, job.state].filter(Boolean);
      mapJobsToday.push({
        id: job.id,
        title: job.title ?? null,
        addressLine: parts.length ? parts.join(", ") : (job.address ?? job.suburb ?? "Address pending")
      });
    } else if (d === tomorrowKey) {
      glanceTomorrow.push(row);
      jobsTomorrowHoursTotal += hrs;
    }
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
        revenueByDay[i] += Number(inv.total ?? 0);
      }
    }
  }

  const activityCandidates: DashboardActivityItem[] = [];
  for (const j of recentJobsActivity ?? []) {
    if (!j.created_at) continue;
    activityCandidates.push({
      id: `job-${j.id}`,
      kind: "job",
      label: `Job created: ${j.title ?? "Untitled"}`,
      at: j.created_at,
      isDemo: Boolean((j as { is_demo?: boolean }).is_demo)
    });
  }
  for (const c of recentClientsActivity ?? []) {
    if (!c.created_at) continue;
    activityCandidates.push({
      id: `client-${c.id}`,
      kind: "client",
      label: `Client added: ${c.full_name ?? "New client"}`,
      at: c.created_at,
      isDemo: Boolean((c as { is_demo?: boolean }).is_demo)
    });
  }
  for (const inv of recentInvoicesActivity ?? []) {
    if (!inv.created_at) continue;
    activityCandidates.push({
      id: `invoice-${inv.id}`,
      kind: "invoice",
      label: `Invoice ${inv.invoice_number ?? inv.id} added`,
      at: inv.created_at,
      isDemo: Boolean((inv as { is_demo?: boolean }).is_demo)
    });
  }
  for (const q of recentQuotesActivity ?? []) {
    if (!q.created_at) continue;
    activityCandidates.push({
      id: `quote-${q.id}`,
      kind: "quote",
      label: `Quote ${q.quote_number ?? q.id} added`,
      at: q.created_at,
      isDemo: Boolean((q as { is_demo?: boolean }).is_demo)
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
      .reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0),
    outstandingAmount: invoicesMoney
      .filter((invoice) => (invoice.status ?? "").toLowerCase() === "unpaid")
      .reduce((sum, invoice) => sum + Number(invoice.total ?? 0), 0),
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
      client_name: (invoice as any).client_name ?? "Unknown client",
      total: 0
    };
    current.total += Number(invoice.total ?? 0);
    topClientsMap.set(id, current);
  }
  const topClients = Array.from(topClientsMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const chaseInvoices = excludeDemoFinancial(safeUnpaid as Array<{ is_demo?: boolean | null }>).map((invoice: any) => ({
    ...invoice,
    client_name: invoice.client_name ?? "Unknown client"
  }));

  const invoiceStatusCounts = { draft: 0, unpaid: 0, overdue: 0, paid: 0 };
  for (const invoice of invoicesMoney) {
    invoiceStatusCounts[invoiceBucket(invoice)] += 1;
  }

  const quotesMoney = excludeDemoFinancial(safeQuotes as Array<{ is_demo?: boolean | null }>);
  const quoteStatusCounts = { draft: 0, awaiting: 0, accepted: 0, declined: 0 };
  for (const quote of quotesMoney as Array<{ status?: string | null }>) {
    quoteStatusCounts[quoteBucket(quote.status)] += 1;
  }

  const pipelineAwaitingValue = (quotesMoney as Array<{ status?: string | null; total?: number | null }>).reduce(
    (sum, quote) => (quoteBucket(quote.status) === "awaiting" ? sum + Number(quote.total ?? 0) : sum),
    0
  );

  const jobsScheduledThisWeek = (visibleJobs as Array<{ scheduled_date?: string | null }>).filter((job) => {
    if (!job.scheduled_date) return false;
    const date = new Date(job.scheduled_date);
    return date >= weekStart && date < weekEnd;
  }).length;

  const quotesFollowUp = quotesMoney
    .filter((quote: any) => {
      const st = (quote.status ?? "").toLowerCase();
      if (st !== "sent" && st !== "pending") return false;
      const ref = quote.created_at;
      if (!ref) return false;
      const ageDays = Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24));
      return ageDays >= 3;
    })
    .map((quote: any) => {
      const ref = quote.created_at;
      const ageDays = ref ? Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      return {
        ...quote,
        client_name: quote.client_name ?? "Unknown client",
        quote_amount: Number(quote.total ?? 0),
        days_waiting: ageDays
      };
    });

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
    recentActivity,
    invoiceStatusCounts,
    quoteStatusCounts,
    jobsTodayStat: { count: glanceToday.length, hours: jobsTodayHoursTotal },
    jobsTomorrowStat: { count: glanceTomorrow.length, hours: jobsTomorrowHoursTotal },
    mapJobsToday,
    onboardingCounts: {
      clients: visibleClients.length,
      jobs: visibleJobs.length,
      quotes: quotesMoney.length,
      invoices: invoicesMoney.length,
      employees: typeof employeeHeadcount === "number" ? employeeHeadcount : 0
    },
    pipelineAwaitingValue,
    jobsScheduledThisWeek
  };
}


