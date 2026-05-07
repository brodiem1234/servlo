import { LockedOverlay } from "@/components/locked-overlay";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";

const DEMO_POSTS = [
  {
    id: 1,
    author: "Mike's Plumbing Co",
    avatar: "MP",
    avatarColor: "#3B82F6",
    time: "2h ago",
    content: "Just wrapped up a full bathroom reno in Norwood — client is stoked! Before/after shots below. Shoutout to the team for smashing it out in 3 days. 💪",
    likes: 34,
    comments: 8,
    trade: "Plumbing",
  },
  {
    id: 2,
    author: "Sparks Electrical",
    avatar: "SE",
    avatarColor: "#F59E0B",
    time: "4h ago",
    content: "PSA: If you're still running old consumer units from the 90s, it's time to upgrade. Had three callouts this week for tripped breakers that could have been avoided. Happy to chat if you need a quote.",
    likes: 67,
    comments: 15,
    trade: "Electrical",
  },
  {
    id: 3,
    author: "Adelaide Tiling Solutions",
    avatar: "AT",
    avatarColor: "#8B5CF6",
    time: "6h ago",
    content: "Anyone else finding it hard to source large format tiles at the moment? 600x1200mm Calacatta has been back-ordered for 6 weeks from my usual supplier. Any recommendations in SA?",
    likes: 12,
    comments: 22,
    trade: "Tiling",
  },
  {
    id: 4,
    author: "SA Solar Experts",
    avatar: "SS",
    avatarColor: "#22C55E",
    time: "Yesterday",
    content: "SERVLO has genuinely changed how we run the business. Used to chase invoices on spreadsheets, now everything is automated. 10/10 would recommend to any trade. #tradielife #SERVLO",
    likes: 89,
    comments: 31,
    trade: "Solar",
  },
  {
    id: 5,
    author: "Clean Right Services",
    avatar: "CR",
    avatarColor: "#14B8A6",
    time: "Yesterday",
    content: "New van graphics just landed! Nothing like fresh branding to kick off the new financial year. Drop a 🔥 if you love it.",
    likes: 103,
    comments: 19,
    trade: "Cleaning",
  },
  {
    id: 6,
    author: "Burnside Landscaping",
    avatar: "BL",
    avatarColor: "#10B981",
    time: "2 days ago",
    content: "Tip of the week: When quoting landscaping jobs, always add a 15% contingency for rock/root removal on older properties. Had a job in Burnside last month where we hit bedrock at 300mm. Saved ourselves with the contingency. 🪨",
    likes: 45,
    comments: 11,
    trade: "Landscaping",
  },
  {
    id: 7,
    author: "ProPaint Adelaide",
    avatar: "PA",
    avatarColor: "#F97316",
    time: "3 days ago",
    content: "Just hit 200 five-star reviews on Google! Couldn't have done it without the team and our amazing clients in Adelaide. Time to celebrate. 🎉",
    likes: 156,
    comments: 44,
    trade: "Painting",
  },
  {
    id: 8,
    author: "Total Roofing SA",
    avatar: "TR",
    avatarColor: "#EF4444",
    time: "4 days ago",
    content: "Reminder that Q1 2027 changes to NCC roofing provisions are coming. If you're doing any new roof installs or major restorations, make sure you're across the updated fall arrest requirements. Link in comments.",
    likes: 28,
    comments: 17,
    trade: "Roofing",
  },
];

export default function ConnectFeedPage() {
  return (
    <div style={{ position: "relative", minHeight: "600px" }}>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Feed</h1>
          <span className="text-sm text-slate-400">Trades Community Network</span>
        </div>
        {/* Create post box */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-400">You</div>
            <div className="flex-1 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-slate-500 cursor-pointer">Share something with the trades community...</div>
          </div>
        </div>
        {/* Posts */}
        {DEMO_POSTS.map((post) => (
          <div key={post.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: post.avatarColor + "33", border: `1px solid ${post.avatarColor}66` }}
                >
                  {post.avatar}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{post.author}</div>
                  <div className="text-xs text-slate-500">{post.time} · {post.trade}</div>
                </div>
              </div>
              <button className="text-slate-600 hover:text-slate-400"><MoreHorizontal size={16} /></button>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">{post.content}</p>
            <div className="flex items-center gap-4 text-slate-500 text-xs border-t border-white/5 pt-3">
              <button className="flex items-center gap-1.5 hover:text-pink-400 transition-colors"><Heart size={14} />{post.likes}</button>
              <button className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors"><MessageCircle size={14} />{post.comments}</button>
              <button className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"><Share2 size={14} />Share</button>
            </div>
          </div>
        ))}
      </div>
      <LockedOverlay productName="SERVLO CONNECT" launchDate="Q2 2026" accentColor="#6366F1" />
    </div>
  );
}
