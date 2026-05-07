import { LockedOverlay } from "@/components/locked-overlay";
import { ShoppingBag, TrendingUp, DollarSign, Zap } from "lucide-react";

export default function LeadsDashboardPage() {
  return (
    <div style={{ position: "relative", minHeight: "600px" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">SERVLO LEADS</h1>
          <p className="text-slate-400 mt-1">Lead Marketplace — verified jobs matched to your trade</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Available Leads", Icon: ShoppingBag },
            { label: "My Leads", Icon: Zap },
            { label: "Conversion Rate", Icon: TrendingUp },
            { label: "Pipeline Value", Icon: DollarSign },
          ].map(({ label, Icon }) => (
            <div key={label} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <Icon size={15} className="text-amber-400" />
                </span>
              </div>
              <p className="text-2xl font-bold tabular-nums text-white">—</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-white/5 border border-white/10" />
          ))}
        </div>
      </div>
      <LockedOverlay productName="SERVLO LEADS" launchDate="Q4 2026" accentColor="#F59E0B" />
    </div>
  );
}
