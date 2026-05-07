import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Clock, Award } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const COLOR = "#EAB308";
const COLOR_LIGHT = "#FDE047";
const COLOR_BG = "rgb(234 179 8 / 0.12)";
const COLOR_BORDER = "rgb(234 179 8 / 0.3)";

const COURSES = [
  {
    title: "Electrical Safety & Compliance",
    trade: "Electrical",
    duration: "4 hours",
    cpd: 4,
    color: "#F59E0B",
  },
  {
    title: "White Card — Construction Induction",
    trade: "General",
    duration: "6 hours",
    cpd: 6,
    color: "#3B82F6",
  },
  {
    title: "Working at Heights",
    trade: "General",
    duration: "3 hours",
    cpd: 3,
    color: "#EF4444",
  },
  {
    title: "Plumbing Compliance & Standards",
    trade: "Plumbing",
    duration: "5 hours",
    cpd: 5,
    color: "#0EA5E9",
  },
  {
    title: "Business Basics for Tradies",
    trade: "Business",
    duration: "2 hours",
    cpd: 2,
    color: "#8B5CF6",
  },
  {
    title: "Tax for Tradespeople",
    trade: "Business",
    duration: "2.5 hours",
    cpd: 2,
    color: "#22C55E",
  },
];

export default async function AcademyDashboardPage() {
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
        <div>
          <p className="text-sm font-semibold" style={{ color: COLOR_LIGHT }}>
            SERVLO Academy is launching Q1 2028. You&apos;re on the early access list.
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            CPD-accredited trade training — online, on-demand, built for Australian workers.
          </p>
        </div>
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
          Academy
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          CPD-accredited trade training. Complete courses online, earn certificates.
        </p>
      </div>

      {/* Course grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COURSES.map((course) => (
          <div
            key={course.title}
            className="flex flex-col gap-4 rounded-xl border p-5"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            {/* Course image placeholder */}
            <div
              className="flex h-28 items-center justify-center rounded-lg text-3xl font-black"
              style={{
                background: `linear-gradient(135deg, ${course.color}22 0%, ${course.color}11 100%)`,
                border: `1px solid ${course.color}33`,
                color: course.color,
              }}
            >
              {course.title.slice(0, 2).toUpperCase()}
            </div>

            {/* Details */}
            <div>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  background: `${course.color}18`,
                  color: course.color,
                }}
              >
                {course.trade}
              </span>
              <p
                className="mt-2 font-bold leading-snug"
                style={{ color: "var(--text-primary)" }}
              >
                {course.title}
              </p>
            </div>

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

            {/* CTA */}
            <Link
              href="/dashboard/academy/courses"
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
