import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Switching from Jobber to SERVLO",
  description: "Migrate from Jobber to SERVLO: Australian-built job management software designed for service businesses. No per-user pricing.",
};

export default function MigrateFromJobberPage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 740, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <a href="/" style={{ fontSize: 18, fontWeight: 700, color: "#3B82F6", textDecoration: "none" }}>SERVLO</a>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
        Switching from Jobber to SERVLO
      </h1>
      <p style={{ fontSize: 16, color: "#64748b", marginBottom: 40 }}>
        Jobber is a solid tool, but it charges per user and is built for the North American market. SERVLO is built for Australian service businesses with flat pricing.
      </p>

      {/* Why switch */}
      <section style={{ marginBottom: 36, background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "20px 24px" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0c4a6e", marginBottom: 12 }}>
          Why Australian businesses switch from Jobber
        </h2>
        <ul style={{ color: "#0c4a6e", lineHeight: 2, paddingLeft: 20, margin: 0 }}>
          <li>Jobber pricing grows as you hire. SERVLO plans are flat-rate</li>
          <li>SERVLO includes Australian GST (10%) on all invoices and quotes automatically</li>
          <li>ABN lookup, Australian suburbs autocomplete, and ATO-ready BAS helper</li>
          <li>Australian-hosted data (Supabase Sydney region)</li>
          <li>Local support team. No international timezone delays</li>
        </ul>
      </section>

      {/* Comparison table */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>
          Feature comparison
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>Feature</th>
              <th style={{ textAlign: "center", padding: "10px 12px", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>Jobber</th>
              <th style={{ textAlign: "center", padding: "10px 12px", borderBottom: "2px solid #3B82F6", color: "#3B82F6" }}>SERVLO</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Job scheduling", "✓", "✓"],
              ["Invoicing & quotes", "✓", "✓"],
              ["GST-aware invoicing (AU)", "—", "✓"],
              ["ABN lookup", "—", "✓"],
              ["BAS helper", "—", "✓"],
              ["AI quote generation", "—", "✓"],
              ["Flat-rate pricing", "—", "✓"],
              ["Online booking page", "✓", "✓"],
              ["Client portal", "✓", "✓"],
              ["Xero / MYOB integration", "Xero only", "✓ Both"],
              ["Recurring jobs", "✓", "✓"],
              ["Team timesheets", "✓", "✓"],
            ].map(([feature, jobber, servlo], i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "10px 12px", color: "#334155" }}>{feature}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", color: jobber === "—" ? "#94a3b8" : "#334155" }}>{jobber}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", color: "#3B82F6", fontWeight: 600 }}>{servlo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Migration steps */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
          Step 1: Export from Jobber
        </h2>
        <p style={{ color: "#334155", lineHeight: 1.7 }}>
          In Jobber, go to <strong>Settings &rarr; Data &rarr; Export</strong>. Download your client list, job history, and invoice records as CSV files.
        </p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
          Step 2: Import into SERVLO
        </h2>
        <ul style={{ color: "#334155", lineHeight: 2, paddingLeft: 20 }}>
          <li>Clients import via CSV in <strong>Settings &rarr; Import/Export</strong></li>
          <li>Jobs can be recreated or imported from exported data</li>
          <li>Pricebook items can be entered in bulk from your existing rate card</li>
          <li>Connect Xero or MYOB in Settings &rarr; Integrations for financial continuity</li>
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
          Step 3: Start your free trial
        </h2>
        <p style={{ color: "#334155", lineHeight: 1.7, marginBottom: 16 }}>
          SERVLO offers a 30-day free trial. No credit card required. Run both systems side-by-side until you&apos;re confident, then cancel Jobber when you&apos;re ready.
        </p>
        <a
          href="/auth/signup"
          style={{ display: "inline-block", background: "#3B82F6", color: "#fff", padding: "14px 28px", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 15 }}
        >
          Start free trial
        </a>
      </section>

      {/* Need help */}
      <section style={{ background: "#f8fafc", borderRadius: 12, padding: "20px 24px", marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
          Need migration help?
        </h2>
        <p style={{ color: "#475569", fontSize: 14, margin: 0 }}>
          Our team will help you migrate from Jobber for free. Email{" "}
          <a href="mailto:hello@servlo.com.au" style={{ color: "#3B82F6" }}>hello@servlo.com.au</a>{" "}
          with your Jobber export and we&apos;ll get you set up.
        </p>
      </section>

      <p style={{ color: "#94a3b8", fontSize: 13 }}>
        <a href="/migrate/from-servicem8" style={{ color: "#3B82F6" }}>Switching from ServiceM8?</a>
        {" · "}
        <a href="/migrate/from-tradify" style={{ color: "#3B82F6" }}>Switching from Tradify?</a>
        {" · "}
        <a href="/migrate/from-simpro" style={{ color: "#3B82F6" }}>Switching from simPRO?</a>
      </p>
    </main>
  );
}
