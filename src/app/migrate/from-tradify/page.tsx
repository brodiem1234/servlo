import Link from "next/link";

export const metadata = {
 title: "Switching from Tradify to SERVLO",
 description: "A clear guide to migrating from Tradify to SERVLO: Australian service business management software.",
};

export default function MigrateFromTradifyPage() {
 return (
 <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 740, margin: "0 auto", padding: "48px 24px" }}>
 <div style={{ marginBottom: 32 }}>
 <a href="/" style={{ fontSize: 18, fontWeight: 700, color: "#3B82F6", textDecoration: "none" }}>SERVLO</a>
 </div>

 <h1 style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", marginBottom: 8 }}>
 Switching from Tradify to SERVLO
 </h1>
 <p style={{ fontSize: 16, color: "#a3a3a3", marginBottom: 40 }}>
 A simple, clear guide to migrating your business data.
 </p>

 {/* Step 1 */}
 <section style={{ marginBottom: 36 }}>
 <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", marginBottom: 8 }}>
 Step 1: Export your Tradify data
 </h2>
 <p style={{ color: "#e5e5e5", lineHeight: 1.7, marginBottom: 12 }}>
 From your Tradify account, go to <strong>Settings &rarr; Export Data</strong>.
 You can download your customers, jobs, and invoices as CSV files.
 </p>
 <p style={{ color: "#a3a3a3", fontSize: 14 }}>
 If you can&apos;t find the export option, contact Tradify support directly.
 All SaaS providers are required to provide your data on request.
 </p>
 </section>

 {/* Step 2 */}
 <section style={{ marginBottom: 36 }}>
 <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", marginBottom: 8 }}>
 Step 2: Import into SERVLO
 </h2>
 <p style={{ color: "#e5e5e5", lineHeight: 1.7, marginBottom: 12 }}>
 Here&apos;s what comes across easily and what to plan for:
 </p>
 <ul style={{ color: "#e5e5e5", lineHeight: 2, paddingLeft: 20 }}>
 <li><strong>Clients</strong>: import via CSV in Settings &rarr; Import/Export, or add them as they come up</li>
 <li><strong>Jobs</strong>: historical jobs can be imported as reference; active jobs are re-created in SERVLO</li>
 <li><strong>Quotes &amp; Invoices</strong>: we recommend a clean slate in SERVLO for billing clarity</li>
 <li><strong>Team members</strong>: re-invite from Team &rarr; Employees (takes 2 minutes each)</li>
 </ul>
 <p style={{ color: "#a3a3a3", fontSize: 14, marginTop: 12 }}>
 <strong>Bulk Tradify import coming soon.</strong> Email{" "}
 <a href="mailto:hello@servlo.com.au" style={{ color: "#3B82F6" }}>hello@servlo.com.au</a> for early access.
 </p>
 </section>

 {/* Step 3 */}
 <section style={{ marginBottom: 40 }}>
 <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", marginBottom: 8 }}>
 Step 3: Let us know what brought you here
 </h2>
 <p style={{ color: "#e5e5e5", lineHeight: 1.7 }}>
 Understanding why you switched helps us build a better product. Reply to any of our emails
 or reach us at{" "}
 <a href="mailto:hello@servlo.com.au" style={{ color: "#3B82F6" }}>hello@servlo.com.au</a>.
 We read every response.
 </p>
 </section>

 {/* CTA */}
 <div style={{
 background: "linear-gradient(135deg, #3B82F6 0%, #0e7490 100%)",
 borderRadius: 16, padding: "32px 40px", textAlign: "center"
 }}>
 <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
 Ready to try SERVLO?
 </h3>
 <p style={{ color: "rgba(255,255,255,0.85)", marginBottom: 20 }}>
 30-day money-back guarantee. Your data, always yours.
 </p>
 <a
 href="/auth/signup"
 style={{
 display: "inline-block", background: "#fff", color: "#0A0A0A",
 padding: "14px 32px", borderRadius: 8, fontWeight: 700,
 textDecoration: "none", fontSize: 16
 }}
 >
 Sign up. Founding 50 lock for life
 </a>
 </div>

 <div style={{ marginTop: 48, borderTop: "1px solid #404040", paddingTop: 24 }}>
 <p style={{ color: "#a3a3a3", fontSize: 13 }}>
 Also switching from another tool?{" "}
 <Link href="/migrate/from-servicem8" style={{ color: "#3B82F6" }}>ServiceM8</Link>
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
