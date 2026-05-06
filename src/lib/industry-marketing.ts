import type { LandingIndustrySlug } from "./industries";

/** Landing page: tile subtitle + deep-dive section per industry */
export const LANDING_INDUSTRY_COPY: Record<
  LandingIndustrySlug,
  { tileHint: string; headline: string; tagline: string; bullets: [string, string, string] }
> = {
  trades: {
    tileHint: "Electricians, plumbers, builders, concreters, landscapers",
    headline: "Trades",
    tagline: "Schedule your crew, track jobs on site, send invoices same day.",
    bullets: [
      "Dispatch jobs with calendar views your techs actually open on-site.",
      "Photo log progress and materials so disputes disappear.",
      "Quote → job → invoice in one thread — GST-ready PDFs in seconds."
    ]
  },
  cleaning: {
    tileHint: "Residential, commercial, NDIS",
    headline: "Cleaning",
    tagline: "Recurring job scheduling, client portals, NDIS-ready invoicing.",
    bullets: [
      "Set repeating schedules without rebuilding spreadsheets each week.",
      "Residential & NDIS plans stored securely against each client.",
      "Portal links keep property managers in the loop on completed visits."
    ]
  },
  events: {
    tileHint: "Coordinators, AV, hire",
    headline: "Events",
    tagline: "Run sheets as jobs, track crews & gear, bill milestones cleanly.",
    bullets: [
      "Bump-in to bump-out as discrete jobs with crew assignments.",
      "Quotes bundle labour, AV, staging and hire stock.",
      "Deposit & balance invoices tied to each event milestone."
    ]
  },
  marketing: {
    tileHint: "Studios & agencies",
    headline: "Marketing & agencies",
    tagline: "Retainers, milestones and approvals — without another agency stack.",
    bullets: [
      "Turn scopes of work into quotes clients can approve digitally.",
      "Track creative phases as jobs with deadlines your team sees daily.",
      "Invoice retainers or deliverables without exporting hours elsewhere."
    ]
  },
  health: {
    tileHint: "Clinics, studios, mobile practitioners",
    headline: "Health & wellness",
    tagline: "Sessions, rosters and billing — built for appointment-heavy teams.",
    bullets: [
      "Book recurring sessions alongside one-off visits.",
      "Keep practitioner notes next to each booking.",
      "Invoice packs or single visits with professional PDFs."
    ]
  },
  field_services: {
    tileHint: "Pest control, inspections, maintenance",
    headline: "Field services",
    tagline: "Routes, inspections and proof-of-service in one workflow.",
    bullets: [
      "Schedule recurring inspections across suburbs without clashes.",
      "Attach compliance photos and checklist outcomes per visit.",
      "Follow-up quotes for treatments or repairs stay linked to the original job."
    ]
  }
};
