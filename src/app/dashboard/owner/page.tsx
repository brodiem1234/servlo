import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOwnerContext, getOwnerDashboardData } from "@/lib/dashboard/owner";
import { invoiceReminderEmailTemplate, quoteFollowUpEmailTemplate, sendEmail } from "@/lib/email";

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
  const { user, trialEnd } = await getOwnerContext();

  if (!user) {
    redirect("/auth/login");
  }

  const { metrics, recentJobs, topClients, chaseInvoices, quotesFollowUp } = await getOwnerDashboardData(user.id);
  const trialDaysRemaining = trialEnd
    ? Math.max(
        0,
        Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  async function sendInvoiceReminderAction(formData: FormData) {
    "use server";
    const { user: owner } = await getOwnerContext();
    if (!owner) redirect("/auth/login");
    const invoiceId = String(formData.get("invoice_id") ?? "");
    const sb = await createClient();
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
    const { user: owner } = await getOwnerContext();
    if (!owner) redirect("/auth/login");
    const quoteId = String(formData.get("quote_id") ?? "");
    const sb = await createClient();
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
        <h1 className="text-2xl font-bold text-[#1e3a5f] md:text-3xl">Owner Dashboard</h1>
        <p className="text-sm text-[#64748b]">Track operational performance in real time.</p>
      </div>

      {metrics.activeClientsCount === 0 && recentJobs.length === 0 ? (
        <article className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">Getting Started Checklist</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>1. <a href="/dashboard/owner/clients" className="font-medium text-[#1e3a5f] underline">Add your first client</a></li>
            <li>2. <a href="/dashboard/owner/jobs" className="font-medium text-[#1e3a5f] underline">Create your first job</a></li>
            <li>3. <a href="/dashboard/owner/quotes" className="font-medium text-[#1e3a5f] underline">Send your first quote</a></li>
            <li>4. <a href="/dashboard/owner/invoices" className="font-medium text-[#1e3a5f] underline">Create your first invoice</a></li>
            <li>5. <a href="/dashboard/owner/settings" className="font-medium text-[#1e3a5f] underline">Complete your business settings</a></li>
          </ul>
        </article>
      ) : null}

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1e3a5f]">Quick Actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/dashboard/owner/jobs" className="rounded bg-[#0db8c8] px-4 py-2 text-sm text-white hover:bg-[#0a9dab]">
            New Job
          </a>
          <a href="/dashboard/owner/clients" className="rounded bg-[#0db8c8] px-4 py-2 text-sm text-white hover:bg-[#0a9dab]">
            New Client
          </a>
          <a href="/dashboard/owner/invoices" className="rounded border border-[#1e3a5f] px-4 py-2 text-sm text-[#1e3a5f]">
            New Invoice
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border-l-4 border-l-[#0db8c8] border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Revenue This Month</p>
          <p className="mt-2 text-3xl font-bold text-[#1e3a5f]">{formatCurrency(metrics.revenueThisMonth)}</p>
        </article>
        <article className="rounded-xl border-l-4 border-l-[#0db8c8] border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Outstanding</p>
          <p className="mt-2 text-3xl font-bold text-[#ef4444]">{formatCurrency(metrics.outstandingAmount)}</p>
        </article>
        <article className="rounded-xl border-l-4 border-l-[#0db8c8] border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Jobs Completed This Week</p>
          <p className="mt-2 text-3xl font-bold text-[#1e3a5f]">{metrics.jobsCompletedThisWeek}</p>
        </article>
        <article className="rounded-xl border-l-4 border-l-[#0db8c8] border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Active Clients</p>
          <p className="mt-2 text-3xl font-bold text-[#1e3a5f]">{metrics.activeClientsCount}</p>
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
                  <th className="px-2 py-2 font-medium">Client</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.length === 0 ? (
                  <tr>
                    <td className="px-2 py-4 text-slate-500" colSpan={4}>
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
          <h2 className="text-lg font-semibold text-[#1e3a5f]">Top Clients</h2>
          <div className="mt-3 space-y-2 text-sm">
            {topClients.map((client, idx) => (
              <div key={`${client.client_name}-${idx}`} className="flex items-center justify-between rounded border px-3 py-2">
                <p>{client.client_name}</p>
                <p className="font-semibold">{formatCurrency(client.total)}</p>
              </div>
            ))}
            {topClients.length === 0 ? <p className="text-slate-500">No client revenue data yet.</p> : null}
          </div>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">Chase Invoices</h2>
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
                <p className="text-slate-600">
                  {formatCurrency(Number(invoice.amount ?? 0))} · Due{" "}
                  {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-AU") : "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {invoice.last_reminder_sent
                    ? `Reminder sent ${Math.max(
                        0,
                        Math.floor((Date.now() - new Date(invoice.last_reminder_sent).getTime()) / (1000 * 60 * 60 * 24))
                      )} days ago`
                    : "No reminder sent yet"}
                </p>
              </div>
            ))}
            {chaseInvoices.length === 0 ? <p className="text-slate-500">No unpaid invoices.</p> : null}
          </div>
        </article>

        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">Follow Up Needed (Quotes)</h2>
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
                <p className="text-slate-600">
                  Created {quote.created_at ? new Date(quote.created_at).toLocaleDateString("en-AU") : "-"} ·{" "}
                  {quote.status ?? "pending"}
                </p>
              </div>
            ))}
            {quotesFollowUp.length === 0 ? <p className="text-slate-500">No quote follow-ups needed.</p> : null}
          </div>
        </article>
      </div>
    </section>
  );
}


