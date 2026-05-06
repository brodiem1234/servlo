import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOwnerDashboardData } from "@/lib/dashboard/owner";
import { invoiceReminderEmailTemplate, quoteFollowUpEmailTemplate, sendEmail } from "@/lib/email";
import RevenueSparkline from "@/components/dashboard/revenue-sparkline";
import OwnerDashboardQuickActions from "@/components/dashboard/owner-dashboard-quick-actions";
import InvoiceQuoteStatusGrids from "@/components/dashboard/invoice-quote-status-grids";
import JobDayStatCards from "@/components/dashboard/job-day-stat-cards";
import GettingStartedRing from "@/components/dashboard/getting-started-ring";
import TodayJobsMapCollapsible from "@/components/dashboard/today-jobs-map-collapsible";
import { DemoBadge } from "@/components/demo-badge";
import {
  getGettingStartedChecklist,
  isIndustrySlug,
  ownerWelcomeLine,
  type IndustrySlug
} from "@/lib/industries";
import { computeTrialDaysRemaining } from "@/lib/trial-profile";
import { loadWorkspaceFeatureSet, schedulingEnabled } from "@/lib/workspace-features";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);
}

function getStatusBadgeClasses(status: string | null) {
  const key = (status ?? "").toLowerCase();
  if (key === "completed" || key === "complete") return "bg-green-100 text-green-700";
  if (key === "in_progress" || key === "in-progress") return "bg-orange-100 text-orange-700";
  if (key === "cancelled") return "bg-red-100 text-red-700";
  return "bg-[color-mix(in_srgb,var(--accent-color)_14%,transparent)] text-[color-mix(in_srgb,var(--accent-color)_88%,#000)] dark:bg-[color-mix(in_srgb,var(--accent-color)_22%,transparent)] dark:text-[color-mix(in_srgb,var(--accent-color)_92%,white)]";
}

function isoLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function OwnerDashboardPage() {
  const sb = await createClient();
  const {
    data: { user }
  } = await sb.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [{ data: profile }, dashboardData] = await Promise.all([
    sb
      .from("profiles")
      .select(
        "trial_end, trial_end_date, trial_start, subscription_status, industry_tags, industry_other_note, business_name"
      )
      .eq("id", user.id)
      .maybeSingle(),
    getOwnerDashboardData(user.id)
  ]);

  const trialDaysRemaining = computeTrialDaysRemaining(
    profile as {
      trial_end?: string | null;
      trial_end_date?: string | null;
      trial_start?: string | null;
      subscription_status?: string | null;
    }
  );
  const industryTags: IndustrySlug[] = Array.isArray((profile as { industry_tags?: unknown })?.industry_tags)
    ? ((profile as { industry_tags: string[] }).industry_tags ?? []).filter((t): t is IndustrySlug => isIndustrySlug(t))
    : [];
  const enabled = await loadWorkspaceFeatureSet(sb, user.id, industryTags);
  const welcomeLine = ownerWelcomeLine(industryTags.length ? industryTags : null);
  const checklistItems = getGettingStartedChecklist(industryTags.length ? industryTags : null);

  const onboardingCounts = dashboardData.onboardingCounts;
  const bizDone = Boolean(((profile as { business_name?: string | null })?.business_name ?? "").trim());

  function checklistDone(href: string): boolean {
    const h = href.toLowerCase();
    if (h.includes("/employees")) return onboardingCounts.employees > 0;
    if (h.includes("/clients")) return onboardingCounts.clients > 0;
    if (h.includes("/schedule")) return onboardingCounts.jobs > 0;
    if (h.includes("/reports")) return onboardingCounts.quotes > 0;
    if (h.includes("/jobs")) return onboardingCounts.jobs > 0;
    if (h.includes("/quotes")) return onboardingCounts.quotes > 0;
    if (h.includes("/invoices")) return onboardingCounts.invoices > 0;
    if (h.includes("/settings")) return bizDone;
    return false;
  }

  const ringTasks = checklistItems.map((item) => ({
    ...item,
    done: checklistDone(item.href)
  }));

  const ringTasksVisible = ringTasks.filter((task) => {
    const h = task.href.toLowerCase();
    if (h.includes("/settings")) return true;
    if (h.includes("/schedule")) return schedulingEnabled(enabled);
    if (h.includes("/employees")) return enabled.has("employee_management");
    if (h.includes("/reports"))
      return enabled.has("crm_pipeline") || enabled.has("project_tracking") || enabled.has("equipment_hire");
    if (h.includes("/clients")) return enabled.has("client_management");
    if (h.includes("/jobs")) return schedulingEnabled(enabled);
    if (h.includes("/quotes")) return enabled.has("quotes");
    if (h.includes("/invoices")) return enabled.has("invoices");
    return true;
  });

  const todayIso = isoLocal(new Date());
  const tomorrowD = new Date();
  tomorrowD.setDate(tomorrowD.getDate() + 1);
  const tomorrowIso = isoLocal(tomorrowD);

  const {
    metrics,
    recentJobs,
    topClients,
    chaseInvoices,
    quotesFollowUp,
    revenueLast7Days,
    glanceToday,
    glanceTomorrow,
    jobsByStatus,
    recentActivity,
    invoiceStatusCounts,
    quoteStatusCounts,
    jobsTodayStat,
    jobsTomorrowStat,
    mapJobsToday,
    pipelineAwaitingValue,
    jobsScheduledThisWeek
  } = dashboardData;

  const sparkLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-AU", { weekday: "short" });
  });

  const activityFiltered = recentActivity.filter((item) => {
    if (item.kind === "job" && !schedulingEnabled(enabled)) return false;
    if (item.kind === "invoice" && !enabled.has("invoices")) return false;
    if (item.kind === "quote" && !enabled.has("quotes")) return false;
    if (item.kind === "client" && !enabled.has("client_management")) return false;
    return true;
  });

  async function sendInvoiceReminderAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const invoiceId = String(formData.get("invoice_id") ?? "");
    const { data: invoice } = await sb
      .from("invoices")
      .select("invoice_number, amount, due_date, client_id, is_demo")
      .eq("id", invoiceId)
      .eq("owner_id", owner.id)
      .maybeSingle();
    if (invoice?.is_demo) return;
    if (invoice?.client_id) {
      const { data: client } = await sb
        .from("clients")
        .select("full_name, email")
        .eq("id", invoice.client_id)
        .maybeSingle();
      if (client?.email) {
        await sendEmail(
          client.email,
          `Invoice reminder: ${invoice.invoice_number ?? "SERVLO Invoice"}`,
          invoiceReminderEmailTemplate({
            clientName: client.full_name ?? "there",
            invoiceNumber: invoice.invoice_number ?? "Invoice",
            amount: formatCurrency(Number(invoice.amount ?? 0)),
            dueDate: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-AU") : "-",
            payNowUrl: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || `${process.env.NEXT_PUBLIC_APP_URL || "https://servlo.com.au"}/dashboard/client`
          })
        );
      }
    }
    await sb
      .from("invoices")
      .update({ last_reminder_sent: new Date().toISOString() })
      .eq("id", invoiceId)
      .eq("owner_id", owner.id);
    revalidatePath("/dashboard/owner");
  }

  async function sendQuoteReminderAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const quoteId = String(formData.get("quote_id") ?? "");
    const { data: quote } = await sb
      .from("quotes")
      .select("quote_number, created_at, client_id, is_demo")
      .eq("id", quoteId)
      .eq("owner_id", owner.id)
      .maybeSingle();
    if (quote?.is_demo) return;
    if (quote?.client_id) {
      const { data: client } = await sb
        .from("clients")
        .select("full_name, email")
        .eq("id", quote.client_id)
        .maybeSingle();
      if (client?.email) {
        await sendEmail(
          client.email,
          `Quote follow-up: ${quote.quote_number ?? "SERVLO Quote"}`,
          quoteFollowUpEmailTemplate({
            clientName: client.full_name ?? "there",
            quoteNumber: quote.quote_number ?? "Quote",
            quoteDate: quote.created_at ? new Date(quote.created_at).toLocaleDateString("en-AU") : "-"
          })
        );
      }
    }
    await sb
      .from("quotes")
      .update({ last_reminder_sent: new Date().toISOString() })
      .eq("id", quoteId)
      .eq("owner_id", owner.id);
    revalidatePath("/dashboard/owner");
  }

  const showScheduling = schedulingEnabled(enabled);
  const featureInvoices = enabled.has("invoices");
  const featureQuotes = enabled.has("quotes");
  const featureClients = enabled.has("client_management");
  const featureJobMap = enabled.has("gps_clock") && showScheduling;
  const featurePipeline = enabled.has("crm_pipeline");
  const featureRecurringWeek = enabled.has("recurring_jobs") && showScheduling;
  const featureEquipment = enabled.has("equipment_hire");
  const featureJobPhotos = enabled.has("job_photos");

  return (
    <section className="space-y-6">
      {trialDaysRemaining > 0 ? (
        <div className="rounded-lg border border-[color-mix(in_srgb,var(--accent-color)_42%,var(--border))] bg-[color-mix(in_srgb,var(--accent-color)_10%,var(--bg-card))] px-4 py-3 text-sm text-[var(--text-primary)]">
          {trialDaysRemaining} days remaining in your free trial -{" "}
          <a
            href="/dashboard/owner/settings"
            className="font-semibold text-[var(--accent-color)] underline decoration-[color-mix(in_srgb,var(--accent-color)_50%,var(--border))] underline-offset-2 hover:opacity-90"
          >
            Upgrade now
          </a>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Trial expired -{" "}
          <a
            href="/dashboard/owner/settings"
            className="font-semibold !text-amber-950 underline decoration-amber-900 underline-offset-2 hover:!text-amber-900"
          >
            upgrade to continue
          </a>
        </div>
      )}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] md:text-3xl">Owner Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)]">Track operational performance in real time.</p>
          {welcomeLine ? (
            <p className="mt-2 text-sm font-medium text-accent-strong">{welcomeLine}</p>
          ) : null}
        </div>
        {showScheduling ? (
          <JobDayStatCards
            todayKeyIso={todayIso}
            tomorrowKeyIso={tomorrowIso}
            today={jobsTodayStat}
            tomorrow={jobsTomorrowStat}
          />
        ) : null}
      </div>

      {metrics.activeClientsCount === 0 && recentJobs.length === 0 ? (
        <GettingStartedRing tasks={ringTasksVisible} />
      ) : null}

      <InvoiceQuoteStatusGrids
        invoices={invoiceStatusCounts}
        quotes={quoteStatusCounts}
        showInvoices={featureInvoices}
        showQuotes={featureQuotes}
      />

      <OwnerDashboardQuickActions
        enabled={{
          scheduling: showScheduling,
          clients: featureClients,
          invoices: featureInvoices,
          quotes: featureQuotes
        }}
      />

      {showScheduling ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Jobs by status</span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            Pending · {jobsByStatus.pending}
          </span>
          <span className="rounded-full bg-[color-mix(in_srgb,var(--accent-color)_14%,transparent)] px-3 py-1 text-xs font-semibold text-[color-mix(in_srgb,var(--accent-color)_88%,#000)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--accent-color)_38%,transparent)] dark:bg-[color-mix(in_srgb,var(--accent-color)_22%,transparent)] dark:text-[color-mix(in_srgb,var(--accent-color)_92%,white)] dark:ring-[color-mix(in_srgb,var(--accent-color)_48%,transparent)]">
            In progress · {jobsByStatus.inProgress}
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
            Completed · {jobsByStatus.completed}
          </span>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="dashboard-card rounded-xl border-l-4 border-l-[var(--accent-color)] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Revenue This Month</p>
          <p className="dashboard-stat-value mt-2 text-3xl font-bold">{formatCurrency(metrics.revenueThisMonth)}</p>
          <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Paid invoices — last 7 days
          </p>
          <RevenueSparkline values={revenueLast7Days} labels={sparkLabels} />
        </article>
        <article className="dashboard-card rounded-xl border-l-4 border-l-[var(--accent-color)] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Outstanding</p>
          <p className="dashboard-stat-value mt-2 text-3xl font-bold">{formatCurrency(metrics.outstandingAmount)}</p>
        </article>
        {showScheduling ? (
          <article className="dashboard-card rounded-xl border-l-4 border-l-[var(--accent-color)] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Jobs Completed This Week</p>
            <p className="dashboard-stat-value mt-2 text-3xl font-bold">{metrics.jobsCompletedThisWeek}</p>
          </article>
        ) : null}
        <article className="dashboard-card rounded-xl border-l-4 border-l-[var(--accent-color)] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Active Clients</p>
          <p className="dashboard-stat-value mt-2 text-3xl font-bold">{metrics.activeClientsCount}</p>
        </article>
      </div>

      <div className={`grid gap-4 ${showScheduling ? "xl:grid-cols-2" : ""}`}>
        {showScheduling ? (
          <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">This Week at a Glance</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Scheduled jobs for today and tomorrow.</p>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-accent-strong">Today</h3>
                <ul className="mt-2 space-y-2 text-sm text-[var(--text-secondary)]">
                  {glanceToday.length === 0 ? (
                    <li className="text-[var(--text-muted)]">No jobs scheduled.</li>
                  ) : (
                    glanceToday.map((job) => (
                      <li key={job.id} className="rounded border border-[var(--border)] px-3 py-2">
                        <p className="flex flex-wrap items-center gap-2 font-medium text-[var(--text-primary)]">
                          <span>{job.title ?? "Untitled job"}</span>
                          {job.is_demo ? <DemoBadge /> : null}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {job.client_name ?? "—"}
                          {job.scheduled_start ? ` · ${job.scheduled_start.slice(0, 5)}` : ""}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-accent-strong">Tomorrow</h3>
                <ul className="mt-2 space-y-2 text-sm text-[var(--text-secondary)]">
                  {glanceTomorrow.length === 0 ? (
                    <li className="text-[var(--text-muted)]">No jobs scheduled.</li>
                  ) : (
                    glanceTomorrow.map((job) => (
                      <li key={job.id} className="rounded border border-[var(--border)] px-3 py-2">
                        <p className="flex flex-wrap items-center gap-2 font-medium text-[var(--text-primary)]">
                          <span>{job.title ?? "Untitled job"}</span>
                          {job.is_demo ? <DemoBadge /> : null}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {job.client_name ?? "—"}
                          {job.scheduled_start ? ` · ${job.scheduled_start.slice(0, 5)}` : ""}
                        </p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </article>
        ) : null}

        <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent activity</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Latest jobs, clients, invoices and quotes.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {activityFiltered.length === 0 ? (
              <li className="text-[var(--text-muted)]">No recent activity yet.</li>
            ) : (
              activityFiltered.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-2 rounded border border-[var(--border)] px-3 py-2"
                >
                  <span className="flex flex-wrap items-center gap-2 text-[var(--text-primary)]">
                    <span>{item.label}</span>
                    {item.isDemo ? <DemoBadge /> : null}
                  </span>
                  <span className="shrink-0 text-xs capitalize text-[var(--text-muted)]">{item.kind}</span>
                </li>
              ))
            )}
          </ul>
        </article>
      </div>

      {featurePipeline || featureRecurringWeek || featureEquipment || featureJobPhotos ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featurePipeline ? (
            <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pipeline value</h2>
              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{formatCurrency(pipelineAwaitingValue)}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Open quotes awaiting acceptance</p>
              <a
                href="/dashboard/owner/quotes?bucket=awaiting"
                className="mt-3 inline-block text-sm font-semibold text-[var(--accent-color)] hover:underline"
              >
                Review quotes
              </a>
            </article>
          ) : null}
          {featureRecurringWeek ? (
            <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Scheduled this week</h2>
              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{jobsScheduledThisWeek}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Jobs on your calendar (Mon–Sun)</p>
              <a href="/dashboard/schedule" className="mt-3 inline-block text-sm font-semibold text-[var(--accent-color)] hover:underline">
                View schedule
              </a>
            </article>
          ) : null}
          {featureEquipment ? (
            <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Equipment & hire</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Line up hire gear and packages against jobs and quotes.
              </p>
              <a href="/dashboard/owner/quotes" className="mt-3 inline-block text-sm font-semibold text-[var(--accent-color)] hover:underline">
                Open quotes
              </a>
            </article>
          ) : null}
          {featureJobPhotos ? (
            <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Job photos</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Capture proof-of-work from each job record when you&apos;re on site.
              </p>
              <a href="/dashboard/owner/jobs" className="mt-3 inline-block text-sm font-semibold text-[var(--accent-color)] hover:underline">
                View jobs
              </a>
            </article>
          ) : null}
        </div>
      ) : null}

      {featureJobMap ? <TodayJobsMapCollapsible jobs={mapJobsToday} /> : null}

      {showScheduling || (featureInvoices && featureClients) ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {showScheduling ? (
        <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Jobs</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                  <th className="px-2 py-2 font-medium">Title</th>
                  <th className="px-2 py-2 font-medium">Client</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.length === 0 ? (
                  <tr>
                    <td className="px-2 py-4 text-[var(--text-muted)]" colSpan={4}>
                      No jobs found.
                    </td>
                  </tr>
                ) : (
                  recentJobs.map((job) => (
                    <tr key={job.id} className="border-b border-[var(--border)]">
                      <td className="px-2 py-2 font-medium text-[var(--text-primary)]">
                        <span className="inline-flex flex-wrap items-center gap-2">
                          <span>{job.title ?? "Untitled job"}</span>
                          {job.is_demo ? <DemoBadge /> : null}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-[var(--text-secondary)]">{job.client_name ?? "-"}</td>
                      <td className="px-2 py-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClasses(job.status ?? null)}`}>
                          {job.status ?? "pending"}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-[var(--text-secondary)]">
                        {job.scheduled_date
                          ? new Date(job.scheduled_date).toLocaleDateString("en-AU")
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
          ) : null}

          {featureInvoices && featureClients ? (
        <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Top Clients</h2>
          <div className="mt-3 space-y-2 text-sm">
            {topClients.map((client, idx) => (
              <div
                key={`${client.client_name}-${idx}`}
                className="flex items-center justify-between rounded border border-[var(--border)] px-3 py-2"
              >
                <p className="text-[var(--text-primary)]">{client.client_name}</p>
                <p className="font-semibold text-[var(--text-primary)]">{formatCurrency(client.total)}</p>
              </div>
            ))}
            {topClients.length === 0 ? <p className="text-[var(--text-muted)]">No client revenue data yet.</p> : null}
          </div>
        </article>
          ) : null}
        </div>
      ) : null}

      {featureInvoices || featureQuotes ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {featureInvoices ? (
        <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Chase Invoices</h2>
          <div className="mt-3 space-y-2 text-sm">
            {chaseInvoices.map((invoice: any) => (
              <div key={invoice.id} className="rounded border border-[var(--border)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-[var(--text-primary)]">
                    {invoice.invoice_number ?? "Invoice"} - {invoice.client_name}
                  </p>
                  <form action={sendInvoiceReminderAction}>
                    <input type="hidden" name="invoice_id" value={invoice.id} />
                    <button
                      type="submit"
                      className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                    >
                      Send Reminder
                    </button>
                  </form>
                </div>
                <p className="text-[var(--text-secondary)]">
                  {formatCurrency(Number(invoice.amount ?? 0))} · Due{" "}
                  {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-AU") : "-"}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {invoice.last_reminder_sent
                    ? `Reminder sent ${Math.max(
                        0,
                        Math.floor((Date.now() - new Date(invoice.last_reminder_sent).getTime()) / (1000 * 60 * 60 * 24))
                      )} days ago`
                    : "No reminder sent yet"}
                </p>
              </div>
            ))}
            {chaseInvoices.length === 0 ? <p className="text-[var(--text-muted)]">No unpaid invoices.</p> : null}
          </div>
        </article>
          ) : null}

          {featureQuotes ? (
        <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Follow Up Needed (Quotes)</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Awaiting acceptance for more than 3 days.</p>
          <div className="mt-3 space-y-2 text-sm">
            {quotesFollowUp.map((quote: any) => (
              <div key={quote.id} className="rounded border border-[var(--border)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-[var(--text-primary)]">
                    {quote.client_name} · {quote.quote_number ?? "Quote"}
                  </p>
                  <form action={sendQuoteReminderAction}>
                    <input type="hidden" name="quote_id" value={quote.id} />
                    <button
                      type="submit"
                      className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                    >
                      Send Follow Up
                    </button>
                  </form>
                </div>
                <p className="text-[var(--text-secondary)]">
                  {formatCurrency(Number(quote.quote_amount ?? quote.total ?? 0))} · Waiting{" "}
                  {quote.days_waiting ?? 0} days · Status {quote.status ?? "pending"}
                </p>
              </div>
            ))}
            {quotesFollowUp.length === 0 ? <p className="text-[var(--text-muted)]">No quote follow-ups needed.</p> : null}
          </div>
        </article>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}


