import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import { guardWorkspaceNav } from "@/lib/workspace-feature-guard";
import { excludeDemoFinancial } from "@/lib/demo/visibility";
import FirstVisitBanner from "@/components/dashboard/first-visit-banner";
import {
  RevenueBarChart,
  JobsDonutChart,
  InvoiceStatusPieChart,
  type MonthRevenue,
  type JobStatusCount,
  type InvoiceStatusTotal,
} from "@/components/dashboard/reports-charts";
import { ReportsDashboard } from "./reports-dashboard";

export const dynamic = "force-dynamic";

function formatAud(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function ReportsPage() {
  const { user, enabled, supabase: sb } = await requireOwnerWorkspaceFeatures();
  guardWorkspaceNav(enabled, "reports_bundle");

  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  // ── Parallel data fetches ────────────────────────────────────────────────
  const [
    invoicesResult,
    paidInvoices6mResult,
    jobs90dResult,
    allJobsResult,
    timesheetsResult,
    employeesResult,
    clientsResult,
    clientRevenueResult,
  ] = await Promise.all([
    // Full invoice list for legacy charts + overdue calc
    sb
      .from("invoices")
      .select("id, total, status, paid_at, issue_date, client_id, due_date, is_demo")
      .eq("owner_id", user.id),
    // Paid invoices last 6 months for new revenue chart
    sb
      .from("invoices")
      .select("total, created_at, paid_at, issue_date")
      .eq("owner_id", user.id)
      .eq("status", "paid")
      .is("deleted_at", null)
      .gte("created_at", sixMonthsAgo.toISOString()),
    // Jobs last 90 days for stats + service mix
    sb
      .from("jobs")
      .select("status, scheduled_date, materials_cost, labour_hours, hourly_rate, is_demo, job_type")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .gte("created_at", ninetyDaysAgo.toISOString()),
    // All jobs for legacy charts + profitability
    sb
      .from("jobs")
      .select("id, title, status, is_demo, materials_cost, labour_hours, hourly_rate, revenue")
      .eq("owner_id", user.id)
      .is("deleted_at", null),
    // Timesheets this month for employee hours
    sb
      .from("timesheets")
      .select("employee_id, total_hours, clock_in, clock_out")
      .gte(
        "clock_in",
        new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      )
      .lt(
        "clock_in",
        new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
      ),
    sb.from("employees").select("id, full_name, is_demo, owner_id").eq("owner_id", user.id),
    sb.from("clients").select("id, full_name, is_demo").eq("owner_id", user.id),
    // All paid invoices with client_id for top clients
    sb
      .from("invoices")
      .select("client_id, total")
      .eq("owner_id", user.id)
      .eq("status", "paid")
      .is("deleted_at", null),
  ]);

  const allInvoices = invoicesResult.data ?? [];
  const rawPaid6m = paidInvoices6mResult.data ?? [];
  const jobs90d = jobs90dResult.data ?? [];
  const allJobs = allJobsResult.data ?? [];
  const allTimesheets = timesheetsResult.data ?? [];
  const allEmployees = employeesResult.data ?? [];
  const allClients = clientsResult.data ?? [];
  const rawClientRevenue = clientRevenueResult.data ?? [];

  // ── Monthly revenue (last 6 months) ──────────────────────────────────────
  const revenueByMonth6m = new Map<string, number>();
  for (const inv of rawPaid6m) {
    const dateStr = (inv.paid_at ?? inv.issue_date ?? inv.created_at) as string;
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth6m.set(key, (revenueByMonth6m.get(key) ?? 0) + Number(inv.total ?? 0));
  }
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
    monthlyRevenue.push({ month: label, revenue: revenueByMonth6m.get(key) ?? 0 });
  }

  // ── Job stats (90d, excluding demo) ──────────────────────────────────────
  const realJobs90d = jobs90d.filter((j) => !j.is_demo);
  const completedJobs = realJobs90d.filter((j) => j.status === "completed");
  const cancelledJobs = realJobs90d.filter((j) => j.status === "cancelled");
  const scheduledJobs = realJobs90d.filter(
    (j) => j.status === "scheduled" || j.status === "pending" || j.status === "in_progress"
  );
  const jobStats = {
    total: realJobs90d.length,
    completed: completedJobs.length,
    cancelled: cancelledJobs.length,
    scheduled: scheduledJobs.length,
    completionRate:
      realJobs90d.length > 0 ? (completedJobs.length / realJobs90d.length) * 100 : 0,
  };

  // ── Top clients by revenue (excluding demo clients) ───────────────────────
  const nonDemoClientIds = new Set(
    allClients.filter((c) => !c.is_demo).map((c) => c.id)
  );
  const clientRevenueMap = new Map<string, number>();
  const clientJobCountMap = new Map<string, number>();
  for (const inv of rawClientRevenue) {
    if (!inv.client_id || !nonDemoClientIds.has(inv.client_id)) continue;
    clientRevenueMap.set(
      inv.client_id,
      (clientRevenueMap.get(inv.client_id) ?? 0) + Number(inv.total ?? 0)
    );
    clientJobCountMap.set(inv.client_id, (clientJobCountMap.get(inv.client_id) ?? 0) + 1);
  }
  const clientNameById = new Map(
    allClients.map((c: { id: string; full_name: string | null }) => [c.id, c.full_name ?? "Unknown"])
  );
  const topClients = Array.from(clientRevenueMap.entries())
    .map(([id, revenue]) => ({
      name: clientNameById.get(id) ?? "Unknown",
      revenue,
      jobCount: clientJobCountMap.get(id) ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // ── Total revenue (all time, non-demo paid invoices) ─────────────────────
  const totalRevenue = excludeDemoFinancial(allInvoices)
    .filter((inv) => inv.status === "paid")
    .reduce((s, inv) => s + Number(inv.total ?? 0), 0);

  // ── Avg job value (completed real jobs with revenue data) ─────────────────
  const completedWithRevenue = allJobs
    .filter((j) => !j.is_demo && j.status === "completed" && Number((j as { revenue?: number | null }).revenue ?? 0) > 0);
  const avgJobValue =
    completedWithRevenue.length > 0
      ? completedWithRevenue.reduce((s, j) => s + Number((j as { revenue?: number | null }).revenue ?? 0), 0) /
        completedWithRevenue.length
      : 0;

  // ── Service mix from jobs90d ──────────────────────────────────────────────
  const serviceMixMap = new Map<string, number>();
  for (const job of realJobs90d) {
    const type = (job as { job_type?: string | null }).job_type ?? "General";
    serviceMixMap.set(type, (serviceMixMap.get(type) ?? 0) + 1);
  }
  const serviceMix = Array.from(serviceMixMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // ── Legacy chart data ────────────────────────────────────────────────────

  const paidInvoicesLegacy = excludeDemoFinancial(allInvoices).filter(
    (inv) => inv.status === "paid" && (inv.paid_at ?? inv.issue_date)
  );
  const revenueByMonthLegacy = new Map<string, number>();
  for (const inv of paidInvoicesLegacy) {
    const dateStr = (inv.paid_at ?? inv.issue_date) as string;
    const d = new Date(dateStr);
    if (d < twelveMonthsAgo) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonthLegacy.set(
      key,
      (revenueByMonthLegacy.get(key) ?? 0) + Number(inv.total ?? 0)
    );
  }
  const monthLabels: MonthRevenue[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
    monthLabels.push({ month: label, revenue: revenueByMonthLegacy.get(key) ?? 0 });
  }

  const clientRevenueLegacy = new Map<string, number>();
  for (const inv of paidInvoicesLegacy) {
    if (!inv.client_id) continue;
    clientRevenueLegacy.set(
      inv.client_id,
      (clientRevenueLegacy.get(inv.client_id) ?? 0) + Number(inv.total ?? 0)
    );
  }
  const topClientsLegacy = Array.from(clientRevenueLegacy.entries())
    .map(([id, total]) => ({ name: clientNameById.get(id) ?? "Unknown", total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const jobStatusCounts = new Map<string, number>();
  for (const job of allJobs) {
    const s = (job.status ?? "unknown").toLowerCase();
    jobStatusCounts.set(s, (jobStatusCounts.get(s) ?? 0) + 1);
  }
  const KNOWN_JOB_STATUSES = ["pending", "scheduled", "in_progress", "completed", "cancelled"];
  const jobsByStatus: JobStatusCount[] = KNOWN_JOB_STATUSES.map((s) => ({
    status: s,
    count: jobStatusCounts.get(s) ?? 0,
  }));
  for (const [status, count] of jobStatusCounts.entries()) {
    if (!KNOWN_JOB_STATUSES.includes(status)) {
      jobsByStatus.push({ status, count });
    }
  }

  const valuableInvoices = excludeDemoFinancial(allInvoices).filter((inv) =>
    ["paid", "unpaid", "overdue"].includes((inv.status ?? "").toLowerCase())
  );
  const avgInvoiceValue =
    valuableInvoices.length > 0
      ? valuableInvoices.reduce((sum, inv) => sum + Number(inv.total ?? 0), 0) /
        valuableInvoices.length
      : 0;

  const invoiceStatusTotals = new Map<string, number>();
  for (const inv of excludeDemoFinancial(allInvoices)) {
    let bucket = (inv.status ?? "draft").toLowerCase();
    if (bucket !== "paid" && bucket !== "draft" && inv.due_date) {
      const due = new Date(inv.due_date);
      due.setHours(0, 0, 0, 0);
      if (due < new Date(now.toDateString())) bucket = "overdue";
    }
    invoiceStatusTotals.set(
      bucket,
      (invoiceStatusTotals.get(bucket) ?? 0) + Number(inv.total ?? 0)
    );
  }
  const invoiceStatusData: InvoiceStatusTotal[] = Array.from(invoiceStatusTotals.entries()).map(
    ([status, total]) => ({ status, total })
  );

  const empHoursMap = new Map<string, number>();
  for (const ts of allTimesheets) {
    if (!ts.employee_id) continue;
    const inMs = ts.clock_in ? new Date(ts.clock_in).getTime() : NaN;
    const outMs = ts.clock_out ? new Date(ts.clock_out).getTime() : NaN;
    const explicit = Number(ts.total_hours ?? 0);
    const derived =
      Number.isFinite(inMs) && Number.isFinite(outMs) && outMs > inMs
        ? (outMs - inMs) / 36e5
        : 0;
    const hours = explicit > 0 ? explicit : derived;
    empHoursMap.set(ts.employee_id, (empHoursMap.get(ts.employee_id) ?? 0) + hours);
  }
  const employeeNameById = new Map(
    allEmployees.map((e: { id: string; full_name: string | null }) => [e.id, e.full_name ?? "Unknown"])
  );
  const employeeHours = Array.from(empHoursMap.entries())
    .map(([id, hours]) => ({ name: employeeNameById.get(id) ?? "Unknown", hours }))
    .sort((a, b) => b.hours - a.hours);

  type JobProfit = { title: string; revenue: number; cost: number; profit: number; margin: number };
  const profitableJobs: JobProfit[] = allJobs
    .filter((j) => !j.is_demo)
    .map((j) => {
      const materials = Number((j as { materials_cost?: number | null }).materials_cost ?? 0);
      const hours = Number((j as { labour_hours?: number | null }).labour_hours ?? 0);
      const rate = Number((j as { hourly_rate?: number | null }).hourly_rate ?? 0);
      const rev = Number((j as { revenue?: number | null }).revenue ?? 0);
      const cost = materials + hours * rate;
      const profit = rev - cost;
      const margin = rev > 0 ? (profit / rev) * 100 : 0;
      return {
        title: (j as { title?: string | null }).title ?? "Untitled",
        revenue: rev,
        cost,
        profit,
        margin,
      };
    })
    .filter((j) => j.revenue > 0 || j.cost > 0)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);

  const profitTotalRevenue = profitableJobs.reduce((s, j) => s + j.revenue, 0);
  const profitTotalCost = profitableJobs.reduce((s, j) => s + j.cost, 0);
  const profitTotal = profitTotalRevenue - profitTotalCost;
  const avgMargin = profitTotalRevenue > 0 ? (profitTotal / profitTotalRevenue) * 100 : 0;

  const isEmpty =
    allInvoices.length === 0 && allJobs.length === 0 && allTimesheets.length === 0;

  const monthLabel = now.toLocaleDateString("en-AU", { month: "long", year: "numeric" });

  return (
    <section className="space-y-8">
      <FirstVisitBanner
        pageKey="reports"
        title="Business performance"
        description="Track revenue trends, job stats, and team productivity. Data updates in real time."
      />

      {/* New ReportsDashboard — KPI cards, SVG charts, export */}
      <ReportsDashboard
        monthlyRevenue={monthlyRevenue}
        jobStats={jobStats}
        topClients={topClients}
        avgJobValue={avgJobValue}
        serviceMix={serviceMix}
        totalRevenue={totalRevenue}
      />

      {isEmpty ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center shadow-sm">
          <p className="text-lg font-semibold text-[var(--text-primary)]">No data yet</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Add invoices, jobs, and timesheets to start seeing reports.
          </p>
        </div>
      ) : (
        <>
          {/* Detailed charts section */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Detailed analysis</h2>

            {/* Row 1 — Revenue bar chart (full width) */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Revenue — last 12 months
              </h3>
              <RevenueBarChart data={monthLabels} />
            </div>

            {/* Row 2 — Jobs donut + avg invoice value / invoice status pie */}
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Jobs by status
                </h3>
                <p className="mb-3 text-xs text-[var(--text-muted)]">
                  {allJobs.length} total job{allJobs.length !== 1 ? "s" : ""}
                </p>
                <JobsDonutChart data={jobsByStatus} />
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Average invoice value
                  </p>
                  <p className="mt-1 text-3xl font-bold text-[var(--text-primary)]">
                    {formatAud(avgInvoiceValue)}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    across {valuableInvoices.length} invoice{valuableInvoices.length !== 1 ? "s" : ""} (paid + unpaid)
                  </p>
                </div>

                <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
                  <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Invoice breakdown by value
                  </h3>
                  <InvoiceStatusPieChart data={invoiceStatusData} />
                </div>
              </div>
            </div>

            {/* Row 3 — Top clients + Employee hours */}
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Top clients by revenue (all time)
                </h3>
                {topClientsLegacy.length === 0 ? (
                  <p className="py-4 text-center text-sm text-[var(--text-muted)]">
                    No paid invoices with client data.
                  </p>
                ) : (
                  <table className="w-full text-sm" aria-label="Top clients by all-time revenue">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        <th className="pb-2 pr-3">Client</th>
                        <th className="pb-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topClientsLegacy.map((c, i) => (
                        <tr key={i} className="border-b border-[var(--border)] last:border-0">
                          <td className="py-2 pr-3 font-medium text-[var(--text-primary)]">{c.name}</td>
                          <td className="py-2 text-right font-semibold text-[var(--text-primary)]">
                            {formatAud(c.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Employee hours — {monthLabel}
                </h3>
                {employeeHours.length === 0 ? (
                  <p className="py-4 text-center text-sm text-[var(--text-muted)]">
                    No timesheet entries this month.
                  </p>
                ) : (
                  <table className="w-full text-sm" aria-label="Employee hours this month">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        <th className="pb-2 pr-3">Employee</th>
                        <th className="pb-2 text-right">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeHours.map((e, i) => (
                        <tr key={i} className="border-b border-[var(--border)] last:border-0">
                          <td className="py-2 pr-3 font-medium text-[var(--text-primary)]">{e.name}</td>
                          <td className="py-2 text-right font-semibold text-[var(--text-primary)]">
                            {e.hours.toFixed(1)}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Row 4 — Profitability */}
            {profitableJobs.length > 0 && (
              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Per-job profitability
                </h3>
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
                    <p className="text-xs text-[var(--text-muted)]">Total Revenue</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{formatAud(profitTotalRevenue)}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
                    <p className="text-xs text-[var(--text-muted)]">Total Cost</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{formatAud(profitTotalCost)}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
                    <p className="text-xs text-[var(--text-muted)]">Total Profit</p>
                    <p className={`text-lg font-bold ${profitTotal >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {formatAud(profitTotal)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
                    <p className="text-xs text-[var(--text-muted)]">Avg Margin</p>
                    <p className={`text-lg font-bold ${avgMargin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {avgMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <table className="w-full text-sm" aria-label="Per-job profitability">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      <th className="pb-2 pr-3">Job</th>
                      <th className="pb-2 text-right">Revenue</th>
                      <th className="pb-2 text-right">Cost</th>
                      <th className="pb-2 text-right">Profit</th>
                      <th className="pb-2 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitableJobs.map((j, i) => (
                      <tr key={i} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2 pr-3 font-medium text-[var(--text-primary)] max-w-[160px] truncate">{j.title}</td>
                        <td className="py-2 text-right text-[var(--text-secondary)]">{formatAud(j.revenue)}</td>
                        <td className="py-2 text-right text-[var(--text-secondary)]">{formatAud(j.cost)}</td>
                        <td className={`py-2 text-right font-semibold ${j.profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {formatAud(j.profit)}
                        </td>
                        <td className={`py-2 text-right font-semibold ${j.margin >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {j.margin.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Only jobs with revenue or cost data entered are shown. Set revenue and costs in the job costing tab.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
