import { Star } from "lucide-react";

export default function GrowReviewsPage() {
  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Google Review Automation
      </h1>

      <div
        className="flex flex-col items-center justify-center rounded-xl border py-20 text-center"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "color-mix(in srgb, var(--accent-color) 12%, transparent)" }}
        >
          <Star size={32} style={{ color: "var(--accent-color)" }} />
        </span>
        <h2 className="mt-4 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Google Review Automation
        </h2>
        <span
          className="mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ring-1 ring-amber-400/30"
          style={{
            background: "rgb(245 158 11 / 0.15)",
            color: "rgb(251 191 36)",
          }}
        >
          Coming soon
        </span>
        <p className="mt-3 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
          Send automated review requests after each completed job. More 5-star reviews means more inbound leads —
          no chasing customers required.
        </p>
      </div>
    </section>
  );
}
