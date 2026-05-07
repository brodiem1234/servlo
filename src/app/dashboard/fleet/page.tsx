import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Truck, ClipboardList, Route, Fuel } from "lucide-react";

export const dynamic = "force-dynamic";

const COLOR = "#0EA5E9";
const COLOR_LIGHT = "#7DD3FC";
const COLOR_BG = "rgb(14 165 233 / 0.12)";
const COLOR_BORDER = "rgb(14 165 233 / 0.3)";

const STAT_CARDS = [
  {
    label: "Vehicles Tracked",
    value: "—",
    Icon: Truck,
    sub: "Available when Fleet launches Q2 2027",
  },
  {
    label: "Jobs in Progress",
    value: "—",
    Icon: ClipboardList,
    sub: "Available when Fleet launches Q2 2027",
  },
  {
    label: "Distance Today",
    value: "—",
    Icon: Route,
    sub: "Available when Fleet launches Q2 2027",
  },
  {
    label: "Fuel Spend Estimate",
    value: "—",
    Icon: Fuel,
    sub: "Available when Fleet launches Q2 2027",
  },
];

export default async function FleetDashboardPage() {
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
            SERVLO Fleet is launching Q2 2027. You&apos;re on the early access list.
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            GPS tracking, job dispatch and fuel management for your whole fleet.
          </p>
        </div>
        <a
          href="mailto:hello@servlo.com.au?subject=SERVLO Fleet Early Access"
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: COLOR }}
        >
          Join waitlist
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Fleet Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Your vehicles, drivers and jobs at a glance.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ label, value, Icon, sub }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-xl border p-5"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                {label}
              </p>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: COLOR_BG }}
              >
                <Icon size={15} style={{ color: COLOR }} />
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {value}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* Map placeholder */}
      <div
        className="relative overflow-hidden rounded-xl border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* Coming soon overlay */}
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          style={{ background: `color-mix(in srgb, ${COLOR} 8%, rgba(0,0,0,0.65))` }}
        >
          <p className="text-base font-bold" style={{ color: COLOR_LIGHT }}>
            Live tracking map available at launch — Q2 2027
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            See your entire fleet on a real-time map with job status overlays
          </p>
        </div>

        {/* Map placeholder rectangle */}
        <div
          className="flex h-64 items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(14,165,233,0.05) 0%, rgba(14,165,233,0.1) 100%)",
            filter: "blur(0.5px)",
            opacity: 0.5,
          }}
        >
          <div className="text-center">
            <div
              className="mx-auto mb-3 h-24 w-24 rounded-full"
              style={{ background: COLOR_BG }}
            />
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: COLOR_LIGHT }}>
              Live Tracking
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
