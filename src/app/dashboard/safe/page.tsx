import { ShieldCheck, AlertTriangle, BookOpen, ClipboardCheck } from "lucide-react";

export const dynamic = "force-dynamic";

const COLOR = "#EF4444";
const COLOR_LIGHT = "#FCA5A5";
const COLOR_BG = "rgb(239 68 68 / 0.12)";
const COLOR_BORDER = "rgb(239 68 68 / 0.3)";

const STAT_CARDS = [
  {
    label: "Total Incidents",
    value: "—",
    Icon: AlertTriangle,
    sub: "Available when Safe launches Q2 2027",
  },
  {
    label: "Open Actions",
    value: "—",
    Icon: ClipboardCheck,
    sub: "Available when Safe launches Q2 2027",
  },
  {
    label: "Toolbox Talks",
    value: "—",
    Icon: BookOpen,
    sub: "Available when Safe launches Q2 2027",
  },
  {
    label: "Compliance Score",
    value: "—",
    Icon: ShieldCheck,
    sub: "Available when Safe launches Q2 2027",
  },
];

const DEMO_INCIDENTS = [
  {
    date: "Today 8:45 AM",
    type: "Near Miss",
    location: "Site A — 12 Example St",
    severity: "Low",
    status: "Open",
  },
  {
    date: "Yesterday 2:30 PM",
    type: "Injury",
    location: "Site B — 45 Sample Ave",
    severity: "Medium",
    status: "Under Review",
  },
  {
    date: "Mon 10:15 AM",
    type: "Hazard",
    location: "Site C — 78 Demo Rd",
    severity: "High",
    status: "Closed",
  },
  {
    date: "Last Fri 3:00 PM",
    type: "Near Miss",
    location: "Site A — 12 Example St",
    severity: "Low",
    status: "Closed",
  },
  {
    date: "Last Thu 9:20 AM",
    type: "Equipment",
    location: "Workshop — Main Depot",
    severity: "Medium",
    status: "Open",
  },
];

export default function SafeDashboardPage() {
  return (
    <section className="space-y-6">
      {/* Launch banner */}
      <div
        className="flex items-center justify-between gap-4 rounded-xl px-5 py-4"
        style={{ background: COLOR_BG, border: `1px solid ${COLOR_BORDER}` }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: COLOR_LIGHT }}>
            SERVLO Safe is launching Q2 2027. You&apos;re on the early access list.
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            Workplace safety compliance, incident reporting and toolbox talks.
          </p>
        </div>
        <a
          href="mailto:hello@servlo.com.au?subject=SERVLO Safe Early Access"
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: COLOR }}
        >
          Join waitlist
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Safe Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Your workplace safety compliance hub.
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

      {/* Demo incident log preview */}
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
            Live incident log available at launch
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Preview below shows what your safety dashboard will look like
          </p>
        </div>

        <div className="p-5" style={{ filter: "blur(1px)", opacity: 0.5 }}>
          <h2 className="mb-4 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Recent incidents
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Date", "Type", "Location", "Severity", "Status"].map((h) => (
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
                {DEMO_INCIDENTS.slice(0, 3).map((incident, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="py-2.5 pr-4 text-xs" style={{ color: "var(--text-muted)" }}>
                      {incident.date}
                    </td>
                    <td className="py-2.5 pr-4 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {incident.type}
                    </td>
                    <td className="py-2.5 pr-4 text-xs" style={{ color: "var(--text-primary)" }}>
                      {incident.location}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background:
                            incident.severity === "High"
                              ? "rgb(239 68 68 / 0.15)"
                              : incident.severity === "Medium"
                              ? "rgb(249 115 22 / 0.15)"
                              : "rgb(255 255 255 / 0.08)",
                          color:
                            incident.severity === "High"
                              ? COLOR_LIGHT
                              : incident.severity === "Medium"
                              ? "#FDBA74"
                              : "var(--text-muted)",
                        }}
                      >
                        {incident.severity}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background:
                            incident.status === "Closed"
                              ? "rgb(255 255 255 / 0.06)"
                              : "rgb(239 68 68 / 0.15)",
                          color:
                            incident.status === "Closed" ? "var(--text-muted)" : COLOR_LIGHT,
                        }}
                      >
                        {incident.status}
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
