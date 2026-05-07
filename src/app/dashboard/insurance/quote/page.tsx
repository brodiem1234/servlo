import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const COLOR = "#F43F5E";
const COLOR_LIGHT = "#FDA4AF";
const COLOR_BG = "rgb(244 63 94 / 0.12)";
const COLOR_BORDER = "rgb(244 63 94 / 0.3)";

export default async function InsuranceQuotePage() {
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
          SERVLO Insurance is launching Q4 2027. Quote form opens at launch.
        </p>
        <a
          href="mailto:hello@servlo.com.au?subject=SERVLO Insurance Early Access"
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: COLOR }}
        >
          Join waitlist
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Get a Quote
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Answer a few quick questions to get an indicative premium.
        </p>
      </div>

      {/* Quote form — overlay */}
      <div className="relative">
        {/* Overlay */}
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${COLOR} 8%, rgba(0,0,0,0.6))` }}
        >
          <div className="text-center">
            <p className="text-base font-bold" style={{ color: COLOR_LIGHT }}>
              Quote engine available at launch — Q4 2027
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Pre-fill your business details now so you&apos;re ready at launch
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
              <option>Pest Control</option>
              <option>Other</option>
            </select>
          </div>

          {/* Annual turnover */}
          <div>
            <label className="mb-1 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Annual Turnover
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
              <option>Under $100K</option>
              <option>$100K – $250K</option>
              <option>$250K – $500K</option>
              <option>$500K – $1M</option>
              <option>$1M+</option>
            </select>
          </div>

          {/* Number of employees */}
          <div>
            <label className="mb-1 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Number of Employees (including yourself)
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
              <option>Just me (sole trader)</option>
              <option>2–5 employees</option>
              <option>6–10 employees</option>
              <option>11–20 employees</option>
              <option>20+ employees</option>
            </select>
          </div>

          {/* Insurance type */}
          <div>
            <label className="mb-1 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Insurance Type
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {["Public Liability", "Tools & Equipment", "Vehicle", "Income Protection"].map((t) => (
                <label
                  key={t}
                  className="flex cursor-not-allowed items-center gap-2 rounded-lg border p-3"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border)",
                  }}
                >
                  <input type="checkbox" disabled className="h-4 w-4" />
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                    {t}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            disabled
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white opacity-50"
            style={{ background: COLOR }}
          >
            Get quote (coming soon)
          </button>
        </div>
      </div>
    </section>
  );
}
