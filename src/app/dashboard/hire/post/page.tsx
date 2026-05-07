import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const COLOR = "#F97316";
const COLOR_LIGHT = "#FDBA74";
const COLOR_BG = "rgb(249 115 22 / 0.12)";
const COLOR_BORDER = "rgb(249 115 22 / 0.3)";

export default async function HirePostPage() {
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
          SERVLO Hire is launching Q1 2027. Job listings open at launch.
        </p>
        <a
          href="mailto:hello@servlo.com.au?subject=SERVLO Hire Early Access"
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: COLOR }}
        >
          Join waitlist
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Post a Job
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Create a listing to attract qualified tradies in your area.
        </p>
      </div>

      {/* Form — disabled with overlay */}
      <div className="relative">
        {/* Overlay */}
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${COLOR} 8%, rgba(0,0,0,0.6))` }}
        >
          <div className="text-center">
            <p className="text-base font-bold" style={{ color: COLOR_LIGHT }}>
              Job posting opens at launch — Q1 2027
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              You&apos;ll be among the first to post when Hire goes live
            </p>
          </div>
        </div>

        <div
          className="space-y-5 rounded-xl border p-6"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
            opacity: 0.4,
            filter: "blur(0.5px)",
            pointerEvents: "none",
          }}
        >
          {/* Job title */}
          <div>
            <label className="mb-1 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Job Title
            </label>
            <input
              type="text"
              placeholder="e.g. Experienced Electrician needed — Sydney CBD"
              disabled
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Trade type */}
          <div>
            <label className="mb-1 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Trade Type
            </label>
            <select
              disabled
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <option>Select trade...</option>
              <option>Electrician</option>
              <option>Plumber</option>
              <option>Builder</option>
              <option>Painter</option>
              <option>Landscaper</option>
              <option>HVAC Technician</option>
              <option>Other</option>
            </select>
          </div>

          {/* Suburb */}
          <div>
            <label className="mb-1 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Suburb
            </label>
            <input
              type="text"
              placeholder="e.g. Surry Hills, NSW"
              disabled
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Description
            </label>
            <textarea
              rows={4}
              disabled
              placeholder="Describe the role, requirements, and what a typical day looks like..."
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
                resize: "none",
              }}
            />
          </div>

          {/* Rate type + Duration */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Rate Type
              </label>
              <select
                disabled
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <option>Hourly rate</option>
                <option>Fixed price</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Duration
              </label>
              <select
                disabled
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <option>One-off job</option>
                <option>Short-term (1–4 weeks)</option>
                <option>Part-time ongoing</option>
                <option>Full-time ongoing</option>
              </select>
            </div>
          </div>

          <button
            disabled
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white opacity-50"
            style={{ background: COLOR }}
          >
            Post job (coming soon)
          </button>
        </div>
      </div>
    </section>
  );
}
