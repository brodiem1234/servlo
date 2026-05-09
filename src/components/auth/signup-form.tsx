"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent, KeyboardEvent, MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { authUrl } from "@/lib/auth/site-origin";
import { immediateOwnerUpsert } from "@/app/auth/signup/owner-signup-action";
import { lookupABN, type AbnLookupResult } from "@/app/auth/signup/lookup-abn";
import {
  allPasswordRequirementsMet,
  normalizePasswordStrength,
  abnDigitsFromInput,
  formatAbnDigits,
  validateAbnChecksum,
  type PasswordRequirementState,
  type PasswordRuleKey
} from "@/lib/auth/signup-field-validation";
import {
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import { EnterpriseModal } from "@/components/marketing/enterprise-modal";
import { Button } from "@/components/ui/button";
import type { IndustrySlug } from "@/lib/industries";
import { formatIndustryLabels } from "@/lib/industries";
import { ThemeToggleCorner } from "@/components/theme-toggle-corner";
import { DEFAULT_ACCENT_HEX } from "@/lib/brand-accent";
import { WorkspaceSetupPreview } from "@/components/auth/workspace-setup-preview";
import {
  buildInitialEnabledFeatures,
  optionalFeaturesForIndustry,
  primaryIndustrySlug,
  recommendedFeaturesForIndustry
} from "@/lib/workspace-features";
import type { Stripe, StripeCardElement } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// ── Stripe (loaded once, outside component) ─────────────────────────────────

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

function getPriceId(tier: string): string | null {
  const ids: Record<string, string> = {
    solo:     "price_1TTiL8K1tzStyRcJQAfbuJ5n",
    team:     "price_1TTiLaK1tzStyRcJNOgCeg0X",
    business: "price_1TTiLyK1tzStyRcJ4BVJz0o8",
  };
  return ids[tier] ?? null;
}

// ── Phone helpers (AU-only, E.164) ──────────────────────────────────────────

function formatAUPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  // Strip leading 0 if present
  const local = digits.startsWith("0") ? digits.slice(1) : digits;
  const d = local.slice(0, 9); // Max 9 local digits
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

function phoneLocalDigits(value: string): string {
  return value.replace(/\D/g, "").replace(/^0/, "");
}

function isPhoneValid(value: string): boolean {
  return phoneLocalDigits(value).length >= 9;
}

function isValidAustralianPhone(phone: string): boolean {
  const stripped = phone.replace(/[\s\-\(\)]/g, '');
  return /^(04\d{8}|\+614\d{8}|0[2-9]\d{8}|\+61[2-9]\d{8})$/.test(stripped);
}

// ── Industry chips ───────────────────────────────────────────────────────────

type IndustryChip = {
  id: string;
  label: string;
  category: string;
  slug: IndustrySlug;
};

const INDUSTRY_CHIPS: IndustryChip[] = [
  // Trades
  { id: "electrician",  label: "Electrician",       category: "Trades",                slug: "trades"         },
  { id: "plumber",      label: "Plumber",            category: "Trades",                slug: "trades"         },
  { id: "builder",      label: "Builder",            category: "Trades",                slug: "trades"         },
  { id: "carpenter",    label: "Carpenter",          category: "Trades",                slug: "trades"         },
  { id: "concreter",    label: "Concreter",          category: "Trades",                slug: "trades"         },
  { id: "painter",      label: "Painter",            category: "Trades",                slug: "trades"         },
  { id: "tiler",        label: "Tiler",              category: "Trades",                slug: "trades"         },
  { id: "roofer",       label: "Roofer",             category: "Trades",                slug: "trades"         },
  { id: "hvac",         label: "HVAC",               category: "Trades",                slug: "trades"         },
  { id: "gas-fitter",   label: "Gas Fitter",         category: "Trades",                slug: "trades"         },
  { id: "welder",       label: "Welder",             category: "Trades",                slug: "trades"         },
  { id: "fabricator",   label: "Fabricator",         category: "Trades",                slug: "trades"         },
  // Cleaning
  { id: "residential-cleaning",  label: "Residential Cleaning",  category: "Cleaning",        slug: "cleaning"       },
  { id: "commercial-cleaning",   label: "Commercial Cleaning",   category: "Cleaning",        slug: "cleaning"       },
  { id: "ndis-cleaning",         label: "NDIS Cleaning",         category: "Cleaning",        slug: "cleaning"       },
  { id: "end-of-lease",          label: "End of Lease",          category: "Cleaning",        slug: "cleaning"       },
  { id: "industrial-cleaning",   label: "Industrial Cleaning",   category: "Cleaning",        slug: "cleaning"       },
  // Field Services
  { id: "pest-control",  label: "Pest Control",  category: "Field Services", slug: "field_services" },
  { id: "security",      label: "Security",      category: "Field Services", slug: "field_services" },
  { id: "inspections",   label: "Inspections",   category: "Field Services", slug: "field_services" },
  { id: "maintenance",   label: "Maintenance",   category: "Field Services", slug: "field_services" },
  { id: "locksmith",     label: "Locksmith",     category: "Field Services", slug: "field_services" },
  // Landscaping
  { id: "garden",        label: "Garden",        category: "Landscaping", slug: "trades" },
  { id: "irrigation",    label: "Irrigation",    category: "Landscaping", slug: "trades" },
  { id: "tree-services", label: "Tree Services", category: "Landscaping", slug: "trades" },
  { id: "pool-spa",      label: "Pool & Spa",    category: "Landscaping", slug: "trades" },
  // Health & Wellness
  { id: "physio",           label: "Physio",           category: "Health & Wellness", slug: "health" },
  { id: "chiropractic",     label: "Chiropractic",     category: "Health & Wellness", slug: "health" },
  { id: "massage",          label: "Massage",          category: "Health & Wellness", slug: "health" },
  { id: "nutrition",        label: "Nutrition",        category: "Health & Wellness", slug: "health" },
  { id: "personal-training",label: "Personal Training",category: "Health & Wellness", slug: "health" },
  // Events & Hire
  { id: "av",                label: "AV",                category: "Events & Hire", slug: "events" },
  { id: "equipment-hire",    label: "Equipment Hire",    category: "Events & Hire", slug: "events" },
  { id: "catering",          label: "Catering",          category: "Events & Hire", slug: "events" },
  { id: "photography",       label: "Photography",       category: "Events & Hire", slug: "events" },
  { id: "event-coordination",label: "Event Coordination",category: "Events & Hire", slug: "events" },
  // Transport & Logistics
  { id: "courier",   label: "Courier",   category: "Transport & Logistics", slug: "field_services" },
  { id: "removals",  label: "Removals",  category: "Transport & Logistics", slug: "field_services" },
  { id: "freight",   label: "Freight",   category: "Transport & Logistics", slug: "field_services" },
  // Beauty & Personal Care
  { id: "hair",   label: "Hair",   category: "Beauty & Personal Care", slug: "other" },
  { id: "skin",   label: "Skin",   category: "Beauty & Personal Care", slug: "other" },
  { id: "nails",  label: "Nails",  category: "Beauty & Personal Care", slug: "other" },
  { id: "barber", label: "Barber", category: "Beauty & Personal Care", slug: "other" },
  // Professional Services
  { id: "consulting",        label: "Consulting",        category: "Professional Services", slug: "marketing" },
  { id: "it-support",        label: "IT Support",        category: "Professional Services", slug: "marketing" },
  { id: "marketing-agency",  label: "Marketing Agency",  category: "Professional Services", slug: "marketing" },
  { id: "accounting",        label: "Accounting",        category: "Professional Services", slug: "marketing" },
  // Home Services
  { id: "home-cleaning",     label: "Home Cleaning",     category: "Home Services", slug: "cleaning" },
  { id: "gardening",         label: "Gardening",         category: "Home Services", slug: "trades"   },
  { id: "handyman",          label: "Handyman",          category: "Home Services", slug: "trades"   },
  { id: "appliance-repair",  label: "Appliance Repair",  category: "Home Services", slug: "field_services" },
  // Education
  { id: "tutoring",       label: "Tutoring",        category: "Education", slug: "other" },
  { id: "music-lessons",  label: "Music Lessons",   category: "Education", slug: "other" },
  { id: "coaching",       label: "Coaching",        category: "Education", slug: "other" },
  // Other — special: triggers custom text input
  { id: "other", label: "Other", category: "Other", slug: "other" },
];

// ── Product selection data ───────────────────────────────────────────────────

type IndividualProduct = {
  id: string;
  name: string;
  color: string;
  nameColor: string;
  gradient: string;
  glow: string;
  desc: string;
  price: string;
  badge: string;
  available: boolean;
};

type BundlePair = {
  id: string;
  name: string;
  colors: [string, string];
  gradient: string;
  subtitle: string;
  price: string;
  savings: string;
  comingSoon: boolean;
};

const INDIVIDUAL_PRODUCTS: IndividualProduct[] = [
  {
    id: "core", name: "SERVLO Core", color: "#3B82F6",
    nameColor: "#93C5FD",
    gradient: "linear-gradient(135deg, #0d1b36 0%, #1a3a6b 100%)",
    glow: "rgba(59,130,246,0.2)",
    desc: "Job management, invoicing, scheduling",
    price: "From $39/mo", badge: "Available now", available: true,
  },
  {
    id: "grow", name: "SERVLO Grow", color: "#8B5CF6",
    nameColor: "#C4B5FD",
    gradient: "linear-gradient(135deg, #120a2e 0%, #2d1b69 100%)",
    glow: "rgba(139,92,246,0.2)",
    desc: "AI ads, reviews and social content",
    price: "From $59/mo", badge: "Coming Q3 2026", available: false,
  },
  {
    id: "leads", name: "SERVLO Leads", color: "#F59E0B",
    nameColor: "#FCD34D",
    gradient: "linear-gradient(135deg, #1f1200 0%, #3d2000 100%)",
    glow: "rgba(245,158,11,0.2)",
    desc: "Verified job leads marketplace",
    price: "From $12/lead", badge: "Coming Q4 2026", available: false,
  },
];

const BUNDLE_PAIRS: BundlePair[] = [
  {
    id: "core+grow", name: "Core + Grow", colors: ["#3B82F6", "#8B5CF6"],
    gradient: "linear-gradient(135deg, #0d1b36 0%, #2d1b69 100%)",
    subtitle: "Essential Bundle", price: "$149/mo", savings: "Save $29/mo", comingSoon: false,
  },
  {
    id: "core+leads", name: "Core + Leads", colors: ["#3B82F6", "#F59E0B"],
    gradient: "linear-gradient(135deg, #0d1b36 0%, #3d2000 100%)",
    subtitle: "Starter Bundle", price: "$99/mo", savings: "Save $12/mo", comingSoon: false,
  },
  {
    id: "grow+leads", name: "Grow + Leads", colors: ["#8B5CF6", "#F59E0B"],
    gradient: "linear-gradient(135deg, #120a2e 0%, #3d2000 100%)",
    subtitle: "Growth Bundle", price: "$199/mo", savings: "Coming 2026", comingSoon: true,
  },
];

const FULL_PLATFORM = {
  id: "core+grow+leads",
  name: "SERVLO Full Platform",
  subtitle: "Everything included. All products. One login.",
  price: "$249/mo",
  badge: "⭐ Best Value — Save $58/mo",
  features: [
    "Jobs, scheduling, invoicing & client management",
    "Team management, timesheets & GPS clock-in",
    "AI-powered ads and social content generation",
    "Google review automation and referral tracking",
    "Verified job leads matched to your trade",
    "30-day free trial — no charge until it ends",
  ],
};

// ── Plan tier options ───────────────────────────────────────────────────────

type PlanTier = {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
};

const GROW_TIERS: PlanTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$59",
    description: "Get started with marketing",
    features: ["1 business", "AI ad creation", "5 campaigns/mo"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$119",
    description: "Scale your reach",
    features: ["Up to 3 businesses", "Unlimited campaigns", "Google review automation"],
    recommended: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: "$299",
    description: "Manage all your clients",
    features: ["Unlimited businesses", "White-label reports", "Priority support"],
  },
];

const LEADS_TIERS: PlanTier[] = [
  {
    id: "payg",
    name: "Pay-as-you-go",
    price: "$12/lead",
    description: "Pay only for leads you accept",
    features: ["No subscription required", "Verified trade leads", "Accept or decline each lead"],
  },
  {
    id: "verified",
    name: "Verified",
    price: "$39/mo",
    description: "Regular verified leads included",
    features: ["5 leads/month included", "Lead alerts via SMS & email", "Priority placement"],
    recommended: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$89/mo",
    description: "Maximum lead volume",
    features: ["15 leads/month included", "Exclusive territory options", "Dedicated account support"],
  },
];

function tiersForCombo(combo: string): PlanTier[] {
  if (combo === "leads") return LEADS_TIERS;
  if (combo === "grow") return GROW_TIERS;

  const priceMap: Record<string, [number, number, number, number]> = {
    "core":             [39,  89, 179, 0],
    "core+grow":        [99, 149, 249, 0],
    "core+leads":       [79, 129, 219, 0],
    "grow+leads":       [149, 199, 299, 0],
    "core+grow+leads":  [199, 249, 349, 0],
  };
  const [p0, p1, p2] = priceMap[combo] ?? [39, 89, 179];
  return [
    {
      id: "solo",
      name: "Solo",
      price: `$${p0}`,
      description: "Perfect for sole traders",
      features: ["1 user", "Unlimited jobs", "50 AI generations/mo"],
    },
    {
      id: "team",
      name: "Team",
      price: `$${p1}`,
      description: "For growing businesses",
      features: ["Unlimited team members", "Team timesheets & scheduling", "200 AI generations/mo"],
      recommended: true,
    },
    {
      id: "business",
      name: "Business",
      price: `$${p2}`,
      description: "Scaling operations",
      features: ["Unlimited users", "Xero & MYOB integration", "500 AI generations/mo"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      description: "Custom solutions",
      features: ["Custom integrations", "White-glove onboarding", "SLA guarantee"],
    },
  ];
}

function comboLabel(combo: string): string {
  const names: Record<string, string> = {
    "core":            "SERVLO Core",
    "grow":            "SERVLO Grow",
    "leads":           "SERVLO Leads",
    "core+grow":       "Core + Grow — Essential Bundle",
    "core+leads":      "Core + Leads — Starter Bundle",
    "grow+leads":      "Grow + Leads — Growth Bundle",
    "core+grow+leads": "SERVLO Full Platform",
  };
  return names[combo] ?? combo;
}

// ── SVG icons ───────────────────────────────────────────────────────────────

function GoogleLogoSmall() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MicrosoftLogoSmall() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 21 21" aria-hidden>
      <rect x="1"  y="1"  width="9" height="9" fill="#F25022" />
      <rect x="11" y="1"  width="9" height="9" fill="#7FBA00" />
      <rect x="1"  y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

// ── Password hints ──────────────────────────────────────────────────────────

function passwordHintLabel(rule: PasswordRuleKey): string {
  switch (rule) {
    case "length":    return "Minimum 8 characters";
    case "upper":     return "At least one uppercase letter";
    case "number":    return "At least one number";
    case "noPersonal":return "Cannot contain your first name, last name, or email address";
    default:          return "";
  }
}

function PasswordStrengthHints({ rules }: { rules: PasswordRequirementState }) {
  const order: PasswordRuleKey[] = ["length", "noPersonal", "upper", "number"];
  return (
    <ul className="mt-2 space-y-1 text-[11px] leading-snug" aria-live="polite">
      {order.map((key) => {
        const ok = rules[key];
        return (
          <li key={key} className={`flex items-center gap-2 ${ok ? "text-emerald-400" : "text-slate-500"}`}>
            <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${ok ? "bg-emerald-600/20" : "bg-slate-700/40"}`}>
              {ok ? <Check className="h-2.5 w-2.5 text-emerald-400" strokeWidth={3} aria-hidden /> : null}
            </span>
            <span>{passwordHintLabel(key)}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function SignupForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Step 1=credentials, 2=industries, 3=products, 4=plan tier, 5=workspace, 6=trial
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Credential fields
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [businessNameInput, setBusinessNameInput] = useState("");

  // ABN
  const [abnInput, setAbnInput] = useState("");
  const [abnConfirmed, setAbnConfirmed] = useState(false);
  const [abnLookup, setAbnLookup] = useState<AbnLookupResult | null>(null);
  const [abnLookupLoading, setAbnLookupLoading] = useState(false);
  const [entityName, setEntityName] = useState<string>("");

  // Phone (AU-only)
  const [phoneInput, setPhoneInput] = useState("");

  // Industry selection — chip-based
  const [selectedChipIds, setSelectedChipIds] = useState<Set<string>>(new Set());
  const [industrySearch, setIndustrySearch] = useState("");
  const [otherNote, setOtherNote] = useState("");

  // Derived: slugs from selected chips
  const selected = useMemo((): IndustrySlug[] => {
    const slugSet = new Set<IndustrySlug>();
    for (const chipId of selectedChipIds) {
      const chip = INDUSTRY_CHIPS.find((c) => c.id === chipId);
      if (chip) slugSet.add(chip.slug);
    }
    return [...slugSet];
  }, [selectedChipIds]);

  // Product + plan
  const [selectedProductCombo, setSelectedProductCombo] = useState("core");
  const [selectedPlanTier, setSelectedPlanTier] = useState("solo");

  // Feature toggles (step 5)
  const [optionalFeatureOn, setOptionalFeatureOn] = useState<Record<string, boolean>>({});

  // Stripe refs
  const stripeRef = useRef<Stripe | null>(null);
  const cardElementRef = useRef<StripeCardElement | null>(null);
  const cardMountRef = useRef<HTMLDivElement>(null);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [ownerSubmitting, setOwnerSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "microsoft" | null>(null);
  const [productTooltip, setProductTooltip] = useState<string | null>(null);
  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);

  const onGoogleSignUp = useCallback(async () => {
    setOauthLoading("google");
    setError(null);
    try {
      const supabase = createSupabaseBrowser();
      const { error: e } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (e) { setError(e.message || "Unable to connect to Google."); setOauthLoading(null); }
      // On success the browser redirects — don't reset loading state
    } catch (e) { setError(e instanceof Error ? e.message : "Google sign-up failed."); setOauthLoading(null); }
  }, []);

  const onMicrosoftSignUp = useCallback(async () => {
    setOauthLoading("microsoft");
    setError(null);
    try {
      const supabase = createSupabaseBrowser();
      const { error: e } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: { scopes: "email", redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (e) { setError(e.message || "Unable to connect to Microsoft."); setOauthLoading(null); }
    } catch (e) { setError(e instanceof Error ? e.message : "Microsoft sign-up failed."); setOauthLoading(null); }
  }, []);

  const passwordRules = useMemo(
    () => normalizePasswordStrength(passwordInput, nameInput, emailInput),
    [passwordInput, nameInput, emailInput]
  );

  const abnDigits = abnDigitsFromInput(abnInput);
  const abnHas11  = abnDigits.length === 11;
  const abnValid  = abnHas11 && validateAbnChecksum(abnInput);

  const needsOtherNote = selectedChipIds.has("other");
  const industriesJson = useMemo(() => JSON.stringify(selected), [selected]);
  const signupPrimaryIndustry = useMemo(
    () => primaryIndustrySlug(selected.length ? selected : ["other"]),
    [selected]
  );
  const signupRecommendedIds = useMemo(() => recommendedFeaturesForIndustry(signupPrimaryIndustry), [signupPrimaryIndustry]);
  const signupOptionalIds    = useMemo(() => optionalFeaturesForIndustry(signupPrimaryIndustry), [signupPrimaryIndustry]);
  const signupIndustryHeadline = formatIndustryLabels([signupPrimaryIndustry]) || "SERVLO";

  const filteredChips = useMemo(() => {
    const q = industrySearch.trim().toLowerCase();
    if (!q) return INDUSTRY_CHIPS;
    return INDUSTRY_CHIPS.filter(
      (c) => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );
  }, [industrySearch]);

  function toggleChip(id: string) {
    setSelectedChipIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    if (!selectedChipIds.has("other")) setOtherNote("");
  }, [selectedChipIds]);

  useEffect(() => {
    setAbnConfirmed(false);
    setAbnLookup(null);
    setAbnLookupLoading(false);
    setEntityName("");
    if (fieldErrors.abn) clearFieldError("abn");
  }, [abnInput]); // eslint-disable-line react-hooks/exhaustive-deps

  // ABN lookup — fires whenever abnDigits changes and the checksum is valid
  useEffect(() => {
    if (!abnValid) return;
    let cancelled = false;
    setAbnLookupLoading(true);
    setAbnLookup(null);
    setEntityName("");
    lookupABN(abnDigits).then((result) => {
      if (cancelled) return;
      setAbnLookup(result);
      setAbnLookupLoading(false);
      if (result.status === "active" || result.status === "inactive") {
        setEntityName(result.entityName);
      }
    }).catch(() => {
      if (cancelled) return;
      setAbnLookup({ status: "error", message: "Lookup failed" });
      setAbnLookupLoading(false);
    });
    return () => { cancelled = true; };
  }, [abnDigits, abnValid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mount Stripe card element when reaching step 6 (for Core-containing products)
  useEffect(() => {
    if (step !== 6) return;
    const hasCore = selectedProductCombo === "core" || selectedProductCombo.startsWith("core+");
    const priceId = getPriceId(selectedPlanTier);
    if (!hasCore || !priceId) return;

    let mounted = true;
    stripePromise.then((stripeInstance) => {
      if (!stripeInstance || !cardMountRef.current || !mounted) return;
      if (cardElementRef.current) {
        cardElementRef.current.destroy();
        cardElementRef.current = null;
      }
      const elements = stripeInstance.elements();
      const card = elements.create("card", {
        style: {
          base: {
            color: "#e2e8f0",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "14px",
            "::placeholder": { color: "#64748b" },
          },
          invalid: { color: "#ef4444" },
        },
      });
      card.mount(cardMountRef.current);
      stripeRef.current = stripeInstance;
      cardElementRef.current = card;
    });

    return () => {
      mounted = false;
      cardElementRef.current?.destroy();
      cardElementRef.current = null;
    };
    // Re-mount if product/tier changes while on step 6
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedProductCombo, selectedPlanTier]);

  // ── Keyboard / input helpers ─────────────────────────────────────────────

  function blockAbnKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" || e.key === "Tab" || e.key === "Delete" || e.key.startsWith("Arrow")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^\d$/.test(e.key)) return;
    e.preventDefault();
  }

  function blockPhoneKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" || e.key === "Tab" || e.key === "Delete" || e.key.startsWith("Arrow")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^\d$/.test(e.key)) return;
    e.preventDefault();
  }

  // ── Validation ───────────────────────────────────────────────────────────

  function setFieldError(field: string, msg: string) {
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));
  }

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validateBusinessNameField(value: string): string | null {
    if (!value.trim()) return "Business name is required.";
    if (value.trim().length < 2) return "Business name must be at least 2 characters.";
    if (value.length > 100) return "Business name must be under 100 characters.";
    return null;
  }

  function handleBusinessNameBlur() {
    const err = validateBusinessNameField(businessNameInput);
    if (err) setFieldError("businessName", err);
    else clearFieldError("businessName");
  }

  function handlePhoneBlur() {
    if (!phoneInput.trim()) {
      setFieldError("phone", "Phone number is required.");
      return;
    }
    // Build testable E.164-equivalent strings from the local input
    const localDigits = phoneLocalDigits(phoneInput);
    const withZero = `0${localDigits}`;
    const e164 = `+61${localDigits}`;
    if (!isValidAustralianPhone(withZero) && !isValidAustralianPhone(e164)) {
      setFieldError("phone", "Please enter a valid Australian phone number (e.g. 04xx xxx xxx)");
    } else {
      clearFieldError("phone");
    }
  }

  function handleNameBlur() {
    if (!nameInput.trim()) setFieldError("name", "Full name is required.");
    else clearFieldError("name");
  }

  function handleEmailBlur() {
    if (!emailInput.trim()) setFieldError("email", "Email is required.");
    else clearFieldError("email");
  }

  function validateStep1(): string | null {
    if (!nameInput.trim()) return "Full name is required.";
    if (!emailInput.trim()) return "Email is required.";
    if (!businessNameInput.trim()) return "Business name is required.";
    const bizErr = validateBusinessNameField(businessNameInput);
    if (bizErr) return bizErr;
    if (!allPasswordRequirementsMet(passwordRules)) return "Please meet every password requirement before continuing.";
    if (!isPhoneValid(phoneInput)) return "Enter a valid Australian phone number (9 digits).";
    if (!abnHas11) return "ABN must be 11 digits.";
    if (!abnValid) return "Invalid ABN — please re-enter your 11-digit ABN.";
    if (!abnConfirmed) return "Please confirm your ABN before continuing.";
    return null;
  }

  // ── Step navigation ──────────────────────────────────────────────────────

  function handleContinue(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    // Run all field validations and collect errors
    const newErrors: { [key: string]: string } = {};
    if (!nameInput.trim()) newErrors.name = "Full name is required.";
    if (!emailInput.trim()) newErrors.email = "Email is required.";
    const bizErr = validateBusinessNameField(businessNameInput);
    if (bizErr) newErrors.businessName = bizErr;
    if (!isPhoneValid(phoneInput)) newErrors.phone = "Please enter a valid Australian phone number (e.g. 04xx xxx xxx)";
    setFieldErrors(newErrors);
    const gate = validateStep1();
    if (gate) { setError(gate); return; }
    setError(null);
    setStep(2);
  }

  function handleContinueFromIndustries(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setStep(3);
  }

  function handleContinueFromProducts(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    // Reset plan tier to sensible default for the selected product
    const tiers = tiersForCombo(selectedProductCombo);
    setSelectedPlanTier(tiers[0].id);
    setStep(4);
  }

  function handleContinueFromPlanTier(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const nextOptional = Object.fromEntries(signupOptionalIds.map((id) => [id, false]));
    setOptionalFeatureOn(nextOptional);
    setStep(5);
  }

  function handleContinueFromWorkspacePreview(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setStep(6);
  }

  function handleBack(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setError(null);
    setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4 | 5 | 6);
  }

  // ── Core signup logic ────────────────────────────────────────────────────

  async function doSignup() {
    if (step !== 6) return;
    setError(null);

    const gate = validateStep1();
    if (gate) { setError(gate); return; }

    setOwnerSubmitting(true);

    try {
      // E.164 phone — AU only
      const phoneDigits = phoneInput.replace(/\s/g, "");
      const phoneLocal  = phoneDigits.startsWith("0") ? phoneDigits.slice(1) : phoneDigits;
      const phoneE164   = `+61${phoneLocal}`;

      const abnRaw = abnDigitsFromInput(abnInput);

      const supabase = createSupabaseBrowser();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailInput.trim(),
        password: passwordInput,
        options: {
          data: {
            name: nameInput.trim(),
            business_name: businessNameInput.trim(),
            abn: abnRaw,
            phone_number: phoneE164,
            role: "owner",
            industry_tags: selected.join(","),
            industry_other_note: otherNote || "",
            accent_colour: DEFAULT_ACCENT_HEX,
            selected_products: selectedProductCombo,
            plan_tier: selectedPlanTier,
          }
        }
      });

      if (authError) {
        console.error("[signup/owner] signUp failed", authError);
        const lower = authError.message.toLowerCase();
        if (lower.includes("user already registered") || lower.includes("email already") || lower.includes("already registered")) {
          setError("An account with this email already exists. Try signing in instead.");
        } else {
          setError(authError.message);
        }
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setError(
          "Account signup did not return a user id. If email confirmation is required, check your inbox — otherwise contact support."
        );
        return;
      }

      const accessToken = authData.session?.access_token;
      if (!accessToken) {
        setError("Account created. Confirm your email if required, then sign in to finish setup.");
        return;
      }

      // Immediately upsert profiles + businesses using service-role so data is
      // persisted even if /api/setup-business fails or times out.
      try {
        await immediateOwnerUpsert({
          userId,
          fullName: nameInput.trim(),
          email: emailInput.trim(),
          phone: phoneE164,
          businessName: businessNameInput.trim(),
          abn: abnRaw,
          entityName: entityName || null,
          selectedIndustries: selected,
          selectedPlan: selectedPlanTier,
          selectedProducts: selectedProductCombo,
        });
      } catch (upsertErr) {
        // Non-fatal — /api/setup-business will also upsert as a second pass
        console.error("[signup/owner] immediateOwnerUpsert threw (non-fatal)", upsertErr);
      }

      const optionalChosen = new Set(
        signupOptionalIds.filter((id) => Boolean(optionalFeatureOn[id]))
      );
      const workspaceFeaturesEnabled = buildInitialEnabledFeatures(signupPrimaryIndustry, optionalChosen);

      const setupBody = {
        userId,
        fullName: nameInput.trim(),
        businessName: businessNameInput.trim(),
        abn: abnRaw,
        phone: phoneE164,
        industries: selected,
        workspaceFeaturesEnabled,
        accentColour: DEFAULT_ACCENT_HEX,
        selectedPlan: selectedPlanTier,
        selectedProducts: selectedProductCombo,
        entityName: entityName || undefined,
      };

      let res = await fetch("/api/setup-business", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(setupBody)
      });
      let raw = await res.text();
      let parsed: { success?: boolean; businessId?: string; demoSeeded?: boolean; demoSeedError?: string; error?: string };
      try {
        parsed = JSON.parse(raw) as typeof parsed;
      } catch {
        parsed = { error: raw.slice(0, 280) || "Invalid response from server." };
      }

      if (!res.ok || parsed.error) {
        // Surface ABN duplicate error immediately — do NOT retry or continue
        if (res.status === 409 || (parsed.error && parsed.error.includes("ABN is already registered"))) {
          setError(parsed.error ?? "This ABN is already registered with SERVLO. Please sign in to your existing account.");
          setFieldErrors((prev) => ({ ...prev, abn: parsed.error ?? "ABN already registered" }));
          return;
        }
        console.warn("[signup/owner] setup-business failed — retrying", res.status, parsed);
        res = await fetch("/api/setup-business", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(setupBody)
        });
        raw = await res.text();
        try {
          parsed = JSON.parse(raw) as typeof parsed;
        } catch {
          parsed = { error: raw.slice(0, 280) || "Invalid response from server." };
        }
      }

      if (!res.ok || parsed.error) {
        // Surface ABN duplicate error from retry too
        if (res.status === 409 || (parsed.error && parsed.error.includes("ABN is already registered"))) {
          setError(parsed.error ?? "This ABN is already registered with SERVLO. Please sign in to your existing account.");
          setFieldErrors((prev) => ({ ...prev, abn: parsed.error ?? "ABN already registered" }));
          return;
        }
        console.error("[signup/owner] setup-business failed after retry — continuing to dashboard", parsed);
        router.push("/dashboard/owner");
        router.refresh();
        return;
      }

      if (parsed.demoSeeded !== true) {
        try {
          const demoRes = await fetch("/api/setup-business", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ userId, demoOnly: true })
          });
          if (!demoRes.ok) {
            console.warn("[signup/owner] demo-only seed retry failed", demoRes.status, await demoRes.text());
          }
        } catch (demoErr) {
          console.warn("[signup/owner] demo-only seed retry threw", demoErr);
        }
      }

      // ── Stripe trial (Core-containing products with a known price tier) ─
      const hasCore  = selectedProductCombo === "core" || selectedProductCombo.startsWith("core+");
      const priceId  = getPriceId(selectedPlanTier);

      if (hasCore && priceId && stripeRef.current && cardElementRef.current) {
        try {
          const { paymentMethod, error: pmError } = await stripeRef.current.createPaymentMethod({
            type: "card",
            card: cardElementRef.current,
          });
          if (pmError) throw new Error(pmError.message);

          const trialRes = await fetch("/api/stripe/create-trial", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              paymentMethodId: paymentMethod!.id,
              selectedProductCombo,
              selectedPlanTier,
            }),
          });

          if (!trialRes.ok) {
            const trialErr = (await trialRes.json()) as { error?: string };
            console.warn("[signup/owner] trial setup failed", trialErr);
          }
        } catch (stripeErr) {
          console.warn("[signup/owner] stripe trial error — proceeding anyway", stripeErr);
        }
      }

      router.push("/dashboard/owner");
      router.refresh();
    } catch (err) {
      console.error("[signup/owner] unexpected error", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setOwnerSubmitting(false);
    }
  }

  async function handleOwnerSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await doSignup();
  }

  // ── Derived ──────────────────────────────────────────────────────────────

  const accentBtn = "bg-[#3B82F6] text-white hover:bg-blue-500";

  const step1Disabled =
    !allPasswordRequirementsMet(passwordRules) ||
    !isPhoneValid(phoneInput) ||
    !abnValid ||
    !abnConfirmed ||
    abnLookupLoading;

  const hasCore  = selectedProductCombo === "core" || selectedProductCombo.startsWith("core+");
  const priceId  = getPriceId(selectedPlanTier);
  const needsCard = hasCore && !!priceId;

  const currentTiers = tiersForCombo(selectedProductCombo);

  // ABN confirm checkbox visibility
  const showConfirmCheckbox = abnValid && !abnLookupLoading && (
    abnLookup?.status === "active" ||
    abnLookup?.status === "skipped" ||
    abnLookup?.status === "error" ||
    abnLookup === null
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <ThemeToggleCorner />
      <EnterpriseModal isOpen={enterpriseModalOpen} onClose={() => setEnterpriseModalOpen(false)} />
      <main
        className="auth-theme flex min-h-screen items-center justify-center px-6 py-16"
        style={{ backgroundColor: "#0a0f1e" }}
      >
        <div
          className="auth-card mx-auto w-full max-w-2xl rounded-2xl border p-8 shadow-sm"
          style={{ backgroundColor: "#111827", borderColor: "#1e293b" }}
        >
          <div className="mb-4 flex justify-center">
            <Image src="/logo.png" alt="SERVLO" width={64} height={64} />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "#f8fafc" }}>
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Start your 30-day free trial and set up your business in minutes.
          </p>

          {/* Step indicator */}
          <div className="mt-4 flex items-center gap-1">
            {([1, 2, 3, 4, 5, 6] as const).map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s < step ? "bg-[#3B82F6]" : s === step ? "bg-[#3B82F6] opacity-60" : "bg-slate-700"
                }`}
              />
            ))}
          </div>

          {/* OAuth — only on step 1 */}
          {step === 1 ? (
            <div className="mt-5 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={oauthLoading !== null}
                onClick={onGoogleSignUp}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-600 bg-slate-800 font-medium text-slate-200 shadow-sm hover:bg-slate-700 disabled:opacity-60"
              >
                {oauthLoading === "google" ? (
                  <Loader2 size={18} className="animate-spin shrink-0" />
                ) : (
                  <GoogleLogoSmall />
                )}
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={oauthLoading !== null}
                onClick={onMicrosoftSignUp}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-600 bg-slate-800 font-medium text-slate-200 shadow-sm hover:bg-slate-700 disabled:opacity-60"
              >
                {oauthLoading === "microsoft" ? (
                  <Loader2 size={18} className="animate-spin shrink-0" />
                ) : (
                  <MicrosoftLogoSmall />
                )}
                Continue with Microsoft
              </Button>
              <p className="text-center text-xs text-slate-500">
                Make sure pop-ups are enabled in your browser for Google and Microsoft sign-in to work.
              </p>
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-700" />
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">or sign up with email</span>
                <span className="h-px flex-1 bg-slate-700" />
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-md border border-red-700/50 bg-red-950/40 px-3 py-2.5 text-sm text-red-300">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
              <span className="whitespace-pre-wrap break-words">
                {error}
                {error.includes("ABN is already registered") ? (
                  <span> <Link href="/auth/login" className="font-semibold underline">Sign in instead →</Link></span>
                ) : null}
              </span>
            </div>
          ) : null}

          <form ref={formRef} onSubmit={handleOwnerSignup} className="mt-6 space-y-6">
            <input type="hidden" name="industry_tags_json" value={industriesJson} />
            <input type="hidden" name="industry_other_note" value={otherNote} />
            <input type="hidden" name="accent_colour" value={DEFAULT_ACCENT_HEX} readOnly />

            {/* ── Step 1: Credentials ──────────────────────────────────── */}
            <div className={step === 1 ? "grid gap-4 sm:grid-cols-2" : "hidden"} aria-hidden={step !== 1}>
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-300">
                  Full name
                </label>
                <input
                  id="name" name="name" value={nameInput}
                  onChange={(e) => { setNameInput(e.target.value); if (fieldErrors.name) clearFieldError("name"); }}
                  onBlur={handleNameBlur}
                  required
                  className={`h-10 w-full rounded-md border bg-slate-800 px-3 text-sm text-slate-200 focus:outline-none ${fieldErrors.name ? "border-red-500 focus:border-red-500" : "border-slate-600 focus:border-[#3B82F6]"}`}
                />
                {fieldErrors.name ? <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p> : null}
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="email" name="email" type="email" autoComplete="email"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); if (fieldErrors.email) clearFieldError("email"); }}
                  onBlur={handleEmailBlur}
                  required
                  className={`h-10 w-full rounded-md border bg-slate-800 px-3 text-sm text-slate-200 focus:outline-none ${fieldErrors.email ? "border-red-500 focus:border-red-500" : "border-slate-600 focus:border-[#3B82F6]"}`}
                />
                {fieldErrors.email ? <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-300">
                  Password
                </label>
                <input
                  id="password" name="password" type="password" autoComplete="new-password"
                  value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
                  required
                  className="h-10 w-full rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-200 focus:border-[#3B82F6] focus:outline-none"
                />
                <PasswordStrengthHints rules={passwordRules} />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="business_name" className="block text-sm font-medium text-slate-300">
                    Business name
                  </label>
                  <span className={`text-xs ${businessNameInput.length > 80 ? (businessNameInput.length > 100 ? "text-red-400" : "text-amber-400") : "text-slate-500"}`}>
                    {businessNameInput.length}/100
                  </span>
                </div>
                <input
                  id="business_name" name="business_name"
                  value={businessNameInput}
                  onChange={(e) => {
                    setBusinessNameInput(e.target.value);
                    if (fieldErrors.businessName) clearFieldError("businessName");
                  }}
                  onBlur={handleBusinessNameBlur}
                  maxLength={100}
                  required
                  className={`h-10 w-full rounded-md border bg-slate-800 px-3 text-sm text-slate-200 focus:outline-none ${fieldErrors.businessName ? "border-red-500 focus:border-red-500" : "border-slate-600 focus:border-[#3B82F6]"}`}
                />
                {fieldErrors.businessName ? <p className="mt-1 text-xs text-red-400">{fieldErrors.businessName}</p> : null}
              </div>

              {/* ABN */}
              <div>
                <label htmlFor="abn" className="mb-1 block text-sm font-medium text-slate-300">
                  ABN
                </label>
                <div className="relative">
                  <input
                    id="abn" name="abn" value={abnInput}
                    inputMode="numeric" autoComplete="off"
                    placeholder="51 824 753 556"
                    onKeyDown={blockAbnKeyDown}
                    onChange={(e) => setAbnInput(formatAbnDigits(e.target.value.replace(/\D/g, "")))}
                    className={[
                      "h-10 w-full rounded-md border bg-slate-800 px-3 pr-9 text-sm text-slate-200 transition-colors focus:outline-none",
                      abnHas11
                        ? abnValid ? "border-emerald-500" : "border-red-500"
                        : "border-slate-600"
                    ].join(" ")}
                    required
                  />
                  {abnValid ? (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" aria-label="Valid ABN">
                      <Check size={15} strokeWidth={3} />
                    </span>
                  ) : null}
                </div>
                {fieldErrors.abn ? (
                  <div className="mt-2 rounded-md border border-red-700/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                    {fieldErrors.abn}
                    {fieldErrors.abn.includes("already registered") ? (
                      <span> <Link href="/auth/login" className="font-semibold underline">Sign in instead →</Link></span>
                    ) : null}
                  </div>
                ) : abnInput.trim() && !abnHas11 ? (
                  <p className="mt-1 text-xs font-medium text-amber-400">ABN must be 11 digits</p>
                ) : abnHas11 && !abnValid ? (
                  <p className="mt-1 text-xs font-medium text-red-400">Invalid ABN — please check the number</p>
                ) : null}

                {/* ABN lookup result box */}
                {abnValid ? (
                  <div
                    className={`mt-2 rounded-md border p-3 text-sm ${
                      !abnLookupLoading && (abnLookup?.status === "inactive" || abnLookup?.status === "not_found")
                        ? "border-amber-600/40 bg-amber-950/30"
                        : "border-emerald-500/40 bg-emerald-950/30"
                    }`}
                  >
                    {abnLookupLoading ? (
                      <span className="flex items-center gap-2 text-slate-400">
                        <Loader2 size={14} className="animate-spin shrink-0" aria-hidden />
                        Looking up ABN in the Australian Business Register…
                      </span>
                    ) : abnLookup?.status === "active" ? (
                      <span className="font-semibold text-emerald-400">
                        ✓ {abnLookup.entityName} — ABN active
                      </span>
                    ) : abnLookup?.status === "inactive" ? (
                      <span className="text-amber-400">
                        ⚠ {abnLookup.entityName} — this ABN is not currently active.
                      </span>
                    ) : abnLookup?.status === "not_found" ? (
                      <span className="text-amber-400">
                        ⚠ ABN not found in the Australian Business Register.
                      </span>
                    ) : (
                      /* skipped, error, or null — fallback */
                      <span className="font-semibold text-emerald-400">
                        ✓ Valid ABN — enter your registered business name above to confirm
                      </span>
                    )}
                  </div>
                ) : null}

                {/* Confirm checkbox — only when box shows active or fallback text */}
                {showConfirmCheckbox ? (
                  <label className="mt-2 flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={abnConfirmed}
                      onChange={(e) => setAbnConfirmed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#3B82F6]"
                    />
                    <span className="text-xs text-slate-300">I confirm this is my business ABN</span>
                  </label>
                ) : null}
              </div>

              {/* Phone — AU only with static prefix */}
              <div className="sm:col-span-2">
                <label htmlFor="phone_number" className="mb-1 block text-sm font-medium text-slate-300">
                  Phone number
                </label>
                <div className={`flex h-10 items-center overflow-hidden rounded-md border bg-slate-800 ${fieldErrors.phone ? "border-red-500 focus-within:border-red-500" : "border-slate-600 focus-within:border-[#3B82F6]"}`}>
                  <span className="select-none border-r border-slate-600 bg-slate-700 px-3 text-sm text-slate-300 h-full flex items-center gap-1.5 shrink-0">
                    🇦🇺 +61
                  </span>
                  <input
                    id="phone_number" name="phone_number" type="tel"
                    value={phoneInput}
                    autoComplete="tel-national" inputMode="tel"
                    placeholder="412 345 678"
                    onKeyDown={blockPhoneKeyDown}
                    onChange={(e) => {
                      setPhoneInput(formatAUPhone(e.target.value));
                      if (fieldErrors.phone) clearFieldError("phone");
                    }}
                    onBlur={handlePhoneBlur}
                    required
                    className="h-full flex-1 bg-transparent px-3 text-sm text-slate-200 outline-none placeholder:text-slate-500"
                  />
                </div>
                {fieldErrors.phone ? (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.phone}</p>
                ) : phoneInput.trim() && !isPhoneValid(phoneInput) ? (
                  <p className="mt-1 text-xs font-medium text-amber-400">Please enter a valid Australian phone number (e.g. 04xx xxx xxx)</p>
                ) : null}
              </div>

              <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  onClick={handleContinue}
                  disabled={step1Disabled}
                  className={`w-full sm:w-auto ${accentBtn} disabled:pointer-events-none disabled:opacity-50`}
                >
                  Continue
                </Button>
              </div>
            </div>

            {/* ── Step 2: Industries ────────────────────────────────────── */}
            <div className={step === 2 ? "space-y-4" : "hidden"} aria-hidden={step !== 2}>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "#f8fafc" }}>
                  What industries do you serve?
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Select all that apply — we&apos;ll tailor your workspace. You can change this later.
                </p>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search your industry..."
                value={industrySearch}
                onChange={(e) => setIndustrySearch(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#3B82F6] focus:outline-none"
              />

              {/* Selected counter */}
              {selectedChipIds.size > 0 ? (
                <p className="text-xs font-semibold text-slate-400">
                  Selected: {selectedChipIds.size} {selectedChipIds.size === 1 ? "industry" : "industries"}
                </p>
              ) : null}

              {/* Chip grid — scrollable, max height */}
              <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-700 p-3">
                {filteredChips.length === 0 ? (
                  <p className="text-sm text-slate-500">No industries match your search.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredChips.map((chip) => {
                      const on = selectedChipIds.has(chip.id);
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => toggleChip(chip.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            on
                              ? "border-[#3B82F6] bg-[#3B82F6]/15 text-[#93C5FD]"
                              : "border-slate-600 bg-slate-800/60 text-slate-300 hover:border-slate-400"
                          }`}
                        >
                          {on ? <Check size={10} strokeWidth={3} aria-hidden /> : null}
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Custom note for "Other" */}
              {needsOtherNote ? (
                <div>
                  <label htmlFor="industry_other_field" className="mb-1 block text-sm font-medium text-slate-300">
                    Tell us about your business
                  </label>
                  <textarea
                    id="industry_other_field"
                    value={otherNote}
                    onChange={(e) => setOtherNote(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-[#3B82F6] focus:outline-none"
                    placeholder="e.g. Plumbing and gas fitting across Adelaide"
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="dark-ghost" onClick={handleBack}>Back</Button>
                <div className="flex gap-2">
                  <Button type="button" variant="dark-ghost" onClick={handleContinueFromIndustries} className="text-slate-400 text-sm">
                    Skip
                  </Button>
                  <Button type="button" onClick={handleContinueFromIndustries} className={accentBtn}>Continue</Button>
                </div>
              </div>
            </div>

            {/* ── Step 3: Product selection ────────────────────────────── */}
            <div className={step === 3 ? "space-y-5" : "hidden"} aria-hidden={step !== 3}>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "#f8fafc" }}>
                  Choose your products
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Start with what you need. You can add more later.
                </p>
              </div>

              {/* Row 1 — individual products */}
              <div className="grid gap-3 sm:grid-cols-3">
                {INDIVIDUAL_PRODUCTS.map((prod) => {
                  const isSelected = selectedProductCombo.split("+").includes(prod.id);
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => {
                        const hasProd = selectedProductCombo.split("+").includes(prod.id);
                        if (prod.id === "core") {
                          // Core is always the base — clicking it goes to solo core
                          if (!selectedProductCombo.includes("grow") && !selectedProductCombo.includes("leads")) {
                            setSelectedProductCombo("core");
                          }
                          return;
                        }
                        // Grow / Leads require Core
                        if (!selectedProductCombo.startsWith("core")) {
                          setProductTooltip("SERVLO Core is required to use this product.");
                          setTimeout(() => setProductTooltip(null), 3000);
                          return;
                        }
                        setProductTooltip(null);
                        const hasGrow  = selectedProductCombo.includes("grow");
                        const hasLeads = selectedProductCombo.includes("leads");
                        if (prod.id === "grow") {
                          if (hasProd) setSelectedProductCombo(hasLeads ? "core+leads" : "core");
                          else         setSelectedProductCombo(hasLeads ? "core+grow+leads" : "core+grow");
                        } else if (prod.id === "leads") {
                          if (hasProd) setSelectedProductCombo(hasGrow ? "core+grow" : "core");
                          else         setSelectedProductCombo(hasGrow ? "core+grow+leads" : "core+leads");
                        }
                      }}
                      className="relative flex flex-col overflow-hidden rounded-xl p-4 text-left transition"
                      style={{
                        background: prod.gradient,
                        border: isSelected
                          ? `1px solid ${prod.color}`
                          : `1px solid rgba(255,255,255,0.08)`,
                        borderLeft: `4px solid ${prod.color}`,
                        boxShadow: isSelected
                          ? `0 0 24px ${prod.glow}, 0 0 0 2px ${prod.color}44`
                          : `0 0 20px ${prod.glow}`,
                        transform: isSelected ? "scale(1.02)" : undefined,
                      }}
                    >
                      <div className="absolute left-0 right-0 top-0 h-[3px] rounded-t-xl" style={{ background: prod.color }} />
                      {isSelected ? (
                        <span
                          className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full"
                          style={{ backgroundColor: prod.color }}
                        >
                          <Check size={11} strokeWidth={3} className="text-white" />
                        </span>
                      ) : null}
                      <div className="pt-1">
                        <p className="text-sm font-bold" style={{ color: prod.nameColor }}>{prod.name}</p>
                        <p className="mt-1 text-xs text-slate-300">{prod.desc}</p>
                        <p className="mt-3 text-xs font-semibold text-slate-200">{prod.price}</p>
                        <span
                          className={`mt-1.5 self-start rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            prod.available
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {prod.badge}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Row 2 — bundle pairs */}
              <div className="grid gap-3 sm:grid-cols-3">
                {BUNDLE_PAIRS.map((bundle) => {
                  const isActive = selectedProductCombo === bundle.id;
                  return (
                    <button
                      key={bundle.id}
                      type="button"
                      onClick={() => {
                        if (bundle.comingSoon) return;
                        setSelectedProductCombo(bundle.id);
                        setProductTooltip(null);
                      }}
                      disabled={bundle.comingSoon}
                      className="relative flex flex-col overflow-hidden rounded-xl p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        background: bundle.gradient,
                        border: isActive
                          ? `1px solid ${bundle.colors[0]}`
                          : `1px solid rgba(255,255,255,0.08)`,
                        boxShadow: isActive
                          ? `0 0 20px color-mix(in srgb, ${bundle.colors[0]} 30%, ${bundle.colors[1]} 30%)`
                          : undefined,
                        transform: isActive ? "scale(1.02)" : undefined,
                      }}
                    >
                      <div
                        className="absolute left-0 right-0 top-0 h-[3px] rounded-t-xl"
                        style={{ background: `linear-gradient(90deg, ${bundle.colors[0]}, ${bundle.colors[1]})` }}
                      />
                      {isActive ? (
                        <span
                          className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full"
                          style={{ backgroundColor: bundle.colors[0] }}
                        >
                          <Check size={11} strokeWidth={3} className="text-white" />
                        </span>
                      ) : null}
                      <div className="pt-1">
                        <p className="text-sm font-bold text-slate-100">{bundle.name}</p>
                        <p className="text-xs text-slate-400">{bundle.subtitle}</p>
                        <p className="mt-3 text-xs font-semibold text-slate-300">{bundle.price}</p>
                        <span
                          className={`mt-1.5 self-start rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            bundle.comingSoon
                              ? "bg-slate-700 text-slate-400"
                              : "bg-emerald-500/15 text-emerald-300"
                          }`}
                        >
                          {bundle.savings}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Row 3 — full platform (full width, most prominent) */}
              {(() => {
                const isActive = selectedProductCombo === FULL_PLATFORM.id;
                return (
                  <button
                    type="button"
                    onClick={() => { setSelectedProductCombo(FULL_PLATFORM.id); setProductTooltip(null); }}
                    className="relative w-full overflow-hidden rounded-xl border p-5 text-left transition"
                    style={
                      isActive
                        ? { borderColor: "#8B5CF6", boxShadow: "0 0 0 2px #8B5CF644, 0 8px 24px -4px rgba(139,92,246,0.25)", background: "linear-gradient(135deg, #3B82F612, #8B5CF612, #F59E0B12)" }
                        : { borderColor: "#4B5563", background: "linear-gradient(135deg, #3B82F608, #8B5CF608, #F59E0B08)" }
                    }
                  >
                    {/* Triple gradient top bar */}
                    <div
                      className="absolute left-0 right-0 top-0 h-1.5 rounded-t-xl"
                      style={{ background: "linear-gradient(90deg, #3B82F6, #8B5CF6, #F59E0B)" }}
                    />
                    <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold text-white">{FULL_PLATFORM.name}</p>
                          <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-500/30">
                            {FULL_PLATFORM.badge}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">{FULL_PLATFORM.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xl font-bold text-white">{FULL_PLATFORM.price}</p>
                          <p className="text-xs text-emerald-400">30-day trial free</p>
                        </div>
                        {isActive ? (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8B5CF6]">
                            <Check size={14} strokeWidth={3} className="text-white" />
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {FULL_PLATFORM.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                          <Check size={11} strokeWidth={3} className="shrink-0 text-emerald-400" aria-hidden />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-xs font-semibold text-slate-400">
                      Most businesses choose this
                    </p>
                  </button>
                );
              })()}

              {/* Core requirement tooltip */}
              {productTooltip ? (
                <p className="rounded-md border border-amber-700/40 bg-amber-950/30 px-3 py-2 text-xs font-medium text-amber-300">
                  {productTooltip}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="dark-ghost" onClick={handleBack}>Back</Button>
                <Button type="button" onClick={handleContinueFromProducts} className={accentBtn}>Continue</Button>
              </div>
            </div>

            {/* ── Step 4: Plan tier ────────────────────────────────────── */}
            <div className={step === 4 ? "space-y-4" : "hidden"} aria-hidden={step !== 4}>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "#f8fafc" }}>
                  Choose your plan
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  All plans include a 30-day free trial — no charge until your trial ends.
                </p>
              </div>

              {/* Product summary banner */}
              <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-2.5">
                <p className="text-xs text-slate-400">Selected product</p>
                <p className="text-sm font-semibold text-slate-100">{comboLabel(selectedProductCombo)}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {currentTiers.map((tier) => {
                  const on = selectedPlanTier === tier.id;
                  const isEnterprise = tier.id === "enterprise";
                  if (isEnterprise) {
                    return (
                      <button
                        key={tier.id} type="button"
                        onClick={() => setEnterpriseModalOpen(true)}
                        className="relative flex flex-col items-start gap-2 rounded-lg border border-slate-600 p-4 text-left transition hover:border-slate-500"
                      >
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold text-slate-100">{tier.price}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-200">{tier.name}</p>
                        <p className="text-xs text-slate-400">{tier.description}</p>
                        <ul className="mt-1 space-y-0.5">
                          {tier.features.map((f) => (
                            <li key={f} className="flex items-center gap-1.5 text-xs text-slate-300">
                              <Check size={11} className="shrink-0 text-[#3B82F6]" strokeWidth={3} aria-hidden />
                              {f}
                            </li>
                          ))}
                        </ul>
                        <span className="mt-1 text-xs font-semibold text-blue-400">Contact us →</span>
                      </button>
                    );
                  }
                  return (
                    <button
                      key={tier.id} type="button"
                      onClick={() => setSelectedPlanTier(tier.id)}
                      className={`relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition ${
                        on
                          ? "border-[#3B82F6] ring-2 ring-[#3B82F6]/40"
                          : "border-slate-600 hover:border-slate-500"
                      }`}
                    >
                      {tier.recommended ? (
                        <span className="absolute right-3 top-2 rounded-full bg-[#3B82F6]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#93C5FD]">
                          Most popular
                        </span>
                      ) : null}
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-slate-100">{tier.price}</span>
                        <span className="text-xs text-slate-400">/ month</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-200">{tier.name}</p>
                      <p className="text-xs text-slate-400">{tier.description}</p>
                      <ul className="mt-1 space-y-0.5">
                        {tier.features.map((f) => (
                          <li key={f} className="flex items-center gap-1.5 text-xs text-slate-300">
                            <Check size={11} className="shrink-0 text-[#3B82F6]" strokeWidth={3} aria-hidden />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="dark-ghost" onClick={handleBack}>Back</Button>
                <Button type="button" onClick={handleContinueFromPlanTier} className={accentBtn}>Continue</Button>
              </div>
            </div>

            {/* ── Step 5: Workspace preview ────────────────────────────── */}
            <div className={step === 5 ? "space-y-4" : "hidden"} aria-hidden={step !== 5}>
              <WorkspaceSetupPreview
                primaryIndustryLabel={signupIndustryHeadline}
                recommendedIds={signupRecommendedIds}
                optionalIds={signupOptionalIds}
                optionalOn={optionalFeatureOn}
                setOptionalOn={(id, on) => setOptionalFeatureOn((prev) => ({ ...prev, [id]: on }))}
                onBack={handleBack}
                onContinue={handleContinueFromWorkspacePreview}
                submitting={false}
              />
            </div>

            {/* ── Step 6: Trial / Stripe ───────────────────────────────── */}
            <div className={step === 6 ? "space-y-5" : "hidden"} aria-hidden={step !== 6}>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "#f8fafc" }}>
                  {needsCard ? "Start your 30-day free trial" : "Reserve your spot"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {needsCard
                    ? "Enter your card details — you won't be charged until your trial ends."
                    : "This product is coming soon. Reserve your spot and we'll notify you at launch."}
                </p>
              </div>

              {/* Summary */}
              <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {(INDIVIDUAL_PRODUCTS.find((p) => p.id === selectedProductCombo) ?? BUNDLE_PAIRS.find((p) => p.id === selectedProductCombo) ?? (FULL_PLATFORM.id === selectedProductCombo ? FULL_PLATFORM : null))?.name ?? selectedProductCombo}
                    </p>
                    <p className="text-xs text-slate-400 capitalize">{selectedPlanTier} plan</p>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const tier = currentTiers.find((t) => t.id === selectedPlanTier);
                      const tierPrice = tier?.price ?? "—";
                      // Leads tiers already include unit in price string
                      const hasUnit = tierPrice.includes("/") || selectedProductCombo === "leads";
                      return (
                        <p className="text-sm font-bold text-slate-100">
                          {tierPrice}{!hasUnit ? <span className="text-xs font-normal text-slate-400">/mo</span> : null}
                        </p>
                      );
                    })()}
                    {needsCard ? (
                      <p className="text-xs text-emerald-400">30-day trial free</p>
                    ) : (
                      <p className="text-xs text-slate-400">Reserve — no charge</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stripe card element (Core + known price only) */}
              {needsCard ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Card details</label>
                  <div
                    ref={cardMountRef}
                    className="rounded-md border border-slate-600 bg-slate-800 px-3 py-3 focus-within:border-[#3B82F6]"
                    style={{ minHeight: "40px" }}
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Secured by Stripe. Your card will not be charged during the trial.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="dark-ghost" onClick={handleBack} disabled={ownerSubmitting}>
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => doSignup()}
                  disabled={ownerSubmitting}
                  className={`w-full sm:w-auto ${accentBtn} disabled:pointer-events-none disabled:opacity-50`}
                >
                  {ownerSubmitting
                    ? "Setting up…"
                    : needsCard
                      ? "Start 30-Day Free Trial"
                      : "Reserve My Spot"}
                </Button>
              </div>
            </div>
          </form>

          <p className="mt-5 text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-[#3B82F6] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
