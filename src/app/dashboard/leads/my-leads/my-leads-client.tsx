"use client";

import { Fragment, useState, useTransition, useRef } from "react";
import { ChevronDown, X, UserPlus, ArrowRight } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

// ── Types ─────────────────────────────────────────────────────────────────────

export type LeadStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "booked"
  | "won"
  | "lost";

const STATUS_OPTIONS: LeadStatus[] = [
  "new",
  "contacted",
  "quoted",
  "booked",
  "won",
  "lost",
];

export type LeadRow = {
  id: string;
  status: string | null;
  created_at: string | null;
  notes: string | null;
  estimated_value: number | null;
  marketplace_lead: {
    id: string;
    service_type: string | null;
    suburb: string | null;
    description: string | null;
    estimated_budget: number | null;
    contact_name?: string | null;
  } | null;
};

type Props = {
  leads: LeadRow[];
  updateStatusAction: (leadId: string, status: string) => Promise<{ ok: boolean }>;
  updateNotesAction: (leadId: string, notes: string) => Promise<{ ok: boolean }>;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadgeStyle(status: string | null): React.CSSProperties {
  const s = (status ?? "new").toLowerCase();
  if (s === "new")
    return {
      background: "rgb(59 130 246 / 0.15)",
      color: "rgb(96 165 250)",
      border: "1px solid rgb(59 130 246 / 0.3)",
    };
  if (s === "contacted")
    return {
      background: "rgb(245 158 11 / 0.15)",
      color: "rgb(251 191 36)",
      border: "1px solid rgb(245 158 11 / 0.3)",
    };
  if (s === "quoted")
    return {
      background: "rgb(168 85 247 / 0.15)",
      color: "rgb(196 137 253)",
      border: "1px solid rgb(168 85 247 / 0.3)",
    };
  if (s === "booked" || s === "won")
    return {
      background: "rgb(34 197 94 / 0.15)",
      color: "rgb(74 222 128)",
      border: "1px solid rgb(34 197 94 / 0.3)",
    };
  // lost
  return {
    background: "rgb(239 68 68 / 0.15)",
    color: "rgb(248 113 113)",
    border: "1px solid rgb(239 68 68 / 0.3)",
  };
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function daysInPipeline(createdAt: string | null): number {
  if (!createdAt) return 0;
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MyLeadsClient({
  leads,
  updateStatusAction,
  updateNotesAction,
}: Props) {
  const [statuses, setStatuses] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const l of leads) {
      map[l.id] = l.status ?? "new";
    }
    return map;
  });
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const l of leads) {
      map[l.id] = l.notes ?? "";
    }
    return map;
  });
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [convertModalLead, setConvertModalLead] = useState<LeadRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const notesTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function handleStatusChange(leadId: string, newStatus: string) {
    setStatuses((prev) => ({ ...prev, [leadId]: newStatus }));
    setOpenDropdown(null);
    startTransition(async () => {
      await updateStatusAction(leadId, newStatus);
    });
  }

  function toggleNotesRow(leadId: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  }

  function handleNotesChange(leadId: string, value: string) {
    setNotes((prev) => ({ ...prev, [leadId]: value }));
  }

  function handleNotesBlur(leadId: string) {
    const value = notes[leadId] ?? "";
    if (notesTimers.current[leadId])
      clearTimeout(notesTimers.current[leadId]);
    notesTimers.current[leadId] = setTimeout(() => {
      startTransition(async () => {
        await updateNotesAction(leadId, value);
      });
    }, 300);
  }

  return (
    <>
      <div
        className="overflow-x-auto rounded-xl border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr
              className="border-b text-left"
              style={{ borderColor: "var(--border)" }}
            >
              {[
                "Service type",
                "Suburb",
                "Description",
                "Date received",
                "Days",
                "Est. value",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const ml = lead.marketplace_lead;
              const currentStatus = statuses[lead.id] ?? "new";
              const isOpen = openDropdown === lead.id;
              const notesExpanded = expandedNotes.has(lead.id);
              const days = daysInPipeline(lead.created_at);
              const estimatedValue =
                lead.estimated_value ?? ml?.estimated_budget ?? null;

              return (
                <Fragment key={lead.id}>
                  <tr
                    className="border-b transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td
                      className="px-4 py-3 font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {ml?.service_type ?? "—"}
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {ml?.suburb ?? "—"}
                    </td>
                    <td
                      className="max-w-[200px] truncate px-4 py-3"
                      style={{ color: "var(--text-secondary)" }}
                      title={ml?.description ?? ""}
                    >
                      {ml?.description ?? "—"}
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {lead.created_at
                        ? new Date(lead.created_at).toLocaleDateString(
                            "en-AU"
                          )
                        : "—"}
                    </td>
                    {/* Days in pipeline */}
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
                        style={{
                          background:
                            days > 14
                              ? "rgb(239 68 68 / 0.12)"
                              : days > 7
                              ? "rgb(245 158 11 / 0.12)"
                              : "rgb(34 197 94 / 0.12)",
                          color:
                            days > 14
                              ? "rgb(248 113 113)"
                              : days > 7
                              ? "rgb(251 191 36)"
                              : "rgb(74 222 128)",
                        }}
                      >
                        {days}d
                      </span>
                    </td>
                    {/* Estimated value */}
                    <td
                      className="px-4 py-3 font-semibold tabular-nums"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {estimatedValue
                        ? `$${estimatedValue.toLocaleString("en-AU")}`
                        : "—"}
                    </td>
                    {/* Status dropdown */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdown(isOpen ? null : lead.id)
                          }
                          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                          style={statusBadgeStyle(currentStatus)}
                          disabled={isPending}
                        >
                          {capitalise(currentStatus)}
                          <ChevronDown size={11} />
                        </button>
                        {isOpen && (
                          <div
                            className="absolute left-0 top-full z-20 mt-1 w-36 rounded-lg border py-1 shadow-lg"
                            style={{
                              background: "var(--bg-card)",
                              borderColor: "var(--border)",
                            }}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => handleStatusChange(lead.id, s)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-white/5"
                                style={{ color: "var(--text-primary)" }}
                              >
                                <span
                                  className="inline-block h-2 w-2 rounded-full"
                                  style={statusBadgeStyle(s)}
                                />
                                {capitalise(s)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleNotesRow(lead.id)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-white/5"
                          style={{
                            borderColor: "var(--border)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {notesExpanded ? "Hide notes" : "Notes"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConvertModalLead(lead)}
                          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-white/5"
                          style={{
                            borderColor: "var(--accent-color)",
                            color: "var(--accent-color)",
                          }}
                        >
                          <UserPlus size={11} />
                          Convert
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable notes row */}
                  {notesExpanded && (
                    <tr
                      className="border-b"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td
                        colSpan={8}
                        className="bg-white/[0.02] px-4 py-3"
                      >
                        <div className="flex flex-col gap-1.5">
                          <label
                            className="text-[10px] font-semibold uppercase tracking-wide"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Notes — auto-saves on blur
                          </label>
                          <textarea
                            value={notes[lead.id] ?? ""}
                            onChange={(e) =>
                              handleNotesChange(lead.id, e.target.value)
                            }
                            onBlur={() => handleNotesBlur(lead.id)}
                            placeholder="Add notes about this lead…"
                            rows={3}
                            className="w-full max-w-2xl resize-none rounded-lg border p-3 text-sm"
                            style={{
                              background: "var(--bg-primary)",
                              borderColor: "var(--border)",
                              color: "var(--text-primary)",
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Convert to client modal */}
      {convertModalLead && (
        <ConvertToClientModal
          lead={convertModalLead}
          onClose={() => setConvertModalLead(null)}
        />
      )}
    </>
  );
}

// ── Convert to client modal ───────────────────────────────────────────────────

function ConvertToClientModal({
  lead,
  onClose,
}: {
  lead: LeadRow;
  onClose: () => void;
}) {
  const ml = lead.marketplace_lead;
  const [fullName, setFullName] = useState(ml?.contact_name ?? "");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isPending, startTransition] = useTransition();
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!fullName.trim()) {
      setError("Client name is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("clients")
        .insert({
          owner_id: user.id,
          full_name: fullName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
        })
        .select("id")
        .single();

      if (insertError) {
        setError("Failed to create client. Please try again.");
        console.error("[convert-to-client]", insertError);
        return;
      }

      setCreatedClientId(data?.id ?? null);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgb(0 0 0 / 0.7)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border p-6 shadow-2xl"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 hover:bg-white/10"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={16} />
        </button>

        <div className="mb-5 flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              background:
                "color-mix(in srgb, var(--accent-color) 14%, transparent)",
            }}
          >
            <UserPlus size={16} style={{ color: "var(--accent-color)" }} />
          </span>
          <div>
            <h2
              className="text-base font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Convert to client
            </h2>
            {ml && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {ml.service_type} · {ml.suburb}
              </p>
            )}
          </div>
        </div>

        {createdClientId ? (
          <div className="py-4 text-center">
            <p
              className="text-xl font-bold"
              style={{ color: "rgb(74 222 128)" }}
            >
              Client created!
            </p>
            <p
              className="mt-1.5 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              {fullName} has been added to your clients.
            </p>
            <a
              href={`/dashboard/owner/clients/${createdClientId}` as string}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold text-white"
              style={{ background: "var(--accent-color)" }}
            >
              Go to client profile
              <ArrowRight size={14} />
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <p
                className="rounded-lg px-3 py-2 text-sm font-semibold"
                style={{
                  background: "rgb(239 68 68 / 0.12)",
                  color: "rgb(248 113 113)",
                  border: "1px solid rgb(239 68 68 / 0.3)",
                }}
              >
                {error}
              </p>
            )}

            {/* Client name */}
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Client name <span style={{ color: "rgb(248 113 113)" }}>*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  background: "var(--bg-primary)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  background: "var(--bg-primary)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Phone */}
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="04xx xxx xxx"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  background: "var(--bg-primary)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "var(--accent-color)" }}
            >
              {isPending ? "Creating client…" : "Create client"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
