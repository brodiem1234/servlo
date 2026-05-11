import { ShieldCheck, AlertTriangle, BookOpen, ClipboardCheck } from "lucide-react";

export default function SafeDashboardPage() {
  return (
    <div style={{ position: "relative", minHeight: "600px" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">SERVLO SAFE</h1>
          <p className="text-slate-400 mt-1">Safety &amp; Compliance — incidents, toolbox talks, compliance scores</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Incidents", Icon: AlertTriangle },
            { label: "Open Actions", Icon: ClipboardCheck },
            { label: "Toolbox Talks", Icon: BookOpen },
            { label: "Compliance Score", Icon: ShieldCheck },
          ].map(({ label, Icon }) => (
            <div key={label} className="flex flex-col gap-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                  <Icon size={15} className="text-red-400" />
                </span>
              </div>
              <p className="text-2xl font-bold tabular-nums text-white">—</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10" />
          ))}
        </div>
      </div>
      {/* LockedOverlay removed for testing — reinstate before release */}
    </div>
  );
}
