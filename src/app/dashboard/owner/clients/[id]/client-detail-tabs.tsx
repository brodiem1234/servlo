"use client";

import { useState } from "react";

type ClientInfo = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status?: string | null;
  source?: string | null;
  client_type?: string | null;
  company_name: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  notes: string | null;
};

type Job = {
  id: string;
  title: string | null;
  status: string | null;
  scheduled_date: string | null;
};

type Invoice = {
  id: string;
  invoice_number: string | null;
  amount: number | null;
  status: string | null;
  due_date: string | null;
};

type Quote = {
  id: string;
  quote_number: string | null;
  total: number | null;
  status: string | null;
  created_at: string | null;
};

type Props = {
  client: ClientInfo;
  jobs: Job[];
  invoices: Invoice[];
  quotes: Quote[];
};

export default function ClientDetailTabs({ client, jobs, invoices, quotes }: Props) {
  const [tab, setTab] = useState<"overview" | "jobs" | "invoices" | "quotes">("overview");

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white p-1 text-sm w-fit">
        <button onClick={() => setTab("overview")} className={`rounded px-3 py-1 ${tab === "overview" ? "bg-[#3b82f6] text-white" : ""}`}>Overview</button>
        <button onClick={() => setTab("jobs")} className={`rounded px-3 py-1 ${tab === "jobs" ? "bg-[#3b82f6] text-white" : ""}`}>Jobs</button>
        <button onClick={() => setTab("invoices")} className={`rounded px-3 py-1 ${tab === "invoices" ? "bg-[#3b82f6] text-white" : ""}`}>Invoices</button>
        <button onClick={() => setTab("quotes")} className={`rounded px-3 py-1 ${tab === "quotes" ? "bg-[#3b82f6] text-white" : ""}`}>Quotes</button>
      </div>

      {tab === "overview" ? (
        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Name</dt><dd className="font-medium">{client.full_name ?? "-"}</dd></div>
            <div><dt className="text-slate-500">Email</dt><dd className="font-medium">{client.email ?? "-"}</dd></div>
            <div><dt className="text-slate-500">Phone</dt><dd className="font-medium">{client.phone ?? "-"}</dd></div>
            <div><dt className="text-slate-500">Company</dt><dd className="font-medium">{client.company_name ?? "-"}</dd></div>
            <div><dt className="text-slate-500">Type</dt><dd className="font-medium capitalize">{client.client_type ?? "customer"}</dd></div>
            <div><dt className="text-slate-500">Status</dt><dd className="font-medium capitalize">{client.status ?? "active"}</dd></div>
            <div><dt className="text-slate-500">Source</dt><dd className="font-medium capitalize">{client.source ?? "other"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-500">Address</dt><dd className="font-medium">{[client.address, client.suburb, client.state, client.postcode].filter(Boolean).join(", ") || "-"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-500">Notes</dt><dd className="font-medium">{client.notes ?? "-"}</dd></div>
          </dl>
        </article>
      ) : null}

      {tab === "jobs" ? (
        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">Linked Jobs</h3>
          <div className="space-y-2 text-sm">
            {jobs.map((job) => (
              <div key={job.id} className="rounded border p-2">
                <p className="font-medium">{job.title ?? "Untitled job"}</p>
                <p className="text-slate-600">
                  {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString("en-AU") : "-"} · {job.status ?? "scheduled"}
                </p>
              </div>
            ))}
            {jobs.length === 0 ? <p className="text-slate-500">No linked jobs.</p> : null}
          </div>
        </article>
      ) : null}

      {tab === "invoices" ? (
        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">Linked Invoices</h3>
          <div className="space-y-2 text-sm">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="rounded border p-2">
                <p className="font-medium">{invoice.invoice_number ?? "Invoice"}</p>
                <p className="text-slate-600">
                  ${Number(invoice.amount ?? 0).toFixed(2)} · {invoice.status ?? "draft"}
                </p>
              </div>
            ))}
            {invoices.length === 0 ? <p className="text-slate-500">No linked invoices.</p> : null}
          </div>
        </article>
      ) : null}

      {tab === "quotes" ? (
        <article className="rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">Linked Quotes</h3>
          <div className="space-y-2 text-sm">
            {quotes.map((quote) => (
              <div key={quote.id} className="rounded border p-2">
                <p className="font-medium">{quote.quote_number ?? "Quote"}</p>
                <p className="text-slate-600">
                  ${Number(quote.total ?? 0).toFixed(2)} · {quote.status ?? "draft"}
                </p>
              </div>
            ))}
            {quotes.length === 0 ? <p className="text-slate-500">No linked quotes.</p> : null}
          </div>
        </article>
      ) : null}
    </div>
  );
}

