import { LockedOverlay } from "@/components/locked-overlay";
import { MapPin, Star, Wrench } from "lucide-react";

const DEMO_BUSINESSES = [
  { name: "Mike's Plumbing Co", trade: "Plumbing", suburb: "Norwood, SA", rating: 4.9, reviews: 127, color: "#3B82F6", initials: "MP" },
  { name: "Sparks Electrical", trade: "Electrical", suburb: "Prospect, SA", rating: 4.8, reviews: 89, color: "#F59E0B", initials: "SE" },
  { name: "Adelaide Tiling Solutions", trade: "Tiling", suburb: "Unley, SA", rating: 5.0, reviews: 64, color: "#8B5CF6", initials: "AT" },
  { name: "SA Solar Experts", trade: "Solar", suburb: "Glenelg, SA", rating: 4.7, reviews: 203, color: "#22C55E", initials: "SS" },
  { name: "ProPaint Adelaide", trade: "Painting", suburb: "Burnside, SA", rating: 4.9, reviews: 211, color: "#F97316", initials: "PA" },
  { name: "Total Roofing SA", trade: "Roofing", suburb: "Campbelltown, SA", rating: 4.6, reviews: 55, color: "#EF4444", initials: "TR" },
  { name: "Burnside Landscaping", trade: "Landscaping", suburb: "Mitcham, SA", rating: 4.8, reviews: 93, color: "#10B981", initials: "BL" },
  { name: "Clean Right Services", trade: "Cleaning", suburb: "Adelaide CBD", rating: 4.9, reviews: 178, color: "#14B8A6", initials: "CR" },
];

export default function DiscoverPage() {
  return (
    <div style={{ position: "relative", minHeight: "600px" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Discover</h1>
          <p className="text-slate-400 mt-1">Find and connect with local trade businesses</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DEMO_BUSINESSES.map((biz) => (
            <div key={biz.name} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-white/20 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: biz.color + "33", border: `1px solid ${biz.color}66` }}>{biz.initials}</div>
                <div>
                  <div className="font-semibold text-white text-sm">{biz.name}</div>
                  <div className="flex items-center gap-1 text-xs text-slate-500"><Wrench size={10} />{biz.trade}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-400"><MapPin size={10} />{biz.suburb}</div>
                <div className="flex items-center gap-1" style={{ color: "#F59E0B" }}><Star size={10} fill="currentColor" /><span className="font-semibold">{biz.rating}</span><span className="text-slate-500">({biz.reviews})</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <LockedOverlay productName="SERVLO CONNECT" launchDate="Q2 2026" accentColor="#6366F1" />
    </div>
  );
}
