import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClientContext } from "@/lib/dashboard/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  pending:     "bg-yellow-100 text-yellow-800",
  scheduled:   "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed:   "bg-green-100 text-green-800",
  cancelled:   "bg-gray-100 text-gray-500",
  draft:       "bg-gray-100 text-gray-600",
  sent:        "bg-blue-100 text-blue-700",
  accepted:    "bg-green-100 text-green-700",
  declined:    "bg-red-100 text-red-700",
  expired:     "bg-orange-100 text-orange-700",
  paid:        "bg-emerald-100 text-emerald-700",
  overdue:     "bg-red-100 text-red-800",
  unpaid:      "bg-yellow-100 text-yellow-800",
};

function fmtDate(d: string | null) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ClientDashboardPage() {
  const { user, clientIds } = await getClientContext();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();
  const ids = clientIds.length > 0 ? clientIds : ["__none__"];

  const [{ data: jobs }, { data: quotes }, { data: invoices }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, status, scheduled_date, scheduled_start, address, suburb")
      .in("client_id", ids)
      .order("scheduled_date", { ascending: true })
      .limit(20),
    supabase
      .from("quotes")
      .select("id, quote_number, total, status, created_at, public_token")
      .in("client_id", ids)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("invoices")
      .select("id, invoice_number, total, due_date, status, stripe_payment_link")
      .in("client_id", ids)
      .order("due_date", { ascending: true })
      .limit(20),
  ]);

  const unpaidInvoices = (invoices ?? []).filter((i: any) => i.status === "unpaid" || i.status === "overdue");
  const pendingQuotes = (quotes ?? []).filter((q: any) => q.status === "sent" || q.status === "pending");
  const upcomingJobs = (jobs ?? []).filter((j: any) => j.status !== "completed" && j.status !== "cancelled");

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>My Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Track your scheduled jobs, quotes, and invoices.</p>
      </div>

      {/* Action required banner */}
      {(unpaidInvoices.length > 0 || pendingQuotes.length > 0) && (
        <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--bg-card)", border: "2px solid var(--accent-color)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>⚡ Action required</p>
          {unpaidInvoices.length > 0 && (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              You have {unpaidInvoices.length} unpaid invoice{unpaidInvoices.length !== 1 ? "s" : ""} totalling{" "}
              <strong>${unpaidInvoices.reduce((s: number, i: any) => s + Number(i.total ?? 0), 0).toFixed(2)}</strong>
            </p>
          )}
          {pendingQuotes.length > 0 && (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              You have {pendingQuotes.length} quote{pendingQuotes.length !== 1 ? "s" : ""} awaiting your approval
            </p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 grid-cols-3">
        {[
          { label: "Upcoming jobs", value: upcomingJobs.length },
          { label: "Pending quotes", value: pendingQuotes.length },
          { label: "Unpaid invoices", value: unpaidInvoices.length },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Jobs */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>My Jobs</h2>
          {(jobs ?? []).length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No jobs yet</p>
          ) : (
            <div className="space-y-2">
              {(jobs ?? []).slice(0, 6).map((job: any) => (
                <div key={job.id} className="rounded-lg p-2.5" style={{ background: "var(--bg-secondary)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{job.title ?? "Untitled"}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_BADGE[job.status ?? "scheduled"] ?? "bg-gray-100 text-gray-600"}`}>
                      {job.status ?? "scheduled"}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {fmtDate(job.scheduled_date)}
                    {job.suburb ? ` · ${job.suburb}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quotes */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>My Quotes</h2>
          {(quotes ?? []).length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No quotes yet</p>
          ) : (
            <div className="space-y-2">
              {(quotes ?? []).slice(0, 6).map((quote: any) => (
                <div key={quote.id} className="rounded-lg p-2.5" style={{ background: "var(--bg-secondary)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{quote.quote_number ?? "Quote"}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_BADGE[quote.status ?? "draft"] ?? "bg-gray-100 text-gray-600"}`}>
                      {quote.status ?? "draft"}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>${Number(quote.total ?? 0).toFixed(2)}</p>
                  {quote.public_token && (quote.status === "sent" || quote.status === "pending") && (
                    <Link
                      href={`/q/${quote.public_token}`}
                      className="mt-1.5 inline-block text-xs font-medium px-2 py-1 rounded"
                      style={{ background: "var(--accent-color)", color: "#fff" }}
                    >
                      View &amp; Sign →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>My Invoices</h2>
          {(invoices ?? []).length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No invoices yet</p>
          ) : (
            <div className="space-y-2">
              {(invoices ?? []).slice(0, 6).map((invoice: any) => (
                <div key={invoice.id} className="rounded-lg p-2.5" style={{ background: "var(--bg-secondary)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{invoice.invoice_number ?? "Invoice"}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_BADGE[invoice.status ?? "unpaid"] ?? "bg-gray-100 text-gray-600"}`}>
                      {invoice.status ?? "unpaid"}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    ${Number(invoice.total ?? 0).toFixed(2)}
                    {invoice.due_date ? ` · Due ${fmtDate(invoice.due_date)}` : ""}
                  </p>
                  {invoice.stripe_payment_link && (invoice.status === "unpaid" || invoice.status === "overdue") && (
                    <a
                      href={invoice.stripe_payment_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-block text-xs font-medium px-2 py-1 rounded"
                      style={{ background: "#22C55E", color: "#fff" }}
                    >
                      Pay Now →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

