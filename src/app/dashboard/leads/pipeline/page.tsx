import { GitBranch, Briefcase, TrendingUp, Zap } from "lucide-react";

const PIPELINE_STAGES = [
  {
    product: "Core",
    Icon: Briefcase,
    description: "Manage the work — jobs, invoices, clients and your team.",
    color: "var(--accent-color)",
  },
  {
    product: "Grow",
    Icon: TrendingUp,
    description: "Market the business — ads, social, reviews and referrals.",
    color: "rgb(168 85 247)",
  },
  {
    product: "Leads",
    Icon: Zap,
    description: "Fill the pipeline — buy verified leads matched to your industry.",
    color: "rgb(245 158 11)",
  },
];

export default function LeadsPipelinePage() {
  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Lead Pipeline
      </h1>

      {/* Platform connection diagram */}
      <div
        className="rounded-xl border p-6"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="mb-6 flex items-center gap-2">
          <GitBranch size={18} style={{ color: "var(--accent-color)" }} />
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            How the platform works together
          </h2>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
          {PIPELINE_STAGES.map((stage, i) => (
            <div key={stage.product} className="flex flex-1 flex-col md:flex-row md:items-start">
              <div
                className="flex flex-1 flex-col rounded-xl border p-5"
                style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}
              >
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: `color-mix(in srgb, ${stage.color} 15%, transparent)` }}
                >
                  <stage.Icon size={20} style={{ color: stage.color }} />
                </div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  SERVLO {stage.product}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  {stage.description}
                </p>
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <div className="hidden items-center px-2 md:flex" aria-hidden>
                  <span className="text-lg" style={{ color: "var(--text-muted)" }}>→</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
          Leads you purchase flow directly into your Core client list, where you can raise quotes, book jobs
          and send invoices — closing the loop from prospect to paid customer.
        </p>
      </div>

      {/* Empty state */}
      <div
        className="flex flex-col items-center justify-center rounded-xl border py-14 text-center"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "color-mix(in srgb, var(--accent-color) 12%, transparent)" }}
        >
          <GitBranch size={32} style={{ color: "var(--accent-color)" }} />
        </span>
        <h2 className="mt-4 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Pipeline tracking — coming soon
        </h2>
        <p className="mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
          When Leads launches, this view will show every purchased lead tracked through contact → quote → job →
          invoice with conversion metrics.
        </p>
      </div>
    </section>
  );
}
