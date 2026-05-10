import { Shield, Wrench, Truck, HeartPulse } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type InsuranceType = { label: string; sub: string; coverage: string; Icon: LucideIcon };

const INSURANCE_TYPES: InsuranceType[] = [
  { label: "Public Liability", sub: "Protects you from third-party claims for injury or property damage.", coverage: "$5M – $20M coverage", Icon: Shield },
  { label: "Tools & Equipment", sub: "Covers loss, theft and damage to your tools and gear.", coverage: "Up to $50K replacement", Icon: Wrench },
  { label: "Vehicle", sub: "Comprehensive cover for your work utes, vans and fleet vehicles.", coverage: "Agreed or market value", Icon: Truck },
  { label: "Income Protection", sub: "Monthly income if you can't work due to illness or injury.", coverage: "Up to 75% of income", Icon: HeartPulse },
];

export default function InsuranceDashboardPage() {
  return (
    <div style={{ position: "relative", minHeight: "600px" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">SERVLO INSURANCE</h1>
          <p className="text-slate-400 mt-1">Embedded Insurance — fast quotes, no brokers</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {INSURANCE_TYPES.map(({ label, sub, coverage, Icon }) => (
            <div key={label} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                  <Icon size={20} className="text-rose-400" />
                </span>
                <div>
                  <p className="font-bold text-white">{label}</p>
                  <p className="mt-1 text-xs text-slate-400">{sub}</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg p-3 bg-rose-500/10">
                <span className="text-xs text-slate-400">Coverage</span>
                <span className="text-xs font-bold text-rose-300">{coverage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* LockedOverlay removed for testing — reinstate before release */}
    </div>
  );
}
