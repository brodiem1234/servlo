import { TrendingUp, TrendingDown, Receipt, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

const COLOR = "#10B981";
const COLOR_LIGHT = "#6EE7B7";
const COLOR_BG = "rgb(16 185 129 / 0.12)";
const COLOR_BORDER = "rgb(16 185 129 / 0.3)";

const STAT_CARDS = [
  {
    label: "Total Income",
    value: "—",
    Icon: TrendingUp,
    sub: "Available when Books launches Q3 2027",
  },
  {
    label: "Total Expenses",
    value: "—",
    Icon: TrendingDown,
    sub: "Available when Books launches Q3 2027",
  },
  {
    label: "BAS Owing",
    value: "—",
    Icon: Receipt,
    sub: "Available when Books launches Q3 2027",
  },
  {
    label: "Net Profit",
    value: "—",
    Icon: DollarSign,
    sub: "Available when Books launches Q3 2027",
  },
];

const DEMO_TRANSACTIONS = [
  {
    date: "Today",
    description: "Invoice #INV-00142 — Smith Plumbing",
    category: "Income",
    amount: "$1,540.00",
    type: "credit",
  },
  {
    date: "Yesterday",
    description: "Bunnings — Materials & supplies",
    category: "Materials",
    amount: "$342.50",
    type: "debit",
  },
  {
    date: "Mon",
    description: "Invoice #INV-00141 — Jones Electrical",
    category: "Income",
    amount: "$880.00",
    type: "credit",
  },
  {
    date: "Last Fri",
    description: "Fuel — Site vehicle",
    category: "Vehicle",
    amount: "$95.20",
    type: "debit",
  },
  {
    date: "Last Thu",
    description: "Invoice #INV-00140 — Brown HVAC",
    category: "Income",
    amount: "$2,200.00",
    type: "credit",
  },
];

export default function BooksDashboardPage() {
  return (
    <section className="space-y-6">
      {/* Launch banner */}
      <div
        className="flex items-center justify-between gap-4 rounded-xl px-5 py-4"
        style={{ background: COLOR_BG, border: `1px solid ${COLOR_BORDER}` }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: COLOR_LIGHT }}>
            SERVLO Books is launching Q3 2027.
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            Integrated bookkeeping, BAS lodgement and expense tracking for tradies.
          </p>
        </div>
        <a
          href="mailto:hello@servlo.com.au?subject=SERVLO Books Early Access"
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: COLOR }}
        >
          Join waitlist
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Books Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Your bookkeeping and BAS overview.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ label, value, Icon, sub }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-xl border p-5"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                {label}
              </p>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: COLOR_BG }}
              >
                <Icon size={15} style={{ color: COLOR }} />
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {value}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* Demo transaction log preview */}
      <div
        className="relative overflow-hidden rounded-xl border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* Coming soon overlay */}
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${COLOR} 10%, rgba(0,0,0,0.7))` }}
        >
          <p className="text-base font-bold" style={{ color: COLOR_LIGHT }}>
            Live transaction feed available at launch
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Preview below shows what your books dashboard will look like
          </p>
        </div>

        <div className="p-5" style={{ filter: "blur(1px)", opacity: 0.5 }}>
          <h2 className="mb-4 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Recent transactions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Date", "Description", "Category", "Amount"].map((h) => (
                    <th
                      key={h}
                      className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_TRANSACTIONS.slice(0, 3).map((tx, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="py-2.5 pr-4 text-xs" style={{ color: "var(--text-muted)" }}>
                      {tx.date}
                    </td>
                    <td className="py-2.5 pr-4 text-xs" style={{ color: "var(--text-primary)" }}>
                      {tx.description}
                    </td>
                    <td className="py-2.5 pr-4 text-xs" style={{ color: "var(--text-muted)" }}>
                      {tx.category}
                    </td>
                    <td className="py-2.5">
                      <span
                        className="text-xs font-semibold tabular-nums"
                        style={{
                          color: tx.type === "credit" ? COLOR_LIGHT : "#FCA5A5",
                        }}
                      >
                        {tx.type === "credit" ? "+" : "-"}{tx.amount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
