"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import {
  X,
  FileText,
  CheckCircle,
  XCircle,
  GripVertical,
  Phone,
  MessageSquare,
  CalendarClock,
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type LeadStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "booked"
  | "won"
  | "lost";

type PipelineLead = {
  id: string;
  status: LeadStatus;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  marketplace_lead: {
    id: string;
    service_type: string | null;
    suburb: string | null;
    description: string | null;
    estimated_budget: number | null;
    contact_name?: string | null;
  } | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const COLUMNS: {
  id: LeadStatus | "won_lost";
  label: string;
  statuses: LeadStatus[];
  accent: string;
  bg: string;
}[] = [
  {
    id: "new",
    label: "New",
    statuses: ["new"],
    accent: "rgb(59 130 246)",
    bg: "rgb(59 130 246 / 0.08)",
  },
  {
    id: "contacted",
    label: "Contacted",
    statuses: ["contacted"],
    accent: "rgb(245 158 11)",
    bg: "rgb(245 158 11 / 0.08)",
  },
  {
    id: "quoted",
    label: "Quoted",
    statuses: ["quoted"],
    accent: "rgb(168 85 247)",
    bg: "rgb(168 85 247 / 0.08)",
  },
  {
    id: "booked",
    label: "Booked",
    statuses: ["booked"],
    accent: "rgb(34 197 94)",
    bg: "rgb(34 197 94 / 0.08)",
  },
  {
    id: "won_lost",
    label: "Won / Lost",
    statuses: ["won", "lost"],
    accent: "rgb(100 116 139)",
    bg: "rgb(100 116 139 / 0.08)",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysInStage(createdAt: string | null): number {
  if (!createdAt) return 0;
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
}

function daysBetween(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  return Math.max(
    0,
    Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
  );
}

function formatBudget(n: number | null): string {
  if (!n) return "POA";
  return `$${n.toLocaleString("en-AU")}`;
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LeadsPipelinePage() {
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<PipelineLead | null>(null);
  const [panelNotes, setPanelNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const supabase = createSupabaseBrowser();
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data load ───────────────────────────────────────────────────────────────

  const loadLeads = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("leads_accepted")
      .select(
        `id, status, notes, created_at, updated_at,
         marketplace_lead:marketplace_lead_id (
           id, service_type, suburb, description, estimated_budget, contact_name
         )`
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    type Raw = {
      id: string;
      status: string | null;
      notes: string | null;
      created_at: string | null;
      updated_at: string | null;
      marketplace_lead: {
        id: string;
        service_type: string | null;
        suburb: string | null;
        description: string | null;
        estimated_budget: number | null;
        contact_name?: string | null;
      } | null;
    };

    const rows = (data as Raw[] | null) ?? [];
    setLeads(
      rows.map((r) => ({
        ...r,
        status: (r.status ?? "new") as LeadStatus,
      }))
    );
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Keep panel in sync when leads update
  useEffect(() => {
    if (selectedLead) {
      const updated = leads.find((l) => l.id === selectedLead.id);
      if (updated) {
        setSelectedLead(updated);
        setPanelNotes(updated.notes ?? "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads]);

  // ── Drag handlers ───────────────────────────────────────────────────────────

  function handleDragStart(leadId: string) {
    setDraggedId(leadId);
  }

  function handleDragOver(e: React.DragEvent, colId: string) {
    e.preventDefault();
    setDragOverCol(colId);
  }

  function handleDrop(colId: string) {
    if (!draggedId) return;
    const col = COLUMNS.find((c) => c.id === colId);
    if (!col) return;
    const newStatus = col.statuses[0];
    void dropToStatus(draggedId, newStatus);
    setDraggedId(null);
    setDragOverCol(null);
  }

  async function dropToStatus(leadId: string, status: LeadStatus) {
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, status, updated_at: new Date().toISOString() }
          : l
      )
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("leads_accepted")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", leadId)
      .eq("owner_id", user.id);
  }

  // ── Notes save ──────────────────────────────────────────────────────────────

  async function saveNotes(leadId: string, notes: string) {
    setSavingNotes(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("leads_accepted")
      .update({ notes })
      .eq("id", leadId)
      .eq("owner_id", user.id);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, notes } : l))
    );
    setSavingNotes(false);
  }

  function openPanel(lead: PipelineLead) {
    setSelectedLead(lead);
    setPanelNotes(lead.notes ?? "");
  }

  // ── Summary stats ───────────────────────────────────────────────────────────

  const activePipelineValue = leads
    .filter((l) => !["won", "lost"].includes(l.status))
    .reduce((sum, l) => sum + (l.marketplace_lead?.estimated_budget ?? 0), 0);

  const wonLeads = leads.filter((l) => l.status === "won");
  const winRate =
    leads.length > 0
      ? Math.round((wonLeads.length / leads.length) * 100)
      : 0;

  const allBudgets = leads
    .map((l) => l.marketplace_lead?.estimated_budget ?? 0)
    .filter(Boolean);
  const avgDeal =
    allBudgets.length > 0
      ? Math.round(allBudgets.reduce((a, b) => a + b, 0) / allBudgets.length)
      : 0;

  const closedDays = wonLeads
    .map((l) => daysBetween(l.created_at, l.updated_at))
    .filter((d) => d > 0);
  const avgDaysToClose =
    closedDays.length > 0
      ? Math.round(
          closedDays.reduce((a, b) => a + b, 0) / closedDays.length
        )
      : null;

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-32 text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        Loading pipeline…
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Lead Pipeline
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Drag cards between columns to update lead status.
          </p>
        </div>
      </div>

      {/* Empty state */}
      {leads.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border py-20 text-center"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <p
            className="font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            No leads in your pipeline yet
          </p>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Browse the marketplace to find jobs near you.
          </p>
          <Link
            href="/dashboard/leads/browse"
            className="mt-4 inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: "var(--accent-color)" }}
          >
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <>
          {/* Kanban board */}
          <div className="overflow-x-auto">
            <div className="flex min-w-[900px] gap-3 pb-4">
              {COLUMNS.map((col) => {
                const colLeads = leads.filter((l) =>
                  col.statuses.includes(l.status)
                );
                const colValue = colLeads.reduce(
                  (sum, l) =>
                    sum + (l.marketplace_lead?.estimated_budget ?? 0),
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
                        ? `2px solid ${col.accent}`
                        : `1px solid var(--border)`,
                    }}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDrop={() => handleDrop(col.id)}
                    onDragLeave={() =>
                      setDragOverCol((prev) =>
                        prev === col.id ? null : prev
                      )
                    }
                  >
                    {/* Column header */}
                    <div
                      className="flex items-start justify-between rounded-t-xl px-3 py-2.5"
                      style={{
                        background: col.bg,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: col.accent }}
                          />
                          <p
                            className="text-xs font-bold"
                            style={{ color: col.accent }}
                          >
                            {col.label}
                          </p>
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                            style={{ background: col.bg, color: col.accent }}
                          >
                            {colLeads.length}
                          </span>
                        </div>
                        {colValue > 0 && (
                          <p
                            className="mt-0.5 pl-4 text-[10px] font-semibold tabular-nums"
                            style={{ color: col.accent }}
                          >
                            ${colValue.toLocaleString("en-AU")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="flex flex-col gap-2 p-2">
                      {colLeads.length === 0 && (
                        <div
                          className="rounded-lg border border-dashed px-3 py-4 text-center text-xs"
                          style={{
                            borderColor: "var(--border)",
                            color: "var(--text-muted)",
                          }}
                        >
                          Drop here
                        </div>
                      )}
                      {colLeads.map((lead) => {
                        const ml = lead.marketplace_lead;
                        const days = daysInStage(lead.created_at);
                        const isDragging = draggedId === lead.id;
                        return (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={() => handleDragStart(lead.id)}
                            onDragEnd={() => {
                              setDraggedId(null);
                              setDragOverCol(null);
                            }}
                            onClick={() => openPanel(lead)}
                            className="group cursor-grab rounded-lg border p-3 shadow-sm transition active:cursor-grabbing"
                            style={{
                              background: isDragging
                                ? col.bg
                                : "var(--bg-primary)",
                              borderColor: isDragging
                                ? col.accent
                                : "var(--border)",
                              opacity: isDragging ? 0.6 : 1,
                            }}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <p
                                className="text-xs font-semibold leading-snug"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {ml?.contact_name ??
                                  ml?.service_type ??
                                  "Lead"}
                              </p>
                              <GripVertical
                                size={12}
                                className="mt-0.5 shrink-0 opacity-30 group-hover:opacity-60"
                                style={{ color: "var(--text-muted)" }}
                              />
                            </div>
                            <p
                              className="mt-0.5 text-[10px]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {ml?.suburb ?? "—"} · {ml?.service_type ?? "—"}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <span
                                className="text-xs font-bold"
                                style={{ color: col.accent }}
                              >
                                {formatBudget(
                                  ml?.estimated_budget ?? null
                                )}
                              </span>
                              <span
                                className="text-[10px]"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {days}d
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Pipeline value",
                value: `$${activePipelineValue.toLocaleString("en-AU")}`,
              },
              {
                label: "Average deal size",
                value:
                  avgDeal > 0
                    ? `$${avgDeal.toLocaleString("en-AU")}`
                    : "—",
              },
              { label: "Conversion rate", value: `${winRate}%` },
              {
                label: "Avg days to close",
                value:
                  avgDaysToClose !== null
                    ? `${avgDaysToClose}d`
                    : "—",
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
                  style={{ color: "var(--text-primary)" }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Side panel ──────────────────────────────────────────────────────── */}
      {selectedLead && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgb(0 0 0 / 0.4)" }}
            onClick={() => setSelectedLead(null)}
          />
          {/* Panel */}
          <div
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[320px] flex-col overflow-y-auto shadow-2xl"
            style={{
              background: "var(--bg-card)",
              borderLeft: "1px solid var(--border)",
            }}
          >
            {/* Panel header */}
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <h2
                  className="text-base font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {selectedLead.marketplace_lead?.service_type ?? "Lead"}{" "}
                  details
                </h2>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {selectedLead.marketplace_lead?.suburb ?? ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="rounded-lg p-1.5 hover:bg-white/10"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-5 p-5">
              {/* Details */}
              <div
                className="space-y-2 rounded-xl border p-4"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-primary)",
                }}
              >
                <Row
                  label="Service type"
                  value={
                    selectedLead.marketplace_lead?.service_type ?? "—"
                  }
                />
                <Row
                  label="Suburb"
                  value={selectedLead.marketplace_lead?.suburb ?? "—"}
                />
                <Row
                  label="Estimated value"
                  value={formatBudget(
                    selectedLead.marketplace_lead?.estimated_budget ?? null
                  )}
                />
                <Row
                  label="Current status"
                  value={capitalise(selectedLead.status)}
                />
                <Row
                  label="Date received"
                  value={
                    selectedLead.created_at
                      ? new Date(
                          selectedLead.created_at
                        ).toLocaleDateString("en-AU")
                      : "—"
                  }
                />
                <Row
                  label="Days in pipeline"
                  value={`${daysInStage(selectedLead.created_at)} days`}
                />
              </div>

              {/* Description */}
              {selectedLead.marketplace_lead?.description && (
                <div>
                  <p
                    className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Description
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {selectedLead.marketplace_lead.description}
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div>
                <p
                  className="mb-2 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  Timeline
                </p>
                <div className="space-y-2">
                  <TimelineEvent
                    label="Lead received"
                    date={selectedLead.created_at}
                  />
                  {selectedLead.status !== "new" && (
                    <TimelineEvent
                      label={`Status: ${capitalise(selectedLead.status)}`}
                      date={selectedLead.updated_at}
                    />
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p
                  className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  Notes{" "}
                  {savingNotes && (
                    <span style={{ color: "var(--accent-color)" }}>
                      (saving…)
                    </span>
                  )}
                </p>
                <textarea
                  value={panelNotes}
                  onChange={(e) => setPanelNotes(e.target.value)}
                  onBlur={() => {
                    if (notesTimerRef.current)
                      clearTimeout(notesTimerRef.current);
                    notesTimerRef.current = setTimeout(() => {
                      void saveNotes(selectedLead.id, panelNotes);
                    }, 300);
                  }}
                  placeholder="Add notes about this lead…"
                  rows={4}
                  className="w-full resize-none rounded-lg border p-3 text-sm"
                  style={{
                    background: "var(--bg-primary)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Action buttons */}
              <div className="mt-auto space-y-2">
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  Actions
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void dropToStatus(selectedLead.id, "contacted")
                  }
                  className="flex w-full items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <Phone
                    size={14}
                    style={{ color: "var(--accent-color)" }}
                  />
                  Mark as Contacted
                </button>

                <Link
                  href={"/dashboard/owner/quotes" as any}
                  className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <CalendarClock
                    size={14}
                    style={{ color: "var(--accent-color)" }}
                  />
                  Schedule a Quote
                </Link>

                <Link
                  href={"/dashboard/owner/quotes" as any}
                  className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <FileText
                    size={14}
                    style={{ color: "var(--accent-color)" }}
                  />
                  Create Quote
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    void dropToStatus(selectedLead.id, "won")
                  }
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
                  style={{ background: "rgb(34 197 94)" }}
                >
                  <CheckCircle size={14} />
                  Mark as Won
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void dropToStatus(selectedLead.id, "lost")
                  }
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
                  style={{
                    background: "rgb(239 68 68 / 0.15)",
                    color: "rgb(248 113 113)",
                    border: "1px solid rgb(239 68 68 / 0.3)",
                  }}
                >
                  <XCircle size={14} />
                  Mark as Lost
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      <p
        className="text-sm font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}

function TimelineEvent({
  label,
  date,
}: {
  label: string;
  date: string | null;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-1.5 flex flex-col items-center">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: "var(--accent-color)" }}
        />
      </div>
      <div>
        <p
          className="text-xs font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </p>
        {date && (
          <p
            className="text-[10px]"
            style={{ color: "var(--text-muted)" }}
          >
            {new Date(date).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
