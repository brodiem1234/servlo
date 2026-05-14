import Link from "next/link";

export const metadata = {
  title: "Switching from ServiceM8 to SERVLO",
  description: "A clear guide to migrating from ServiceM8 to SERVLO: Australian service business management software.",
};

export default function MigrateFromServiceM8Page() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 740, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <a href="/" style={{ fontSize: 18, fontWeight: 700, color: "#3B82F6", textDecoration: "none" }}>SERVLO</a>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", marginBottom: 8 }}>
        Switching from ServiceM8 to SERVLO
      </h1>
      <p style={{ fontSize: 16, color: "#a3a3a3", marginBottom: 40 }}>
        A simple, straightforward guide to making the move.
      </p>

      {/* Step 1 */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", marginBottom: 8 }}>
          Step 1: Export your ServiceM8 data
        </h2>
        <p style={{ color: "#e5e5e5", lineHeight: 1.7, marginBottom: 12 }}>
          ServiceM8 lets you export your data from the web app. Go to <strong>Settings &rarr; Company &rarr; Data Export</strong>
          in your ServiceM8 account. Download your clients, jobs, and financial records.
        </p>
        <p style={{ color: "#a3a3a3", fontSize: 14 }}>
          For detailed steps, refer to ServiceM8&apos;s own documentation. They make this straightforward.
        </p>
      </section>

      {/* Step 2 */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", marginBottom: 8 }}>
          Step 2: Import into SERVLO
        </h2>
        <p style={{ color: "#e5e5e5", lineHeight: 1.7, marginBottom: 12 }}>
          What to expect during import:
        </p>
        <ul style={{ color: "#e5e5e5", lineHeight: 2, paddingLeft: 20 }}>
          <li>Client records map directly: name, phone, email, address all come across</li>
          <li>Job history can be entered manually or via our CSV import (in Settings &rarr; Import/Export)</li>
          <li>Invoices and quotes: we recommend starting fresh in SERVLO for a clean history</li>
          <li>Employee details can be re-entered in Team &rarr; Employees</li>
        </ul>
        <p style={{ color: "#a3a3a3", fontSize: 14, marginTop: 12 }}>
          <strong>Bulk import coming soon</strong>: we&apos;re building a direct ServiceM8 CSV import tool.
          If you&apos;d like early access, email <a href="mailto:hello@servlo.com.au" style={{ color: "#3B82F6" }}>hello@servlo.com.au</a>.
        </p>
      </section>

      {/* Step 3 */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", marginBottom: 8 }}>
          Step 3: Tell us why you switched
        </h2>
        <p style={{ color: "#e5e5e5", lineHeight: 1.7 }}>
          We&apos;d genuinely love to know. Reply to any of our emails, or drop us a note at{" "}
          <a href="mailto:hello@servlo.com.au" style={{ color: "#3B82F6" }}>hello@servlo.com.au</a>.
          Your feedback shapes what we build next.
        </p>
      </section>

      {/* CTA */}
      <div style={{
        background: "linear-gradient(135deg, #3B82F6 0%, #0e7490 100%)",
        borderRadius: 16, padding: "32px 40px", textAlign: "center"
      }}>
        <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
          Ready to make the move?
        </h3>
        <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: 20 }}>
          30-day free trial. No credit card required. Cancel anytime.
        </p>
        <a
          href="/auth/signup"
          style={{
            display: "inline-block", background: "#fff", color: "#3B82F6",
            padding: "14px 32px", borderRadius: 8, fontWeight: 700,
            textDecoration: "none", fontSize: 16
          }}
        >
          Start your free trial
        </a>
      </div>

      <div style={{ marginTop: 48, borderTop: "1px solid #404040", paddingTop: 24 }}>
        <p style={{ color: "#a3a3a3", fontSize: 13 }}>
          Also switching from another tool?{" "}
          <Link href="/migrate/from-tradify" style={{ color: "#3B82F6" }}>Tradify</Link>
          {" "}&middot;{" "}
          <Link href="/migrate/from-jobber" style={{ color: "#3B82F6" }}>Jobber</Link>
          {" "}&middot;{" "}
          <Link href="/migrate/from-simpro" style={{ color: "#3B82F6" }}>simPRO</Link>
          {" "}&middot;{" "}
          <a href="/" style={{ color: "#3B82F6" }}>Back to SERVLO</a>
        </p>
      </div>
    </main>
  );
}
