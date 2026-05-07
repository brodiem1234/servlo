import { LockedOverlay } from "@/components/locked-overlay";
import { Hammer, FilePlus, Search } from "lucide-react";

export default function HireDashboardPage() {
  return (
    <div style={{ position: "relative", minHeight: "600px" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">SERVLO HIRE</h1>
          <p className="text-slate-400 mt-1">Trade Job Board — post jobs, find qualified tradies</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20">
              <FilePlus size={22} className="text-orange-400" />
            </span>
            <div>
              <p className="text-lg font-bold text-white">Post a Job</p>
              <p className="mt-1 text-sm text-slate-400">List a role and get matched with verified tradies in your area.</p>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
              <Search size={22} className="text-orange-400" />
            </span>
            <div>
              <p className="text-lg font-bold text-white">Browse Tradies</p>
              <p className="mt-1 text-sm text-slate-400">Search verified tradies by trade type, suburb and availability.</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-white/5 border border-white/10" />
          ))}
        </div>
      </div>
      <LockedOverlay productName="SERVLO HIRE" launchDate="Q1 2027" accentColor="#F97316" />
    </div>
  );
}
