import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: { token: string };
};

export default async function ClientPortalPage({ params }: Props) {
  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name, email")
    .eq("portal_token", params.token)
    .maybeSingle();

  if (!client) return notFound();

  const [{ data: jobs }, { data: quotes }, { data: invoices }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, status, scheduled_date")
      .eq("client_id", client.id)
      .order("scheduled_date", { ascending: false }),
    supabase
      .from("quotes")
      .select("id, quote_number, total, status, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, invoice_number, amount, status, due_date")
      .eq("client_id", client.id)
      .order("due_date", { ascending: true })
  ]);

  async function acceptQuoteAction(formData: FormData) {
    "use server";
    const quoteId = String(formData.get("quote_id") ?? "");
    const token = String(formData.get("token") ?? "");
    const sb = await createClient();
    const { data: tokenClient } = await sb.from("clients").select("id").eq("portal_token", token).maybeSingle();
    if (!tokenClient) return;
    await sb.from("quotes").update({ status: "accepted" }).eq("id", quoteId).eq("client_id", tokenClient.id);
  }

  async function declineQuoteAction(formData: FormData) {
    "use server";
    const quoteId = String(formData.get("quote_id") ?? "");
    const token = String(formData.get("token") ?? "");
    const sb = await createClient();
    const { data: tokenClient } = await sb.from("clients").select("id").eq("portal_token", token).maybeSingle();
    if (!tokenClient) return;
    await sb.from("quotes").update({ status: "declined" }).eq("id", quoteId).eq("client_id", tokenClient.id);
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <section className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Client Portal</h1>
          <p className="text-sm text-[#64748b]">{client.full_name ?? client.email ?? "Client"}</p>
        </div>

        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">Pending Quotes</h2>
          <div className="mt-3 space-y-2 text-sm">
            {(quotes ?? []).map((quote) => (
              <div key={quote.id} className="rounded border p-3">
                <p className="font-medium">{quote.quote_number ?? "Quote"} · ${Number(quote.total ?? 0).toFixed(2)}</p>
                <p className="text-[#64748b] capitalize">{quote.status ?? "draft"}</p>
                {(quote.status ?? "").toLowerCase() !== "accepted" ? (
                  <div className="mt-2 flex gap-2">
                    <form action={acceptQuoteAction}>
                      <input type="hidden" name="quote_id" value={quote.id} />
                      <input type="hidden" name="token" value={params.token} />
                      <button type="submit" className="rounded bg-[#22c55e] px-3 py-1 text-xs text-white">Accept</button>
                    </form>
                    <form action={declineQuoteAction}>
                      <input type="hidden" name="quote_id" value={quote.id} />
                      <input type="hidden" name="token" value={params.token} />
                      <button type="submit" className="rounded bg-[#ef4444] px-3 py-1 text-xs text-white">Decline</button>
                    </form>
                  </div>
                ) : null}
              </div>
            ))}
            {(quotes ?? []).length === 0 ? <p className="text-[#64748b]">No quotes available.</p> : null}
          </div>
        </article>

        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">Unpaid Invoices</h2>
          <div className="mt-3 space-y-2 text-sm">
            {(invoices ?? [])
              .filter((invoice) => (invoice.status ?? "").toLowerCase() !== "paid")
              .map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <p className="font-medium">{invoice.invoice_number ?? "Invoice"}</p>
                    <p className="text-[#64748b]">${Number(invoice.amount ?? 0).toFixed(2)}</p>
                  </div>
                  <a
                    href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "#"}
                    className="rounded bg-[var(--accent-color)] px-3 py-1 text-xs text-white hover:bg-[var(--accent-hover)]"
                  >
                    Pay Now
                  </a>
                </div>
              ))}
          </div>
        </article>

        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">Job History</h2>
          <div className="mt-3 space-y-2 text-sm">
            {(jobs ?? []).map((job) => (
              <div key={job.id} className="rounded border p-3">
                <p className="font-medium">{job.title ?? "Job"}</p>
                <p className="text-[#64748b]">
                  {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString("en-AU") : "-"} · {job.status ?? "scheduled"}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

