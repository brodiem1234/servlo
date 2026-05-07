import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const COLOR = "#14B8A6";
const COLOR_LIGHT = "#5EEAD4";
const COLOR_BG = "rgb(20 184 166 / 0.12)";
const COLOR_BORDER = "rgb(20 184 166 / 0.3)";

const DEMO_CALLS = [
  {
    time: "Today 9:14 AM",
    caller: "+61 412 345 678",
    name: "James Nguyen",
    duration: "1m 42s",
    outcome: "Booked",
    transcript: "Caller requested a quote for hot water system install. AI confirmed availability and booked for Thursday 10am.",
  },
  {
    time: "Today 8:02 AM",
    caller: "+61 433 987 654",
    name: "Sarah Mitchell",
    duration: "0m 58s",
    outcome: "Voicemail",
    transcript: "After-hours call — AI left voicemail acknowledgement and scheduled a callback for 9am next business day.",
  },
  {
    time: "Yesterday 4:37 PM",
    caller: "+61 405 111 222",
    name: "Tom Baker",
    duration: "2m 15s",
    outcome: "Booked",
    transcript: "Emergency plumbing inquiry, burst pipe under sink. AI triaged urgency and booked next-day callout with priority flag.",
  },
  {
    time: "Yesterday 11:50 AM",
    caller: "+61 488 000 111",
    name: "Priya Sharma",
    duration: "0m 22s",
    outcome: "Transferred",
    transcript: "Insurance claim inquiry outside AI scope. Transferred to owner mobile as per escalation rules.",
  },
  {
    time: "Mon 2:18 PM",
    caller: "+61 417 555 999",
    name: "Ken Williamson",
    duration: "3m 01s",
    outcome: "Booked",
    transcript: "New customer — annual gas heater service. AI collected address, confirmed pricing and booked Tue 8am.",
  },
];

export default async function AnswerCallsPage() {
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
          SERVLO Answer is launching Q3 2026. Call log data shown below is a preview.
        </p>
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
          Call Log
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Every call your AI agent handles — with full transcripts.
        </p>
      </div>

      <div
        className="relative overflow-hidden rounded-xl border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* Coming soon overlay */}
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${COLOR} 8%, rgba(0,0,0,0.65))` }}
        >
          <p className="text-base font-bold" style={{ color: COLOR_LIGHT }}>
            Live call data available at launch — Q3 2026
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Preview below shows sample call records
          </p>
        </div>

        <div className="p-5" style={{ filter: "blur(1px)", opacity: 0.5 }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Time", "Caller", "Duration", "Outcome", "Transcript"].map((h) => (
                    <th
                      key={h}
                      className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_CALLS.map((call, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="py-3 pr-4 text-xs" style={{ color: "var(--text-muted)" }}>
                      {call.time}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                        {call.name}
                      </p>
                      <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                        {call.caller}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-xs" style={{ color: "var(--text-primary)" }}>
                      {call.duration}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background:
                            call.outcome === "Booked"
                              ? "rgb(20 184 166 / 0.15)"
                              : call.outcome === "Transferred"
                              ? "rgb(99 102 241 / 0.15)"
                              : "rgb(255 255 255 / 0.08)",
                          color:
                            call.outcome === "Booked"
                              ? COLOR_LIGHT
                              : call.outcome === "Transferred"
                              ? "#A5B4FC"
                              : "var(--text-muted)",
                        }}
                      >
                        {call.outcome}
                      </span>
                    </td>
                    <td
                      className="max-w-[240px] py-3 text-xs leading-relaxed"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {call.transcript}
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
