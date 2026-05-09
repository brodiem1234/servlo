"use client";

import React, { useState } from "react";
import {
  Mail,
  Plus,
  Pencil,
  Copy,
  LayoutTemplate,
  Send,
  Users,
  MousePointerClick,
} from "lucide-react";

export type EmailCampaign = {
  id: string;
  name: string;
  status: "draft" | "scheduled" | "sent" | "cancelled";
  subject: string | null;
  recipient_count: number | null;
  open_count: number | null;
  click_count: number | null;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
};

type Stats = {
  totalCampaigns: number;
  sentCount: number;
  avgOpenRate: number;
  avgClickRate: number;
};

type Tab = "campaigns" | "create" | "templates";

const TEMPLATES = [
  {
    name: "Seasonal Promotion",
    subject: "Special offer for our valued clients",
    preview: "It's that time of year! We're offering...",
  },
  {
    name: "Re-engagement",
    subject: "We miss you — here's 10% off",
    preview: "We noticed it's been a while since your last service...",
  },
  {
    name: "After-job Follow-up",
    subject: "Thanks for choosing us!",
    preview: "Hi [Name], thank you for your recent booking...",
  },
  {
    name: "Survey Request",
    subject: "How did we do?",
    preview: "We'd love to hear your feedback...",
  },
  {
    name: "Service Reminder",
    subject: "Time for your annual service",
    preview: "Hi [Name], it's been 12 months since your last...",
  },
];

const STATUS_STYLES: Record<
  EmailCampaign["status"],
  { bg: string; color: string; border: string; label: string }
> = {
  draft: {
    bg: "rgb(107 114 128 / 0.15)",
    color: "#9CA3AF",
    border: "rgb(107 114 128 / 0.3)",
    label: "Draft",
  },
  scheduled: {
    bg: "rgb(59 130 246 / 0.15)",
    color: "#60A5FA",
    border: "rgb(59 130 246 / 0.3)",
    label: "Scheduled",
  },
  sent: {
    bg: "rgb(16 185 129 / 0.15)",
    color: "#34D399",
    border: "rgb(16 185 129 / 0.3)",
    label: "Sent",
  },
  cancelled: {
    bg: "rgb(239 68 68 / 0.15)",
    color: "#F87171",
    border: "rgb(239 68 68 / 0.3)",
    label: "Cancelled",
  },
};

function formatDate(iso: string | null) {
  if (!iso) return "--";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function rateStr(
  numerator: number | null,
  denominator: number | null
): string {
  if (!denominator || denominator === 0 || numerator === null) return "--";
  return ((numerator / denominator) * 100).toFixed(1) + "%";
}

type Toast = { id: number; message: string; ok: boolean };

export function EmailCampaignsManager({
  campaigns: initial,
  stats,
}: {
  campaigns: EmailCampaign[];
  stats: Stats;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("campaigns");
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>(initial);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formAudience, setFormAudience] = useState<
    "all" | "recent_90" | "high_value"
  >("all");
  const [formScheduleMode, setFormScheduleMode] = useState<"now" | "later">(
    "now"
  );
  const [formScheduledAt, setFormScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    subject?: string;
  }>({});

  const addToast = (message: string, ok: boolean) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, ok }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const resetForm = () => {
    setFormName("");
    setFormSubject("");
    setFormBody("");
    setFormAudience("all");
    setFormScheduleMode("now");
    setFormScheduledAt("");
    setFormErrors({});
  };

  const prefillTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    setFormSubject(tmpl.subject);
    setFormBody(tmpl.preview);
    setFormName(tmpl.name);
    setActiveTab("create");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; subject?: string } = {};
    if (!formName.trim()) errors.name = "Campaign name is required";
    if (!formSubject.trim()) errors.subject = "Subject line is required";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/grow/email-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          subject: formSubject,
          body: formBody,
          audience_type: formAudience,
          scheduled_at:
            formScheduleMode === "later" && formScheduledAt
              ? formScheduledAt
              : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        addToast(json.error ?? "Failed to create campaign", false);
      } else {
        setCampaigns((prev) => [json.campaign, ...prev]);
        addToast("Campaign created successfully", true);
        resetForm();
        setActiveTab("campaigns");
      }
    } catch {
      addToast("Network error — please try again", false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDuplicate = (c: EmailCampaign) => {
    setFormName(c.name + " (copy)");
    setFormSubject(c.subject ?? "");
    setFormBody("");
    setFormAudience("all");
    setFormScheduleMode("now");
    setFormScheduledAt("");
    setFormErrors({});
    setActiveTab("create");
  };

  const card: React.CSSProperties = {
    background: "var(--bg-card)",
    borderColor: "var(--border)",
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "campaigns", label: "Campaigns" },
    { id: "create", label: "Create" },
    { id: "templates", label: "Templates" },
  ];

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Email Marketing
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Create and manage email campaigns for your clients.
          </p>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-purple-400/30"
          style={{ background: "rgb(139 92 246 / 0.2)", color: "#C4B5FD" }}
        >
          GROW
        </span>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Campaigns",
            value: stats.totalCampaigns,
            icon: <LayoutTemplate size={18} style={{ color: "#A78BFA" }} />,
          },
          {
            label: "Sent",
            value: stats.sentCount,
            icon: <Send size={18} style={{ color: "#A78BFA" }} />,
          },
          {
            label: "Avg Open Rate",
            value: stats.avgOpenRate > 0 ? stats.avgOpenRate + "%" : "--",
            icon: <Mail size={18} style={{ color: "#A78BFA" }} />,
          },
          {
            label: "Avg Click Rate",
            value: stats.avgClickRate > 0 ? stats.avgClickRate + "%" : "--",
            icon: <MousePointerClick size={18} style={{ color: "#A78BFA" }} />,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-start gap-3 rounded-xl border p-4"
            style={card}
          >
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "rgb(139 92 246 / 0.15)" }}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {s.label}
              </p>
              <p
                className="mt-0.5 text-2xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 rounded-lg p-1"
        style={{ background: "var(--bg-secondary)", width: "fit-content" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="rounded-md px-4 py-2 text-sm font-medium transition-all"
            style={
              activeTab === tab.id
                ? { background: "#8B5CF6", color: "#fff" }
                : { color: "var(--text-muted)" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Campaigns Tab ── */}
      {activeTab === "campaigns" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setActiveTab("create");
              }}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "#8B5CF6" }}
            >
              <Plus size={15} /> New Campaign
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded-xl border py-16"
              style={card}
            >
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: "rgb(139 92 246 / 0.15)" }}
              >
                <Mail size={24} style={{ color: "#A78BFA" }} />
              </div>
              <p
                className="text-base font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                No campaigns yet
              </p>
              <p
                className="mt-1 max-w-sm text-center text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Send your first email campaign to engage your clients.
              </p>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab("create");
                }}
                className="mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ background: "#8B5CF6" }}
              >
                <Plus size={14} /> Create Campaign
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border" style={card}>
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="border-b text-left text-xs font-semibold uppercase tracking-wide"
                    style={{
                      color: "var(--text-muted)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3 text-right">Recipients</th>
                    <th className="px-4 py-3 text-right">Open Rate</th>
                    <th className="px-4 py-3 text-right">Click Rate</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const s = STATUS_STYLES[c.status] ?? STATUS_STYLES.draft;
                    const dateStr =
                      c.status === "sent"
                        ? formatDate(c.sent_at)
                        : c.status === "scheduled"
                        ? formatDate(c.scheduled_at)
                        : formatDate(c.created_at);
                    return (
                      <tr
                        key={c.id}
                        className="border-b last:border-0"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <td
                          className="px-4 py-3 font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {c.name}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-semibold"
                            style={{
                              background: s.bg,
                              color: s.color,
                              border: `1px solid ${s.border}`,
                            }}
                          >
                            {s.label}
                          </span>
                        </td>
                        <td
                          className="max-w-[200px] truncate px-4 py-3"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {c.subject ?? "--"}
                        </td>
                        <td
                          className="px-4 py-3 text-right"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {c.recipient_count ?? "--"}
                        </td>
                        <td
                          className="px-4 py-3 text-right"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {c.status === "sent"
                            ? rateStr(c.open_count, c.recipient_count)
                            : "--"}
                        </td>
                        <td
                          className="px-4 py-3 text-right"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {c.status === "sent"
                            ? rateStr(c.click_count, c.recipient_count)
                            : "--"}
                        </td>
                        <td
                          className="px-4 py-3 text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {dateStr}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              title="Edit"
                              className="rounded p-1 transition-colors hover:bg-white/10"
                              style={{ color: "var(--text-muted)" }}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              title="Duplicate"
                              onClick={() => handleDuplicate(c)}
                              className="rounded p-1 transition-colors hover:bg-white/10"
                              style={{ color: "var(--text-muted)" }}
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Create Tab ── */}
      {activeTab === "create" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="rounded-xl border p-6 space-y-5" style={card}>
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              New Email Campaign
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Campaign Name <span style={{ color: "#F87171" }}>*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (formErrors.name) setFormErrors((p) => ({ ...p, name: undefined }));
                  }}
                  placeholder="e.g. Spring Promotion 2026"
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: formErrors.name ? "#F87171" : "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
                {formErrors.name && (
                  <p className="text-xs" style={{ color: "#F87171" }}>
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Subject Line <span style={{ color: "#F87171" }}>*</span>
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => {
                    setFormSubject(e.target.value);
                    if (formErrors.subject)
                      setFormErrors((p) => ({ ...p, subject: undefined }));
                  }}
                  placeholder="e.g. Special offer just for you"
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: formErrors.subject
                      ? "#F87171"
                      : "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
                {formErrors.subject && (
                  <p className="text-xs" style={{ color: "#F87171" }}>
                    {formErrors.subject}
                  </p>
                )}
              </div>

              {/* Audience */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Audience
                </label>
                {(
                  [
                    { value: "all", label: "All clients" },
                    { value: "recent_90", label: "Recent clients (90 days)" },
                    { value: "high_value", label: "High value clients" },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      name="audience"
                      value={opt.value}
                      checked={formAudience === opt.value}
                      onChange={() => setFormAudience(opt.value)}
                      className="accent-purple-500"
                    />
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Body */}
              <div className="space-y-1">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Email Body
                </label>
                <textarea
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  rows={6}
                  placeholder="Write your email content here..."
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/50 resize-y"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Schedule */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Send timing
                </label>
                <div className="flex gap-4">
                  {(
                    [
                      { value: "now", label: "Send now" },
                      { value: "later", label: "Schedule for later" },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="scheduleMode"
                        value={opt.value}
                        checked={formScheduleMode === opt.value}
                        onChange={() => setFormScheduleMode(opt.value)}
                        className="accent-purple-500"
                      />
                      <span
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
                {formScheduleMode === "later" && (
                  <input
                    type="datetime-local"
                    value={formScheduledAt}
                    onChange={(e) => setFormScheduledAt(e.target.value)}
                    className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                    style={{
                      background: "var(--bg-secondary)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: "#8B5CF6" }}
                >
                  {submitting ? "Saving..." : "Create Campaign"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab("campaigns");
                  }}
                  className="rounded-lg border px-5 py-2 text-sm font-medium"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview */}
          <div className="space-y-3">
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Preview
            </p>
            <div
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: "var(--border)" }}
            >
              {/* Email header bar */}
              <div
                className="flex items-center gap-2 border-b px-4 py-3"
                style={{
                  background: "rgb(139 92 246 / 0.08)",
                  borderColor: "var(--border)",
                }}
              >
                <Mail size={14} style={{ color: "#A78BFA" }} />
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#C4B5FD" }}
                >
                  {formSubject || "Your subject line will appear here"}
                </span>
              </div>
              <div className="p-5 space-y-3" style={{ background: "var(--bg-card)" }}>
                <div className="space-y-1">
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    To: Your clients
                  </p>
                  <p
                    className="text-base font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {formSubject || (
                      <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                        Subject line preview
                      </span>
                    )}
                  </p>
                </div>
                <div
                  className="rounded-lg border p-4 text-sm whitespace-pre-wrap min-h-[100px]"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border)",
                    color: formBody ? "var(--text-primary)" : "var(--text-muted)",
                  }}
                >
                  {formBody || "Your email body will appear here as you type..."}
                </div>
                <div
                  className="flex items-center gap-2 rounded-lg p-3 text-xs"
                  style={{
                    background: "rgb(139 92 246 / 0.08)",
                    color: "var(--text-muted)",
                  }}
                >
                  <Users size={12} />
                  Audience:{" "}
                  {{
                    all: "All clients",
                    recent_90: "Recent clients (90 days)",
                    high_value: "High value clients",
                  }[formAudience]}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Templates Tab ── */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Choose a pre-built template to get started quickly. Click "Use
            Template" to pre-fill the campaign creation form.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.name}
                className="flex flex-col justify-between rounded-xl border p-5 space-y-4"
                style={card}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ background: "rgb(139 92 246 / 0.15)" }}
                    >
                      <Mail size={14} style={{ color: "#A78BFA" }} />
                    </div>
                    <p
                      className="font-semibold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {tmpl.name}
                    </p>
                  </div>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {tmpl.subject}
                  </p>
                  <p
                    className="text-xs line-clamp-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {tmpl.preview}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => prefillTemplate(tmpl)}
                  className="w-full rounded-lg border py-2 text-sm font-semibold transition-colors hover:bg-purple-500/10"
                  style={{
                    borderColor: "rgb(139 92 246 / 0.4)",
                    color: "#A78BFA",
                  }}
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-lg px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto"
            style={{
              background: t.ok ? "rgb(16 185 129 / 0.9)" : "rgb(239 68 68 / 0.9)",
              color: "#fff",
              minWidth: 220,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </section>
  );
}
