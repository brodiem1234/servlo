"use client";

import { useState, useMemo, useTransition, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Bell,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Paintbrush,
  Bot,
  Loader2,
} from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AiScore = {
  score: number;
  reason: string;
  grade: "A" | "B" | "C" | "D";
};

export type AiScoreMap = Record<string, AiScore>;

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

// ── Demo leads fallback ───────────────────────────────────────────────────────

export const DEMO_LEADS: MarketplaceLead[] = [
  {
    id: "demo-1",
    suburb: "Bondi",
    postcode: "2026",
    service_type: "Plumbing",
    description:
      "Urgent hot water system replacement needed. 250L gas storage unit stopped working yesterday. Family of 4 — need same-day or next-day service if possible. New unit preferred, rental property so tenant is without hot water.",
    urgency: "today",
    estimated_budget: 1800,
    status: "available",
    is_demo: true,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-2",
    suburb: "Surry Hills",
    postcode: "2010",
    service_type: "Electrical",
    description:
      "Complete electrical upgrade for older terrace house — switchboard replacement, new GPOs in kitchen and bathrooms, LED downlight installation throughout. Currently on fuses, needs modernising for insurance requirements.",
    urgency: "this_week",
    estimated_budget: 4500,
    status: "available",
    is_demo: true,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-3",
    suburb: "Manly",
    postcode: "2095",
    service_type: "Landscaping",
    description:
      "Full backyard transformation for corner block. Looking for design + installation: raised garden beds, decking approx 40sqm, irrigation system, turf laying. Budget is flexible for the right design.",
    urgency: "flexible",
    estimated_budget: 12000,
    status: "available",
    is_demo: true,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-4",
    suburb: "Newtown",
    postcode: "2042",
    service_type: "Carpentry",
    description:
      "Custom built-in wardrobe and study nook for master bedroom. Space is 3.2m wide and 2.4m high. Need full height storage on one wall and a floating desk with shelving on the other. Timber finish preferred.",
    urgency: "this_week",
    estimated_budget: 3200,
    status: "available",
    is_demo: true,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-5",
    suburb: "Paddington",
    postcode: "2021",
    service_type: "Painting",
    description:
      "Interior and exterior repaint for 3-bedroom Victorian terrace. Interior walls and ceilings — 2 coats Dulux, colour selected. Exterior render and timber trim repaint. Approx 220sqm total. Heritage colours required.",
    urgency: "flexible",
    estimated_budget: 8500,
    status: "available",
    is_demo: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-6",
    suburb: "Cronulla",
    postcode: "2230",
    service_type: "Cleaning",
    description:
      "End of lease clean for 4-bedroom house with pool. Carpets steam cleaned, all windows inside and out, oven and kitchen deep clean, garage sweep. Need receipt for bond claim. Must be completed by Friday.",
    urgency: "today",
    estimated_budget: 650,
    status: "available",
    is_demo: true,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-7",
    suburb: "Mosman",
    postcode: "2088",
    service_type: "HVAC",
    description:
      "Supply and install ducted reverse-cycle air conditioning for 4-bedroom home. Single-storey, approx 280sqm. Existing ductwork may be reusable — need assessment first. Quality brands only (Daikin / Mitsubishi).",
    urgency: "this_week",
    estimated_budget: 9800,
    status: "available",
    is_demo: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-8",
    suburb: "Balmain",
    postcode: "2041",
    service_type: "Pest Control",
    description:
      "Termite inspection and treatment required urgently. Found mud trails in garage and timber subfloor sounding hollow. Old Queenslander-style house, original timber stumps. Need full inspection report for insurance.",
    urgency: "today",
    estimated_budget: 1200,
    status: "available",
    is_demo: true,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-9",
    suburb: "Chatswood",
    postcode: "2067",
    service_type: "Plumbing",
    description:
      "Bathroom renovation — full refit including new tiling, vanity, toilet suite, frameless shower screen, and heated towel rail. Supply and install all fixtures. Roughly 8sqm wet area. Mid-range budget.",
    urgency: "flexible",
    estimated_budget: 5500,
    status: "available",
    is_demo: true,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-10",
    suburb: "Glebe",
    postcode: "2037",
    service_type: "Electrical",
    description:
      "Solar PV system installation — 10kW system, single storey terrace with north-facing roof. Supply, install, and connect to grid. Interested in battery storage option as well. Need CEC-accredited installer.",
    urgency: "this_week",
    estimated_budget: 14000,
    status: "available",
    is_demo: true,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-11",
    suburb: "Randwick",
    postcode: "2031",
    service_type: "Carpentry",
    description:
      "Deck construction approx 35sqm off back of house. Spotted gum hardwood preferred. Feature steps and built-in bench seating. Outdoor dining area — needs to handle pool area proximity. DA already approved.",
    urgency: "flexible",
    estimated_budget: 6800,
    status: "available",
    is_demo: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-12",
    suburb: "Kirribilli",
    postcode: "2061",
    service_type: "Painting",
    description:
      "Apartment repaint — 2 bed, 2 bath in high-rise building. Interior only. Walls, ceilings, and doors. White throughout except feature wall in living area. Currently some water staining that needs priming first.",
    urgency: "this_week",
    estimated_budget: 2800,
    status: "available",
    is_demo: true,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Constants ─────────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
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

const POSTED_WITHIN_OPTIONS = [
  { label: "Any", value: "any" },
  { label: "Today", value: "today" },
  { label: "This week", value: "this_week" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function serviceIcon(type: string | null) {
  const t = (type ?? "").toLowerCase();
  if (t === "electrical") return <Zap size={18} />;
  if (t === "plumbing") return <Droplets size={18} />;
  if (t === "carpentry") return <Building2 size={18} />;
  if (t === "painting") return <Paintbrush size={18} />;
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
    bg: "rgb(100 116 139 / 0.15)",
    text: "rgb(148 163 184)",
    ring: "rgb(100 116 139 / 0.3)",
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
  if (mins < 1) return "Just now";
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

function leadPrice(budget: number | null): number {
  const b = budget ?? 0;
  if (b >= 5000) return 30;
  if (b >= 1000) return 20;
  return 12;
}

function postedWithinMs(value: string): number | null {
  if (value === "today") return 24 * 60 * 60 * 1000;
  if (value === "this_week") return 7 * 24 * 60 * 60 * 1000;
  return null;
}

// Random viewer count per lead (stable per id)
function viewerCount(id: string): number {
  const n = id.charCodeAt(id.length - 1) % 7;
  return n + 2; // 2–8
}

// AI score badge colours per grade
function gradeStyle(grade: AiScore["grade"]): { bg: string; text: string; border: string } {
  if (grade === "A")
    return {
      bg: "rgb(34 197 94 / 0.15)",
      text: "rgb(34 197 94)",
      border: "rgb(34 197 94 / 0.3)",
    };
  if (grade === "B")
    return {
      bg: "rgb(59 130 246 / 0.15)",
      text: "rgb(96 165 250)",
      border: "rgb(59 130 246 / 0.3)",
    };
  if (grade === "C")
    return {
      bg: "rgb(245 158 11 / 0.15)",
      text: "rgb(251 191 36)",
      border: "rgb(245 158 11 / 0.3)",
    };
  return {
    bg: "rgb(239 68 68 / 0.15)",
    text: "rgb(248 113 113)",
    border: "rgb(239 68 68 / 0.3)",
  };
}

function AiScoreBadge({ aiScore }: { aiScore: AiScore }) {
  const style = gradeStyle(aiScore.grade);
  return (
    <span
      title={aiScore.reason}
      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold cursor-default"
      style={{
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
    >
      <Bot size={9} />
      {aiScore.grade} · {aiScore.score}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BrowseLeadsClient({
  leads: serverLeads,
}: {
  leads: MarketplaceLead[];
}) {
  // Merge server leads with demo data (deduplicate by id)
  const allLeads = useMemo(() => {
    const serverIds = new Set(serverLeads.map((l) => l.id));
    const extras = DEMO_LEADS.filter((d) => !serverIds.has(d.id));
    return [...serverLeads, ...extras];
  }, [serverLeads]);

  // ── AI scoring state ────────────────────────────────────────────────────────
  const [scores, setScores] = useState<AiScoreMap>({});
  const [isScoringAll, setIsScoringAll] = useState(false);

  // Auto-score top 5 unscored leads on mount
  useEffect(() => {
    const top5 = filtered.slice(0, 5);
    if (top5.length === 0) return;
    void Promise.allSettled(
      top5.map(async (lead) => {
        const res = await fetch("/api/leads/score", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            lead: {
              service_type: lead.service_type ?? "",
              urgency: lead.urgency ?? "flexible",
              estimated_budget: lead.estimated_budget ?? 0,
              description: lead.description ?? "",
              suburb: lead.suburb ?? "",
            },
          }),
        });
        if (!res.ok) return null;
        const data: AiScore = await res.json();
        return { id: lead.id, data };
      })
    ).then((results) => {
      const newScores: AiScoreMap = {};
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          newScores[result.value.id] = result.value.data;
        }
      }
      setScores((prev) => ({ ...prev, ...newScores }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function scoreAllLeads() {
    if (isScoringAll) return;
    setIsScoringAll(true);
    try {
      const results = await Promise.allSettled(
        filtered.map(async (lead) => {
          const res = await fetch("/api/leads/score", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              lead: {
                service_type: lead.service_type ?? "",
                urgency: lead.urgency ?? "flexible",
                estimated_budget: lead.estimated_budget ?? 0,
                description: lead.description ?? "",
                suburb: lead.suburb ?? "",
              },
            }),
          });
          if (!res.ok) return null;
          const data: AiScore = await res.json();
          return { id: lead.id, data };
        })
      );
      const newScores: AiScoreMap = {};
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          newScores[result.value.id] = result.value.data;
        }
      }
      setScores((prev) => ({ ...prev, ...newScores }));
    } finally {
      setIsScoringAll(false);
    }
  }

  // ── Filter state ────────────────────────────────────────────────────────────
  const [pendingServices, setPendingServices] = useState<Set<string>>(
    new Set()
  );
  const [pendingSuburb, setPendingSuburb] = useState("");
  const [pendingRadius, setPendingRadius] = useState<string>("25km");
  const [pendingUrgency, setPendingUrgency] = useState("any");
  const [pendingPostedWithin, setPendingPostedWithin] = useState("any");

  // Applied (committed) filters
  const [activeServices, setActiveServices] = useState<Set<string>>(new Set());
  const [activeSuburb, setActiveSuburb] = useState("");
  const [activeRadius, setActiveRadius] = useState("25km");
  const [activeUrgency, setActiveUrgency] = useState("any");
  const [activePostedWithin, setActivePostedWithin] = useState("any");

  // ── UI state ────────────────────────────────────────────────────────────────
  const [panelLead, setPanelLead] = useState<MarketplaceLead | null>(null);
  const [alertModalOpen, setAlertModalOpen] = useState(false);

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const cutoff = postedWithinMs(activePostedWithin);
    return allLeads.filter((lead) => {
      if (activeServices.size > 0) {
        const t = (lead.service_type ?? "").toLowerCase();
        const match = [...activeServices].some(
          (s) => s.toLowerCase() === t
        );
        if (!match) return false;
      }
      if (activeSuburb.trim()) {
        const suburb = (lead.suburb ?? "").toLowerCase();
        const postcode = (lead.postcode ?? "").toLowerCase();
        const q = activeSuburb.trim().toLowerCase();
        if (!suburb.includes(q) && !postcode.includes(q)) return false;
      }
      if (activeUrgency !== "any") {
        const u = (lead.urgency ?? "").toLowerCase().replace(" ", "_");
        if (u !== activeUrgency) return false;
      }
      if (cutoff !== null && lead.created_at) {
        const age = Date.now() - new Date(lead.created_at).getTime();
        if (age > cutoff) return false;
      }
      return true;
    });
  }, [allLeads, activeServices, activeSuburb, activeUrgency, activePostedWithin]);

  const featuredLeads = useMemo(
    () => allLeads.filter((l) => (l.estimated_budget ?? 0) > 3000).slice(0, 6),
    [allLeads]
  );

  function applyFilters() {
    setActiveServices(new Set(pendingServices));
    setActiveSuburb(pendingSuburb);
    setActiveRadius(pendingRadius);
    setActiveUrgency(pendingUrgency);
    setActivePostedWithin(pendingPostedWithin);
  }

  function clearFilters() {
    setPendingServices(new Set());
    setPendingSuburb("");
    setPendingRadius("25km");
    setPendingUrgency("any");
    setPendingPostedWithin("any");
    setActiveServices(new Set());
    setActiveSuburb("");
    setActiveRadius("25km");
    setActiveUrgency("any");
    setActivePostedWithin("any");
  }

  function toggleService(svc: string) {
    setPendingServices((prev) => {
      const next = new Set(prev);
      if (next.has(svc)) next.delete(svc);
      else next.add(svc);
      return next;
    });
  }

  const hasActiveFilters =
    activeServices.size > 0 ||
    activeSuburb.trim() !== "" ||
    activeUrgency !== "any" ||
    activePostedWithin !== "any";

  return (
    <div className="flex min-h-0 gap-6">
      {/* ── Left sidebar ────────────────────────────────────────────────────── */}
      <aside
        className="hidden w-[280px] shrink-0 flex-col gap-5 rounded-xl border p-5 self-start md:flex"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          position: "sticky",
          top: "1rem",
        }}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal
            size={15}
            style={{ color: "var(--accent-color)" }}
          />
          <h2
            className="text-sm font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Filters
          </h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-xs font-semibold underline"
              style={{ color: "var(--accent-color)" }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Service type */}
        <div>
          <p
            className="mb-2 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Service type
          </p>
          <div className="flex flex-col gap-1.5">
            {SERVICE_TYPES.map((svc) => (
              <label
                key={svc}
                className="flex cursor-pointer items-center gap-2.5 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                <input
                  type="checkbox"
                  checked={pendingServices.has(svc)}
                  onChange={() => toggleService(svc)}
                  className="h-3.5 w-3.5 rounded accent-amber-500"
                />
                {svc}
              </label>
            ))}
          </div>
        </div>

        {/* Divider */}
        <hr style={{ borderColor: "var(--border)" }} />

        {/* Suburb input */}
        <div>
          <label
            className="mb-2 block text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Suburb / postcode
          </label>
          <input
            type="text"
            value={pendingSuburb}
            onChange={(e) => setPendingSuburb(e.target.value)}
            placeholder="Enter suburb or postcode"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{
              background: "var(--bg-primary)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Radius */}
        <div>
          <p
            className="mb-2 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Radius
          </p>
          <div className="flex gap-1.5">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setPendingRadius(r)}
                className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition"
                style={{
                  background:
                    pendingRadius === r
                      ? "var(--accent-color)"
                      : "var(--bg-primary)",
                  color:
                    pendingRadius === r ? "#fff" : "var(--text-secondary)",
                  border: "1px solid",
                  borderColor:
                    pendingRadius === r
                      ? "var(--accent-color)"
                      : "var(--border)",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Urgency */}
        <div>
          <p
            className="mb-2 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Urgency
          </p>
          <div className="flex flex-col gap-1.5">
            {URGENCY_OPTIONS.map(({ label, value }) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2.5 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                <input
                  type="radio"
                  name="urgency"
                  value={value}
                  checked={pendingUrgency === value}
                  onChange={() => setPendingUrgency(value)}
                  className="accent-amber-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Posted within */}
        <div>
          <p
            className="mb-2 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Posted within
          </p>
          <div className="flex flex-col gap-1.5">
            {POSTED_WITHIN_OPTIONS.map(({ label, value }) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2.5 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                <input
                  type="radio"
                  name="posted_within"
                  value={value}
                  checked={pendingPostedWithin === value}
                  onChange={() => setPendingPostedWithin(value)}
                  className="accent-amber-500"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Apply button */}
        <button
          type="button"
          onClick={applyFilters}
          className="w-full rounded-lg py-2.5 text-sm font-bold text-white"
          style={{ background: "var(--accent-color)" }}
        >
          Apply filters
        </button>
      </aside>

      {/* ── Right content ────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Top bar — alert button + AI score button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Showing{" "}
            <span
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {filtered.length}
            </span>{" "}
            of {allLeads.length} demo leads — live marketplace launches Q4 2026
          </p>
          <div className="flex flex-wrap shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={scoreAllLeads}
              disabled={isScoringAll || filtered.length === 0}
              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                borderColor: "rgb(139 92 246)",
                color: "rgb(167 139 250)",
              }}
            >
              {isScoringAll ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Bot size={14} />
              )}
              {isScoringAll ? "Scoring…" : "🤖 AI Score"}
            </button>
            <button
              type="button"
              onClick={() => setAlertModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-zinc-100 dark:hover:bg-white/5"
              style={{
                borderColor: "var(--accent-color)",
                color: "var(--accent-color)",
              }}
            >
              <Bell size={14} />
              Set up lead alerts
            </button>
          </div>
        </div>

        {/* Featured leads */}
        {featuredLeads.length > 0 && (
          <div>
            <h2
              className="mb-3 text-sm font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              High-value jobs near you
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {featuredLeads.map((lead) => {
                const colors = urgencyColor(lead.urgency);
                const price = leadPrice(lead.estimated_budget);
                return (
                  <div
                    key={`featured-${lead.id}`}
                    className="flex w-64 shrink-0 flex-col rounded-xl border"
                    style={{
                      background: "var(--bg-card)",
                      borderColor: "var(--accent-color)",
                      boxShadow: "0 0 0 1px rgb(245 158 11 / 0.2)",
                    }}
                  >
                    <div className="flex items-start gap-2 p-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          background:
                            "color-mix(in srgb, var(--accent-color) 14%, transparent)",
                          color: "var(--accent-color)",
                        }}
                      >
                        {serviceIcon(lead.service_type)}
                      </span>
                      <div className="min-w-0">
                        <p
                          className="text-xs font-bold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {lead.service_type ?? "General"}
                        </p>
                        <p
                          className="flex items-center gap-1 text-[10px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <MapPin size={9} />
                          {lead.suburb} {lead.postcode}
                        </p>
                      </div>
                      <span
                        className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.ring}`,
                        }}
                      >
                        {urgencyLabel(lead.urgency)}
                      </span>
                    </div>
                    <p
                      className="line-clamp-2 px-3 pb-1 text-[11px] leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {lead.description}
                    </p>
                    <div
                      className="mt-auto flex items-center justify-between border-t p-3"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <span
                        className="text-sm font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {formatBudget(lead.estimated_budget)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPanelLead(lead)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white"
                        style={{ background: "var(--accent-color)" }}
                      >
                        View &amp; Accept
                        <ChevronRight size={11} />
                      </button>
                    </div>
                    {/* Lead price badge */}
                    <div
                      className="rounded-b-xl px-3 py-1.5 text-center text-[10px] font-bold"
                      style={{
                        background: "rgb(245 158 11 / 0.1)",
                        color: "rgb(251 191 36)",
                        borderTop: "1px solid rgb(245 158 11 / 0.2)",
                      }}
                    >
                      Lead fee: ${price}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lead grid */}
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl border py-16 text-center"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            <p
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              No leads match your filters
            </p>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Try adjusting the service type or suburb.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm font-semibold underline"
              style={{ color: "var(--accent-color)" }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((lead) => {
              const colors = urgencyColor(lead.urgency);
              const price = leadPrice(lead.estimated_budget);
              return (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  colors={colors}
                  price={price}
                  aiScore={scores[lead.id] ?? null}
                  onView={() => setPanelLead(lead)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Side panel (slide in from right) ────────────────────────────────── */}
      {panelLead && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgb(0 0 0 / 0.5)" }}
            onClick={() => setPanelLead(null)}
          />
          <LeadDetailPanel lead={panelLead} onClose={() => setPanelLead(null)} />
        </>
      )}

      {/* ── Alert modal ─────────────────────────────────────────────────────── */}
      {alertModalOpen && (
        <LeadAlertModal onClose={() => setAlertModalOpen(false)} />
      )}
    </div>
  );
}

// ── Lead card ─────────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  colors,
  price,
  aiScore,
  onView,
}: {
  lead: MarketplaceLead;
  colors: { bg: string; text: string; ring: string };
  price: number;
  aiScore: AiScore | null;
  onView: () => void;
}) {
  return (
    <div
      className="flex flex-col rounded-xl border"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >
      {/* Card header */}
      <div className="flex items-start gap-3 p-4 pb-3">
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
            {aiScore && <AiScoreBadge aiScore={aiScore} />}
          </div>
          <div
            className="mt-0.5 flex items-center gap-1 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <MapPin size={10} />
            {lead.suburb ?? "Unknown suburb"}{" "}
            {lead.postcode ? lead.postcode : ""}
          </div>
        </div>
        {/* Lead fee badge */}
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            background: "rgb(245 158 11 / 0.12)",
            color: "rgb(251 191 36)",
            border: "1px solid rgb(245 158 11 / 0.25)",
          }}
        >
          ${price} fee
        </span>
      </div>

      {/* Description */}
      <p
        className="line-clamp-3 px-4 pb-3 text-sm leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {lead.description ?? "No description provided."}
      </p>

      {/* Footer */}
      <div
        className="mt-auto flex items-center justify-between border-t p-4 pt-3"
        style={{ borderColor: "var(--border)" }}
      >
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
          onClick={onView}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--accent-color)" }}
        >
          View &amp; Accept
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Lead detail panel ─────────────────────────────────────────────────────────

function LeadDetailPanel({
  lead,
  onClose,
}: {
  lead: MarketplaceLead;
  onClose: () => void;
}) {
  const colors = urgencyColor(lead.urgency);
  const price = leadPrice(lead.estimated_budget);
  const viewers = viewerCount(lead.id);
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [instantQuoting, setInstantQuoting] = useState(false);
  const [instantQuoteMsg, setInstantQuoteMsg] = useState<string | null>(null);

  const handleClaim = useCallback(async () => {
    setClaiming(true);
    try {
      const sb = createSupabaseBrowser();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      await sb.from("leads_accepted").upsert(
        { owner_id: user.id, lead_id: lead.id, status: "new" },
        { onConflict: "owner_id,lead_id" }
      );
      setClaimed(true);
      setTimeout(() => {
        onClose();
        router.push("/dashboard/leads/pipeline");
      }, 800);
    } catch {
      // ignore errors — lead is claimed optimistically
      setClaimed(true);
      setTimeout(() => {
        onClose();
        router.push("/dashboard/leads/pipeline");
      }, 800);
    } finally {
      setClaiming(false);
    }
  }, [lead.id, onClose, router]);

  const handleInstantQuote = useCallback(async () => {
    if (instantQuoting) return;
    setInstantQuoting(true);
    setInstantQuoteMsg(null);
    try {
      const res = await fetch("/api/leads/instant-quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          description: lead.description ?? "",
          service_type: lead.service_type ?? undefined,
          suburb: lead.suburb ?? undefined,
          estimated_budget: lead.estimated_budget ?? undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { quoteId?: string; title?: string; lineItemCount?: number; total?: number };
        const totalFmt = data.total ? ` · $${data.total.toLocaleString("en-AU")} total` : "";
        setInstantQuoteMsg(`Draft quote created${totalFmt}`);
        setTimeout(() => {
          onClose();
          router.push("/dashboard/owner/quotes");
        }, 1200);
      } else {
        setInstantQuoteMsg("Could not generate quote — try again");
      }
    } catch {
      setInstantQuoteMsg("Could not generate quote — try again");
    } finally {
      setInstantQuoting(false);
    }
  }, [instantQuoting, lead, onClose, router]);

  return (
    <div
      className="fixed right-0 top-0 z-50 flex h-full w-full flex-col overflow-y-auto bg-white dark:bg-[#1a2235] shadow-2xl md:w-96"
      style={{
        borderLeft: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-5 py-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              background:
                "color-mix(in srgb, var(--accent-color) 16%, transparent)",
              color: "var(--accent-color)",
            }}
          >
            {serviceIcon(lead.service_type)}
          </span>
          <div>
            <h2
              className="text-sm font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {lead.service_type ?? "General"}
            </h2>
            <p
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <MapPin size={10} />
              {lead.suburb} {lead.postcode}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-white/10"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
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
          <span
            className="flex items-center gap-1 text-[10px]"
            style={{ color: "var(--text-muted)" }}
          >
            <Clock size={10} />
            {relativeTime(lead.created_at)}
          </span>
          <span
            className="ml-auto flex items-center gap-1 text-[10px]"
            style={{ color: "var(--text-muted)" }}
          >
            <Eye size={10} />
            {viewers} tradies viewed
          </span>
        </div>

        {/* Full description */}
        <div>
          <p
            className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Job description
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {lead.description ?? "No description provided."}
          </p>
        </div>

        {/* Details grid */}
        <div
          className="grid grid-cols-2 gap-3 rounded-xl border bg-zinc-50 dark:bg-[#161d2e] p-4"
          style={{ borderColor: "var(--border)" }}
        >
          <PanelDetail label="Property type" value="Residential" />
          <PanelDetail label="Urgency" value={urgencyLabel(lead.urgency)} />
          <PanelDetail label="Contact preference" value="Via SERVLO platform" />
          <PanelDetail
            label="Estimated budget"
            value={formatBudget(lead.estimated_budget)}
            highlight
          />
        </div>

        {/* Estimated value */}
        <div
          className="flex items-center justify-between rounded-lg border px-4 py-3"
          style={{
            borderColor: "var(--accent-color)",
            background: "color-mix(in srgb, var(--accent-color) 6%, transparent)",
          }}
        >
          <div className="flex items-center gap-2">
            <DollarSign size={14} style={{ color: "var(--accent-color)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Lead fee
            </p>
          </div>
          <p
            className="text-xl font-bold"
            style={{ color: "var(--accent-color)" }}
          >
            ${price}
          </p>
        </div>

        {/* CTA */}
        <div className="mt-auto space-y-3">
          <button
            type="button"
            disabled={claiming || claimed}
            onClick={handleClaim}
            className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition disabled:opacity-70"
            style={{ background: claimed ? "#10B981" : "var(--accent-color)" }}
          >
            {claimed ? "✓ Lead claimed — redirecting…" : claiming ? "Claiming…" : `Accept this lead — $${price}`}
          </button>

          {/* Instant quote button */}
          <button
            type="button"
            disabled={instantQuoting || !!instantQuoteMsg?.startsWith("Draft")}
            onClick={handleInstantQuote}
            className="w-full rounded-xl border py-3 text-sm font-bold transition disabled:opacity-70 flex items-center justify-center gap-2"
            style={{
              borderColor: "rgb(139 92 246 / 0.5)",
              color: instantQuoteMsg?.startsWith("Draft") ? "rgb(34 197 94)" : "rgb(167 139 250)",
              background: instantQuoteMsg?.startsWith("Draft")
                ? "rgb(34 197 94 / 0.08)"
                : "rgb(139 92 246 / 0.08)",
            }}
          >
            {instantQuoting ? (
              <><Loader2 size={14} className="animate-spin" /> Generating quote…</>
            ) : instantQuoteMsg?.startsWith("Draft") ? (
              <>✓ {instantQuoteMsg}</>
            ) : (
              <>⚡ Instant Quote</>
            )}
          </button>

          {instantQuoteMsg && !instantQuoteMsg.startsWith("Draft") && (
            <p className="text-center text-xs" style={{ color: "rgb(248 113 113)" }}>
              {instantQuoteMsg}
            </p>
          )}

          <p
            className="text-center text-xs leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Claim this lead to add it to your pipeline and follow up directly.
          </p>
        </div>
      </div>
    </div>
  );
}

function PanelDetail({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p
        className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      <p
        className="text-sm font-semibold"
        style={{
          color: highlight ? "var(--accent-color)" : "var(--text-primary)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ── Lead alert modal ──────────────────────────────────────────────────────────

function LeadAlertModal({ onClose }: { onClose: () => void }) {
  const [suburb, setSuburb] = useState("");
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set()
  );
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleSvc(svc: string) {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      if (next.has(svc)) next.delete(svc);
      else next.add(svc);
      return next;
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from("lead_alert_preferences").upsert(
          {
            owner_id: user.id,
            suburb: suburb.trim() || null,
            service_types: [...selectedServices],
            updated_at: new Date().toISOString(),
          },
          { onConflict: "owner_id", ignoreDuplicates: false }
        );
      } catch {
        // Best-effort — table may not exist yet in dev
      }
      setSubmitted(true);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgb(0 0 0 / 0.7)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border bg-white dark:bg-[#1a2235] p-6 shadow-2xl"
        style={{
          borderColor: "var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-white/10"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{
              background:
                "color-mix(in srgb, var(--accent-color) 14%, transparent)",
            }}
          >
            <Bell size={16} style={{ color: "var(--accent-color)" }} />
          </span>
          <h2
            className="text-base font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Set up lead alerts
          </h2>
        </div>

        {submitted ? (
          <div className="py-6 text-center">
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--accent-color)" }}
            >
              You&apos;re all set!
            </p>
            <p
              className="mt-2 text-sm leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              We&apos;ll notify you when new leads matching your criteria become
              available in your area.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-lg px-6 py-2.5 text-sm font-bold text-white"
              style={{ background: "var(--accent-color)" }}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p
              className="text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Tell us where you work and what jobs you want — we&apos;ll alert
              you the moment a matching lead is posted.
            </p>

            {/* Suburb */}
            <div>
              <label
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Your suburb / postcode
              </label>
              <input
                type="text"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                placeholder="e.g. Bondi, 2026"
                className="w-full rounded-lg border bg-white dark:bg-[#161d2e] px-3 py-2 text-sm"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Service types */}
            <div>
              <p
                className="mb-1.5 text-xs font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Service types you offer
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {SERVICE_TYPES.map((svc) => (
                  <label
                    key={svc}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition"
                    style={{
                      borderColor: selectedServices.has(svc)
                        ? "var(--accent-color)"
                        : "var(--border)",
                      background: selectedServices.has(svc)
                        ? "color-mix(in srgb, var(--accent-color) 8%, transparent)"
                        : "rgb(249 250 251)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedServices.has(svc)}
                      onChange={() => toggleSvc(svc)}
                      className="h-3.5 w-3.5 accent-amber-500"
                    />
                    {svc}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "var(--accent-color)" }}
            >
              {isPending ? "Saving…" : "Save lead alerts"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
