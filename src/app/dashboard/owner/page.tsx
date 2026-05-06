import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOwnerDashboardData } from "@/lib/dashboard/owner";
import { invoiceReminderEmailTemplate, quoteFollowUpEmailTemplate, sendEmail } from "@/lib/email";
import RevenueSparkline from "@/components/dashboard/revenue-sparkline";
import OwnerDashboardQuickActions from "@/components/dashboard/owner-dashboard-quick-actions";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);
}

function getStatusBadgeClasses(status: string | null) {
  const key = (status ?? "").toLowerCase();
  if (key === "completed" || key === "complete") return "bg-green-100 text-green-700";
  if (key === "in_progress" || key === "in-progress") return "bg-orange-100 text-orange-700";
  if (key === "cancelled") return "bg-red-100 text-red-700";
  return "bg-blue-100 text-blue-700";
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
    sb.from("profiles").select("trial_end").eq("id", user.id).maybeSingle(),
    getOwnerDashboardData(user.id)
  ]);

  const trialEnd = profile?.trial_end ?? null;

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
    recentActivity
  } = dashboardData;

  const sparkLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-AU", { weekday: "short" });
  });
  const trialDaysRemaining = trialEnd
    ? Math.max(
        0,
        Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : 0;

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
      .select("invoice_number, amount, due_date, client_id")
      .eq("id", invoiceId)
      .eq("owner_id", owner.id)
      .maybeSingle();
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
      .select("quote_number, created_at, client_id")
      .eq("id", quoteId)
      .eq("owner_id", owner.id)
      .maybeSingle();
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

  return (
    <section className="space-y-6">
      {trialDaysRemaining > 0 ? (
        <div className="rounded-lg border border-sky-200 bg-sky-100 px-4 py-3 text-sm text-sky-900">
          {trialDaysRemaining} days remaining in your free trial -{" "}
          <a href="/dashboard/owner/settings" className="font-semibold underline">
            Upgrade now
          </a>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Trial expired -{" "}
          <a href="/dashboard/owner/settings" className="font-semibold underline">
            upgrade to continue
          </a>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">Owner Dashboard</h1>
        <p className="text-sm text-slate-400">Track operational performance in real time.</p>
      </div>

      {metrics.activeClientsCount === 0 && recentJobs.length === 0 ? (
        <article className="rounded-xl border border-[#2a4a6b] bg-[#1a2f45] p-4">
          <h2 className="text-lg font-semibold text-white">Getting Started Checklist</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            <li>1. <a href="/dashboard/owner/clients" className="font-medium text-white underline">Add your first client</a></li>
            <li>2. <a href="/dashboard/owner/jobs" className="font-medium text-white underline">Create your first job</a></li>
            <li>3. <a href="/dashboard/owner/quotes" className="font-medium text-white underline">Send your first quote</a></li>
            <li>4. <a href="/dashboard/owner/invoices" className="font-medium text-white underline">Create your first invoice</a></li>
            <li>5. <a href="/dashboard/owner/settings" className="font-medium text-white underline">Complete your business settings</a></li>
          </ul>
        </article>
      ) : null}

      <OwnerDashboardQuickActions />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Jobs by status</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-100">
          Pending · {jobsByStatus.pending}
        </span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900 dark:bg-sky-950 dark:text-sky-100">
          In progress · {jobsByStatus.inProgress}
        </span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          Completed · {jobsByStatus.completed}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="dashboard-card rounded-xl border-l-4 border-l-[#0db8c8] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Revenue This Month</p>
          <p className="mt-2 text-3xl font-bold text-teal-400">{formatCurrency(metrics.revenueThisMonth)}</p>
          <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Paid invoices — last 7 days
          </p>
          <RevenueSparkline values={revenueLast7Days} labels={sparkLabels} />
        </article>
        <article className="dashboard-card rounded-xl border-l-4 border-l-[#0db8c8] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Outstanding</p>
          <p className="mt-2 text-3xl font-bold text-teal-400">{formatCurrency(metrics.outstandingAmount)}</p>
        </article>
        <article className="dashboard-card rounded-xl border-l-4 border-l-[#0db8c8] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Jobs Completed This Week</p>
          <p className="mt-2 text-3xl font-bold text-teal-400">{metrics.jobsCompletedThisWeek}</p>
        </article>
        <article className="dashboard-card rounded-xl border-l-4 border-l-[#0db8c8] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Active Clients</p>
          <p className="mt-2 text-3xl font-bold text-teal-400">{metrics.activeClientsCount}</p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">This Week at a Glance</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Scheduled jobs for today and tomorrow.</p>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-[#0db8c8]">Today</h3>
              <ul className="mt-2 space-y-2 text-sm text-[var(--text-secondary)]">
                {glanceToday.length === 0 ? (
                  <li className="text-[var(--text-muted)]">No jobs scheduled.</li>
                ) : (
                  glanceToday.map((job) => (
                    <li key={job.id} className="rounded border border-[var(--border)] px-3 py-2">
                      <p className="font-medium text-[var(--text-primary)]">{job.title ?? "Untitled job"}</p>
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
              <h3 className="text-sm font-semibold text-[#0db8c8]">Tomorrow</h3>
              <ul className="mt-2 space-y-2 text-sm text-[var(--text-secondary)]">
                {glanceTomorrow.length === 0 ? (
                  <li className="text-[var(--text-muted)]">No jobs scheduled.</li>
                ) : (
                  glanceTomorrow.map((job) => (
                    <li key={job.id} className="rounded border border-[var(--border)] px-3 py-2">
                      <p className="font-medium text-[var(--text-primary)]">{job.title ?? "Untitled job"}</p>
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

        <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent activity</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Latest jobs, clients, invoices and quotes.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {recentActivity.length === 0 ? (
              <li className="text-[var(--text-muted)]">No recent activity yet.</li>
            ) : (
              recentActivity.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-2 rounded border border-[var(--border)] px-3 py-2"
                >
                  <span className="text-[var(--text-primary)]">{item.label}</span>
                  <span className="shrink-0 text-xs capitalize text-[var(--text-muted)]">{item.kind}</span>
                </li>
              ))
            )}
          </ul>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-white">Recent Jobs</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b text-left text-slate-300">
                  <th className="px-2 py-2 font-medium">Title</th>
                  <th className="px-2 py-2 font-medium">Client</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.length === 0 ? (
                  <tr>
                    <td className="px-2 py-4 text-slate-400" colSpan={4}>
                      No jobs found.
                    </td>
                  </tr>
                ) : (
                  recentJobs.map((job) => (
                    <tr key={job.id} className="border-b">
                      <td className="px-2 py-2 font-medium">{job.title ?? "Untitled job"}</td>
                      <td className="px-2 py-2">{job.client_name ?? "-"}</td>
                      <td className="px-2 py-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClasses(job.status ?? null)}`}>
                          {job.status ?? "pending"}
                        </span>
                      </td>
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
          <h2 className="text-lg font-semibold text-white">Top Clients</h2>
          <div className="mt-3 space-y-2 text-sm">
            {topClients.map((client, idx) => (
              <div key={`${client.client_name}-${idx}`} className="flex items-center justify-between rounded border px-3 py-2">
                <p>{client.client_name}</p>
                <p className="font-semibold">{formatCurrency(client.total)}</p>
              </div>
            ))}
            {topClients.length === 0 ? <p className="text-slate-400">No client revenue data yet.</p> : null}
          </div>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-white">Chase Invoices</h2>
          <div className="mt-3 space-y-2 text-sm">
            {chaseInvoices.map((invoice: any) => (
              <div key={invoice.id} className="rounded border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{invoice.invoice_number ?? "Invoice"} - {invoice.client_name}</p>
                  <form action={sendInvoiceReminderAction}>
                    <input type="hidden" name="invoice_id" value={invoice.id} />
                    <button type="submit" className="rounded border px-2 py-1 text-xs">Send Reminder</button>
                  </form>
                </div>
                <p className="text-slate-200">
                  {formatCurrency(Number(invoice.amount ?? 0))} · Due{" "}
                  {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-AU") : "-"}
                </p>
                <p className="text-xs text-slate-400">
                  {invoice.last_reminder_sent
                    ? `Reminder sent ${Math.max(
                        0,
                        Math.floor((Date.now() - new Date(invoice.last_reminder_sent).getTime()) / (1000 * 60 * 60 * 24))
                      )} days ago`
                    : "No reminder sent yet"}
                </p>
              </div>
            ))}
            {chaseInvoices.length === 0 ? <p className="text-slate-400">No unpaid invoices.</p> : null}
          </div>
        </article>

        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-white">Follow Up Needed (Quotes)</h2>
          <div className="mt-3 space-y-2 text-sm">
            {quotesFollowUp.map((quote: any) => (
              <div key={quote.id} className="rounded border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{quote.quote_number ?? "Quote"} - {quote.client_name}</p>
                  <form action={sendQuoteReminderAction}>
                    <input type="hidden" name="quote_id" value={quote.id} />
                    <button type="submit" className="rounded border px-2 py-1 text-xs">Send Reminder</button>
                  </form>
                </div>
                <p className="text-slate-200">
                  Created {quote.created_at ? new Date(quote.created_at).toLocaleDateString("en-AU") : "-"} ·{" "}
                  {quote.status ?? "pending"}
                </p>
              </div>
            ))}
            {quotesFollowUp.length === 0 ? <p className="text-slate-400">No quote follow-ups needed.</p> : null}
          </div>
        </article>
      </div>
    </section>
  );
}


