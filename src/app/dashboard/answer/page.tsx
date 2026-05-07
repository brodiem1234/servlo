import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PhoneCall, CalendarCheck, VoicemailIcon, TrendingUp } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const COLOR = "#14B8A6";
const COLOR_LIGHT = "#5EEAD4";
const COLOR_BG = "rgb(20 184 166 / 0.12)";
const COLOR_BORDER = "rgb(20 184 166 / 0.3)";

const STAT_CARDS = [
  {
    label: "Total Calls Answered",
    value: "—",
    Icon: PhoneCall,
    sub: "Available when Answer launches Q3 2026",
  },
  {
    label: "Bookings Made by AI",
    value: "—",
    Icon: CalendarCheck,
    sub: "Available when Answer launches Q3 2026",
  },
  {
    label: "Missed Calls Captured",
    value: "—",
    Icon: VoicemailIcon,
    sub: "Available when Answer launches Q3 2026",
  },
  {
    label: "Conversion Rate",
    value: "—",
    Icon: TrendingUp,
    sub: "Available when Answer launches Q3 2026",
  },
];

const DEMO_CALLS = [
  {
    time: "Today 9:14 AM",
    caller: "+61 412 345 678",
    duration: "1m 42s",
    outcome: "Booked",
    transcript: "Caller requested a quote for hot water system install",
  },
  {
    time: "Today 8:02 AM",
    caller: "+61 433 987 654",
    duration: "0m 58s",
    outcome: "Voicemail",
    transcript: "After-hours call — left voicemail, callback scheduled",
  },
  {
    time: "Yesterday 4:37 PM",
    caller: "+61 405 111 222",
    duration: "2m 15s",
    outcome: "Booked",
    transcript: "Emergency plumbing inquiry — booked next day callout",
  },
  {
    time: "Yesterday 11:50 AM",
    caller: "+61 488 000 111",
    duration: "0m 22s",
    outcome: "Transferred",
    transcript: "Insurance claim inquiry — transferred to owner",
  },
  {
    time: "Mon 2:18 PM",
    caller: "+61 417 555 999",
    duration: "3m 01s",
    outcome: "Booked",
    transcript: "New customer — booked annual gas heater service",
  },
];

export default async function AnswerDashboardPage() {
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
            SERVLO Answer is launching Q3 2026. You&apos;re on the early access list.
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            Your AI phone agent — answers calls, books jobs, captures leads while you work.
          </p>
        </div>
        <a
          href="mailto:hello@servlo.com.au?subject=SERVLO Answer Early Access"
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: COLOR }}
        >
          Join waitlist
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Answer Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Your AI phone agent at a glance.
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

      {/* Demo call log preview */}
      <div
        className="relative overflow-hidden rounded-xl border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* Coming soon overlay */}
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${COLOR} 10%, rgba(0,0,0,0.7))` }}
        >
          <p className="text-base font-bold" style={{ color: COLOR_LIGHT }}>
            Live call log available at launch
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Preview below shows what your call dashboard will look like
          </p>
          <Link
            href="/dashboard/answer/calls"
            className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: COLOR }}
          >
            View full call log
          </Link>
        </div>

        <div className="p-5" style={{ filter: "blur(1px)", opacity: 0.5 }}>
          <h2 className="mb-4 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Recent calls
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Time", "Caller", "Duration", "Outcome"].map((h) => (
                    <th
                      key={h}
                      className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_CALLS.slice(0, 3).map((call, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="py-2.5 pr-4 text-xs" style={{ color: "var(--text-muted)" }}>
                      {call.time}
                    </td>
                    <td className="py-2.5 pr-4 text-xs font-mono" style={{ color: "var(--text-primary)" }}>
                      {call.caller}
                    </td>
                    <td className="py-2.5 pr-4 text-xs" style={{ color: "var(--text-primary)" }}>
                      {call.duration}
                    </td>
                    <td className="py-2.5">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background:
                            call.outcome === "Booked"
                              ? "rgb(20 184 166 / 0.15)"
                              : "rgb(255 255 255 / 0.08)",
                          color: call.outcome === "Booked" ? COLOR_LIGHT : "var(--text-muted)",
                        }}
                      >
                        {call.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
