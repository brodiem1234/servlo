import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Incident = {
  id: string;
  title: string;
  description: string | null;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  started_at: string;
  resolved_at: string | null;
};

const STATUS_LABELS: Record<Incident["status"], string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

const SEVERITY_COLORS: Record<Incident["severity"], string> = {
  minor: "#d97706",   // amber
  major: "#dc2626",   // red
  critical: "#7c3aed", // purple
};

export default async function StatusPage() {
  const admin = createAdminClient();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: incidents } = await admin
    .from("incidents")
    .select("id, title, description, status, severity, started_at, resolved_at")
    .gte("started_at", ninetyDaysAgo)
    .order("started_at", { ascending: false });

  const openIncidents = (incidents ?? []).filter((i: Incident) => i.status !== "resolved");
  const isOperational = openIncidents.length === 0;

  // Optional env-based override message
  const overrideMessage = process.env.STATUS_OVERRIDE_MESSAGE;

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 700, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 40 }}>
        <a href="/" style={{ fontSize: 20, fontWeight: 700, color: "#3B82F6", textDecoration: "none" }}>
          SERVLO
        </a>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", marginTop: 24, marginBottom: 8 }}>
          System Status
        </h1>

        {overrideMessage && (
          <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
            <p style={{ margin: 0, color: "#92400e", fontWeight: 600 }}>{overrideMessage}</p>
          </div>
        )}

        {/* Overall status */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "16px 20px",
          borderRadius: 10, marginBottom: 32,
          background: isOperational ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${isOperational ? "#bbf7d0" : "#fecaca"}`
        }}>
          <div style={{
            width: 12, height: 12, borderRadius: "50%",
            background: isOperational ? "#16a34a" : "#dc2626"
          }} />
          <span style={{ fontWeight: 700, color: isOperational ? "#15803d" : "#dc2626" }}>
            {isOperational ? "All systems operational" : `${openIncidents.length} active incident${openIncidents.length !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      {/* Incidents list */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>
          Recent incidents (last 90 days)
        </h2>

        {(incidents ?? []).length === 0 ? (
          <p style={{ color: "#64748b", fontSize: 15 }}>No incidents reported in the last 90 days.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(incidents as Incident[]).map((incident) => (
              <div key={incident.id} style={{
                border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px",
                background: incident.status === "resolved" ? "#f8fafc" : "#fff"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
                    {incident.title}
                  </h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                      background: SEVERITY_COLORS[incident.severity] + "20",
                      color: SEVERITY_COLORS[incident.severity], textTransform: "uppercase"
                    }}>
                      {incident.severity}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                      background: incident.status === "resolved" ? "#f0fdf4" : "#fef3c7",
                      color: incident.status === "resolved" ? "#15803d" : "#92400e",
                      textTransform: "uppercase"
                    }}>
                      {STATUS_LABELS[incident.status]}
                    </span>
                  </div>
                </div>
                {incident.description && (
                  <p style={{ margin: "8px 0 0", color: "#475569", fontSize: 14, lineHeight: 1.5 }}>
                    {incident.description}
                  </p>
                )}
                <p style={{ margin: "10px 0 0", fontSize: 12, color: "#94a3b8" }}>
                  Started: {new Date(incident.started_at).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
                  {incident.resolved_at && (
                    <> &middot; Resolved: {new Date(incident.resolved_at).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}</>
                  )}
                  {!incident.resolved_at && incident.status !== "resolved" && (
                    <> &middot; <span style={{ color: "#dc2626", fontWeight: 600 }}>Ongoing</span></>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer style={{ marginTop: 60, borderTop: "1px solid #e2e8f0", paddingTop: 24 }}>
        <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
          &copy; {new Date().getFullYear()} SERVLO &mdash; Business management software for Australian service businesses.
          {" "}<a href="/" style={{ color: "#3B82F6" }}>Back to SERVLO</a>
        </p>
      </footer>
    </main>
  );
}
