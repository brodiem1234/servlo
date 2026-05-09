import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Switching from simPRO to SERVLO",
  description: "Migrate from simPRO to SERVLO — a simpler, more affordable Australian job management platform for growing service businesses.",
};

export default function MigrateFromSimproPage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 740, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <a href="/" style={{ fontSize: 18, fontWeight: 700, color: "#3B82F6", textDecoration: "none" }}>SERVLO</a>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
        Switching from simPRO to SERVLO
      </h1>
      <p style={{ fontSize: 16, color: "#64748b", marginBottom: 40 }}>
        simPRO is a powerful enterprise platform — but for many small to mid-sized Australian service businesses, it&apos;s more complexity and cost than you need. SERVLO gives you the essentials, done right.
      </p>

      {/* Why switch */}
      <section style={{ marginBottom: 36, background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "20px 24px" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0c4a6e", marginBottom: 12 }}>
          Why businesses switch from simPRO
        </h2>
        <ul style={{ color: "#0c4a6e", lineHeight: 2, paddingLeft: 20, margin: 0 }}>
          <li>simPRO implementation costs are significant — SERVLO is self-serve, no setup fees</li>
          <li>SERVLO is designed for 1–30 person service businesses, not enterprise contractors</li>
          <li>Flat monthly pricing with no per-user fees or module add-ons</li>
          <li>Modern mobile-first interface — no training required for your team</li>
          <li>30-day free trial with demo data pre-loaded so you can evaluate immediately</li>
        </ul>
      </section>

      {/* Who should switch */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
          Is SERVLO right for you?
        </h2>
        <p style={{ color: "#334155", lineHeight: 1.7, marginBottom: 12 }}>
          SERVLO is a great fit if you:
        </p>
        <ul style={{ color: "#334155", lineHeight: 2, paddingLeft: 20 }}>
          <li>Run a service business with fewer than 30 employees</li>
          <li>Need job scheduling, quoting, invoicing, and client management in one place</li>
          <li>Want Australian GST handling and BAS support built in</li>
          <li>Don&apos;t need complex project management, multi-company, or contractor licensing features</li>
        </ul>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>
          If you run a large construction or engineering firm requiring complex project costing, simPRO may still be the better choice. SERVLO is built for trades, cleaning, events, health, and field services.
        </p>
      </section>

      {/* Migration steps */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
          Step 1: Export from simPRO
        </h2>
        <p style={{ color: "#334155", lineHeight: 1.7 }}>
          simPRO allows data export through its reporting module. Export your <strong>Customers</strong>, <strong>Jobs</strong>, and <strong>Invoices</strong> reports to CSV. Contact simPRO support if you need assistance locating the export functions.
        </p>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
          Step 2: Import into SERVLO
        </h2>
        <ul style={{ color: "#334155", lineHeight: 2, paddingLeft: 20 }}>
          <li>Use <strong>Settings &rarr; Import/Export</strong> to bulk-import your client list</li>
          <li>Re-enter your pricebook rates in <strong>Pricebook</strong> — these are quick to add</li>
          <li>Historical jobs can be added manually or left archived in simPRO for reference</li>
          <li>Connect your accounting software (Xero or MYOB) in <strong>Settings &rarr; Integrations</strong></li>
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
          Step 3: Run a 30-day trial
        </h2>
        <p style={{ color: "#334155", lineHeight: 1.7, marginBottom: 16 }}>
          Start a free 30-day trial with no credit card required. Your demo data is pre-loaded so you can explore everything before committing. Most businesses are fully set up within a day.
        </p>
        <a
          href="/auth/signup"
          style={{ display: "inline-block", background: "#3B82F6", color: "#fff", padding: "14px 28px", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 15 }}
        >
          Start free trial
        </a>
      </section>

      {/* Pricing comparison */}
      <section style={{ marginBottom: 36, background: "#f8fafc", borderRadius: 12, padding: "20px 24px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
          Pricing comparison
        </h2>
        <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          simPRO pricing starts at several hundred dollars per month and scales with modules and users.
          SERVLO starts at <strong>$49/month</strong> (Solo) with a flat Team plan at <strong>$99/month</strong> — everything included, no add-ons.
        </p>
      </section>

      {/* Need help */}
      <section style={{ background: "#f8fafc", borderRadius: 12, padding: "20px 24px", marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
          Need migration help?
        </h2>
        <p style={{ color: "#475569", fontSize: 14, margin: 0 }}>
          We&apos;ll help you migrate from simPRO at no cost. Email{" "}
          <a href="mailto:hello@servlo.com.au" style={{ color: "#3B82F6" }}>hello@servlo.com.au</a>{" "}
          with your simPRO exports and we&apos;ll guide you through the transition.
        </p>
      </section>

      <p style={{ color: "#94a3b8", fontSize: 13 }}>
        <a href="/migrate/from-servicem8" style={{ color: "#3B82F6" }}>Switching from ServiceM8?</a>
        {" · "}
        <a href="/migrate/from-tradify" style={{ color: "#3B82F6" }}>Switching from Tradify?</a>
        {" · "}
        <a href="/migrate/from-jobber" style={{ color: "#3B82F6" }}>Switching from Jobber?</a>
      </p>
    </main>
  );
}
