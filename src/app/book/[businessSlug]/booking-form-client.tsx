"use client";

import { useState } from "react";

type Props = {
  ownerId: string;
  accent: string;
  serviceTypes: string[];
};

const DEFAULT_SERVICES = [
  "General service",
  "Emergency call-out",
  "Quote / assessment",
  "Maintenance",
  "Installation",
  "Repair",
  "Inspection",
];

export function BookingFormClient({ ownerId, accent, serviceTypes }: Props) {
  const services = serviceTypes.length > 0 ? serviceTypes : DEFAULT_SERVICES;
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service_type: services[0] ?? "",
    description: "",
    preferred_date: "",
    preferred_time: "",
    address: "",
    urgency: "flexible",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/booking/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, owner_id: ownerId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Submission failed");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <div style={{ background: "#fff", borderRadius: 12, padding: "32px 24px", textAlign: "center", border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Request received!</h2>
        <p style={{ color: "#64748b" }}>We&apos;ll be in touch shortly to confirm your booking.</p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 44,
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    padding: "0 12px",
    fontSize: 14,
    color: "#0f172a",
    boxSizing: "border-box",
    background: "#fff",
  };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 };

  return (
    <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 12, padding: "24px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Your name *</label>
          <input required style={inputStyle} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" />
        </div>
        <div>
          <label style={labelStyle}>Phone *</label>
          <input required type="tel" style={inputStyle} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="0400 000 000" />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Email</label>
        <input type="email" style={inputStyle} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="jane@example.com" />
      </div>
      <div>
        <label style={labelStyle}>Service type *</label>
        <select required style={{ ...inputStyle }} value={form.service_type} onChange={(e) => setForm((p) => ({ ...p, service_type: e.target.value }))}>
          {services.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Job address</label>
        <input style={inputStyle} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="123 Main Street, Suburb" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Preferred date</label>
          <input type="date" style={inputStyle} value={form.preferred_date} onChange={(e) => setForm((p) => ({ ...p, preferred_date: e.target.value }))} min={new Date().toISOString().slice(0, 10)} />
        </div>
        <div>
          <label style={labelStyle}>Urgency</label>
          <select style={{ ...inputStyle }} value={form.urgency} onChange={(e) => setForm((p) => ({ ...p, urgency: e.target.value }))}>
            <option value="flexible">Flexible</option>
            <option value="this_week">This week</option>
            <option value="urgent">Urgent (within 24h)</option>
          </select>
        </div>
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Describe the job or any relevant details…"
          rows={3}
          style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" }}
        />
      </div>
      {status === "error" ? (
        <p style={{ color: "#dc2626", fontSize: 13 }}>{errorMsg}</p>
      ) : null}
      <button
        type="submit"
        disabled={status === "submitting"}
        style={{ background: accent, color: "#fff", border: "none", borderRadius: 8, padding: "14px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: status === "submitting" ? 0.7 : 1 }}
      >
        {status === "submitting" ? "Sending…" : "Submit booking request"}
      </button>
      <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
        Powered by <strong>SERVLO</strong>
      </p>
    </form>
  );
}
