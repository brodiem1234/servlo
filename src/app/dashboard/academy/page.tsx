import { Clock, Award } from "lucide-react";

const COURSES = [
  { title: "Electrical Safety & Compliance", trade: "Electrical", duration: "4 hours", cpd: 4, color: "#F59E0B" },
  { title: "White Card — Construction Induction", trade: "General", duration: "6 hours", cpd: 6, color: "#3B82F6" },
  { title: "Working at Heights", trade: "General", duration: "3 hours", cpd: 3, color: "#EF4444" },
  { title: "Plumbing Compliance & Standards", trade: "Plumbing", duration: "5 hours", cpd: 5, color: "#0EA5E9" },
  { title: "Business Basics for Tradies", trade: "Business", duration: "2 hours", cpd: 2, color: "#8B5CF6" },
  { title: "Tax for Tradespeople", trade: "Business", duration: "2.5 hours", cpd: 2, color: "#22C55E" },
];

export default function AcademyDashboardPage() {
  return (
    <div style={{ position: "relative", minHeight: "600px" }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">SERVLO ACADEMY</h1>
          <p className="text-slate-400 mt-1">Trade Training — CPD-accredited, online, on-demand</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((course) => (
            <div key={course.title} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
              <div
                className="flex h-28 items-center justify-center rounded-lg text-3xl font-black"
                style={{ background: `linear-gradient(135deg, ${course.color}22 0%, ${course.color}11 100%)`, border: `1px solid ${course.color}33`, color: course.color }}
              >
                {course.title.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: `${course.color}18`, color: course.color }}>{course.trade}</span>
                <p className="mt-2 font-bold leading-snug text-white">{course.title}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-xs text-slate-500"><Clock size={12} />{course.duration}</span>
                <span className="flex items-center gap-1 text-xs text-slate-500"><Award size={12} />{course.cpd} CPD pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* LockedOverlay removed for testing — reinstate before release */}
    </div>
  );
}
