import { Wallet, TrendingUp, Receipt, RefreshCw } from "lucide-react";

const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const CASH_FLOW_HEIGHTS = [55, 70, 45, 80, 60, 75]; // stub percentages

export default function FinanceHubDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">SERVLO FINANCE HUB</h1>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "#042f2e", color: "#059669", border: "1px solid #05966933" }}>
            Q1 2027
          </span>
        </div>
        <p className="text-slate-400 mt-1">Accounting &amp; Cash Flow — bank feeds, BAS, and Xero sync</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Cash in Account", Icon: Wallet, value: "--" },
          { label: "Month P&L", Icon: TrendingUp, value: "--" },
          { label: "Tax Owing (BAS est.)", Icon: Receipt, value: "$0" },
          { label: "Xero / MYOB Sync", Icon: RefreshCw, value: "—" },
        ].map(({ label, Icon, value }) => (
          <div key={label} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#05966915" }}>
                <Icon size={15} style={{ color: "#059669" }} />
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Cash flow chart */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Projected Cash Flow</h2>
          <span className="text-xs text-slate-500">Next 6 months (stub data)</span>
        </div>
        <div className="flex items-end gap-3 h-32">
          {CASH_FLOW_HEIGHTS.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md"
                style={{ height: `${h}%`, background: "linear-gradient(to top, #059669, #34d399)" }}
              />
              <span className="text-xs text-slate-500">{MONTHS[i]}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-3 text-center">Connect your bank to see real cash flow projections</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Bank Feed */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Bank Feed</h2>
          <p className="text-sm text-slate-500">Connect your bank to import transactions automatically</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "Commonwealth", color: "#FFD700" },
              { name: "ANZ", color: "#007DBA" },
              { name: "Westpac", color: "#DA1710" },
              { name: "NAB", color: "#E11837" },
            ].map((bank) => (
              <button
                key={bank.name}
                disabled
                className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm font-semibold text-slate-400 cursor-not-allowed hover:bg-white/5 text-left flex items-center gap-2"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: bank.color }} />
                {bank.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-600">More banks coming at launch · Powered by open banking</p>
        </div>

        <div className="space-y-4">
          {/* Xero integration */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Xero Integration</h2>
              <span className="text-xs text-slate-500 border border-white/10 rounded-full px-2 py-0.5">Not connected</span>
            </div>
            <button disabled className="w-full rounded-lg px-3 py-2 text-sm font-semibold border border-white/10 bg-white/5 text-slate-400 cursor-not-allowed">
              Connect Xero (coming soon)
            </button>
            <button disabled className="w-full rounded-lg px-3 py-2 text-sm font-semibold border border-white/10 bg-white/5 text-slate-500 cursor-not-allowed">
              Connect MYOB (coming soon)
            </button>
          </div>

          {/* BAS Preview */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">BAS Preview</h2>
            <table className="w-full text-sm">
              <tbody>
                {[
                  { label: "GST collected", value: "$0" },
                  { label: "GST paid (credits)", value: "$0" },
                  { label: "Net BAS owing", value: "$0" },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-white/5 last:border-0">
                    <td className="py-2 text-slate-500">{row.label}</td>
                    <td className="py-2 text-right text-slate-300 tabular-nums font-medium">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-600">BAS estimates update when bank feed is connected</p>
          </div>
        </div>
      </div>
    </div>
  );
}
