import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClientContext } from "@/lib/dashboard/client";

export default async function ClientDashboardPage() {
  const { user, clientIds } = await getClientContext();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();
  const ids = clientIds.length > 0 ? clientIds : ["__none__"];

  const [{ data: jobs }, { data: quotes }, { data: invoices }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, status, scheduled_date, scheduled_start, scheduled_end")
      .in("client_id", ids)
      .order("scheduled_date", { ascending: true }),
    supabase
      .from("quotes")
      .select("id, quote_number, total, status, created_at")
      .in("client_id", ids)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, invoice_number, amount, due_date, status")
      .in("client_id", ids)
      .order("due_date", { ascending: true })
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">My Dashboard</h1>
        <p className="text-sm text-[#64748b]">Track your scheduled jobs, quotes, and invoices.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border-l-4 border-l-[var(--accent-color)] border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-[#64748b]">My jobs</p>
          <p className="mt-1 text-2xl font-bold text-[#1e3a5f]">{jobs?.length ?? 0}</p>
        </article>
        <article className="rounded-xl border-l-4 border-l-[var(--accent-color)] border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-[#64748b]">Quotes</p>
          <p className="mt-1 text-2xl font-bold text-[#1e3a5f]">{quotes?.length ?? 0}</p>
        </article>
        <article className="rounded-xl border-l-4 border-l-[var(--accent-color)] border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-[#64748b]">Invoices</p>
          <p className="mt-1 text-2xl font-bold text-[#1e3a5f]">{invoices?.length ?? 0}</p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-xl border bg-white p-4 shadow-sm xl:col-span-1">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">My Jobs</h2>
          <div className="mt-3 space-y-2 text-sm">
            {(jobs ?? []).slice(0, 8).map((job) => (
              <div key={job.id} className="rounded border p-2">
                <p className="font-medium">{job.title ?? "Untitled job"}</p>
                <p className="text-[#64748b]">
                  {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString("en-AU") : "No date"} ·{" "}
                  {job.status ?? "scheduled"}
                </p>
              </div>
            ))}
            {(jobs ?? []).length === 0 ? <p className="text-[#64748b]">No jobs assigned yet.</p> : null}
          </div>
        </article>

        <article className="rounded-xl border bg-white p-4 shadow-sm xl:col-span-1">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">My Quotes</h2>
          <div className="mt-3 space-y-2 text-sm">
            {(quotes ?? []).slice(0, 8).map((quote) => (
              <div key={quote.id} className="rounded border p-2">
                <p className="font-medium">{quote.quote_number ?? "Quote"}</p>
                <p className="text-[#64748b]">
                  ${Number(quote.total ?? 0).toFixed(2)} · {quote.status ?? "draft"}
                </p>
              </div>
            ))}
            {(quotes ?? []).length === 0 ? <p className="text-[#64748b]">No quotes yet.</p> : null}
          </div>
        </article>

        <article className="rounded-xl border bg-white p-4 shadow-sm xl:col-span-1">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">My Invoices</h2>
          <div className="mt-3 space-y-2 text-sm">
            {(invoices ?? []).slice(0, 8).map((invoice) => (
              <div key={invoice.id} className="rounded border p-2">
                <p className="font-medium">{invoice.invoice_number ?? "Invoice"}</p>
                <p className="text-[#64748b]">
                  ${Number(invoice.amount ?? 0).toFixed(2)} · {invoice.status ?? "draft"}
                </p>
              </div>
            ))}
            {(invoices ?? []).length === 0 ? <p className="text-[#64748b]">No invoices yet.</p> : null}
          </div>
        </article>
      </div>
    </section>
  );
}

