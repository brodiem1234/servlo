import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOwnerDashboardData } from "@/lib/dashboard/owner";
import { invoiceReminderEmailTemplate, sendEmail } from "@/lib/email";
import { DemoBadge } from "@/components/demo-badge";
import { computeTrialDaysRemaining } from "@/lib/trial-profile";
import { loadWorkspaceFeatureSet, schedulingEnabled } from "@/lib/workspace-features";
import { isIndustrySlug, type IndustrySlug } from "@/lib/industries";
import LiveClock from "@/components/dashboard/live-clock";
import WeeklyRevenueChart from "@/components/dashboard/weekly-revenue-chart";
import OwnerSidebarTodos from "@/components/dashboard/owner-sidebar-todos";
import OnboardingChecklist from "@/components/dashboard/onboarding-checklist";
import { OnboardingTour } from "@/components/dashboard/onboarding-tour";
import { ReferralWidget } from "@/components/dashboard/referral-widget";
import { ensureReferralCode } from "@/lib/referral";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);
}

function isoLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateLong(d: Date) {
  return d.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function extractFirstName(displayName: string | null | undefined, email: string | null | undefined): string {
  if (displayName && displayName.trim()) {
    return displayName.trim().split(/\s+/)[0];
  }
  if (email) {
    return email.split("@")[0];
  }
  return "there";
}

function getStatusBadgeStyle(status: string | null): { bg: string; text: string } {
  const key = (status ?? "").toLowerCase();
  if (key === "completed" || key === "complete") return { bg: "bg-green-100 dark:bg-green-950", text: "text-green-700 dark:text-green-300" };
  if (key === "in_progress" || key === "in-progress") return { bg: "bg-orange-100 dark:bg-orange-950", text: "text-orange-700 dark:text-orange-300" };
  if (key === "cancelled") return { bg: "bg-red-100 dark:bg-red-950", text: "text-red-700 dark:text-red-300" };
  return { bg: "bg-blue-100 dark:bg-blue-950", text: "text-blue-700 dark:text-blue-300" };
}

export default async function OwnerDashboardPage() {
  const sb = await createClient();
  const {
    data: { user }
  } = await sb.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const todayIso = isoLocal(new Date());

  const [{ data: profile }, dashboardData, { data: todayJobsRaw }, { data: taskRows }] =
    await Promise.all([
      sb
        .from("profiles")
        .select("trial_end, trial_start, subscription_status, industry_tags, full_name, onboarding_completed")
        .eq("id", user.id)
        .maybeSingle(),
      getOwnerDashboardData(user.id),
      sb
        .from("jobs")
        .select("id, title, address, suburb, state, scheduled_start, scheduled_end, status, client_id, employee_id, is_demo, clients(full_name), employees(full_name)")
        .eq("owner_id", user.id)
        .eq("scheduled_date", todayIso)
        .order("scheduled_start"),
      sb
        .from("owner_tasks")
        .select("id, title, done")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(80)
    ]);

  const trialDaysRemaining = computeTrialDaysRemaining(
    profile as {
      trial_end?: string | null;
      trial_start?: string | null;
      subscription_status?: string | null;
    }
  );

  const industryTags: IndustrySlug[] = Array.isArray((profile as { industry_tags?: unknown })?.industry_tags)
    ? ((profile as { industry_tags: string[] }).industry_tags ?? []).filter((t): t is IndustrySlug => isIndustrySlug(t))
    : [];
  const enabled = await loadWorkspaceFeatureSet(sb, user.id, industryTags);
  const showScheduling = schedulingEnabled(enabled);
  const featureInvoices = enabled.has("invoices");

  const firstName = extractFirstName(
    (profile as { full_name?: string | null } | null)?.full_name ?? null,
    user.email ?? null
  );

  const onboardingCompleted = (profile as { onboarding_completed?: boolean | null } | null)?.onboarding_completed ?? false;

  const { metrics, chaseInvoices, recentActivity, jobsScheduledThisWeek } = dashboardData;

  // Referral URL (non-blocking — fallback on error)
  let referralUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au"}`;
  try {
    const refCode = await ensureReferralCode(user.id);
    referralUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au"}?ref=${refCode}`;
  } catch {
    // Non-blocking — referral widget just won't show the code
  }

  // Weekly revenue chart data: Mon–Sun for current week
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0=Sun
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  // Query paid invoices for current week
  const { data: weekPaidInvoices } = await sb
    .from("invoices")
    .select("total, paid_at, is_demo")
    .eq("owner_id", user.id)
    .eq("status", "paid")
    .gte("paid_at", weekStart.toISOString())
    .not("paid_at", "is", null);

  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyRevenueData = DAY_LABELS.map((label, i) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + i);
    const dayKey = isoLocal(dayDate);
    const total = (weekPaidInvoices ?? [])
      .filter((inv: any) => !inv.is_demo && inv.paid_at && String(inv.paid_at).slice(0, 10) === dayKey)
      .reduce((sum: number, inv: any) => sum + Number(inv.total ?? 0), 0);
    return { label, value: total };
  });

  // Today's jobs
  const todayJobs = (todayJobsRaw ?? []) as unknown as Array<{
    id: string;
    title: string | null;
    address: string | null;
    suburb: string | null;
    state: string | null;
    scheduled_start: string | null;
    scheduled_end: string | null;
    status: string | null;
    client_id: string | null;
    employee_id: string | null;
    is_demo: boolean | null;
    clients: { full_name: string | null } | null;
    employees: { full_name: string | null } | null;
  }>;

  // Who's working today: group by employee
  const employeeJobsMap = new Map<string, { name: string; count: number; jobs: string[] }>();
  for (const job of todayJobs) {
    if (job.employee_id && job.employees?.full_name) {
      const existing = employeeJobsMap.get(job.employee_id) ?? {
        name: job.employees.full_name,
        count: 0,
        jobs: []
      };
      existing.count += 1;
      if (job.title) existing.jobs.push(job.title);
      employeeJobsMap.set(job.employee_id, existing);
    }
  }
  const workingToday = Array.from(employeeJobsMap.values());

  // Overdue invoices: status=unpaid and due_date < today
  const overdueInvoices = chaseInvoices.filter((inv: any) => {
    if (!inv.due_date) return false;
    return new Date(inv.due_date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
  });

  const initialTasks = (taskRows ?? []).map((t: any) => ({
    id: String(t.id),
    title: String(t.title ?? ""),
    done: Boolean(t.done)
  }));

  async function sendInvoiceReminderAction(formData: FormData) {
    "use server";
    const sbAction = await createClient();
    const {
      data: { user: owner }
    } = await sbAction.auth.getUser();
    if (!owner) redirect("/auth/login");
    const invoiceId = String(formData.get("invoice_id") ?? "");
    const { data: invoice } = await sbAction
      .from("invoices")
      .select("invoice_number, total, due_date, client_id, is_demo")
      .eq("id", invoiceId)
      .eq("owner_id", owner.id)
      .maybeSingle();
    if (invoice?.is_demo) return;
    if (invoice?.client_id) {
      const { data: client } = await sbAction
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
            amount: formatCurrency(Number(invoice.total ?? 0)),
            dueDate: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-AU") : "-",
            payNowUrl:
              process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ||
              `${process.env.NEXT_PUBLIC_APP_URL || "https://servlo.com.au"}/dashboard/client`
          })
        );
      }
    }
    await sbAction
      .from("invoices")
      .update({ last_reminder_sent: new Date().toISOString() })
      .eq("id", invoiceId)
      .eq("owner_id", owner.id);
    revalidatePath("/dashboard/owner");
  }

  return (
    <section className="space-y-6">
      <OnboardingTour initialCompleted={onboardingCompleted} />
      <OnboardingChecklist />
      {/* Trial banner */}
      {trialDaysRemaining > 0 ? (
        <div className="rounded-lg border border-[color-mix(in_srgb,var(--accent-color)_42%,var(--border))] bg-[color-mix(in_srgb,var(--accent-color)_10%,var(--bg-card))] px-4 py-3 text-sm text-[var(--text-primary)]">
          {trialDaysRemaining} days remaining in your free trial —{" "}
          <a
            href="/dashboard/owner/settings"
            className="font-semibold text-[var(--accent-color)] underline decoration-[color-mix(in_srgb,var(--accent-color)_50%,var(--border))] underline-offset-2 hover:opacity-90"
          >
            Upgrade now
          </a>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Trial expired —{" "}
          <a
            href="/dashboard/owner/settings"
            className="font-semibold !text-amber-950 underline decoration-amber-900 underline-offset-2 hover:!text-amber-900"
          >
            upgrade to continue
          </a>
        </div>
      )}

      {/* Top bar: Morning briefing header */}
      <div className="flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
            Good morning, {firstName}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            {formatDateLong(new Date())} &mdash;{" "}
            <span className="font-semibold text-[var(--accent-color)]">SERVLO CORE</span>
          </p>
        </div>
        <div className="text-lg font-semibold tabular-nums">
          <LiveClock />
        </div>
      </div>

      {/* Row 1: Today's Jobs */}
      {showScheduling ? (
        <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Today&apos;s Jobs</h2>
              <p className="text-xs text-[var(--text-muted)]">
                {todayJobs.length} job{todayJobs.length !== 1 ? "s" : ""} scheduled for today
              </p>
            </div>
            <a
              href="/dashboard/owner/jobs"
              className="shrink-0 text-sm font-semibold text-[var(--accent-color)] hover:underline"
            >
              View all jobs
            </a>
          </div>

          {todayJobs.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-center">
              <p className="text-[var(--text-muted)]">No jobs scheduled today.</p>
              <a
                href="/dashboard/owner/jobs"
                className="mt-2 inline-block text-sm font-semibold text-[var(--accent-color)] hover:underline"
              >
                Schedule a job
              </a>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {todayJobs.map((job) => {
                const { bg, text } = getStatusBadgeStyle(job.status);
                const addressParts = [job.address, job.suburb, job.state].filter(Boolean);
                return (
                  <div
                    key={job.id}
                    className="rounded-lg border border-[var(--border)] p-3 hover:border-[color-mix(in_srgb,var(--accent-color)_40%,var(--border))] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-[var(--text-primary)] leading-tight">
                        {job.title ?? "Untitled job"}
                        {job.is_demo ? (
                          <span className="ml-1.5">
                            <DemoBadge />
                          </span>
                        ) : null}
                      </p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${bg} ${text}`}>
                        {job.status ?? "pending"}
                      </span>
                    </div>
                    {job.clients?.full_name ? (
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{job.clients.full_name}</p>
                    ) : null}
                    {addressParts.length > 0 ? (
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{addressParts.join(", ")}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                      {job.scheduled_start ? (
                        <span>
                          ⏰{" "}
                          {job.scheduled_start.slice(0, 5)}
                          {job.scheduled_end ? ` – ${job.scheduled_end.slice(0, 5)}` : ""}
                        </span>
                      ) : null}
                      {job.employees?.full_name ? (
                        <span>👤 {job.employees.full_name}</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      ) : null}

      {/* Row 2: Four stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border-l-4 border-l-[var(--accent-color)] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Revenue This Month</p>
          <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{formatCurrency(metrics.revenueThisMonth)}</p>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">Paid invoices</p>
        </article>
        <article className="rounded-xl border-l-4 border-l-[var(--accent-color)] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Outstanding</p>
          <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{formatCurrency(metrics.outstandingAmount)}</p>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">Unpaid invoices</p>
        </article>
        {showScheduling ? (
          <article className="rounded-xl border-l-4 border-l-[var(--accent-color)] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Jobs This Week</p>
            <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{jobsScheduledThisWeek}</p>
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">Scheduled Mon–Sun</p>
          </article>
        ) : null}
        <article className="rounded-xl border-l-4 border-l-[var(--accent-color)] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Active Clients</p>
          <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{metrics.activeClientsCount}</p>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">Non-inactive clients</p>
        </article>
      </div>

      {/* Row 3: Overdue invoices + Recent activity */}
      <div className="grid gap-4 xl:grid-cols-2">
        {featureInvoices ? (
          <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Overdue Invoices</h2>
                <p className="text-xs text-[var(--text-muted)]">Payment past due date</p>
              </div>
              {overdueInvoices.length > 0 ? (
                <a
                  href="/dashboard/owner/invoices?bucket=overdue"
                  className="shrink-0 text-sm font-semibold text-[var(--accent-color)] hover:underline"
                >
                  View all
                </a>
              ) : null}
            </div>
            <div className="mt-4 space-y-2">
              {overdueInvoices.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No overdue invoices. Great work!</p>
              ) : (
                overdueInvoices.map((invoice: any) => {
                  const daysOverdue = invoice.due_date
                    ? Math.max(
                        0,
                        Math.floor(
                          (Date.now() - new Date(invoice.due_date).setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
                        )
                      )
                    : 0;
                  return (
                    <div key={invoice.id} className="rounded-lg border border-red-100 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-950/20">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--text-primary)] text-sm">
                            {invoice.invoice_number ?? "Invoice"} · {invoice.client_name}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {formatCurrency(Number(invoice.total ?? 0))} ·{" "}
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              {daysOverdue}d overdue
                            </span>
                          </p>
                        </div>
                        <form action={sendInvoiceReminderAction}>
                          <input type="hidden" name="invoice_id" value={invoice.id} />
                          <button
                            type="submit"
                            className="shrink-0 rounded border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] dark:bg-[var(--bg-secondary)]"
                          >
                            Send Reminder
                          </button>
                        </form>
                      </div>
                      {invoice.last_reminder_sent ? (
                        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                          Reminder sent{" "}
                          {Math.max(
                            0,
                            Math.floor(
                              (Date.now() - new Date(invoice.last_reminder_sent).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          )}{" "}
                          days ago
                        </p>
                      ) : (
                        <p className="mt-1 text-[10px] text-[var(--text-muted)]">No reminder sent yet</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </article>
        ) : null}

        <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Activity</h2>
          <p className="text-xs text-[var(--text-muted)]">Latest jobs, clients, invoices and quotes</p>
          <ul className="mt-4 space-y-2 text-sm">
            {recentActivity.length === 0 ? (
              <li className="text-[var(--text-muted)]">No recent activity yet.</li>
            ) : (
              recentActivity.map((item) => {
                const kindColors: Record<string, string> = {
                  job: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
                  client: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
                  invoice: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
                  quote: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                };
                const badge = kindColors[item.kind] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2"
                  >
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${badge}`}>
                      {item.kind}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[var(--text-primary)]">{item.label}</span>
                    {item.isDemo ? <DemoBadge /> : null}
                  </li>
                );
              })
            )}
          </ul>
        </article>
      </div>

      {/* Row 4: Who's working today + Quick tasks */}
      {showScheduling ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Who&apos;s Working Today</h2>
            <p className="text-xs text-[var(--text-muted)]">Employees assigned to jobs today</p>
            <div className="mt-4 space-y-2">
              {workingToday.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">
                  No employees assigned to jobs today.
                </p>
              ) : (
                workingToday.map((emp) => (
                  <div
                    key={emp.name}
                    className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2.5"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: "var(--accent-color)" }}
                    >
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--text-primary)]">{emp.name}</p>
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {emp.count} job{emp.count !== 1 ? "s" : ""}
                        {emp.jobs.length > 0 ? ` · ${emp.jobs.slice(0, 2).join(", ")}` : ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Quick Tasks</h2>
            <p className="text-xs text-[var(--text-muted)]">Personal to-dos for today</p>
            <div className="mt-2">
              <OwnerSidebarTodos initialTasks={initialTasks} />
            </div>
          </article>
        </div>
      ) : (
        <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Quick Tasks</h2>
          <p className="text-xs text-[var(--text-muted)]">Personal to-dos for today</p>
          <div className="mt-2">
            <OwnerSidebarTodos initialTasks={initialTasks} />
          </div>
        </article>
      )}

      {/* Row 5: Weekly revenue chart */}
      <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Revenue This Week</h2>
            <p className="text-xs text-[var(--text-muted)]">Paid invoices Mon–Sun</p>
          </div>
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            {formatCurrency(weeklyRevenueData.reduce((s, d) => s + d.value, 0))} total
          </p>
        </div>
        <WeeklyRevenueChart data={weeklyRevenueData} />
      </article>

      {/* Referral widget — collapsed by default */}
      <ReferralWidget referralUrl={referralUrl} />
    </section>
  );
}
