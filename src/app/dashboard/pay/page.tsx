import { CreditCard, DollarSign, CheckCircle2, BarChart2, ArrowUpRight } from "lucide-react";

export default function PayDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">SERVLO PAY</h1>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "#0c2d4a", color: "#3B82F6", border: "1px solid #3B82F633" }}>
              Q4 2026
            </span>
          </div>
          <p className="text-slate-400 mt-1">Payment Processing — lowest rates for Australian tradies</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Processed", Icon: DollarSign },
          { label: "Avg Transaction", Icon: BarChart2 },
          { label: "Success Rate", Icon: CheckCircle2 },
          { label: "BNPL Usage", Icon: CreditCard },
        ].map(({ label, Icon }) => (
          <div key={label} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <Icon size={15} className="text-blue-400" />
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-white">--</p>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Client</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Method</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {[
                { invoice: "INV-001", client: "Bob Smith", amount: "$2,450", method: "Stripe", status: "Paid", statusColor: "text-green-400 bg-green-400/10", date: "2 days ago" },
                { invoice: "INV-002", client: "Jane Doe", amount: "$890", method: "BNPL (Afterpay)", status: "Processing", statusColor: "text-yellow-400 bg-yellow-400/10", date: "3 days ago" },
                { invoice: "INV-003", client: "Mike Johnson", amount: "$3,200", method: "Bank Transfer", status: "Paid", statusColor: "text-green-400 bg-green-400/10", date: "5 days ago" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3 text-blue-400 font-mono text-xs">{row.invoice}</td>
                  <td className="px-5 py-3 text-slate-300 font-medium">{row.client}</td>
                  <td className="px-5 py-3 text-white font-semibold tabular-nums">{row.amount}</td>
                  <td className="px-5 py-3 text-slate-400">{row.method}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Payment Methods */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Payment Methods</h2>
          <div className="space-y-2">
            {[
              { name: "Stripe", icon: "💳", status: "Connected", statusClass: "text-green-400 bg-green-400/10", action: null },
              { name: "Afterpay / BNPL", icon: "🔄", status: null, statusClass: null, action: "Connect" },
              { name: "Bank Transfer", icon: "🏦", status: "Enabled", statusClass: "text-green-400 bg-green-400/10", action: null },
              { name: "Apple Pay", icon: "", status: null, statusClass: null, action: "Connect" },
            ].map((m) => (
              <div key={m.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-base">{m.icon}</span>
                  <span className="text-sm text-slate-300 font-medium">{m.name}</span>
                </div>
                {m.status ? (
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${m.statusClass}`}>
                    {m.status}
                  </span>
                ) : (
                  <button disabled className="rounded-lg px-3 py-1 text-xs font-semibold bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed">
                    {m.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Reconciliation summary */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Reconciliation</h2>
            <span className="text-xs text-slate-500">This week</span>
          </div>
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-sm font-medium text-slate-300">3 payments this week</p>
            <p className="text-2xl font-bold text-white mt-1 tabular-nums">$6,540</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight size={13} className="text-green-400" />
              <span className="text-xs text-green-400">0 failed</span>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: "Stripe payouts", value: "$5,650" },
              { label: "BNPL processing", value: "$890" },
              { label: "Platform fee (est.)", value: "—" },
            ].map((r) => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-slate-500">{r.label}</span>
                <span className="text-slate-300 tabular-nums">{r.value}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 mt-2">
            <p className="text-xs text-blue-400 font-medium">Coming Q4 2026</p>
            <p className="text-xs text-slate-500 mt-0.5">Full reconciliation and payout management will be available at launch.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
