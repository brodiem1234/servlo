"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ClientNotesTab from "./client-notes-tab";
import ClientPropertiesTab from "./client-properties-tab";

type ClientInfo = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  status?: string | null;
  source?: string | null;
  client_type?: string | null;
  company_name: string | null;
  abn?: string | null;
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
  materials_cost?: number | null;
  labour_hours?: number | null;
  hourly_rate?: number | null;
};

type Invoice = {
  id: string;
  invoice_number: string | null;
  total: number | null;
  status: string | null;
  due_date: string | null;
  created_at?: string | null;
};

type Quote = {
  id: string;
  quote_number: string | null;
  total: number | null;
  status: string | null;
  created_at: string | null;
};

type Stats = {
  totalJobs: number;
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
};

type Props = {
  client: ClientInfo;
  jobs: Job[];
  invoices: Invoice[];
  quotes: Quote[];
  stats: Stats;
  updateNotesAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  acceptQuoteAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  declineQuoteAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
};

type TabKey = "overview" | "jobs" | "invoices" | "quotes" | "notes" | "properties" | "activity";

function fmt(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2 });
}

function relativeDate(iso: string | null) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString("en-AU");
}

function statusBadge(status: string | null, type: "job" | "invoice" | "quote") {
  const s = (status ?? "").toLowerCase();
  if (type === "job") {
    const map: Record<string, string> = {
      scheduled: "bg-orange-100 text-orange-900 ring-1 ring-orange-300 dark:bg-orange-950 dark:text-orange-100 dark:ring-orange-700",
      in_progress: "bg-sky-100 text-sky-950 ring-1 ring-sky-300 dark:bg-sky-950 dark:text-sky-100 dark:ring-sky-700",
      completed: "bg-green-100 text-green-900 ring-1 ring-green-300 dark:bg-green-950 dark:text-green-100 dark:ring-green-700",
      cancelled: "bg-red-100 text-red-900 ring-1 ring-red-300 dark:bg-red-950 dark:text-red-100 dark:ring-red-700",
    };
    return map[s] ?? map.scheduled;
  }
  if (type === "invoice") {
    if (s === "paid") return "bg-green-100 text-green-900 ring-1 ring-green-300 dark:bg-green-950 dark:text-green-100 dark:ring-green-700";
    if (s === "overdue") return "bg-red-100 text-red-900 ring-1 ring-red-300 dark:bg-red-950 dark:text-red-100 dark:ring-red-700";
    return "bg-amber-100 text-amber-900 ring-1 ring-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-700";
  }
  // quote
  if (s === "accepted") return "bg-green-100 text-green-900 ring-1 ring-green-300 dark:bg-green-950 dark:text-green-100 dark:ring-green-700";
  if (s === "declined") return "bg-red-100 text-red-900 ring-1 ring-red-300 dark:bg-red-950 dark:text-red-100 dark:ring-red-700";
  return "bg-amber-100 text-amber-900 ring-1 ring-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-700";
}

function clientTypeBadgeClass(t: string | null | undefined) {
  const v = (t ?? "customer").toLowerCase();
  if (v === "supplier") return "bg-sky-100 text-sky-900 ring-1 ring-sky-200 dark:bg-sky-950 dark:text-sky-100 dark:ring-sky-800";
  if (v === "lead") return "bg-violet-100 text-violet-900 ring-1 ring-violet-200 dark:bg-violet-950 dark:text-violet-100 dark:ring-violet-800";
  return "bg-blue-100 text-blue-900 ring-1 ring-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-800/50";
}

function clientTypeLabel(t: string | null | undefined) {
  const v = (t ?? "customer").toLowerCase();
  if (v === "supplier") return "Supplier";
  if (v === "lead") return "Lead";
  return "Customer";
}

function statusLabel(s: string | null | undefined) {
  const v = (s ?? "active").toLowerCase();
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusBadgeClassForClient(s: string | null | undefined) {
  const v = (s ?? "active").toLowerCase();
  if (v === "active") return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-800";
  if (v === "lead") return "bg-amber-100 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-800";
  return "bg-slate-100 text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600";
}

// ─── Activity helpers ────────────────────────────────────────────────────────

type ActivityItem = {
  id: string;
  type: "job" | "invoice" | "quote" | "note";
  title: string;
  description: string;
  date: string | null;
};

function buildActivity(jobs: Job[], invoices: Invoice[], quotes: Quote[], hasNotes: boolean, clientName: string | null): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const j of jobs) {
    items.push({ id: `job-${j.id}`, type: "job", title: j.title ?? "Job", description: `Job created for ${clientName ?? "client"}`, date: j.scheduled_date });
  }
  for (const inv of invoices) {
    items.push({ id: `inv-${inv.id}`, type: "invoice", title: inv.invoice_number ?? "Invoice", description: `Invoice ${inv.invoice_number ?? ""} — ${fmt(Number(inv.total ?? 0))}`, date: inv.created_at ?? null });
  }
  for (const q of quotes) {
    items.push({ id: `q-${q.id}`, type: "quote", title: q.quote_number ?? "Quote", description: `Quote ${q.quote_number ?? ""} — ${fmt(Number(q.total ?? 0))} (${q.status ?? "draft"})`, date: q.created_at });
  }
  if (hasNotes) {
    items.push({ id: "note-1", type: "note", title: "Note", description: "Notes on file for this client", date: null });
  }
  return items.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
}

const ACTIVITY_ICONS: Record<ActivityItem["type"], string> = {
  job: "🔧",
  invoice: "🧾",
  quote: "📋",
  note: "📝",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ClientDetailTabs({ client, jobs, invoices, quotes, stats, updateNotesAction, acceptQuoteAction, declineQuoteAction }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("overview");
  const [notes, setNotes] = useState(client.notes ?? "");
  const [notesSaved, setNotesSaved] = useState(false);
  const [notesPending, startNotesSave] = useTransition();
  const [quotePending, startQuoteAction] = useTransition();
  const [actionFeedback, setActionFeedback] = useState<{ id: string; message: string; ok: boolean } | null>(null);

  const handleSaveNotes = () => {
    const fd = new FormData();
    fd.set("client_id", client.id);
    fd.set("notes", notes);
    startNotesSave(async () => {
      await updateNotesAction(fd);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
      router.refresh();
    });
  };

  const handleQuoteAction = (quoteId: string, action: "accept" | "decline") => {
    const fd = new FormData();
    fd.set("quote_id", quoteId);
    startQuoteAction(async () => {
      const fn = action === "accept" ? acceptQuoteAction : declineQuoteAction;
      const result = await fn(fd);
      setActionFeedback({ id: quoteId, message: result.message ?? (result.ok ? "Done" : "Failed"), ok: result.ok });
      setTimeout(() => setActionFeedback(null), 3500);
      router.refresh();
    });
  };

  const activityItems = buildActivity(jobs, invoices, quotes, Boolean(client.notes), client.full_name);

  const tabClass = (t: TabKey) =>
    `rounded px-3 py-1.5 text-sm font-medium transition ${tab === t
      ? "bg-[var(--accent-color)] text-white shadow-sm"
      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"}`;

  return (
    <div className="space-y-4">
      {/* ── Header card ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{client.full_name ?? "—"}</h2>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${clientTypeBadgeClass(client.client_type)}`}>
                {clientTypeLabel(client.client_type)}
              </span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusBadgeClassForClient(client.status)}`}>
                {statusLabel(client.status)}
              </span>
            </div>
            {client.company_name ? (
              <p className="text-sm font-medium text-[var(--text-secondary)]">{client.company_name}</p>
            ) : null}
            {client.abn ? (
              <p className="text-xs text-[var(--text-muted)]">ABN {client.abn}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
              {client.phone ? (
                <a href={`tel:${client.phone}`} className="hover:text-[var(--accent-color)] hover:underline">
                  {client.phone}
                </a>
              ) : null}
              {client.email ? (
                <a href={`mailto:${client.email}`} className="hover:text-[var(--accent-color)] hover:underline">
                  {client.email}
                </a>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {client.phone ? (
              <a
                href={`tel:${client.phone}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition"
              >
                📞 Call
              </a>
            ) : null}
            {client.email ? (
              <a
                href={`mailto:${client.email}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition"
              >
                ✉️ Email
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-1 w-fit shadow-sm">
        {(["overview", "jobs", "invoices", "quotes", "notes", "properties", "activity"] as TabKey[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={tabClass(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Overview tab ────────────────────────────────────────────────── */}
      {tab === "overview" ? (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Jobs", value: stats.totalJobs.toString() },
              { label: "Total Invoiced", value: fmt(stats.totalInvoiced) },
              { label: "Total Paid", value: fmt(stats.totalPaid) },
              { label: "Outstanding", value: fmt(stats.outstanding) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
                <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{value}</p>
              </div>
            ))}
          </div>

          {/* Client info */}
          <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Client Details</h3>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Name</dt>
                <dd className="mt-0.5 font-medium text-[var(--text-primary)]">{client.full_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Email</dt>
                <dd className="mt-0.5">
                  {client.email ? (
                    <a href={`mailto:${client.email}`} className="font-medium text-[var(--accent-color)] hover:underline">
                      {client.email}
                    </a>
                  ) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Phone</dt>
                <dd className="mt-0.5">
                  {client.phone ? (
                    <a href={`tel:${client.phone}`} className="font-medium text-[var(--accent-color)] hover:underline">
                      {client.phone}
                    </a>
                  ) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Company</dt>
                <dd className="mt-0.5 font-medium text-[var(--text-primary)]">{client.company_name ?? "—"}</dd>
              </div>
              {client.abn ? (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">ABN</dt>
                  <dd className="mt-0.5 font-medium text-[var(--text-primary)]">{client.abn}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Type</dt>
                <dd className="mt-0.5">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${clientTypeBadgeClass(client.client_type)}`}>
                    {clientTypeLabel(client.client_type)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Status</dt>
                <dd className="mt-0.5">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusBadgeClassForClient(client.status)}`}>
                    {statusLabel(client.status)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Source</dt>
                <dd className="mt-0.5 font-medium capitalize text-[var(--text-primary)]">{client.source ?? "other"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Address</dt>
                <dd className="mt-0.5 font-medium text-[var(--text-primary)]">
                  {[client.address, client.suburb, client.state, client.postcode].filter(Boolean).join(", ") || "—"}
                </dd>
              </div>
            </dl>
          </article>

          {/* Notes */}
          <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add notes about this client…"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={notesPending}
                className="inline-flex h-9 items-center rounded-lg bg-[var(--accent-color)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 transition"
              >
                {notesPending ? "Saving…" : "Save notes"}
              </button>
              {notesSaved ? (
                <span className="text-sm text-green-500">Saved!</span>
              ) : null}
            </div>
          </article>
        </div>
      ) : null}

      {/* ── Jobs tab ────────────────────────────────────────────────────── */}
      {tab === "jobs" ? (
        <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Jobs ({jobs.length})</h3>
          {jobs.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No jobs for this client yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                    <th className="px-2 py-2 font-medium">Title</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Scheduled Date</th>
                    <th className="px-2 py-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-2 py-3 font-medium text-[var(--text-primary)]">{job.title ?? "Untitled job"}</td>
                      <td className="px-2 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-inset ${statusBadge(job.status, "job")}`}>
                          {statusLabel(job.status ?? "scheduled")}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-[var(--text-secondary)]">
                        {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString("en-AU") : "—"}
                      </td>
                      <td className="px-2 py-3 text-[var(--text-secondary)]">
                        {job.materials_cost != null || job.labour_hours != null
                          ? fmt(Number(job.materials_cost ?? 0) + Number(job.labour_hours ?? 0) * Number(job.hourly_rate ?? 0))
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      ) : null}

      {/* ── Invoices tab ────────────────────────────────────────────────── */}
      {tab === "invoices" ? (
        <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Invoices ({invoices.length})</h3>
          {invoices.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No invoices for this client yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                    <th className="px-2 py-2 font-medium">Invoice #</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Total</th>
                    <th className="px-2 py-2 font-medium">Due Date</th>
                    <th className="px-2 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-2 py-3 font-medium text-[var(--text-primary)]">{inv.invoice_number ?? "—"}</td>
                      <td className="px-2 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-inset ${statusBadge(inv.status, "invoice")}`}>
                          {statusLabel(inv.status ?? "unpaid")}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-[var(--text-secondary)]">{fmt(Number(inv.total ?? 0))}</td>
                      <td className="px-2 py-3 text-[var(--text-secondary)]">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-AU") : "—"}
                      </td>
                      <td className="px-2 py-3">
                        <a
                          href={`/dashboard/owner/invoices/${inv.id}`}
                          className="inline-flex h-7 items-center rounded border border-[var(--border)] px-3 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      ) : null}

      {/* ── Quotes tab ──────────────────────────────────────────────────── */}
      {tab === "quotes" ? (
        <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Quotes ({quotes.length})</h3>
          {actionFeedback ? (
            <div className={`mb-3 rounded-lg px-4 py-2 text-sm font-medium ${actionFeedback.ok ? "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-100" : "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100"}`}>
              {actionFeedback.message}
            </div>
          ) : null}
          {quotes.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No quotes for this client yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                    <th className="px-2 py-2 font-medium">Quote #</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Total</th>
                    <th className="px-2 py-2 font-medium">Created</th>
                    <th className="px-2 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => {
                    const isPending = (quote.status ?? "draft").toLowerCase() !== "accepted" && (quote.status ?? "draft").toLowerCase() !== "declined";
                    return (
                      <tr key={quote.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-2 py-3 font-medium text-[var(--text-primary)]">{quote.quote_number ?? "—"}</td>
                        <td className="px-2 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-inset ${statusBadge(quote.status, "quote")}`}>
                            {statusLabel(quote.status ?? "draft")}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-[var(--text-secondary)]">{fmt(Number(quote.total ?? 0))}</td>
                        <td className="px-2 py-3 text-[var(--text-secondary)]">
                          {quote.created_at ? new Date(quote.created_at).toLocaleDateString("en-AU") : "—"}
                        </td>
                        <td className="px-2 py-3">
                          {isPending ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={quotePending}
                                onClick={() => handleQuoteAction(quote.id, "accept")}
                                className="inline-flex h-7 items-center rounded bg-green-600 px-3 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                disabled={quotePending}
                                onClick={() => handleQuoteAction(quote.id, "decline")}
                                className="inline-flex h-7 items-center rounded border border-red-400 px-3 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-60 transition"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>
      ) : null}

      {/* ── Notes tab ───────────────────────────────────────────────────── */}
      {tab === "notes" ? <ClientNotesTab clientId={client.id} /> : null}

      {/* ── Properties tab ──────────────────────────────────────────────── */}
      {tab === "properties" ? <ClientPropertiesTab clientId={client.id} /> : null}

      {/* ── Activity tab ────────────────────────────────────────────────── */}
      {tab === "activity" ? (
        <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Activity</h3>
          {activityItems.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No activity recorded yet.</p>
          ) : (
            <ol className="space-y-4">
              {activityItems.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-base leading-none">
                    {ACTIVITY_ICONS[item.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{item.description}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{item.date ? relativeDate(item.date) : "—"}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </article>
      ) : null}
    </div>
  );
}
