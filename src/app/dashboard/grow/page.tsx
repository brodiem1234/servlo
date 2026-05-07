import { TrendingUp, Megaphone, Share2, Star, Users2 } from "lucide-react";

const STAT_CARDS = [
  { label: "Ads Created", value: "—", Icon: Megaphone },
  { label: "Social Posts", value: "—", Icon: Share2 },
  { label: "Reviews Generated", value: "—", Icon: Star },
  { label: "Referrals", value: "—", Icon: Users2 },
];

export default function GrowDashboardPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Grow Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Your marketing performance at a glance.
          </p>
        </div>
        <span
          className="mt-1 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-amber-400/30"
          style={{ background: "rgb(245 158 11 / 0.15)", color: "rgb(251 191 36)" }}
        >
          Coming soon
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ label, value, Icon }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-xl border p-5"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                {label}
              </p>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "color-mix(in srgb, var(--accent-color) 12%, transparent)" }}
              >
                <Icon size={15} style={{ color: "var(--accent-color)" }} />
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {value}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Available when Grow launches
            </p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div
        className="flex flex-col items-center justify-center rounded-xl border py-16 text-center"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "color-mix(in srgb, var(--accent-color) 12%, transparent)" }}
        >
          <TrendingUp size={32} style={{ color: "var(--accent-color)" }} />
        </span>
        <h2 className="mt-4 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          SERVLO Grow — coming soon
        </h2>
        <p className="mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
          AI-powered ads, social content, review automation and referral tracking — built for Australian service businesses.
          Launching Q3 2026.
        </p>
      </div>
    </section>
  );
}
