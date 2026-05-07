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
          style={{ background: "rgb(139 92 246 / 0.15)" }}
        >
          <Star size={32} style={{ color: "#8B5CF6" }} />
        </span>
        <h2 className="mt-4 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Google Review Automation
        </h2>
        <span
          className="mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ring-1 ring-purple-400/30"
          style={{
            background: "rgb(139 92 246 / 0.2)",
            color: "#C4B5FD",
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
