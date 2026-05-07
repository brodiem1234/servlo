import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Clock, Award } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const COLOR = "#EAB308";
const COLOR_LIGHT = "#FDE047";
const COLOR_BG = "rgb(234 179 8 / 0.12)";
const COLOR_BORDER = "rgb(234 179 8 / 0.3)";

const ALL_COURSES = [
  {
    title: "Electrical Safety & Compliance",
    trade: "Electrical",
    category: "Safety",
    duration: "4 hours",
    cpd: 4,
    color: "#F59E0B",
    level: "Intermediate",
  },
  {
    title: "White Card — Construction Induction",
    trade: "General",
    category: "Compliance",
    duration: "6 hours",
    cpd: 6,
    color: "#3B82F6",
    level: "Beginner",
  },
  {
    title: "Working at Heights",
    trade: "General",
    category: "Safety",
    duration: "3 hours",
    cpd: 3,
    color: "#EF4444",
    level: "Beginner",
  },
  {
    title: "Plumbing Compliance & Standards",
    trade: "Plumbing",
    category: "Compliance",
    duration: "5 hours",
    cpd: 5,
    color: "#0EA5E9",
    level: "Intermediate",
  },
  {
    title: "Business Basics for Tradies",
    trade: "Business",
    category: "Business",
    duration: "2 hours",
    cpd: 2,
    color: "#8B5CF6",
    level: "Beginner",
  },
  {
    title: "Tax for Tradespeople",
    trade: "Business",
    category: "Business",
    duration: "2.5 hours",
    cpd: 2,
    color: "#22C55E",
    level: "Beginner",
  },
  {
    title: "Confined Space Entry",
    trade: "General",
    category: "Safety",
    duration: "4 hours",
    cpd: 4,
    color: "#F97316",
    level: "Advanced",
  },
  {
    title: "HVAC Refrigerant Handling",
    trade: "HVAC",
    category: "Compliance",
    duration: "6 hours",
    cpd: 6,
    color: "#14B8A6",
    level: "Intermediate",
  },
  {
    title: "Solar Panel Installation",
    trade: "Electrical",
    category: "Technical",
    duration: "8 hours",
    cpd: 8,
    color: "#FBBF24",
    level: "Advanced",
  },
];

const TRADES = ["All", "Electrical", "Plumbing", "HVAC", "General", "Business"];
const CATEGORIES = ["All", "Safety", "Compliance", "Business", "Technical"];

export default async function AcademyCoursesPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <section className="space-y-6">
      {/* Launch banner */}
      <div
        className="flex items-center justify-between gap-4 rounded-xl px-5 py-4"
        style={{ background: COLOR_BG, border: `1px solid ${COLOR_BORDER}` }}
      >
        <p className="text-sm font-semibold" style={{ color: COLOR_LIGHT }}>
          SERVLO Academy is launching Q1 2028. Course catalog shown is a preview.
        </p>
        <a
          href="mailto:hello@servlo.com.au?subject=SERVLO Academy Early Access"
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: COLOR }}
        >
          Join waitlist
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Course Catalog
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Browse all available CPD-accredited courses.
        </p>
      </div>

      {/* Filters (visual only, non-interactive) */}
      <div className="flex flex-wrap gap-4">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Trade
          </p>
          <div className="flex flex-wrap gap-2">
            {TRADES.map((t, i) => (
              <button
                key={t}
                disabled
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: i === 0 ? COLOR : "var(--bg-secondary)",
                  color: i === 0 ? "#000" : "var(--text-muted)",
                  border: "1px solid var(--border)",
                  opacity: 0.6,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Category
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c, i) => (
              <button
                key={c}
                disabled
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: i === 0 ? COLOR : "var(--bg-secondary)",
                  color: i === 0 ? "#000" : "var(--text-muted)",
                  border: "1px solid var(--border)",
                  opacity: 0.6,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Course grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_COURSES.map((course) => (
          <div
            key={course.title}
            className="flex flex-col gap-4 rounded-xl border p-5"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            {/* Course image placeholder */}
            <div
              className="flex h-24 items-center justify-center rounded-lg text-3xl font-black"
              style={{
                background: `linear-gradient(135deg, ${course.color}22 0%, ${course.color}11 100%)`,
                border: `1px solid ${course.color}33`,
                color: course.color,
              }}
            >
              {course.title.slice(0, 2).toUpperCase()}
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: `${course.color}18`, color: course.color }}
              >
                {course.trade}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}
              >
                {course.level}
              </span>
            </div>

            <p className="font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
              {course.title}
            </p>

            {/* Meta */}
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                <Clock size={12} />
                {course.duration}
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                <Award size={12} />
                {course.cpd} CPD pts
              </span>
            </div>

            <Link
              href="/dashboard/academy"
              className="mt-auto flex items-center justify-center rounded-lg py-2.5 text-sm font-semibold no-underline opacity-60"
              style={{
                background: COLOR_BG,
                color: COLOR_LIGHT,
                border: `1px solid ${COLOR_BORDER}`,
              }}
              title="Coming Q1 2028"
            >
              Enroll (Q1 2028)
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
