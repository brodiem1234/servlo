"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";

export type LeadStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "booked"
  | "lost"
  | "won";

const STATUS_OPTIONS: LeadStatus[] = [
  "new",
  "contacted",
  "quoted",
  "booked",
  "won",
  "lost",
];

function statusBadgeStyle(status: string | null): React.CSSProperties {
  const s = (status ?? "new").toLowerCase();
  if (s === "new") return { background: "rgb(59 130 246 / 0.15)", color: "rgb(96 165 250)", border: "1px solid rgb(59 130 246 / 0.3)" };
  if (s === "contacted") return { background: "rgb(245 158 11 / 0.15)", color: "rgb(251 191 36)", border: "1px solid rgb(245 158 11 / 0.3)" };
  if (s === "quoted") return { background: "rgb(168 85 247 / 0.15)", color: "rgb(196 137 253)", border: "1px solid rgb(168 85 247 / 0.3)" };
  if (s === "booked" || s === "won") return { background: "rgb(34 197 94 / 0.15)", color: "rgb(74 222 128)", border: "1px solid rgb(34 197 94 / 0.3)" };
  // lost
  return { background: "rgb(239 68 68 / 0.15)", color: "rgb(248 113 113)", border: "1px solid rgb(239 68 68 / 0.3)" };
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type LeadRow = {
  id: string;
  status: string | null;
  created_at: string | null;
  notes: string | null;
  marketplace_lead: {
    id: string;
    service_type: string | null;
    suburb: string | null;
    description: string | null;
    estimated_budget: number | null;
  } | null;
};

type Props = {
  leads: LeadRow[];
  updateStatusAction: (leadId: string, status: string) => Promise<{ ok: boolean }>;
};

export default function MyLeadsClient({ leads, updateStatusAction }: Props) {
  const [statuses, setStatuses] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const l of leads) {
      map[l.id] = l.status ?? "new";
    }
    return map;
  });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(leadId: string, newStatus: string) {
    setStatuses((prev) => ({ ...prev, [leadId]: newStatus }));
    setOpenDropdown(null);
    startTransition(async () => {
      await updateStatusAction(leadId, newStatus);
    });
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <table className="w-full min-w-[800px] text-sm">
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
              "Status",
              "Value",
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
            return (
              <tr
                key={lead.id}
                className="border-b transition-colors hover:bg-white/5"
                style={{ borderColor: "var(--border)" }}
              >
                <td className="px-4 py-3 font-semibold" style={{ color: "var(--text-primary)" }}>
                  {ml?.service_type ?? "—"}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                  {ml?.suburb ?? "—"}
                </td>
                <td
                  className="max-w-[240px] truncate px-4 py-3"
                  style={{ color: "var(--text-secondary)" }}
                  title={ml?.description ?? ""}
                >
                  {ml?.description ?? "—"}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                  {lead.created_at
                    ? new Date(lead.created_at).toLocaleDateString("en-AU")
                    : "—"}
                </td>
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
                <td
                  className="px-4 py-3 font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {ml?.estimated_budget
                    ? `$${ml.estimated_budget.toLocaleString("en-AU")}`
                    : "POA"}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Converting to client — this will be enabled when Leads launches Q4 2026"
                      )
                    }
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-white/5"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Convert to client
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
