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
    return `You've told us you're in ${INDUSTRY_LABELS[tags[0]]}. Here's your snapshot.`;
  }
  const listed = tags.map((s) => INDUSTRY_LABELS[s]).join(" and ");
  return `You've told us you work across ${listed}. Here's your snapshot.`;
}

export type ChecklistItem = { href: string; label: string; optional?: boolean };

const CHECKLIST_BY_INDUSTRY: Record<IndustrySlug, ChecklistItem[]> = {
  trades: [
    { href: "/dashboard/owner/clients", label: "Add your first client" },
    { href: "/dashboard/owner/jobs", label: "Create your first job" },
    { href: "/dashboard/owner/employees", label: "Set up your crew" },
    { href: "/dashboard/owner/invoices", label: "Send your first invoice" }
  ],
  cleaning: [
    { href: "/dashboard/owner/clients", label: "Add your first client" },
    { href: "/dashboard/owner/jobs", label: "Set up a recurring job" },
    { href: "/dashboard/owner/employees", label: "Add your team" },
    { href: "/dashboard/owner/invoices", label: "Send your first invoice" }
  ],
  events: [
    { href: "/dashboard/owner/clients", label: "Add your first client" },
    { href: "/dashboard/owner/quotes", label: "Quote equipment & packages" },
    { href: "/dashboard/owner/jobs", label: "Schedule bump-in & show day jobs" },
    { href: "/dashboard/owner/invoices", label: "Send your first invoice" }
  ],
  marketing: [
    { href: "/dashboard/owner/clients", label: "Add your first client" },
    { href: "/dashboard/owner/quotes", label: "Create your first quote" },
    { href: "/dashboard/reports", label: "Set up your pipeline view" },
    { href: "/dashboard/owner/invoices", label: "Send your first invoice" }
  ],
  health: [
    { href: "/dashboard/owner/clients", label: "Add your first client" },
    { href: "/dashboard/schedule", label: "Book your appointment cadence" },
    { href: "/dashboard/owner/invoices", label: "Send your first invoice" },
    { href: "/dashboard/owner/clients", label: "Share the client portal" }
  ],
  field_services: [
    { href: "/dashboard/owner/clients", label: "Add your first client" },
    { href: "/dashboard/owner/jobs", label: "Schedule your first visit" },
    { href: "/dashboard/owner/quotes", label: "Quote inspections & treatments" },
    { href: "/dashboard/owner/invoices", label: "Send your first invoice" }
  ],
  other: [
    { href: "/dashboard/owner/clients", label: "Add your first client" },
    { href: "/dashboard/owner/jobs", label: "Create your first job" },
    { href: "/dashboard/owner/quotes", label: "Send your first quote" },
    { href: "/dashboard/owner/invoices", label: "Send your first invoice" }
  ]
};

/** Personalised Getting Started steps by primary industry */
export function getGettingStartedChecklist(tags: IndustrySlug[] | null | undefined): ChecklistItem[] {
  const primary = tags?.find((t) => t !== "other") ?? tags?.[0] ?? "other";
  return CHECKLIST_BY_INDUSTRY[primary] ?? CHECKLIST_BY_INDUSTRY.other;
}
