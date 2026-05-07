import { LockedOverlay } from "@/components/locked-overlay";
import { Users, Lock } from "lucide-react";

const DEMO_GROUPS = [
  { name: "SA Tradies Network", members: 1247, description: "The largest trades community in South Australia", color: "#3B82F6", public: true },
  { name: "Adelaide Electricians", members: 389, description: "Licensed electricians across Adelaide metro", color: "#F59E0B", public: true },
  { name: "Plumbers of SA", members: 512, description: "Connect, share jobs, and refer work across SA", color: "#14B8A6", public: true },
  { name: "SA Solar Installers", members: 203, description: "CEC accredited solar installers in South Australia", color: "#22C55E", public: false },
  { name: "Adelaide Small Business Owners", members: 3891, description: "For all small business owners across Adelaide", color: "#8B5CF6", public: true },
  { name: "Trade Business Growth", members: 721, description: "Marketing, quoting, and growth strategies for tradies", color: "#F97316", public: false },
];

export default function GroupsPage() {
  return (
    <div style={{ position: "relative", minHeight: "600px" }}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Groups</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_GROUPS.map((g) => (
            <div key={g.name} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-white/20 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: g.color + "22", border: `1px solid ${g.color}44` }}>
                    <Users size={18} style={{ color: g.color }} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                      {g.name}
                      {!g.public && <Lock size={11} className="text-slate-500" />}
                    </div>
                    <div className="text-xs text-slate-500">{g.members.toLocaleString()} members</div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400">{g.description}</p>
            </div>
          ))}
        </div>
      </div>
      <LockedOverlay productName="SERVLO CONNECT" launchDate="Q2 2026" accentColor="#6366F1" />
    </div>
  );
}
