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

  // ── Parallel data fetches ────────────────────────────────────────────────
  const [invoicesResult, jobsResult, timesheetsResult, employeesResult, clientsResult] =
    await Promise.all([
      sb
        .from("invoices")
        .select("id, total, status, paid_at, issue_date, client_id, due_date, is_demo")
        .eq("owner_id", user.id),
      sb.from("jobs").select("id, status, is_demo").eq("owner_id", user.id),
      sb
        .from("timesheets")
        .select("employee_id, total_hours, clock_in, clock_out")
        .gte(
          "clock_in",
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        )
        .lt(
          "clock_in",
          new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
        ),
      sb.from("employees").select("id, full_name, is_demo, owner_id").eq("owner_id", user.id),
      sb.from("clients").select("id, full_name, is_demo").eq("owner_id", user.id),
    ]);

  const allInvoices = invoicesResult.data ?? [];
  const allJobs = jobsResult.data ?? [];
  const allTimesheets = timesheetsResult.data ?? [];
  const allEmployees = employeesResult.data ?? [];
  const allClients = clientsResult.data ?? [];

  // ── Revenue by month (last 12 months) ────────────────────────────────────
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  // Include paid invoices regardless of whether paid_at is populated;
  // fall back to issue_date so invoices marked paid without a paid_at date
  // still appear in the revenue chart.
  const paidInvoices = excludeDemoFinancial(allInvoices).filter(
    (inv) => inv.status === "paid" && (inv.paid_at ?? inv.issue_date)
  );

  // Build a map of YYYY-MM → revenue
  const revenueByMonth = new Map<string, number>();
  for (const inv of paidInvoices) {
    const dateStr = (inv.paid_at ?? inv.issue_date) as string;
    const d = new Date(dateStr);
    if (d < twelveMonthsAgo) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(inv.total ?? 0));
  }

  // Fill all 12 months (even empty ones) so the chart has a complete x-axis
  const monthLabels: MonthRevenue[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-AU", { month: "short", year: "2-digit" });
    monthLabels.push({ month: label, revenue: revenueByMonth.get(key) ?? 0 });
  }

  // ── Top clients by revenue ────────────────────────────────────────────────
  const clientRevenueMap = new Map<string, number>();
  for (const inv of paidInvoices) {
    if (!inv.client_id) continue;
    clientRevenueMap.set(
      inv.client_id,
      (clientRevenueMap.get(inv.client_id) ?? 0) + Number(inv.total ?? 0)
    );
  }
  const clientNameById = new Map(
    allClients.map((c: { id: string; full_name: string | null }) => [c.id, c.full_name ?? "Unknown"])
  );
  const topClients = Array.from(clientRevenueMap.entries())
    .map(([id, total]) => ({ name: clientNameById.get(id) ?? "Unknown", total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // ── Jobs by status ────────────────────────────────────────────────────────
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
  // Also include any unknown statuses from real data
  for (const [status, count] of jobStatusCounts.entries()) {
    if (!KNOWN_JOB_STATUSES.includes(status)) {
      jobsByStatus.push({ status, count });
    }
  }

  // ── Average invoice value ─────────────────────────────────────────────────
  const valuableInvoices = excludeDemoFinancial(allInvoices).filter((inv) =>
    ["paid", "unpaid", "overdue"].includes((inv.status ?? "").toLowerCase())
  );
  const avgInvoiceValue =
    valuableInvoices.length > 0
      ? valuableInvoices.reduce((sum, inv) => sum + Number(inv.total ?? 0), 0) /
        valuableInvoices.length
      : 0;

  // ── Outstanding vs paid ───────────────────────────────────────────────────
  const now = new Date();
  const invoiceStatusTotals = new Map<string, number>();
  for (const inv of excludeDemoFinancial(allInvoices)) {
    let bucket = (inv.status ?? "draft").toLowerCase();
    // Classify overdue
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

  // ── Employee hours this month ─────────────────────────────────────────────
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

  // ── Empty state check ────────────────────────────────────────────────────
  const isEmpty =
    allInvoices.length === 0 && allJobs.length === 0 && allTimesheets.length === 0;

  const monthLabel = now.toLocaleDateString("en-AU", { month: "long", year: "numeric" });

  return (
    <section className="space-y-6">
      <FirstVisitBanner
        pageKey="reports"
        title="Business performance"
        description="Track revenue trends, job stats, and team productivity. Data updates in real time."
      />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Last 12 months of revenue · jobs · crew utilisation
        </p>
      </div>

      {isEmpty ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center shadow-sm">
          <p className="text-lg font-semibold text-[var(--text-primary)]">No data yet</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Add invoices, jobs, and timesheets to start seeing reports.
          </p>
        </div>
      ) : (
        <>
          {/* Row 1 — Revenue bar chart (full width) */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Revenue — last 12 months
            </h2>
            <RevenueBarChart data={monthLabels} />
          </div>

          {/* Row 2 — Jobs donut + avg invoice value / invoice status pie */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Jobs by status */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Jobs by status
              </h2>
              <p className="mb-3 text-xs text-[var(--text-muted)]">
                {allJobs.length} total job{allJobs.length !== 1 ? "s" : ""}
              </p>
              <JobsDonutChart data={jobsByStatus} />
            </div>

            {/* Average invoice value + invoice status pie */}
            <div className="flex flex-col gap-4">
              {/* Avg invoice stat */}
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

              {/* Invoice status pie */}
              <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Invoice breakdown by value
                </h2>
                <InvoiceStatusPieChart data={invoiceStatusData} />
              </div>
            </div>
          </div>

          {/* Row 3 — Top clients + Employee hours */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top clients by revenue */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Top clients by revenue
              </h2>
              {topClients.length === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--text-muted)]">
                  No paid invoices with client data.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      <th className="pb-2 pr-3">Client</th>
                      <th className="pb-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClients.map((c, i) => (
                      <tr
                        key={i}
                        className="border-b border-[var(--border)] last:border-0"
                      >
                        <td className="py-2 pr-3 font-medium text-[var(--text-primary)]">
                          {c.name}
                        </td>
                        <td className="py-2 text-right font-semibold text-[var(--text-primary)]">
                          {formatAud(c.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Employee hours this month */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Employee hours — {monthLabel}
              </h2>
              {employeeHours.length === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--text-muted)]">
                  No timesheet entries this month.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      <th className="pb-2 pr-3">Employee</th>
                      <th className="pb-2 text-right">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeHours.map((e, i) => (
                      <tr
                        key={i}
                        className="border-b border-[var(--border)] last:border-0"
                      >
                        <td className="py-2 pr-3 font-medium text-[var(--text-primary)]">
                          {e.name}
                        </td>
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
        </>
      )}
    </section>
  );
}
