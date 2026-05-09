import { PhoneCall, CalendarCheck, VoicemailIcon, TrendingUp, Phone, Settings } from "lucide-react";

export default function AnswerDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">SERVLO ANSWER</h1>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "#0d4a47", color: "#14B8A6", border: "1px solid #14B8A633" }}>
              Q3 2026
            </span>
          </div>
          <p className="text-slate-400 mt-1">AI Phone Agent — answer every call, 24/7</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Calls Answered", Icon: PhoneCall, color: "text-teal-400", bg: "bg-teal-500/10" },
          { label: "Bookings Made by AI", Icon: CalendarCheck, color: "text-teal-400", bg: "bg-teal-500/10" },
          { label: "Missed Calls Captured", Icon: VoicemailIcon, color: "text-teal-400", bg: "bg-teal-500/10" },
          { label: "Conversion Rate", Icon: TrendingUp, color: "text-teal-400", bg: "bg-teal-500/10" },
        ].map(({ label, Icon, color, bg }) => (
          <div key={label} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
                <Icon size={15} className={color} />
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-white">--</p>
          </div>
        ))}
      </div>

      {/* Recent Calls table */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white">Recent Calls</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Caller</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Outcome</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {[
                { caller: "Unknown", duration: "2:34", outcome: "Booking made", date: "2 days ago", outcomeColor: "text-teal-400" },
                { caller: "+61 412 XXX 123", duration: "1:12", outcome: "Info provided", date: "3 days ago", outcomeColor: "text-blue-400" },
                { caller: "Repeat caller", duration: "0:45", outcome: "Voicemail", date: "5 days ago", outcomeColor: "text-slate-400" },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3 text-slate-300 font-medium">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-500" />
                      {row.caller}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-400 tabular-nums">{row.duration}</td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-medium ${row.outcomeColor}`}>{row.outcome}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* AI Agent Settings */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Settings size={15} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-white">AI Agent Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Business greeting</label>
              <textarea
                disabled
                placeholder="Hi! You've reached Bob's Plumbing..."
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 placeholder-slate-600 resize-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Booking integration</label>
              <select disabled className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-600 cursor-not-allowed">
                <option>Connect calendar (coming soon)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Call recording</p>
                <p className="text-xs text-slate-500">Record and transcribe all calls</p>
              </div>
              <div className="h-5 w-9 rounded-full bg-white/10 relative cursor-not-allowed">
                <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-slate-600" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Twilio phone number</label>
              <input
                disabled
                type="text"
                placeholder="+61 2 XXXX XXXX — Connect Twilio to enable"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-600 placeholder-slate-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Integration stubs */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Integrations</h2>
          <p className="text-xs text-slate-500">Connect to enable live calls</p>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                <PhoneCall size={16} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Twilio</p>
                <p className="text-xs text-slate-500">Phone number & call routing</p>
              </div>
            </div>
            <button
              disabled
              className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed"
            >
              Connect
            </button>
          </div>
          <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-4">
            <p className="text-xs text-teal-400 font-medium">Coming Q3 2026</p>
            <p className="text-xs text-slate-500 mt-1">SERVLO ANSWER is currently in development. Join the waitlist to be notified at launch.</p>
            <button
              disabled
              className="mt-3 rounded-lg px-3 py-1.5 text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 cursor-not-allowed w-full"
            >
              Join Waitlist (coming soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
