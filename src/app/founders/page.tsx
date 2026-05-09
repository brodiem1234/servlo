import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SERVLO Founding Members",
  description: "The first 100 businesses to join SERVLO — locked-in pricing, early access, and a direct line to the team.",
};

export default async function FoundersPage() {
  const admin = createAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_founding_member", true);

  const founderCount = count ?? 0;
  const remaining = Math.max(0, 100 - founderCount);
  const pct = Math.min(100, Math.round((founderCount / 100) * 100));

  const benefits = [
    { emoji: "💰", title: "Locked-in pricing for life", desc: "Your plan rate never increases, ever." },
    { emoji: "🗺️", title: "Priority roadmap input", desc: "Your feature requests go to the top of the list." },
    { emoji: "🚀", title: "Early access to everything", desc: "First to try every new feature before public launch." },
    { emoji: "🏅", title: "Permanent recognition", desc: "Your business listed on this page forever." },
    { emoji: "📞", title: "Direct line to the team", desc: "Email us anytime — we respond personally." },
  ];

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <a href="/" style={{ fontSize: 18, fontWeight: 700, color: "#3B82F6", textDecoration: "none" }}>SERVLO</a>
      </div>

      <h1 style={{ fontSize: 36, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>
        Founding Members
      </h1>
      <p style={{ fontSize: 17, color: "#64748b", marginBottom: 40, lineHeight: 1.6 }}>
        The first 100 businesses to subscribe to SERVLO. These are the early believers who help us shape the product.
      </p>

      {/* Counter */}
      <div style={{
        background: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
        border: "1px solid #fde68a", borderRadius: 16, padding: "28px 32px", marginBottom: 40
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#92400e" }}>Founding spots claimed</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: "#b45309" }}>{founderCount} / 100</span>
        </div>
        <div style={{ height: 10, borderRadius: 999, background: "#fde68a", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#d97706", borderRadius: 999, transition: "width 0.5s" }} />
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 14, color: "#92400e" }}>
          {remaining > 0
            ? <><strong>{remaining} spots remaining.</strong> Once these are taken, the program is closed.</>
            : <strong>The Founding Member program is now closed. Thank you to all 100 members!</strong>
          }
        </p>
      </div>

      {/* Benefits */}
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
        What you get as a Founding Member
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
        {benefits.map((b) => (
          <div key={b.title} style={{
            display: "flex", gap: 16, alignItems: "flex-start",
            padding: "16px 20px", borderRadius: 12,
            border: "1px solid #e2e8f0", background: "#fff"
          }}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>{b.emoji}</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 15 }}>{b.title}</p>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      {remaining > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
          borderRadius: 16, padding: "32px 40px", textAlign: "center", marginBottom: 48
        }}>
          <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>
            Become a Founding Member
          </h3>
          <p style={{ color: "rgba(255,255,255,0.9)", marginBottom: 20, fontSize: 15 }}>
            Subscribe to any paid plan and secure your founding member spot.
          </p>
          <a
            href="/auth/signup"
            style={{
              display: "inline-block", background: "#fff", color: "#d97706",
              padding: "14px 32px", borderRadius: 8, fontWeight: 800,
              textDecoration: "none", fontSize: 16
            }}
          >
            Claim your spot — {remaining} left
          </a>
        </div>
      )}

      <footer style={{ borderTop: "1px solid #e2e8f0", paddingTop: 24 }}>
        <p style={{ color: "#94a3b8", fontSize: 13 }}>
          <a href="/" style={{ color: "#3B82F6" }}>Back to SERVLO</a>
        </p>
      </footer>
    </main>
  );
}
