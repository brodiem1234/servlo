/** Canonical industry keys saved on profiles & used on landing/signup */
export const INDUSTRY_SLUGS = [
  "trades",
  "cleaning",
  "events",
  "marketing",
  "health",
  "field_services",
  "other"
] as const;

export type IndustrySlug = (typeof INDUSTRY_SLUGS)[number];

export const isIndustrySlug = (v: string): v is IndustrySlug =>
  (INDUSTRY_SLUGS as readonly string[]).includes(v);

/** Landing page shows these six (no "Other") */
export const LANDING_INDUSTRY_ORDER = [
  "trades",
  "cleaning",
  "events",
  "marketing",
  "health",
  "field_services"
] as const satisfies readonly IndustrySlug[];

export type LandingIndustrySlug = (typeof LANDING_INDUSTRY_ORDER)[number];

export function parseIndustryTagsJson(raw: string | null | undefined): IndustrySlug[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: IndustrySlug[] = [];
    for (const item of parsed) {
      if (typeof item === "string" && isIndustrySlug(item) && !out.includes(item)) {
        out.push(item);
      }
    }
    return out;
  } catch {
    return [];
  }
}

/** Industries saved on auth metadata as a comma-separated slug list (signup user_metadata). */
export function industryTagsFromUserMeta(meta: Record<string, unknown>): IndustrySlug[] {
  const raw = String(meta.industry_tags ?? "");
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const out: IndustrySlug[] = [];
  for (const p of parts) {
    if (isIndustrySlug(p) && !out.includes(p)) out.push(p);
  }
  return out;
}

const INDUSTRY_LABELS: Record<IndustrySlug, string> = {
  trades: "Trades",
  cleaning: "Cleaning",
  events: "Events & hire",
  marketing: "Marketing & agencies",
  health: "Health & wellness",
  field_services: "Field services",
  other: "Other"
};

export function formatIndustryLabels(tags: IndustrySlug[] | null | undefined): string {
  if (!tags?.length) return "";
  return tags.map((s) => INDUSTRY_LABELS[s] ?? s).join(", ");
}

export function ownerWelcomeLine(tags: IndustrySlug[] | null | undefined): string | null {
  if (!tags?.length) return null;
  if (tags.length === 1) {
    return `You've told us you're in ${INDUSTRY_LABELS[tags[0]]} — here's your snapshot.`;
  }
  const listed = tags.map((s) => INDUSTRY_LABELS[s]).join(" and ");
  return `You've told us you work across ${listed} — here's your snapshot.`;
}

export type ChecklistItem = { href: string; label: string };

const BASE_CHECKLIST: ChecklistItem[] = [
  { href: "/dashboard/owner/clients", label: "Add your first client" },
  { href: "/dashboard/owner/jobs", label: "Create your first job" },
  { href: "/dashboard/owner/quotes", label: "Send your first quote" },
  { href: "/dashboard/owner/invoices", label: "Create your first invoice" },
  { href: "/dashboard/owner/settings", label: "Complete your business settings" }
];

const INDUSTRY_CHECKLIST_LEAD: Partial<Record<IndustrySlug, ChecklistItem[]>> = {
  trades: [
    { href: "/dashboard/owner/jobs", label: "Schedule your crew on the calendar" },
    { href: "/dashboard/owner/jobs", label: "Log job progress & photos on site" },
    { href: "/dashboard/owner/invoices", label: "Send an invoice the same day you finish" }
  ],
  cleaning: [
    { href: "/dashboard/owner/jobs", label: "Set up recurring cleans as repeating jobs" },
    { href: "/dashboard/owner/clients", label: "Add residential, commercial, or NDIS clients" },
    { href: "/dashboard/owner/invoices", label: "Turn completed visits into NDIS-ready invoices" }
  ],
  events: [
    { href: "/dashboard/owner/jobs", label: "Track bump-in, show day & bump-out as jobs" },
    { href: "/dashboard/owner/quotes", label: "Quote packages with AV & hire line items" },
    { href: "/dashboard/owner/clients", label: "Give coordinators one portal for approvals" }
  ],
  marketing: [
    { href: "/dashboard/owner/jobs", label: "Track retainers & milestones as jobs" },
    { href: "/dashboard/owner/invoices", label: "Invoice by phase or on approval" },
    { href: "/dashboard/owner/clients", label: "Keep every brand contact in one place" }
  ],
  health: [
    { href: "/dashboard/owner/jobs", label: "Block recurring appointments in your schedule" },
    { href: "/dashboard/owner/clients", label: "Store client notes & intake alongside bookings" },
    { href: "/dashboard/owner/invoices", label: "Bill sessions or packs without spreadsheets" }
  ],
  field_services: [
    { href: "/dashboard/owner/jobs", label: "Plan routes & inspections on one calendar" },
    { href: "/dashboard/owner/jobs", label: "Attach photo proof & compliance notes to jobs" },
    { href: "/dashboard/owner/quotes", label: "Quote treatments & follow-ups in minutes" }
  ],
  other: [
    { href: "/dashboard/owner/settings", label: "Tell us more about your business in settings" },
    { href: "/dashboard/owner/jobs", label: "Model your first workflow as a job" },
    { href: "/dashboard/owner/clients", label: "Import or add your key contacts" }
  ]
};

function dedupeItems(items: ChecklistItem[]): ChecklistItem[] {
  const seen = new Set<string>();
  const out: ChecklistItem[] = [];
  for (const item of items) {
    const k = `${item.href}::${item.label}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

/** Up to 5 items: industry-specific first, then generic without duplicates */
export function getGettingStartedChecklist(tags: IndustrySlug[] | null | undefined): ChecklistItem[] {
  const primary = tags?.find((t) => t !== "other") ?? tags?.[0];
  const lead = primary ? INDUSTRY_CHECKLIST_LEAD[primary] ?? [] : [];
  const merged = dedupeItems([...lead, ...BASE_CHECKLIST]);
  return merged.slice(0, 5);
}
