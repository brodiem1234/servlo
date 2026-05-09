import { Briefcase, Users, CalendarCheck, MapPin, Clock } from "lucide-react";

export default function HireDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">SERVLO HIRE</h1>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "#1e1b4b", color: "#6366F1", border: "1px solid #6366F133" }}>
            Q2 2027
          </span>
        </div>
        <p className="text-slate-400 mt-1">Recruitment &amp; HR — post jobs, track applicants, onboard staff</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Open Positions", Icon: Briefcase },
          { label: "Applications", Icon: Users },
          { label: "Scheduled Interviews", Icon: CalendarCheck },
        ].map(({ label, Icon }) => (
          <div key={label} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#6366F115" }}>
                <Icon size={15} style={{ color: "#6366F1" }} />
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-white">--</p>
          </div>
        ))}
      </div>

      {/* Job Board */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Active Job Listings</h2>
          <button disabled className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-white/10 bg-white/5 text-slate-500 cursor-not-allowed">
            + Post Job (coming soon)
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Title</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Location</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Applicants</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Posted</th>
              </tr>
            </thead>
            <tbody>
              {[
                { title: "Senior Plumber", type: "Full-time", location: "Sydney", applicants: 3, posted: "2 days ago" },
                { title: "Apprentice Electrician", type: "Full-time", location: "Melbourne", applicants: 7, posted: "5 days ago" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3 text-slate-300 font-medium">
                    <div className="flex items-center gap-2">
                      <Briefcase size={13} className="text-slate-500" />
                      {row.title}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "#6366F115", color: "#818CF8" }}>
                      {row.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-slate-600" />
                      {row.location}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-slate-500" />
                      <span className="text-slate-300 font-medium">{row.applicants}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock size={11} className="text-slate-600" />
                      {row.posted}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ATS Kanban */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">Applicant Pipeline</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { stage: "Applied", count: 0, color: "#6366F1" },
            { stage: "Phone Screen", count: 0, color: "#8B5CF6" },
            { stage: "Interview", count: 0, color: "#A78BFA" },
            { stage: "Offer", count: 0, color: "#C4B5FD" },
          ].map((col) => (
            <div key={col.stage} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">{col.stage}</span>
                <span className="rounded-full px-1.5 py-0.5 text-xs font-bold" style={{ background: `${col.color}20`, color: col.color }}>
                  {col.count}
                </span>
              </div>
              <div className="rounded border border-dashed border-white/10 p-3 text-center">
                <p className="text-xs text-slate-600">No candidates</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Onboarding Checklist */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">New Employee Onboarding Checklist</h2>
        <p className="text-xs text-slate-500">Assign this checklist when you make an offer</p>
        <ul className="space-y-2">
          {[
            "Upload ID / license",
            "Sign employment agreement",
            "Complete induction",
            "Tax file number declaration",
            "Bank details",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3">
              <input
                type="checkbox"
                disabled
                className="h-4 w-4 rounded border-slate-600 bg-white/5 cursor-not-allowed"
              />
              <span className="text-sm text-slate-400">{item}</span>
            </li>
          ))}
        </ul>
        <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 mt-3">
          <p className="text-xs font-medium" style={{ color: "#6366F1" }}>Coming Q2 2027</p>
          <p className="text-xs text-slate-500 mt-0.5">Full ATS, e-signatures and onboarding automation at launch.</p>
        </div>
      </div>
    </div>
  );
}
