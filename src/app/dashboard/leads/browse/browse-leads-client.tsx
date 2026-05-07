"use client";

import { useState, useMemo } from "react";
import {
  Zap,
  Wrench,
  Droplets,
  Building2,
  Sparkles,
  Leaf,
  Wind,
  Bug,
  HelpCircle,
  X,
  MapPin,
  Clock,
  DollarSign,
} from "lucide-react";

export type MarketplaceLead = {
  id: string;
  suburb: string | null;
  postcode: string | null;
  service_type: string | null;
  description: string | null;
  urgency: string | null;
  estimated_budget: number | null;
  status: string | null;
  is_demo: boolean | null;
  created_at: string | null;
};

const SERVICE_TYPES = [
  "All",
  "Electrical",
  "Plumbing",
  "Building",
  "Cleaning",
  "Landscaping",
  "HVAC",
  "Pest Control",
  "Other",
] as const;

const RADIUS_OPTIONS = ["10km", "25km", "50km"] as const;

const URGENCY_OPTIONS = [
  { label: "Any", value: "any" },
  { label: "Today", value: "today" },
  { label: "This week", value: "this_week" },
  { label: "Flexible", value: "flexible" },
] as const;

function serviceIcon(type: string | null) {
  const t = (type ?? "").toLowerCase();
  if (t === "electrical") return <Zap size={18} />;
  if (t === "plumbing") return <Droplets size={18} />;
  if (t === "building") return <Building2 size={18} />;
  if (t === "cleaning") return <Sparkles size={18} />;
  if (t === "landscaping") return <Leaf size={18} />;
  if (t === "hvac") return <Wind size={18} />;
  if (t === "pest control") return <Bug size={18} />;
  if (t === "other") return <HelpCircle size={18} />;
  return <Wrench size={18} />;
}

function urgencyColor(urgency: string | null): {
  bg: string;
  text: string;
  ring: string;
} {
  const u = (urgency ?? "").toLowerCase();
  if (u === "today")
    return {
      bg: "rgb(239 68 68 / 0.15)",
      text: "rgb(248 113 113)",
      ring: "rgb(239 68 68 / 0.3)",
    };
  if (u === "this_week" || u === "this week")
    return {
      bg: "rgb(245 158 11 / 0.15)",
      text: "rgb(251 191 36)",
      ring: "rgb(245 158 11 / 0.3)",
    };
  return {
    bg: "rgb(34 197 94 / 0.15)",
    text: "rgb(74 222 128)",
    ring: "rgb(34 197 94 / 0.3)",
  };
}

function urgencyLabel(urgency: string | null) {
  const u = (urgency ?? "").toLowerCase();
  if (u === "today") return "Today";
  if (u === "this_week" || u === "this week") return "This week";
  return "Flexible";
}

function relativeTime(iso: string | null): string {
  if (!iso) return "Recently";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatBudget(budget: number | null): string {
  if (!budget) return "POA";
  return `$${budget.toLocaleString("en-AU")}`;
}

export default function BrowseLeadsClient({
  leads,
}: {
  leads: MarketplaceLead[];
}) {
  const [serviceFilter, setServiceFilter] = useState<string>("All");
  const [suburbFilter, setSuburbFilter] = useState("");
  const [radiusFilter, setRadiusFilter] = useState<string>("25km");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("any");
  const [modalLead, setModalLead] = useState<MarketplaceLead | null>(null);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      if (serviceFilter !== "All") {
        const t = (lead.service_type ?? "").toLowerCase();
        if (t !== serviceFilter.toLowerCase()) return false;
      }
      if (suburbFilter.trim()) {
        const suburb = (lead.suburb ?? "").toLowerCase();
        if (!suburb.includes(suburbFilter.trim().toLowerCase())) return false;
      }
      if (urgencyFilter !== "any") {
        const u = (lead.urgency ?? "").toLowerCase().replace(" ", "_");
        if (u !== urgencyFilter) return false;
      }
      return true;
    });
  }, [leads, serviceFilter, suburbFilter, urgencyFilter]);

  const urgencyColors = modalLead ? urgencyColor(modalLead.urgency) : null;

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div
        className="sticky top-0 z-10 rounded-xl border p-4"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-wrap gap-3">
          {/* Service type */}
          <div className="flex flex-col gap-1">
            <label
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Service type
            </label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="h-9 rounded-lg border px-3 text-sm"
              style={{
                background: "var(--bg-primary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Suburb */}
          <div className="flex flex-col gap-1">
            <label
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Suburb
            </label>
            <input
              type="text"
              value={suburbFilter}
              onChange={(e) => setSuburbFilter(e.target.value)}
              placeholder="e.g. Bondi"
              className="h-9 rounded-lg border px-3 text-sm"
              style={{
                background: "var(--bg-primary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Radius pills */}
          <div className="flex flex-col gap-1">
            <span
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Radius
            </span>
            <div className="flex gap-1.5">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusFilter(r)}
                  className="h-9 rounded-lg px-3 text-sm font-semibold transition"
                  style={{
                    background:
                      radiusFilter === r
                        ? "var(--accent-color)"
                        : "var(--bg-primary)",
                    color: radiusFilter === r ? "#fff" : "var(--text-secondary)",
                    border: "1px solid",
                    borderColor:
                      radiusFilter === r
                        ? "var(--accent-color)"
                        : "var(--border)",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Urgency pills */}
          <div className="flex flex-col gap-1">
            <span
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Urgency
            </span>
            <div className="flex gap-1.5">
              {URGENCY_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setUrgencyFilter(value)}
                  className="h-9 rounded-lg px-3 text-sm font-semibold transition"
                  style={{
                    background:
                      urgencyFilter === value
                        ? "var(--accent-color)"
                        : "var(--bg-primary)",
                    color:
                      urgencyFilter === value ? "#fff" : "var(--text-secondary)",
                    border: "1px solid",
                    borderColor:
                      urgencyFilter === value
                        ? "var(--accent-color)"
                        : "var(--border)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          Showing {filtered.length} of {leads.length} demo leads — live marketplace launches Q4 2026
        </p>
      </div>

      {/* Lead cards grid */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border py-16 text-center"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            No leads match your filters
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Try adjusting the service type or suburb.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lead) => {
            const colors = urgencyColor(lead.urgency);
            return (
              <div
                key={lead.id}
                className="flex flex-col rounded-xl border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                {/* Card header */}
                <div className="flex items-start gap-3 p-4">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background:
                        "color-mix(in srgb, var(--accent-color) 14%, transparent)",
                      color: "var(--accent-color)",
                    }}
                  >
                    {serviceIcon(lead.service_type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className="text-sm font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {lead.service_type ?? "General"}
                      </p>
                      <span
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.ring}`,
                        }}
                      >
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ background: colors.text }}
                        />
                        {urgencyLabel(lead.urgency)}
                      </span>
                    </div>
                    <div
                      className="mt-0.5 flex items-center gap-1 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <MapPin size={10} />
                      {lead.suburb ?? "Unknown suburb"}{" "}
                      {lead.postcode ? `${lead.postcode}` : ""}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p
                  className="line-clamp-2 px-4 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {lead.description ?? "No description provided."}
                </p>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between border-t p-4 pt-3" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <p
                      className="text-lg font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {formatBudget(lead.estimated_budget)}
                    </p>
                    <div
                      className="flex items-center gap-1 text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Clock size={9} />
                      {relativeTime(lead.created_at)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalLead(lead)}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                    style={{ background: "var(--accent-color)" }}
                  >
                    View &amp; Accept
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View & Accept Modal */}
      {modalLead && urgencyColors && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgb(0 0 0 / 0.7)" }}
          onClick={() => setModalLead(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setModalLead(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 hover:bg-white/10"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background:
                    "color-mix(in srgb, var(--accent-color) 16%, transparent)",
                  color: "var(--accent-color)",
                }}
              >
                {serviceIcon(modalLead.service_type)}
              </span>
              <div>
                <h2
                  className="text-lg font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {modalLead.service_type ?? "General"} — {modalLead.suburb}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: urgencyColors.bg,
                      color: urgencyColors.text,
                      border: `1px solid ${urgencyColors.ring}`,
                    }}
                  >
                    {urgencyLabel(modalLead.urgency)}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {relativeTime(modalLead.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="mt-5 space-y-4">
              <div>
                <p
                  className="mb-1 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  Job description
                </p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {modalLead.description ?? "No description provided."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p
                    className="mb-1 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Property type
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                    Residential
                  </p>
                </div>
                <div>
                  <p
                    className="mb-1 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Contact method
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                    Via SERVLO platform
                  </p>
                </div>
                <div>
                  <p
                    className="mb-1 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Estimated job value
                  </p>
                  <p
                    className="flex items-center gap-1 text-lg font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <DollarSign size={14} style={{ color: "var(--accent-color)" }} />
                    {formatBudget(modalLead.estimated_budget)}
                  </p>
                </div>
                <div>
                  <p
                    className="mb-1 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Location
                  </p>
                  <p className="flex items-center gap-1 text-sm" style={{ color: "var(--text-primary)" }}>
                    <MapPin size={12} style={{ color: "var(--accent-color)" }} />
                    {modalLead.suburb} {modalLead.postcode}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6 space-y-3">
              <div className="group relative">
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-xl py-3 text-sm font-bold text-white opacity-50"
                  style={{ background: "var(--accent-color)" }}
                  title="Leads marketplace coming Q4 2026 — you're on the early access list"
                >
                  Accept Lead — $
                  {Math.floor(
                    12 +
                      ((modalLead.estimated_budget ?? 200) / 200) *
                        18
                  ).toFixed(0)}
                </button>
                <div
                  className="absolute -top-10 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold group-hover:block"
                  style={{
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Leads marketplace coming Q4 2026 — you&apos;re on the early access list
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalLead(null)}
                className="w-full rounded-xl py-3 text-sm font-semibold"
                style={{
                  background: "var(--bg-primary)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
