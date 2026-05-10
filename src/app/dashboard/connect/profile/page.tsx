import { MapPin, Star, Wrench } from "lucide-react";

export default function ConnectProfilePage() {
  return (
    <div style={{ position: "relative", minHeight: "600px" }}>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-indigo-500/20 border-2 border-indigo-500/40 flex items-center justify-center text-2xl font-bold text-indigo-400">YB</div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Business</h2>
              <div className="flex items-center gap-1 text-slate-400 text-sm mt-1"><Wrench size={12} />Your Trade</div>
              <div className="flex items-center gap-1 text-slate-400 text-sm mt-0.5"><MapPin size={12} />Your Suburb, SA</div>
              <div className="flex items-center gap-1 mt-2" style={{ color: "#F59E0B" }}>
                {[1,2,3,4,5].map((s) => <Star key={s} size={13} fill="currentColor" />)}
                <span className="text-slate-400 text-xs ml-1">5.0 (0 reviews)</span>
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4 text-center">
            {[["0", "Posts"], ["0", "Connections"], ["0", "Reviews"]].map(([val, label]) => (
              <div key={label} className="rounded-lg bg-white/5 p-3">
                <div className="text-xl font-bold text-white">{val}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="font-semibold text-white mb-3">About</h3>
          <p className="text-sm text-slate-500 italic">No bio added yet.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="font-semibold text-white mb-3">Recent Posts</h3>
          <p className="text-sm text-slate-500 italic">No posts yet.</p>
        </div>
      </div>
      {/* LockedOverlay removed for testing — reinstate before release */}
    </div>
  );
}
