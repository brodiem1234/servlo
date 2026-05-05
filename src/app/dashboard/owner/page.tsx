import { redirect } from "next/navigation";
import { getOwnerContext, getOwnerDashboardData } from "@/lib/dashboard/owner";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);
}

export default async function OwnerDashboardPage() {
  const { user, trialEnd } = await getOwnerContext();

  if (!user) {
    redirect("/auth/login");
  }

  const { metrics, recentJobs, recentInvoices } = await getOwnerDashboardData(user.id);
  const trialDaysRemaining = trialEnd
    ? Math.max(
        0,
        Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-sky-200 bg-sky-100 px-4 py-3 text-sm text-sky-900">
        {trialDaysRemaining} days remaining in your free trial -{" "}
        <a href="/dashboard/owner/settings" className="font-semibold underline">
          Upgrade now
        </a>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f] md:text-3xl">Owner Dashboard</h1>
        <p className="text-sm text-slate-600">Track operational performance in real time.</p>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1e3a5f]">Quick Actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/dashboard/owner/jobs" className="rounded bg-[#1e3a5f] px-4 py-2 text-sm text-white">
            New Job
          </a>
          <a href="/dashboard/owner/clients" className="rounded bg-[#3b82f6] px-4 py-2 text-sm text-white">
            New Client
          </a>
          <a href="/dashboard/owner/invoices" className="rounded border px-4 py-2 text-sm">
            New Invoice
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Jobs</p>
          <p className="mt-2 text-3xl font-bold text-[#1e3a5f]">{metrics.totalJobs}</p>
        </article>
        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Clients</p>
          <p className="mt-2 text-3xl font-bold text-[#1e3a5f]">{metrics.totalClients}</p>
        </article>
        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Revenue This Month</p>
          <p className="mt-2 text-3xl font-bold text-[#1e3a5f]">
            {formatCurrency(metrics.revenueThisMonth)}
          </p>
        </article>
        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Overdue Invoices</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{metrics.overdueInvoices}</p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">Recent Jobs</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="px-2 py-2 font-medium">Title</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.length === 0 ? (
                  <tr>
                    <td className="px-2 py-4 text-slate-500" colSpan={3}>
                      No jobs found.
                    </td>
                  </tr>
                ) : (
                  recentJobs.map((job) => (
                    <tr key={job.id} className="border-b">
                      <td className="px-2 py-2 font-medium">{job.title ?? "Untitled job"}</td>
                      <td className="px-2 py-2">{job.status ?? "pending"}</td>
                      <td className="px-2 py-2">
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

        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">Recent Invoices</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="px-2 py-2 font-medium">Invoice #</th>
                  <th className="px-2 py-2 font-medium">Amount</th>
                  <th className="px-2 py-2 font-medium">Due date</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td className="px-2 py-4 text-slate-500" colSpan={4}>
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b">
                      <td className="px-2 py-2 font-medium">{invoice.invoice_number ?? "-"}</td>
                      <td className="px-2 py-2">{formatCurrency(Number(invoice.amount ?? 0))}</td>
                      <td className="px-2 py-2">
                        {invoice.due_date
                          ? new Date(invoice.due_date).toLocaleDateString("en-AU")
                          : "-"}
                      </td>
                      <td className="px-2 py-2">{invoice.status ?? "draft"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}


