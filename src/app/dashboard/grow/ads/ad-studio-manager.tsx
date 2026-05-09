"use client";

import React, { useState, useRef } from "react";
import {
  BarChart2,
  DollarSign,
  TrendingUp,
  Zap,
  Plus,
  Edit2,
  Pause,
  Play,
  Eye,
  Download,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Globe,
  Facebook,
  Instagram,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AdCampaign {
  id: string;
  name: string;
  platform: string;
  objective: string | null;
  status: string;
  budget_daily: number | null;
  budget_total: number | null;
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
  start_date: string | null;
  end_date: string | null;
  ad_copy: Record<string, unknown> | null;
  targeting: Record<string, unknown> | null;
  created_at: string;
}

export interface AdStudioStats {
  activeCampaigns: number;
  totalSpend: number;
  totalConversions: number;
  avgCTR: number;
}

interface Props {
  campaigns: AdCampaign[];
  stats: AdStudioStats;
}

// ─── Wizard step types ─────────────────────────────────────────────────────────

interface WizardData {
  platform: string;
  objective: string;
  budgetDaily: string;
  budgetTotal: string;
  startDate: string;
  endDate: string;
  headline: string;
  description: string;
  cta: string;
  targetUrl: string;
  campaignName: string;
}

// ─── Helper: format currency ───────────────────────────────────────────────────

function fmtAUD(n: number | null | undefined): string {
  if (n == null) return "$0";
  return `$${n.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtNum(n: number | null | undefined): string {
  if (n == null) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-AU");
}

// ─── Platform badge ────────────────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p === "facebook")
    return (
      <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "rgb(59 130 246 / 0.15)", color: "#60A5FA" }}>
        <Facebook size={11} /> Facebook
      </span>
    );
  if (p === "instagram")
    return (
      <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "rgb(244 63 94 / 0.15)", color: "#FB7185" }}>
        <Instagram size={11} /> Instagram
      </span>
    );
  return (
    <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "rgb(59 130 246 / 0.15)", color: "#38BDF8" }}>
      <Globe size={11} /> Google
    </span>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const map: Record<string, { bg: string; color: string }> = {
    active: { bg: "rgb(16 185 129 / 0.15)", color: "#34D399" },
    paused: { bg: "rgb(245 158 11 / 0.15)", color: "#FBBF24" },
    draft: { bg: "rgb(107 114 128 / 0.15)", color: "#9CA3AF" },
    completed: { bg: "rgb(100 116 139 / 0.15)", color: "#94A3B8" },
  };
  const style = map[s] ?? map.draft;
  return (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize" style={{ background: style.bg, color: style.color }}>
      {status}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = (m: string) => {
    setMsg(m);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMsg(null), 3000);
  };
  return { msg, show };
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "rgb(139 92 246 / 0.15)" }}>
          <Icon size={16} style={{ color: "#A78BFA" }} />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AdStudioManager({ campaigns: initialCampaigns, stats }: Props) {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(initialCampaigns);
  const [activeTab, setActiveTab] = useState<"campaigns" | "create" | "performance">("campaigns");
  const [wizardStep, setWizardStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const { msg: toastMsg, show: showToast } = useToast();
  const performanceRef = useRef<HTMLDivElement>(null);

  const [wizard, setWizard] = useState<WizardData>({
    platform: "",
    objective: "",
    budgetDaily: "",
    budgetTotal: "",
    startDate: "",
    endDate: "",
    headline: "",
    description: "",
    cta: "Get a Quote",
    targetUrl: "",
    campaignName: "",
  });

  const updateWizard = (patch: Partial<WizardData>) =>
    setWizard((w) => ({ ...w, ...patch }));

  // Auto-generate campaign name when platform + objective are chosen
  const autoName = wizard.platform && wizard.objective
    ? `${wizard.platform} — ${wizard.objective}`
    : "";

  // ── Spend vs budget progress ──────────────────────────────────────────────

  function spendColor(spend: number, total: number): string {
    const pct = total > 0 ? spend / total : 0;
    if (pct >= 1) return "#EF4444";
    if (pct >= 0.8) return "#F59E0B";
    return "#10B981";
  }

  // ── Pause / Resume ────────────────────────────────────────────────────────

  const handlePauseResume = (id: string, current: string) => {
    const next = current === "active" ? "paused" : "active";
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: next } : c));
    showToast(`Campaign ${next === "active" ? "resumed" : "paused"}.`);
  };

  // ── View stats ────────────────────────────────────────────────────────────

  const handleViewStats = () => {
    setActiveTab("performance");
    setTimeout(() => performanceRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // ── Submit wizard ─────────────────────────────────────────────────────────

  const handleSubmit = async (status: "draft" | "active") => {
    setSubmitting(true);
    try {
      const name = wizard.campaignName.trim() || autoName || "New Campaign";
      const res = await fetch("/api/grow/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          platform: wizard.platform,
          objective: wizard.objective,
          budget_daily: wizard.budgetDaily ? Number(wizard.budgetDaily) : null,
          budget_total: wizard.budgetTotal ? Number(wizard.budgetTotal) : null,
          start_date: wizard.startDate || null,
          end_date: wizard.endDate || null,
          ad_copy: { headline: wizard.headline, description: wizard.description, cta: wizard.cta, targetUrl: wizard.targetUrl },
          status,
        }),
      });
      const json = await res.json() as { campaign?: AdCampaign; error?: string };
      if (!res.ok) {
        showToast(json.error ?? "Failed to save campaign.");
        return;
      }
      if (json.campaign) {
        setCampaigns((prev) => [json.campaign!, ...prev]);
      }
      showToast(status === "active" ? "Campaign launched!" : "Campaign saved as draft.");
      setActiveTab("campaigns");
      setWizardStep(1);
      setWizard({ platform: "", objective: "", budgetDaily: "", budgetTotal: "", startDate: "", endDate: "", headline: "", description: "", cta: "Get a Quote", targetUrl: "", campaignName: "" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Export CSV ────────────────────────────────────────────────────────────

  const exportCSV = () => {
    const headers = ["Name", "Platform", "Spend", "Impressions", "Clicks", "CTR%", "Conversions", "CPA"];
    const rows = campaigns.map((c) => {
      const ctr = c.impressions && c.clicks ? ((c.clicks / c.impressions) * 100).toFixed(2) : "0";
      const cpa = c.conversions && c.spend ? (c.spend / c.conversions).toFixed(2) : "-";
      return [c.name, c.platform, c.spend ?? 0, c.impressions ?? 0, c.clicks ?? 0, ctr, c.conversions ?? 0, cpa];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ad-campaigns.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Tabs ─────────────────────────────────────────────────────────────────

  const TABS: { key: typeof activeTab; label: string }[] = [
    { key: "campaigns", label: "Campaigns" },
    { key: "create", label: "Create Campaign" },
    { key: "performance", label: "Performance" },
  ];

  // ─── Wizard helpers ───────────────────────────────────────────────────────

  const PLATFORMS = [
    { id: "google", label: "Google Ads", Icon: Globe, color: "#38BDF8" },
    { id: "facebook", label: "Facebook", Icon: Facebook, color: "#60A5FA" },
    { id: "instagram", label: "Instagram", Icon: Instagram, color: "#FB7185" },
  ];

  const OBJECTIVES = [
    { id: "Lead Generation", desc: "Capture contact details" },
    { id: "Brand Awareness", desc: "Get your name out there" },
    { id: "Website Traffic", desc: "Drive clicks to your site" },
    { id: "Conversions", desc: "Turn visitors into buyers" },
  ];

  const QUICK_BUDGETS = ["10", "20", "50"];

  const CTA_OPTIONS = ["Get a Quote", "Call Now", "Learn More", "Book Now"];

  const inputStyle: React.CSSProperties = {
    background: "rgba(139,92,246,0.08)",
    border: "1px solid rgba(139,92,246,0.3)",
    color: "var(--text-primary)",
  };
  const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/40";

  const labelCls = "mb-1.5 block text-sm font-medium";

  return (
    <section className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl"
          style={{ background: "#8B5CF6" }}
        >
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Ad Studio
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Create, manage and track your advertising campaigns.
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-purple-400/30"
          style={{ background: "rgb(139 92 246 / 0.2)", color: "#C4B5FD" }}
        >
          GROW
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Campaigns" value={String(stats.activeCampaigns)} icon={Zap} />
        <StatCard label="Total Spend" value={fmtAUD(stats.totalSpend)} icon={DollarSign} />
        <StatCard label="Total Conversions" value={fmtNum(stats.totalConversions)} icon={TrendingUp} />
        <StatCard label="Avg CTR" value={`${stats.avgCTR.toFixed(2)}%`} icon={BarChart2} />
      </div>

      {/* Tabs */}
      <div className="rounded-xl border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className="px-5 py-3 text-sm font-semibold transition-colors"
              style={{
                borderBottom: activeTab === t.key ? "2px solid #8B5CF6" : "2px solid transparent",
                color: activeTab === t.key ? "#A78BFA" : "var(--text-muted)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── Campaigns tab ──────────────────────────────────────── */}
          {activeTab === "campaigns" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab("create")}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: "#8B5CF6" }}
                >
                  <Plus size={15} /> New Campaign
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgb(139 92 246 / 0.15)" }}>
                    <BarChart2 size={24} style={{ color: "#8B5CF6" }} />
                  </div>
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>No campaigns yet.</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Create your first ad campaign.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("create")}
                    className="mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: "#8B5CF6" }}
                  >
                    Create Campaign
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {campaigns.map((c) => {
                    const spend = c.spend ?? 0;
                    const total = c.budget_total ?? 0;
                    const spendPct = total > 0 ? Math.min((spend / total) * 100, 100) : 0;
                    const ctr = c.impressions && c.clicks
                      ? ((c.clicks / c.impressions) * 100).toFixed(2)
                      : "0.00";
                    return (
                      <div
                        key={c.id}
                        className="flex flex-col gap-3 rounded-xl border p-4"
                        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                          <StatusBadge status={c.status} />
                        </div>

                        {/* Platform + objective */}
                        <div className="flex flex-wrap items-center gap-2">
                          <PlatformBadge platform={c.platform} />
                          {c.objective && (
                            <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                              {c.objective}
                            </span>
                          )}
                        </div>

                        {/* Budget */}
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {c.budget_daily != null && <span>Daily: {fmtAUD(c.budget_daily)}</span>}
                          {c.budget_daily != null && c.budget_total != null && <span className="mx-1">·</span>}
                          {c.budget_total != null && <span>Total: {fmtAUD(c.budget_total)}</span>}
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-4 gap-2 rounded-lg p-2 text-center text-xs" style={{ background: "rgba(139,92,246,0.06)" }}>
                          {[
                            { label: "Impressions", val: fmtNum(c.impressions) },
                            { label: "Clicks", val: fmtNum(c.clicks) },
                            { label: "Conv.", val: fmtNum(c.conversions) },
                            { label: "CTR", val: `${ctr}%` },
                          ].map(({ label, val }) => (
                            <div key={label}>
                              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{val}</p>
                              <p style={{ color: "var(--text-muted)" }}>{label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Spend vs budget progress */}
                        {total > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                              <span>Spend: {fmtAUD(spend)}</span>
                              <span>Budget: {fmtAUD(total)}</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(139,92,246,0.15)" }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${spendPct}%`, background: spendColor(spend, total) }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Dates */}
                        {(c.start_date || c.end_date) && (
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {c.start_date
                              ? new Date(c.start_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
                              : "—"}
                            {" → "}
                            {c.end_date
                              ? new Date(c.end_date).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
                              : "Ongoing"}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled
                            className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium opacity-40 cursor-not-allowed"
                            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                          >
                            <Edit2 size={11} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePauseResume(c.id, c.status)}
                            className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
                            style={{ borderColor: "rgba(139,92,246,0.4)", color: "#A78BFA", background: "rgba(139,92,246,0.08)" }}
                          >
                            {c.status === "active" ? <><Pause size={11} /> Pause</> : <><Play size={11} /> Resume</>}
                          </button>
                          <button
                            type="button"
                            onClick={handleViewStats}
                            className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
                            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                          >
                            <Eye size={11} /> View Stats
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Create Campaign tab ─────────────────────────────────── */}
          {activeTab === "create" && (
            <div className="space-y-6">
              {/* Step indicator */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((s) => (
                  <React.Fragment key={s}>
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background: wizardStep >= s ? "#8B5CF6" : "rgba(139,92,246,0.15)",
                        color: wizardStep >= s ? "#fff" : "#A78BFA",
                      }}
                    >
                      {wizardStep > s ? <CheckCircle2 size={14} /> : s}
                    </div>
                    {s < 4 && (
                      <div
                        className="h-px flex-1"
                        style={{ background: wizardStep > s ? "#8B5CF6" : "rgba(139,92,246,0.2)" }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                <span>Platform & Goal</span>
                <span>Budget & Schedule</span>
                <span>Ad Creative</span>
                <span>Review & Launch</span>
              </div>

              {/* ── Step 1 ─────────────────────────────────────────── */}
              {wizardStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <p className="mb-3 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Choose Platform</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {PLATFORMS.map(({ id, label, Icon, color }) => {
                        const sel = wizard.platform === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => updateWizard({ platform: id })}
                            className="flex flex-col items-center gap-2 rounded-xl border p-4 transition-all"
                            style={{
                              background: sel ? "rgba(139,92,246,0.12)" : "var(--bg-card)",
                              borderColor: sel ? "#8B5CF6" : "var(--border)",
                            }}
                          >
                            <Icon size={28} style={{ color: sel ? color : "var(--text-muted)" }} />
                            <p className="text-sm font-semibold" style={{ color: sel ? "var(--text-primary)" : "var(--text-secondary)" }}>
                              {label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Choose Objective</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {OBJECTIVES.map(({ id, desc }) => {
                        const sel = wizard.objective === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => updateWizard({ objective: id })}
                            className="flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all"
                            style={{
                              background: sel ? "rgba(139,92,246,0.12)" : "var(--bg-card)",
                              borderColor: sel ? "#8B5CF6" : "var(--border)",
                            }}
                          >
                            <p className="text-sm font-semibold" style={{ color: sel ? "#C4B5FD" : "var(--text-primary)" }}>{id}</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!wizard.platform || !wizard.objective}
                      onClick={() => setWizardStep(2)}
                      className="flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
                      style={{ background: "#8B5CF6" }}
                    >
                      Next <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 2 ─────────────────────────────────────────── */}
              {wizardStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <p className={labelCls} style={{ color: "var(--text-secondary)" }}>Daily Budget ($)</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {QUICK_BUDGETS.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => updateWizard({ budgetDaily: v, budgetTotal: String(Number(v) * 30) })}
                          className="rounded-full border px-3 py-1 text-xs font-semibold transition-all"
                          style={{
                            background: wizard.budgetDaily === v ? "#8B5CF6" : "var(--bg-card)",
                            borderColor: wizard.budgetDaily === v ? "#8B5CF6" : "var(--border)",
                            color: wizard.budgetDaily === v ? "#fff" : "var(--text-secondary)",
                          }}
                        >
                          ${v}/day
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => updateWizard({ budgetDaily: "" })}
                        className="rounded-full border px-3 py-1 text-xs font-semibold transition-all"
                        style={{
                          background: !QUICK_BUDGETS.includes(wizard.budgetDaily) && wizard.budgetDaily !== "" ? "#8B5CF6" : "var(--bg-card)",
                          borderColor: "var(--border)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Custom
                      </button>
                    </div>
                    <input
                      type="number"
                      value={wizard.budgetDaily}
                      onChange={(e) => updateWizard({ budgetDaily: e.target.value, budgetTotal: e.target.value ? String(Number(e.target.value) * 30) : "" })}
                      placeholder="Enter daily budget"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <p className={labelCls} style={{ color: "var(--text-secondary)" }}>Total Budget ($) <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(auto: daily × 30)</span></p>
                    <input
                      type="number"
                      value={wizard.budgetTotal}
                      onChange={(e) => updateWizard({ budgetTotal: e.target.value })}
                      placeholder="Total campaign budget"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className={labelCls} style={{ color: "var(--text-secondary)" }}>Start Date</p>
                      <input
                        type="date"
                        value={wizard.startDate}
                        onChange={(e) => updateWizard({ startDate: e.target.value })}
                        className={inputCls}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <p className={labelCls} style={{ color: "var(--text-secondary)" }}>End Date <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></p>
                      <input
                        type="date"
                        value={wizard.endDate}
                        onChange={(e) => updateWizard({ endDate: e.target.value })}
                        className={inputCls}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button type="button" onClick={() => setWizardStep(1)} className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                      <ChevronLeft size={15} /> Back
                    </button>
                    <button
                      type="button"
                      disabled={!wizard.budgetDaily || !wizard.startDate}
                      onClick={() => setWizardStep(3)}
                      className="flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
                      style={{ background: "#8B5CF6" }}
                    >
                      Next <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3 ─────────────────────────────────────────── */}
              {wizardStep === 3 && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between">
                        <p className={labelCls} style={{ color: "var(--text-secondary)" }}>Headline</p>
                        <span className="text-xs" style={{ color: wizard.headline.length > 30 ? "#EF4444" : "var(--text-muted)" }}>
                          {wizard.headline.length}/30
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={30}
                        value={wizard.headline}
                        onChange={(e) => updateWizard({ headline: e.target.value })}
                        placeholder="e.g. Trusted Local Plumber"
                        className={inputCls}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <p className={labelCls} style={{ color: "var(--text-secondary)" }}>Description</p>
                        <span className="text-xs" style={{ color: wizard.description.length > 90 ? "#EF4444" : "var(--text-muted)" }}>
                          {wizard.description.length}/90
                        </span>
                      </div>
                      <textarea
                        maxLength={90}
                        rows={3}
                        value={wizard.description}
                        onChange={(e) => updateWizard({ description: e.target.value })}
                        placeholder="Describe your offer or service…"
                        className={`${inputCls} resize-none`}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <p className={labelCls} style={{ color: "var(--text-secondary)" }}>CTA Button</p>
                      <select
                        value={wizard.cta}
                        onChange={(e) => updateWizard({ cta: e.target.value })}
                        className={inputCls}
                        style={{ ...inputStyle, appearance: "auto" }}
                      >
                        {CTA_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    <div>
                      <p className={labelCls} style={{ color: "var(--text-secondary)" }}>Target URL <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></p>
                      <input
                        type="url"
                        value={wizard.targetUrl}
                        onChange={(e) => updateWizard({ targetUrl: e.target.value })}
                        placeholder="https://yourwebsite.com"
                        className={inputCls}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Live preview */}
                  <div>
                    <p className="mb-2 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Live Preview</p>
                    <div
                      className="overflow-hidden rounded-xl border"
                      style={{ background: "#1a1035", borderColor: "rgba(139,92,246,0.3)" }}
                    >
                      <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "rgba(139,92,246,0.08)" }}>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: "#8B5CF6" }}>
                          AD
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">Your Business</p>
                          <p className="text-[10px] text-purple-300">Sponsored</p>
                        </div>
                      </div>
                      <div className="flex aspect-video items-center justify-center" style={{ background: "linear-gradient(135deg,#4c1d95,#1e1b4b)" }}>
                        <p className="text-xs text-purple-300">Ad image here</p>
                      </div>
                      <div className="space-y-1.5 px-3 py-3">
                        <p className="font-bold text-white text-sm leading-snug">
                          {wizard.headline || "Your Headline"}
                        </p>
                        <p className="text-xs text-purple-200 leading-relaxed">
                          {wizard.description || "Your description will appear here."}
                        </p>
                        <div className="mt-2 rounded-lg py-2 text-center text-xs font-bold text-white" style={{ background: "#8B5CF6" }}>
                          {wizard.cta}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2 lg:col-span-2">
                    <button type="button" onClick={() => setWizardStep(2)} className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                      <ChevronLeft size={15} /> Back
                    </button>
                    <button
                      type="button"
                      disabled={!wizard.headline}
                      onClick={() => { updateWizard({ campaignName: wizard.campaignName || autoName }); setWizardStep(4); }}
                      className="flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
                      style={{ background: "#8B5CF6" }}
                    >
                      Next <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 4 ─────────────────────────────────────────── */}
              {wizardStep === 4 && (
                <div className="space-y-5">
                  <div className="rounded-xl border p-4 space-y-2 text-sm" style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.3)" }}>
                    <h3 className="font-bold mb-3" style={{ color: "var(--text-primary)" }}>Campaign Summary</h3>
                    {[
                      ["Platform", wizard.platform],
                      ["Objective", wizard.objective],
                      ["Daily Budget", wizard.budgetDaily ? `$${wizard.budgetDaily}` : "—"],
                      ["Total Budget", wizard.budgetTotal ? `$${wizard.budgetTotal}` : "—"],
                      ["Start Date", wizard.startDate || "—"],
                      ["End Date", wizard.endDate || "Ongoing"],
                      ["Headline", wizard.headline],
                      ["Description", wizard.description || "—"],
                      ["CTA", wizard.cta],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <span style={{ color: "var(--text-muted)" }}>{label}</span>
                        <span className="font-medium text-right" style={{ color: "var(--text-primary)" }}>{val}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className={labelCls} style={{ color: "var(--text-secondary)" }}>Campaign Name</p>
                    <input
                      type="text"
                      value={wizard.campaignName || autoName}
                      onChange={(e) => updateWizard({ campaignName: e.target.value })}
                      placeholder={autoName || "Campaign name"}
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row justify-between pt-2">
                    <button type="button" onClick={() => setWizardStep(3)} className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                      <ChevronLeft size={15} /> Back
                    </button>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleSubmit("draft")}
                        className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40"
                        style={{ borderColor: "rgba(139,92,246,0.5)", color: "#A78BFA", background: "rgba(139,92,246,0.08)" }}
                      >
                        {submitting ? "Saving…" : "Save as Draft"}
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleSubmit("active")}
                        className="rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
                        style={{ background: "#8B5CF6" }}
                      >
                        {submitting ? "Launching…" : "Launch Campaign"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Performance tab ─────────────────────────────────────── */}
          {activeTab === "performance" && (
            <div ref={performanceRef} className="space-y-4">
              {campaigns.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <BarChart2 size={32} style={{ color: "var(--text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No campaign data yet.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={exportCSV}
                      className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
                      style={{ borderColor: "rgba(139,92,246,0.4)", color: "#A78BFA", background: "rgba(139,92,246,0.08)" }}
                    >
                      <Download size={14} /> Export CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
                    <table className="w-full min-w-[700px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs font-semibold uppercase" style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "rgba(139,92,246,0.05)" }}>
                          {["Name", "Spend", "Impressions", "Clicks", "CTR", "Conversions", "CPA"].map((h) => (
                            <th key={h} className="px-4 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((c) => {
                          const ctr = c.impressions && c.clicks
                            ? `${((c.clicks / c.impressions) * 100).toFixed(2)}%`
                            : "—";
                          const cpa = c.conversions && c.spend
                            ? fmtAUD(c.spend / c.conversions)
                            : "—";
                          return (
                            <tr key={c.id} className="border-b transition-colors hover:bg-purple-500/5" style={{ borderColor: "var(--border)" }}>
                              <td className="px-4 py-3">
                                <p className="font-medium" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{c.platform}</p>
                              </td>
                              <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{fmtAUD(c.spend)}</td>
                              <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{fmtNum(c.impressions)}</td>
                              <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{fmtNum(c.clicks)}</td>
                              <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{ctr}</td>
                              <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{fmtNum(c.conversions)}</td>
                              <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{cpa}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
