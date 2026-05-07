import { LockedOverlay } from "@/components/locked-overlay";
import { Truck, ClipboardList, Route, Fuel } from "lucide-react";

export default function FleetDashboardPage() {
  return (
    <div style={{ position: "relative", minHeight: "600px" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">SERVLO FLEET</h1>
          <p className="text-slate-400 mt-1">Vehicle Tracking — GPS, dispatch, and fuel management</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Vehicles Tracked", Icon: Truck },
            { label: "Jobs in Progress", Icon: ClipboardList },
            { label: "Distance Today", Icon: Route },
            { label: "Fuel Spend Estimate", Icon: Fuel },
          ].map(({ label, Icon }) => (
            <div key={label} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                  <Icon size={15} className="text-sky-400" />
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
      <LockedOverlay productName="SERVLO FLEET" launchDate="Q2 2027" accentColor="#0EA5E9" />
    </div>
  );
}
