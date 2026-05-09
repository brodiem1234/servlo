import { Truck, ClipboardList, Fuel, AlertTriangle, CheckCircle2, MapPin } from "lucide-react";

export default function FleetDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">SERVLO FLEET</h1>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "#3a1f08", color: "#F97316", border: "1px solid #F9731633" }}>
            Q4 2026
          </span>
        </div>
        <p className="text-slate-400 mt-1">Fleet &amp; Asset Management — GPS tracking, service reminders &amp; fuel</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Vehicles", Icon: Truck },
          { label: "Due for Service", Icon: AlertTriangle },
          { label: "Assets Tracked", Icon: ClipboardList },
          { label: "Fuel Spend", Icon: Fuel },
        ].map(({ label, Icon }) => (
          <div key={label} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#F9731615" }}>
                <Icon size={15} style={{ color: "#F97316" }} />
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-white">--</p>
          </div>
        ))}
      </div>

      {/* Service Reminder */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 flex items-start gap-3">
        <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-300">Service reminder</p>
          <p className="text-sm text-amber-200/70 mt-0.5">Ford Transit (XYZ-456) is due for a service (6+ months since last service)</p>
        </div>
      </div>

      {/* Vehicles table */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white">Vehicles</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicle</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Rego</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">KMs</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Last Service</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { vehicle: "Toyota HiLux", rego: "ABC-123", kms: "45,231 km", lastService: "3 months ago", status: "Compliant", ok: true },
                { vehicle: "Ford Transit", rego: "XYZ-456", kms: "82,400 km", lastService: "6 months ago", status: "Service due", ok: false },
                { vehicle: "Subaru Forester", rego: "DEF-789", kms: "23,100 km", lastService: "1 month ago", status: "Compliant", ok: true },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3 text-slate-300 font-medium">
                    <div className="flex items-center gap-2">
                      <Truck size={13} className="text-slate-500" />
                      {row.vehicle}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-400 font-mono text-xs">{row.rego}</td>
                  <td className="px-5 py-3 text-slate-400 tabular-nums">{row.kms}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{row.lastService}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      {row.ok ? (
                        <CheckCircle2 size={13} className="text-green-400" />
                      ) : (
                        <AlertTriangle size={13} className="text-amber-400" />
                      )}
                      <span className={`text-xs font-medium ${row.ok ? "text-green-400" : "text-amber-400"}`}>
                        {row.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <button disabled className="rounded px-2 py-1 text-xs text-slate-500 border border-white/10 bg-white/5 cursor-not-allowed">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Asset register tab */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Asset Register</h2>
            <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "#3a1f08", color: "#F97316" }}>
              Q4 2026
            </span>
          </div>
          <p className="text-sm text-slate-500">Tools &amp; equipment register coming Q4 2026</p>
          <div className="rounded-lg border border-dashed border-white/10 bg-white/5 p-4 text-center">
            <ClipboardList size={22} className="text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-600">Track drills, generators, scaffolding and all job-site assets here</p>
          </div>
        </div>

        {/* GPS Tracking */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">GPS Tracking</h2>
            <MapPin size={14} className="text-slate-500" />
          </div>
          <div className="rounded-lg border border-dashed border-white/10 bg-slate-900/50 h-40 flex flex-col items-center justify-center gap-2">
            <MapPin size={24} className="text-slate-700" />
            <p className="text-xs text-slate-600 text-center px-4">Connect to a GPS provider to see live vehicle tracking</p>
          </div>
          <button disabled className="w-full rounded-lg px-3 py-2 text-xs font-semibold bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed">
            Connect GPS Provider (coming soon)
          </button>
        </div>
      </div>
    </div>
  );
}
