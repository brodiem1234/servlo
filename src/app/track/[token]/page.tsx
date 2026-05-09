"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

type TrackingInfo = {
  job_title: string;
  client_name: string | null;
  status: string;
  employee_name: string | null;
  scheduled_start: string | null;
  tracking_token: string | null;
};

const STATUS_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  scheduled: { label: "Scheduled", color: "#2563eb", emoji: "📅" },
  in_progress: { label: "On the way", color: "#d97706", emoji: "🚗" },
  completed: { label: "Completed", color: "#16a34a", emoji: "✅" },
  cancelled: { label: "Cancelled", color: "#dc2626", emoji: "❌" },
  invoiced: { label: "Completed", color: "#16a34a", emoji: "✅" },
};

function formatTime(iso: string | null): string {
  if (!iso) return "TBC";
  return new Date(iso).toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "TBC";
  return new Date(iso).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function getMinsAway(scheduledStart: string | null): string | null {
  if (!scheduledStart) return null;
  const diff = Math.round((new Date(scheduledStart).getTime() - Date.now()) / 60000);
  if (diff <= 0) return "Arriving now";
  if (diff < 60) return `~${diff} min away`;
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  return `~${hrs}h ${mins}m away`;
}

export default function TrackingPage() {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTracking = useCallback(async () => {
    if (!token) return;
    try {
      // We need the job id from the token — the API accepts token as path param in /track/[token]
      // But our API is /api/jobs/[id]/tracking — we need to find job by token
      // Use a dedicated lookup endpoint
      const res = await fetch(`/api/track/${token}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setError(d.error ?? "Could not load tracking info");
        return;
      }
      const data: TrackingInfo = await res.json();
      setInfo(data);
      setLastUpdated(new Date());
    } catch {
      setError("Network error loading tracking info");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 60_000);
    return () => clearInterval(interval);
  }, [fetchTracking]);

  const statusInfo = info ? (STATUS_LABELS[info.status] ?? { label: info.status, color: "#6b7280", emoji: "📋" }) : null;

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#f8fafc", minHeight: "100vh", padding: "1.5rem 1rem" }}>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "0.5rem" }}>
            SERVLO · Job Tracking
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "#94a3b8" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔄</div>
            <p style={{ fontSize: "0.9375rem" }}>Loading tracking info…</p>
          </div>
        ) : error ? (
          <div style={{ background: "#fee2e2", borderRadius: "1rem", padding: "2rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⚠️</div>
            <p style={{ fontWeight: 600, color: "#991b1b", marginBottom: "0.5rem" }}>Tracking unavailable</p>
            <p style={{ fontSize: "0.875rem", color: "#7f1d1d" }}>{error}</p>
          </div>
        ) : info ? (
          <>
            {/* Status card */}
            <div style={{ background: "white", borderRadius: "1.25rem", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", padding: "1.75rem 1.5rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "2rem" }}>{statusInfo?.emoji}</span>
                <div>
                  <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                    {info.status === "in_progress" ? "Your technician is on the way!" : statusInfo?.label}
                  </p>
                  <span style={{ display: "inline-block", marginTop: "0.25rem", padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, background: `${statusInfo?.color}18`, color: statusInfo?.color }}>
                    {statusInfo?.label}
                  </span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
                <Row label="Job" value={info.job_title} />
                {info.employee_name ? <Row label="Technician" value={info.employee_name} /> : null}
                {info.client_name ? <Row label="Client" value={info.client_name} /> : null}
                {info.scheduled_start ? (
                  <>
                    <Row label="Date" value={formatDate(info.scheduled_start)} />
                    <Row label="Time" value={formatTime(info.scheduled_start)} />
                    {info.status === "in_progress" ? (
                      <Row label="ETA" value={getMinsAway(info.scheduled_start) ?? "See time above"} highlight />
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>

            {/* Map placeholder */}
            <div style={{ background: "white", borderRadius: "1.25rem", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: "1rem" }}>
              <div style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)", height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "2.5rem" }}>🗺️</span>
                <p style={{ fontWeight: 700, color: "#1e40af", fontSize: "0.9375rem" }}>Live GPS tracking</p>
                <p style={{ fontSize: "0.8125rem", color: "#3b82f6" }}>Coming soon</p>
              </div>
            </div>

            {/* Last updated */}
            {lastUpdated ? (
              <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "1rem" }}>
                Last updated {lastUpdated.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })} · auto-refreshes every 60s
              </p>
            ) : null}
          </>
        ) : null}

        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#cbd5e1", marginTop: "2rem" }}>
          Powered by SERVLO
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string | null; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
      <span style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>{label}</span>
      <span style={{ fontSize: "0.875rem", fontWeight: highlight ? 700 : 500, color: highlight ? "#d97706" : "#0f172a" }}>{value}</span>
    </div>
  );
}
