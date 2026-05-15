import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Status | SERVLO",
  description: "Current operational status of SERVLO services.",
};

export const dynamic = "force-dynamic";

/**
 * Lightweight per-service health probes. Each runs with a short timeout so a
 * single down service doesn't drag out the page response. Returns
 * "operational" if reachable, "down" otherwise.
 */
async function probeWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]) as Promise<T | null>;
}

async function probeDatabase(): Promise<"operational" | "down"> {
  try {
    const admin = createAdminClient();
    const result = await probeWithTimeout(
      admin.from("plan_ai_limits").select("plan").limit(1).maybeSingle(),
      2500
    );
    if (!result) return "down";
    if ((result as { error?: unknown }).error) return "down";
    return "operational";
  } catch {
    return "down";
  }
}

async function probeStripe(): Promise<"operational" | "down" | "unknown"> {
  if (!process.env.STRIPE_SECRET_KEY) return "unknown";
  try {
    const result = await probeWithTimeout(stripe.balance.retrieve(), 3000);
    return result ? "operational" : "down";
  } catch {
    return "down";
  }
}

type Incident = {
  id: string;
  title: string;
  description: string | null;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  started_at: string;
  resolved_at: string | null;
  component?: string | null;
};

const STATUS_LABELS: Record<Incident["status"], string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

// Components shown on the status page. Each is "operational" unless an
// active (unresolved) incident references it by name.
const COMPONENTS = [
  { id: "app", label: "Web application" },
  { id: "auth", label: "Sign in & accounts" },
  { id: "database", label: "Database" },
  { id: "billing", label: "Billing (Stripe)" },
  { id: "email", label: "Email delivery" },
  { id: "api", label: "API & integrations" },
];

function componentStatus(
  componentId: string,
  openIncidents: Incident[],
  liveProbes: { database: string; stripe: string }
): {
  state: "operational" | "degraded" | "down";
  label: string;
} {
  // Live probes override declared status — if Supabase or Stripe is failing
  // right now, show "down" regardless of what the incidents table says.
  if (componentId === "database" && liveProbes.database === "down") {
    return { state: "down", label: "Outage" };
  }
  if (componentId === "billing" && liveProbes.stripe === "down") {
    return { state: "down", label: "Outage" };
  }

  const affecting = openIncidents.filter(
    (i) => (i.component ?? "").toLowerCase() === componentId
  );
  if (affecting.length === 0) return { state: "operational", label: "Operational" };
  const worst = affecting.reduce<Incident["severity"]>(
    (max, i) => (i.severity === "critical" ? "critical" : i.severity === "major" && max !== "critical" ? "major" : max),
    "minor"
  );
  if (worst === "critical") return { state: "down", label: "Outage" };
  if (worst === "major") return { state: "down", label: "Degraded" };
  return { state: "degraded", label: "Investigating" };
}

export default async function StatusPage() {
  const admin = createAdminClient();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  let incidents: Incident[] = [];
  let fetchOk = true;

  try {
    const { data, error } = await admin
      .from("incidents")
      .select("id, title, description, status, severity, started_at, resolved_at, component")
      .gte("started_at", ninetyDaysAgo)
      .order("started_at", { ascending: false });

    if (error && (error as { code?: string }).code !== "42P01") {
      // Real error (not "table missing") — surface as a warning banner.
      console.error("[status] incidents fetch failed:", error.message);
      fetchOk = false;
    } else {
      incidents = (data ?? []) as Incident[];
    }
  } catch (err) {
    console.error("[status] fetch threw:", err);
    fetchOk = false;
  }

  // Live probes run in parallel — total worst-case wait is the longest timeout.
  const [databaseProbe, stripeProbe] = await Promise.all([
    probeDatabase(),
    probeStripe(),
  ]);
  const liveProbes = { database: databaseProbe, stripe: stripeProbe };
  const liveOutages =
    (databaseProbe === "down" ? 1 : 0) +
    (stripeProbe === "down" ? 1 : 0);

  const openIncidents = incidents.filter((i) => i.status !== "resolved");
  const overallOperational = fetchOk && openIncidents.length === 0 && liveOutages === 0;
  const overrideMessage = process.env.STATUS_OVERRIDE_MESSAGE;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-200 [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,sans-serif]">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">System Status</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Live operational status for SERVLO services. Subscribe to{" "}
          <a href="https://servlo.app/status" className="font-bold text-white underline underline-offset-4 hover:text-neutral-300">
            this page
          </a>{" "}
          for ongoing updates.
        </p>

        {overrideMessage ? (
          <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {overrideMessage}
          </div>
        ) : null}

        {/* Overall status pill */}
        <div
          className={`mt-6 flex items-center gap-3 rounded-xl border px-5 py-4 ${
            overallOperational
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-red-500/30 bg-red-500/10"
          }`}
        >
          <span
            className={`inline-block h-3 w-3 rounded-full ${
              overallOperational ? "bg-emerald-500" : "bg-red-500"
            } ${overallOperational ? "" : "animate-pulse"}`}
          />
          <span className={`text-base font-bold ${overallOperational ? "text-emerald-300" : "text-red-300"}`}>
            {!fetchOk
              ? "Status data temporarily unavailable"
              : overallOperational
                ? "All systems operational"
                : `${openIncidents.length} active incident${openIncidents.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Components list */}
        <section className="mt-10">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
            Components
          </h2>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111111]">
            {COMPONENTS.map((c, idx) => {
              const s = componentStatus(c.id, openIncidents, liveProbes);
              return (
                <div
                  key={c.id}
                  className={`flex items-center justify-between px-5 py-3 ${
                    idx > 0 ? "border-t border-white/[0.06]" : ""
                  }`}
                >
                  <span className="text-sm text-white">{c.label}</span>
                  <span
                    className={`inline-flex items-center gap-2 text-xs font-semibold ${
                      s.state === "operational"
                        ? "text-emerald-400"
                        : s.state === "degraded"
                          ? "text-amber-400"
                          : "text-red-400"
                    }`}
                  >
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        s.state === "operational"
                          ? "bg-emerald-500"
                          : s.state === "degraded"
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                    />
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Incidents list */}
        <section className="mt-10">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
            Recent incidents (last 90 days)
          </h2>

          {incidents.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-[#111111] px-5 py-6 text-sm text-neutral-400">
              No incidents reported in the last 90 days.
            </p>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => (
                <article
                  key={incident.id}
                  className={`rounded-xl border border-white/10 px-5 py-4 ${
                    incident.status === "resolved" ? "bg-[#0d0d0d]" : "bg-[#111111]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-white">{incident.title}</h3>
                    <div className="flex gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                          incident.severity === "critical"
                            ? "bg-red-500/15 text-red-300"
                            : incident.severity === "major"
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-white/10 text-white"
                        }`}
                      >
                        {incident.severity}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                          incident.status === "resolved"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {STATUS_LABELS[incident.status]}
                      </span>
                    </div>
                  </div>
                  {incident.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                      {incident.description}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs text-neutral-500">
                    Started:{" "}
                    {new Date(incident.started_at).toLocaleString("en-AU", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {incident.resolved_at ? (
                      <>
                        {" "}&middot; Resolved:{" "}
                        {new Date(incident.resolved_at).toLocaleString("en-AU", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </>
                    ) : incident.status !== "resolved" ? (
                      <> &middot; <span className="font-semibold text-red-400">Ongoing</span></>
                    ) : null}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-neutral-500">
          <p>
            SERVLO — operated by Brodie McDonald, ABN 88 688 301 684. For urgent
            issues during an outage, email{" "}
            <a href="mailto:hello@servlo.com.au" className="font-bold text-neutral-300 underline">
              hello@servlo.com.au
            </a>.
          </p>
        </footer>
      </main>
    </div>
  );
}
