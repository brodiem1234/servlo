"use client";

export default function OfflinePage() {
  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#f8fafc", fontFamily: "Arial, sans-serif", padding: "24px", textAlign: "center" }}>
      <div style={{ fontSize: "48px", fontWeight: 800, letterSpacing: "-2px", color: "#3B82F6", marginBottom: "24px" }}>SERVLO</div>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px" }}>You&apos;re offline</h1>
      <p style={{ color: "#94a3b8", marginBottom: "32px", maxWidth: "360px" }}>SERVLO will reconnect automatically when you have internet access.</p>
      <button onClick={() => window.location.reload()} style={{ background: "#3B82F6", color: "white", border: "none", borderRadius: "8px", padding: "12px 24px", fontSize: "14px", fontWeight: 600, cursor: "pointer", marginBottom: "12px" }}>
        Try again
      </button>
      <a href="/dashboard/owner" style={{ color: "#94a3b8", fontSize: "14px" }}>Back to dashboard</a>
    </div>
  );
}
