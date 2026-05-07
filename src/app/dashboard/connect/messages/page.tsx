import { LockedOverlay } from "@/components/locked-overlay";

const DEMO_CONVOS = [
  { name: "Mike's Plumbing Co", last: "Hey mate, do you do commercial work?", time: "2m", unread: 2, color: "#3B82F6", initials: "MP" },
  { name: "Sparks Electrical", last: "Thanks for the referral, much appreciated!", time: "1h", unread: 0, color: "#F59E0B", initials: "SE" },
  { name: "SA Solar Experts", last: "What's your rate for sub-contracting?", time: "3h", unread: 1, color: "#22C55E", initials: "SS" },
  { name: "ProPaint Adelaide", last: "Just sent through the invoice.", time: "Yesterday", unread: 0, color: "#F97316", initials: "PA" },
];

const DEMO_MESSAGES = [
  { from: "Mike's Plumbing Co", content: "Hey mate, do you do commercial work?", time: "2:31 PM", mine: false },
  { from: "You", content: "Yeah we do, mostly restaurants and small offices. What have you got?", time: "2:33 PM", mine: true },
  { from: "Mike's Plumbing Co", content: "Got a client in the CBD with 4 tenancies that need fit-out plumbing. Could be a good referral for you.", time: "2:35 PM", mine: false },
  { from: "You", content: "Sounds great, send me through the details and I'll get a quote together.", time: "2:36 PM", mine: true },
];

export default function MessagesPage() {
  return (
    <div style={{ position: "relative", minHeight: "600px" }}>
      <div>
        <h1 className="text-2xl font-bold text-white mb-4">Messages</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 rounded-xl border border-white/10 overflow-hidden" style={{ height: "500px" }}>
          {/* Sidebar */}
          <div className="border-r border-white/10 overflow-y-auto" style={{ background: "rgba(255,255,255,0.02)" }}>
            {DEMO_CONVOS.map((c) => (
              <div key={c.name} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 border-b border-white/5 ${c.name === "Mike's Plumbing Co" ? "bg-white/5" : ""}`}>
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background: c.color + "33", border: `1px solid ${c.color}66` }}>{c.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between"><span className="font-semibold text-white text-sm">{c.name}</span><span className="text-xs text-slate-500">{c.time}</span></div>
                  <div className="text-xs text-slate-500 truncate">{c.last}</div>
                </div>
                {c.unread > 0 && <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">{c.unread}</div>}
              </div>
            ))}
          </div>
          {/* Chat */}
          <div className="col-span-2 flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-400">MP</div>
              <span className="font-semibold text-white text-sm">{"Mike's Plumbing Co"}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {DEMO_MESSAGES.map((m, i) => (
                <div key={i} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${m.mine ? "bg-indigo-600 text-white" : "bg-white/10 text-slate-200"}`}>
                    <p>{m.content}</p>
                    <p className="text-[10px] mt-1 opacity-60">{m.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500" placeholder="Type a message..." disabled />
                <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold" disabled>Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LockedOverlay productName="SERVLO CONNECT" launchDate="Q2 2026" accentColor="#6366F1" />
    </div>
  );
}
