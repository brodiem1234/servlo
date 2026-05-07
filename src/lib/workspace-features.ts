import type { IndustrySlug } from "@/lib/industries";
import { isIndustrySlug } from "@/lib/industries";
import { businessesOwnerOrEq } from "@/lib/businesses";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Canonical feature ids persisted in businesses.feature_flags.enabled */
export const WORKSPACE_FEATURE_IDS = [
  "jobs_scheduling",
  "appointments_scheduling",
  "client_management",
  "quotes",
  "invoices",
  "recurring_jobs",
  "employee_management",
  "gps_clock",
  "job_photos",
  "timesheets",
  "purchase_orders",
  "contractors",
  "crm_pipeline",
  "email_marketing",
  "client_portal",
  "equipment_hire",
  "project_tracking"
] as const;

export type WorkspaceFeatureId = (typeof WORKSPACE_FEATURE_IDS)[number];

export function isWorkspaceFeatureId(v: string): v is WorkspaceFeatureId {
  return (WORKSPACE_FEATURE_IDS as readonly string[]).includes(v);
}

export const FEATURE_LABELS: Record<WorkspaceFeatureId, string> = {
  jobs_scheduling: "Jobs & Scheduling",
  appointments_scheduling: "Appointments / Scheduling",
  client_management: "Client Management",
  quotes: "Quotes",
  invoices: "Invoices",
  recurring_jobs: "Recurring Jobs",
  employee_management: "Employee Management",
  gps_clock: "GPS Clock In/Out",
  job_photos: "Job Photos",
  timesheets: "Timesheets",
  purchase_orders: "Purchase Orders",
  contractors: "Contractors",
  crm_pipeline: "CRM Pipeline",
  email_marketing: "Email Marketing",
  client_portal: "Client Portal",
  equipment_hire: "Equipment / Hire Tracking",
  project_tracking: "Project Tracking"
};

/** Short helper text shown under feature names in Settings and onboarding. */
export const FEATURE_DESCRIPTIONS: Record<WorkspaceFeatureId, string> = {
  jobs_scheduling: "Job list, calendars, statuses and scheduling tools.",
  appointments_scheduling: "Book and manage timed appointments separately from field jobs.",
  client_management: "Client records, portals and segmentation.",
  quotes: "Create, send and track quotes.",
  invoices: "Raise invoices and track payments.",
  recurring_jobs: "Templates and repeats for cyclical work.",
  employee_management: "Team roster, roles and assignments.",
  gps_clock: "Mobile clock-in with location hints for your crew.",
  job_photos: "Attach before / after imagery to jobs.",
  timesheets: "Capture labour hours linked to jobs and staff.",
  purchase_orders: "Supplier POs tied to suppliers and optionally jobs.",
  contractors: "Subcontractor records and linkage to work.",
  crm_pipeline: "Simple pipeline tracking for prospects and wins.",
  email_marketing: "Newsletters or bulk email touchpoints.",
  client_portal: "Let approved clients review jobs and invoices online.",
  equipment_hire: "Track hires, hires-out and fleet-style assets.",
  project_tracking: "Higher-level milestones across multiple jobs."
};

const ALL_FEATURE_SET: ReadonlySet<WorkspaceFeatureId> = new Set(WORKSPACE_FEATURE_IDS);

const RECOMMENDED: Record<IndustrySlug, readonly WorkspaceFeatureId[]> = {
  trades: [
    "jobs_scheduling",
    "client_management",
    "quotes",
    "invoices",
    "employee_management",
    "gps_clock",
    "job_photos",
    "timesheets",
    "purchase_orders"
  ],
  cleaning: [
    "jobs_scheduling",
    "client_management",
    "recurring_jobs",
    "invoices",
    "employee_management",
    "timesheets",
    "client_portal"
  ],
  events: [
    "jobs_scheduling",
    "client_management",
    "quotes",
    "invoices",
    "contractors",
    "job_photos",
    "equipment_hire"
  ],
  marketing: ["client_management", "quotes", "invoices", "crm_pipeline", "project_tracking"],
  health: ["client_management", "appointments_scheduling", "invoices", "client_portal"],
  field_services: [
    "jobs_scheduling",
    "client_management",
    "quotes",
    "invoices",
    "gps_clock",
    "job_photos",
    "employee_management",
    "timesheets"
  ],
  other: ["jobs_scheduling", "client_management", "quotes", "invoices"]
};

const OPTIONAL: Record<IndustrySlug, readonly WorkspaceFeatureId[]> = {
  trades: ["contractors", "crm_pipeline", "email_marketing"],
  cleaning: ["gps_clock", "job_photos", "purchase_orders"],
  events: ["employee_management", "timesheets", "gps_clock"],
  marketing: ["employee_management", "timesheets", "job_photos"],
  health: ["employee_management", "quotes", "job_photos"],
  field_services: ["purchase_orders", "contractors", "client_portal"],
  other: WORKSPACE_FEATURE_IDS.filter((id) => !(RECOMMENDED.other as readonly WorkspaceFeatureId[]).includes(id))
};

export function primaryIndustrySlug(tags: IndustrySlug[]): IndustrySlug {
  const nonOther = tags.find((t) => t !== "other");
  return nonOther ?? tags[0] ?? "other";
}

export function recommendedFeaturesForIndustry(primary: IndustrySlug): WorkspaceFeatureId[] {
  return [...RECOMMENDED[primary]];
}

export function optionalFeaturesForIndustry(primary: IndustrySlug): WorkspaceFeatureId[] {
  return [...OPTIONAL[primary]];
}

/** Recommended-set membership for Settings badge */
export function isRecommendedFeatureForIndustry(feature: WorkspaceFeatureId, primary: IndustrySlug): boolean {
  return RECOMMENDED[primary].includes(feature);
}

/**
 * Signup / defaults: recommended always on + optional ids the user turned on.
 */
export function buildInitialEnabledFeatures(
  primary: IndustrySlug,
  optionalTurnedOn: ReadonlySet<WorkspaceFeatureId>
): WorkspaceFeatureId[] {
  const base = new Set<WorkspaceFeatureId>(RECOMMENDED[primary]);
  const pool = new Set(OPTIONAL[primary]);
  for (const id of optionalTurnedOn) {
    if (pool.has(id)) base.add(id);
  }
  return WORKSPACE_FEATURE_IDS.filter((id) => base.has(id));
}

export function parseFeatureFlagsColumn(raw: unknown): ReadonlySet<WorkspaceFeatureId> | null {
  if (raw == null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  const enabled = (raw as { enabled?: unknown }).enabled;
  if (!Array.isArray(enabled)) return null;
  const out = new Set<WorkspaceFeatureId>();
  for (const item of enabled) {
    if (typeof item === "string" && isWorkspaceFeatureId(item)) out.add(item);
  }
  return out;
}

export function serializeFeatureFlags(enabled: ReadonlySet<WorkspaceFeatureId>): { enabled: WorkspaceFeatureId[] } {
  return { enabled: WORKSPACE_FEATURE_IDS.filter((id) => enabled.has(id)) };
}

/**
 * Legacy rows: null stored flags → all features on.
 */
export function resolveEffectiveFeatures(
  stored: ReadonlySet<WorkspaceFeatureId> | null,
  _primary: IndustrySlug
): ReadonlySet<WorkspaceFeatureId> {
  void _primary;
  if (!stored) return ALL_FEATURE_SET;
  return stored;
}

export function schedulingEnabled(enabled: ReadonlySet<WorkspaceFeatureId>): boolean {
  return enabled.has("jobs_scheduling") || enabled.has("appointments_scheduling");
}

export function reportsBundleEnabled(enabled: ReadonlySet<WorkspaceFeatureId>): boolean {
  return enabled.has("crm_pipeline") || enabled.has("project_tracking") || enabled.has("equipment_hire");
}

/** Top 3 feature blurbs for welcome email */
export function welcomeHighlightLabels(primary: IndustrySlug): string[] {
  const ids = RECOMMENDED[primary].slice(0, 3);
  return ids.map((id) => FEATURE_LABELS[id]);
}

export async function loadWorkspaceFeatureSet(
  sb: SupabaseClient,
  ownerUserId: string,
  profileIndustryTags?: IndustrySlug[] | null
): Promise<ReadonlySet<WorkspaceFeatureId>> {
  const { data: row } = await sb
    .from("businesses")
    .select("feature_flags, industries")
    .or(businessesOwnerOrEq(ownerUserId))
    .maybeSingle();

  const parsed = parseFeatureFlagsColumn(row?.feature_flags ?? null);
  let primary: IndustrySlug = "other";
  const industries = row?.industries as unknown;
  if (Array.isArray(industries)) {
    const tags = industries.filter((x): x is IndustrySlug => typeof x === "string" && isIndustrySlug(x));
    if (tags.length) primary = primaryIndustrySlug(tags);
  } else if (profileIndustryTags?.length) {
    primary = primaryIndustrySlug(profileIndustryTags);
  }

  return resolveEffectiveFeatures(parsed, primary);
}
