"use client";

import { useState, useCallback } from "react";
import {
  X,
  Plus,
  Phone,
  Mail,
  CalendarClock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import type { LeadPipelineItem, PipelineStats } from "./page";

// ── Types ─────────────────────────────────────────────────────────────────────

type KanbanCol = {
  id: string;
  label: string;
  statuses: string[];
  accent: string;
  bg: string;
};

type Toast = {
  id: number;
  message: string;
  type: "success" | "error";
};

// ── Constants ─────────────────────────────────────────────────────────────────

const COLUMNS: KanbanCol[] = [
  {
    id: "new",
    label: "New",
    statuses: ["new"],
    accent: "#3B82F6",
    bg: "rgba(59,130,246,0.08)",
  },
  {
    id: "contacted",
    label: "Contacted",
    statuses: ["contacted"],
    accent: "#8B5CF6",
    bg: "rgba(139,92,246,0.08)",
  },
  {
    id: "qualified",
    label: "Qualified",
    statuses: ["qualified"],
    accent: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
  },
  {
    id: "proposal",
    label: "Proposal",
    statuses: ["proposal"],
    accent: "#06B6D4",
    bg: "rgba(6,182,212,0.08)",
  },
  {
    id: "won_lost",
    label: "Won / Lost",
    statuses: ["won", "lost"],
    accent: "#64748B",
    bg: "rgba(100,116,139,0.08)",
  },
];

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  manual: { label: "Manual", color: "#64748B" },
  marketplace: { label: "Marketplace", color: "#3B82F6" },
  referral: { label: "Referral", color: "#8B5CF6" },
  website: { label: "Website", color: "#22C55E" },
};

const GRADE_COLORS: Record<string, string> = {
  A: "#10B981",
  B: "#3B82F6",
  C: "#F59E0B",
  D: "#EF4444",
};

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `$${n.toLocaleString("en-AU")}`;
}

function isPastDue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function formatDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

let toastCounter = 0;

// ── Component ─────────────────────────────────────────────────────────────────

export default function LeadsPipeline({
  leads: initialLeads,
  stats: initialStats,
}: {
  leads: LeadPipelineItem[];
  stats: PipelineStats;
}) {
  const [leads, setLeads] = useState<LeadPipelineItem[]>(initialLeads);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadPipelineItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const activeLeads = leads.filter(
    (l) => l.status !== "won" && l.status !== "lost"
  );
  const wonCount = leads.filter((l) => l.status === "won").length;
  const lostCount = leads.filter((l) => l.status === "lost").length;
  const pipelineValue = activeLeads.reduce(
    (sum, l) => sum + (l.estimated_value ?? 0),
    0
  );
  const conversionRate =
    leads.length > 0 ? Math.round((wonCount / leads.length) * 100) : 0;

  // ── Toast ──────────────────────────────────────────────────────────────────

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // ── Drag-and-drop ──────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, lead: LeadPipelineItem) {
    e.dataTransfer.setData("leadId", lead.id);
    e.dataTransfer.setData("oldStatus", lead.status);
    setDraggedId(lead.id);
  }

  function handleDragOver(e: React.DragEvent, colId: string) {
    e.preventDefault();
    setDragOverCol(colId);
  }

  function handleDragLeave(colId: string) {
    setDragOverCol((prev) => (prev === colId ? null : prev));
  }

  async function handleDrop(colId: string) {
    if (!draggedId) return;
    const col = COLUMNS.find((c) => c.id === colId);
    if (!col) return;
    const newStatus = col.statuses[0] as LeadPipelineItem["status"];
    setDraggedId(null);
    setDragOverCol(null);

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === draggedId ? { ...l, status: newStatus } : l
      )
    );
    if (selectedLead?.id === draggedId) {
      setSelectedLead((prev) => prev ? { ...prev, status: newStatus } : prev);
    }

    try {
      const res = await fetch(`/api/leads/pipeline/${draggedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch {
      addToast("Failed to update lead status", "error");
      // Revert
      setLeads((prev) =>
        prev.map((l) =>
          l.id === draggedId
            ? { ...l, status: (l as LeadPipelineItem).status }
            : l
        )
      );
    }
  }

  // ── Quick status change ────────────────────────────────────────────────────

  async function changeStatus(id: string, status: LeadPipelineItem["status"]) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    if (selectedLead?.id === id) {
      setSelectedLead((prev) => (prev ? { ...prev, status } : prev));
    }
    try {
      const res = await fetch(`/api/leads/pipeline/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      addToast("Failed to update status", "error");
    }
  }

  // ── Inline edit (detail panel) ─────────────────────────────────────────────

  async function savePatch(
    id: string,
    patch: Partial<Pick<LeadPipelineItem, "name" | "notes" | "estimated_value" | "next_follow_up">>
  ) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    if (selectedLead?.id === id) {
      setSelectedLead((prev) => (prev ? { ...prev, ...patch } : prev));
    }
    try {
      const res = await fetch(`/api/leads/pipeline/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      addToast("Saved", "success");
    } catch {
      addToast("Failed to save", "error");
    }
  }

  // ── Add lead ───────────────────────────────────────────────────────────────

  async function handleAddLead(form: {
    name: string;
    phone: string;
    email: string;
    source: string;
    estimated_value: string;
    notes: string;
    next_follow_up: string;
  }) {
    try {
      const res = await fetch("/api/leads/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimated_value: form.estimated_value
            ? Number(form.estimated_value)
            : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add lead");
      setLeads((prev) => [json.lead as LeadPipelineItem, ...prev]);
      setShowAddModal(false);
      addToast("Lead added successfully", "success");
    } catch (err: unknown) {
      addToast(
        err instanceof Error ? err.message : "Failed to add lead",
        "error"
      );
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Lead Pipeline
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Drag cards between columns to move leads through your pipeline.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow"
          style={{ background: "#F59E0B" }}
        >
          <Plus size={15} />
          Add Lead
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total Leads",
            value: leads.length.toString(),
          },
          {
            label: "Pipeline Value",
            value: fmt(pipelineValue),
          },
          {
            label: "Won",
            value: wonCount.toString(),
          },
          {
            label: "Conversion Rate",
            value: `${conversionRate}%`,
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border p-4"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              {label}
            </p>
            <p
              className="mt-1 text-xl font-bold tabular-nums"
              style={{ color: "#F59E0B" }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div className="overflow-x-auto">
        <div className="flex min-w-[960px] gap-3 pb-4">
          {COLUMNS.map((col) => {
            const colLeads = leads.filter((l) =>
              col.statuses.includes(l.status)
            );
            const colValue = colLeads.reduce(
              (sum, l) => sum + (l.estimated_value ?? 0),
              0
            );
            const isOver = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                className="flex w-56 shrink-0 flex-col rounded-xl transition-all"
                style={{
                  background: isOver ? col.bg : "var(--bg-card)",
                  border: isOver
                    ? `2px dashed ${col.accent}`
                    : `1px solid var(--border)`,
                }}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={() => handleDrop(col.id)}
                onDragLeave={() => handleDragLeave(col.id)}
              >
                {/* Column header */}
                <div
                  className="rounded-t-xl px-3 py-2.5"
                  style={{
                    background: col.bg,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: col.accent }}
                    />
                    <span
                      className="text-xs font-bold"
                      style={{ color: col.accent }}
                    >
                      {col.label}
                    </span>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                      style={{ background: col.bg, color: col.accent, border: `1px solid ${col.accent}40` }}
                    >
                      {colLeads.length}
                    </span>
                  </div>
                  {colValue > 0 && (
                    <p
                      className="mt-0.5 pl-4 text-[10px] font-semibold tabular-nums"
                      style={{ color: col.accent }}
                    >
                      {fmt(colValue)}
                    </p>
                  )}
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 p-2 min-h-[120px]">
                  {colLeads.length === 0 && (
                    <div
                      className="mt-1 rounded-lg border border-dashed px-3 py-5 text-center text-xs"
                      style={{
                        borderColor: col.accent + "40",
                        color: "var(--text-muted)",
                      }}
                    >
                      No leads yet
                    </div>
                  )}
                  {colLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      col={col}
                      isDragging={draggedId === lead.id}
                      onDragStart={handleDragStart}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragOverCol(null);
                      }}
                      onClick={() => setSelectedLead(lead)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add lead modal */}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddLead}
        />
      )}

      {/* Detail side panel */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={changeStatus}
          onSavePatch={savePatch}
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg"
            style={{
              background: t.type === "success" ? "#F59E0B" : "#EF4444",
            }}
          >
            {t.type === "success" ? (
              <CheckCircle size={14} />
            ) : (
              <AlertCircle size={14} />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Lead card ─────────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  col,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  lead: LeadPipelineItem;
  col: KanbanCol;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, lead: LeadPipelineItem) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const src = SOURCE_LABELS[lead.source ?? "manual"] ?? SOURCE_LABELS.manual;
  const followUpPast = isPastDue(lead.next_follow_up);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className="group cursor-grab rounded-lg border p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing"
      style={{
        background: isDragging ? col.bg : "var(--bg-primary, var(--bg-card))",
        borderColor: isDragging ? col.accent : "var(--border)",
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {/* Name + arrow */}
      <div className="flex items-start justify-between gap-1">
        <p
          className="text-xs font-semibold leading-snug"
          style={{ color: "var(--text-primary)" }}
        >
          {lead.name}
        </p>
        <ChevronRight
          size={12}
          className="mt-0.5 shrink-0 opacity-0 transition group-hover:opacity-50"
          style={{ color: "var(--text-muted)" }}
        />
      </div>

      {/* Source badge */}
      <span
        className="mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
        style={{
          background: src.color + "20",
          color: src.color,
        }}
      >
        {src.label}
      </span>

      {/* Value */}
      {lead.estimated_value != null && (
        <p
          className="mt-1.5 text-xs font-bold tabular-nums"
          style={{ color: col.accent }}
        >
          {fmt(lead.estimated_value)}
        </p>
      )}

      {/* AI grade */}
      {lead.ai_score != null && lead.ai_score > 0 && lead.ai_grade && (
        <span
          className="mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold"
          style={{
            background: (GRADE_COLORS[lead.ai_grade] ?? "#64748B") + "20",
            color: GRADE_COLORS[lead.ai_grade] ?? "#64748B",
          }}
        >
          Grade {lead.ai_grade}
        </span>
      )}

      {/* Follow-up */}
      {lead.next_follow_up && (
        <p
          className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold"
          style={{ color: followUpPast ? "#EF4444" : "var(--text-muted)" }}
        >
          <CalendarClock size={10} />
          {formatDate(lead.next_follow_up)}
          {followUpPast && " (overdue)"}
        </p>
      )}

      {/* Contact icons */}
      {(lead.phone || lead.email) && (
        <div className="mt-2 flex items-center gap-2">
          {lead.phone && (
            <Phone size={11} style={{ color: "var(--text-muted)" }} />
          )}
          {lead.email && (
            <Mail size={11} style={{ color: "var(--text-muted)" }} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Add Lead Modal ─────────────────────────────────────────────────────────────

function AddLeadModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (form: {
    name: string;
    phone: string;
    email: string;
    source: string;
    estimated_value: string;
    notes: string;
    next_follow_up: string;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    source: "manual",
    estimated_value: "",
    notes: "",
    next_follow_up: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function set(key: string, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 shadow-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Add Lead
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="mb-1 block text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Name <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              placeholder="Lead name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="mb-1 block text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                placeholder="04xx xxx xxx"
              />
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="mb-1 block text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Source
              </label>
              <select
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                <option value="manual">Manual</option>
                <option value="marketplace">Marketplace</option>
                <option value="referral">Referral</option>
                <option value="website">Website</option>
              </select>
            </div>
            <div>
              <label
                className="mb-1 block text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Est. Value ($)
              </label>
              <input
                type="number"
                min="0"
                value={form.estimated_value}
                onChange={(e) => set("estimated_value", e.target.value)}
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                placeholder="e.g. 2500"
              />
            </div>
          </div>
          <div>
            <label
              className="mb-1 block text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Next Follow-up
            </label>
            <input
              type="date"
              value={form.next_follow_up}
              onChange={(e) => set("next_follow_up", e.target.value)}
              className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label
              className="mb-1 block text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Notes
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              placeholder="Any initial notes…"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-semibold"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.name.trim()}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#F59E0B" }}
            >
              {submitting ? "Adding…" : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Lead Detail Panel ─────────────────────────────────────────────────────────

function LeadDetailPanel({
  lead,
  onClose,
  onStatusChange,
  onSavePatch,
}: {
  lead: LeadPipelineItem;
  onClose: () => void;
  onStatusChange: (id: string, status: LeadPipelineItem["status"]) => Promise<void>;
  onSavePatch: (
    id: string,
    patch: Partial<Pick<LeadPipelineItem, "name" | "notes" | "estimated_value" | "next_follow_up">>
  ) => Promise<void>;
}) {
  const [editName, setEditName] = useState(lead.name);
  const [editNotes, setEditNotes] = useState(lead.notes ?? "");
  const [editValue, setEditValue] = useState(
    lead.estimated_value != null ? String(lead.estimated_value) : ""
  );
  const [editFollowUp, setEditFollowUp] = useState(
    lead.next_follow_up ? lead.next_follow_up.split("T")[0] : ""
  );
  const [saving, setSaving] = useState(false);

  const src = SOURCE_LABELS[lead.source ?? "manual"] ?? SOURCE_LABELS.manual;

  async function handleSave() {
    setSaving(true);
    await onSavePatch(lead.id, {
      name: editName.trim() || lead.name,
      notes: editNotes || null,
      estimated_value: editValue ? Number(editValue) : null,
      next_follow_up: editFollowUp || null,
    });
    setSaving(false);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto shadow-2xl"
        style={{
          background: "var(--bg-card)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2
              className="text-base font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Lead Details
            </h2>
            <span
              className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
              style={{ background: src.color + "20", color: src.color }}
            >
              {src.label}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 p-5">
          {/* Editable fields */}
          <div className="space-y-3">
            <div>
              <label
                className="mb-1 block text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Name
              </label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Est. Value ($)
              </label>
              <input
                type="number"
                min="0"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Next Follow-up
              </label>
              <input
                type="date"
                value={editFollowUp}
                onChange={(e) => setEditFollowUp(e.target.value)}
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Notes
              </label>
              <textarea
                rows={4}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#F59E0B" }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>

          {/* Read-only details */}
          <div
            className="space-y-2 rounded-xl border p-4"
            style={{
              borderColor: "var(--border)",
              background: "rgba(0,0,0,0.03)",
            }}
          >
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <Phone size={13} style={{ color: "#F59E0B" }} />
                {lead.phone}
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <Mail size={13} style={{ color: "#F59E0B" }} />
                {lead.email}
              </div>
            )}
            {lead.ai_grade && (lead.ai_score ?? 0) > 0 && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    background: (GRADE_COLORS[lead.ai_grade] ?? "#64748B") + "20",
                    color: GRADE_COLORS[lead.ai_grade] ?? "#64748B",
                  }}
                >
                  AI Grade {lead.ai_grade}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                  score {lead.ai_score}
                </span>
              </div>
            )}
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Created {formatDate(lead.created_at)}
            </p>
          </div>

          {/* Status change buttons */}
          <div>
            <p
              className="mb-2 text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Move to Stage
            </p>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.filter((s) => s.value !== lead.status).map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() =>
                    onStatusChange(lead.id, s.value as LeadPipelineItem["status"])
                  }
                  className="rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition hover:bg-white/10"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onStatusChange(lead.id, "won")}
              className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: "#22C55E" }}
            >
              <CheckCircle size={14} />
              Mark as Won
            </button>
            <button
              type="button"
              onClick={() => onStatusChange(lead.id, "lost")}
              className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#F87171",
              }}
            >
              <XCircle size={14} />
              Mark as Lost
            </button>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="flex w-full cursor-not-allowed items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold opacity-40"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-muted)",
              }}
            >
              Convert to Client
              <span className="ml-auto rounded bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-bold text-yellow-400">
                SOON
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
