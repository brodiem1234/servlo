import { MapPin, DollarSign, Clock, Briefcase } from "lucide-react";

const DEMO_JOBS = [
  { title: "Apprentice Plumber", company: "Mike's Plumbing Co", location: "Norwood, SA", type: "Full-time", pay: "$22–26/hr", posted: "Today", color: "#3B82F6" },
  { title: "Qualified Electrician", company: "Sparks Electrical", location: "Prospect, SA", type: "Full-time", pay: "$45–55/hr", posted: "Today", color: "#F59E0B" },
  { title: "Solar Installer (CEC Accredited)", company: "SA Solar Experts", location: "Adelaide Metro", type: "Contract", pay: "$65–80/hr", posted: "Yesterday", color: "#22C55E" },
  { title: "Tiler — Commercial Projects", company: "Adelaide Tiling Solutions", location: "Adelaide CBD", type: "Full-time", pay: "$50–60/hr", posted: "2 days ago", color: "#8B5CF6" },
  { title: "Painter & Decorator", company: "ProPaint Adelaide", location: "Eastern Suburbs, SA", type: "Casual", pay: "$35–45/hr", posted: "3 days ago", color: "#F97316" },
  { title: "Roof Plumber", company: "Total Roofing SA", location: "SA-wide", type: "Contract", pay: "$55–70/hr", posted: "4 days ago", color: "#EF4444" },
];

export default function TradeJobsPage() {
  return (
    <div style={{ position: "relative", minHeight: "600px" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Trade Jobs</h1>
          <p className="text-slate-400 mt-1">Job board for the trades community</p>
        </div>
        <div className="space-y-3">
          {DEMO_JOBS.map((job) => (
            <div key={job.title} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-white/20 transition-colors cursor-pointer">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center mt-0.5" style={{ background: job.color + "22", border: `1px solid ${job.color}44` }}>
                    <Briefcase size={16} style={{ color: job.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{job.title}</div>
                    <div className="text-sm text-slate-400">{job.company}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>
                      <span className="flex items-center gap-1"><DollarSign size={10} />{job.pay}</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{job.posted}</span>
                    </div>
                  </div>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  job.type === "Full-time" ? "bg-blue-500/20 text-blue-400" :
                  job.type === "Contract" ? "bg-purple-500/20 text-purple-400" :
                  "bg-yellow-500/20 text-yellow-400"
                }`}>{job.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* LockedOverlay removed for testing — reinstate before release */}
    </div>
  );
}
