"use client";

type InvoiceCounts = { draft: number; unpaid: number; overdue: number; paid: number };
type QuoteCounts = { draft: number; awaiting: number; accepted: number; declined: number };

type Props = { invoices: InvoiceCounts; quotes: QuoteCounts };

const invoiceStatuses = [
  { key: "draft" as const, label: "Draft", circleClass: "bg-slate-400" },
  { key: "unpaid" as const, label: "Unpaid", circleClass: "bg-[color-mix(in_srgb,var(--accent-color)_55%,#64748b)]" },
  { key: "overdue" as const, label: "Overdue", circleClass: "bg-red-500" },
  { key: "paid" as const, label: "Paid", circleClass: "bg-emerald-500" }
];

const quoteStatuses = [
  { key: "draft" as const, label: "Draft", circleClass: "bg-slate-400" },
  { key: "awaiting" as const, label: "Awaiting acceptance", circleClass: "bg-[color-mix(in_srgb,var(--accent-color)_50%,#94a3b8)]" },
  { key: "accepted" as const, label: "Accepted", circleClass: "bg-emerald-500" },
  { key: "declined" as const, label: "Declined", circleClass: "bg-rose-500" }
];

function GridCard({
  title,
  statuses,
  hrefPrefix,
  bucketKey,
  counts
}: {
  title: string;
  statuses: ReadonlyArray<{ key: string; label: string; circleClass: string }>;
  hrefPrefix: string;
  bucketKey: string;
  counts: Record<string, number>;
}) {
  return (
    <article className="dashboard-card rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Tap a status to filter your list.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statuses.map((s) => (
          <a
            key={s.key}
            href={`${hrefPrefix}?${bucketKey}=${encodeURIComponent(s.key)}`}
            className="flex flex-col items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-3 text-center transition hover:border-[color-mix(in_srgb,var(--accent-color)_45%,var(--border))]"
          >
            <span
              className={`grid h-12 w-12 place-items-center rounded-full text-lg font-bold text-white shadow-inner ${s.circleClass}`}
              aria-hidden
            >
              {counts[s.key] ?? 0}
            </span>
            <span className="text-[11px] font-semibold leading-tight text-[var(--text-secondary)]">{s.label}</span>
          </a>
        ))}
      </div>
    </article>
  );
}

export default function InvoiceQuoteStatusGrids({ invoices, quotes }: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <GridCard
        title="Invoices"
        statuses={invoiceStatuses}
        hrefPrefix="/dashboard/owner/invoices"
        bucketKey="bucket"
        counts={invoices as Record<string, number>}
      />
      <GridCard
        title="Quotes"
        statuses={quoteStatuses}
        hrefPrefix="/dashboard/owner/quotes"
        bucketKey="bucket"
        counts={quotes as Record<string, number>}
      />
    </div>
  );
}
