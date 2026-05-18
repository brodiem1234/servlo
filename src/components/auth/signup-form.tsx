"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent, KeyboardEvent, MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { immediateOwnerUpsert } from "@/app/auth/signup/owner-signup-action";
import { lookupABN, type AbnLookupResult } from "@/app/auth/signup/lookup-abn";
import {
 allPasswordRequirementsMet,
 normalizePasswordStrength,
 abnDigitsFromInput,
 formatAbnDigits,
 validateAbnChecksum,
 TEST_ABN_DIGITS,
 IS_TEST_ABN_BYPASS_ENABLED,
 type PasswordRequirementState,
 type PasswordRuleKey
} from "@/lib/auth/signup-field-validation";
import {
 AlertTriangle,
 ArrowLeft,
 Check,
 Loader2,
 Lock,
} from "lucide-react";
import { EnterpriseModal } from "@/components/marketing/enterprise-modal";
import { Button } from "@/components/ui/button";
import type { IndustrySlug } from "@/lib/industries";
import { formatIndustryLabels } from "@/lib/industries";
import { DEFAULT_ACCENT_HEX } from "@/lib/brand-accent";
import {
 buildInitialEnabledFeatures,
 primaryIndustrySlug
} from "@/lib/workspace-features";
import type { Stripe, StripeCardElement } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// ── Stripe (loaded once, outside component) ─────────────────────────────────

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

// Note: price IDs here are used client-side for Stripe.js only.
// The server (create-trial route) independently maps tier → price ID via env vars
// and never trusts client-supplied price IDs.
function getPriceId(tier: string, annual = false): string | null {
 const monthly: Record<string, string> = {
 solo: "price_1TWSCUK1tzStyRcJDK8SsYJK",
 team: "price_1TWSG3K1tzStyRcJdZxYYK2z",
 business: "price_1TWSGwK1tzStyRcJ3cAmG86B",
 };
 const annualIds: Record<string, string> = {
 solo: "price_1TWThcK1tzStyRcJvL8BvkkO",
 team: "price_1TWSRdK1tzStyRcJNCIHsMT9",
 business: "price_1TWSSrK1tzStyRcJp0PM9TBD",
 };
 return (annual ? annualIds : monthly)[tier] ?? null;
}

// Annual price display helpers
const ANNUAL_DISPLAY: Record<string, { mo: string; yr: string }> = {
 solo: { mo: "$24.17", yr: "$290" },
 team: { mo: "$65.83", yr: "$790" },
 business: { mo: "$124.17", yr: "$1,490" },
};

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

// ── Industry chips (categorised) ─────────────────────────────────────────────

type IndustryChip = {
 id: string;
 label: string;
 slug: IndustrySlug;
};

type IndustryCategory = {
 name: string;
 chips: IndustryChip[];
};

const INDUSTRY_CATEGORIES: IndustryCategory[] = [
 {
 name: "Construction & Trades",
 chips: [
 { id: "electrician", label: "Electrician", slug: "trades" },
 { id: "plumber", label: "Plumber", slug: "trades" },
 { id: "builder", label: "Builder", slug: "trades" },
 { id: "carpenter", label: "Carpenter", slug: "trades" },
 { id: "concreter", label: "Concreter", slug: "trades" },
 { id: "painter", label: "Painter", slug: "trades" },
 { id: "tiler", label: "Tiler", slug: "trades" },
 { id: "roofer", label: "Roofer", slug: "trades" },
 { id: "hvac", label: "HVAC", slug: "trades" },
 { id: "gas-fitter", label: "Gas Fitter", slug: "trades" },
 { id: "welder", label: "Welder", slug: "trades" },
 { id: "fabricator", label: "Fabricator", slug: "trades" },
 { id: "locksmith", label: "Locksmith", slug: "field_services" },
 ],
 },
 {
 name: "Cleaning & Maintenance",
 chips: [
 { id: "residential-cleaning", label: "Residential Cleaning", slug: "cleaning" },
 { id: "commercial-cleaning", label: "Commercial Cleaning", slug: "cleaning" },
 { id: "ndis-cleaning", label: "NDIS Cleaning", slug: "cleaning" },
 { id: "end-of-lease", label: "End of Lease", slug: "cleaning" },
 { id: "industrial-cleaning", label: "Industrial Cleaning", slug: "cleaning" },
 { id: "pest-control", label: "Pest Control", slug: "field_services" },
 { id: "maintenance", label: "Maintenance", slug: "field_services" },
 ],
 },
 {
 name: "Outdoor & Property",
 chips: [
 { id: "garden", label: "Garden", slug: "trades" },
 { id: "irrigation", label: "Irrigation", slug: "trades" },
 { id: "tree-services", label: "Tree Services", slug: "trades" },
 { id: "pool-spa", label: "Pool & Spa", slug: "trades" },
 { id: "equipment-hire", label: "Equipment Hire", slug: "events" },
 ],
 },
 {
 name: "Inspections & Security",
 chips: [
 { id: "security", label: "Security", slug: "field_services" },
 { id: "inspections", label: "Inspections", slug: "field_services" },
 ],
 },
 {
 name: "Health & Wellness",
 chips: [
 { id: "physio", label: "Physio", slug: "health" },
 { id: "chiropractic", label: "Chiropractic", slug: "health" },
 { id: "massage", label: "Massage", slug: "health" },
 { id: "nutrition", label: "Nutrition", slug: "health" },
 { id: "personal-training", label: "Personal Training", slug: "health" },
 ],
 },
 {
 name: "Events & Creative",
 chips: [
 { id: "av", label: "AV", slug: "events" },
 { id: "catering", label: "Catering", slug: "events" },
 { id: "photography", label: "Photography", slug: "events" },
 { id: "event-coordination", label: "Event Coordination", slug: "events" },
 { id: "music-lessons", label: "Music Lessons", slug: "other" },
 ],
 },
 {
 name: "Logistics & Transport",
 chips: [
 { id: "courier", label: "Courier", slug: "field_services" },
 { id: "removals", label: "Removals", slug: "field_services" },
 { id: "freight", label: "Freight", slug: "field_services" },
 ],
 },
 {
 name: "Personal Services",
 chips: [
 { id: "hair", label: "Hair", slug: "other" },
 { id: "skin", label: "Skin", slug: "other" },
 { id: "nails", label: "Nails", slug: "other" },
 { id: "barber", label: "Barber", slug: "other" },
 ],
 },
 {
 name: "Professional & Business",
 chips: [
 { id: "consulting", label: "Consulting", slug: "marketing" },
 { id: "it-support", label: "IT Support", slug: "marketing" },
 { id: "marketing-agency", label: "Marketing Agency", slug: "marketing" },
 { id: "accounting", label: "Accounting", slug: "marketing" },
 ],
 },
 {
 name: "Home Services",
 chips: [
 { id: "home-cleaning", label: "Home Cleaning", slug: "cleaning" },
 { id: "gardening", label: "Gardening", slug: "trades" },
 { id: "handyman", label: "Handyman", slug: "trades" },
 { id: "appliance-repair", label: "Appliance Repair", slug: "field_services" },
 ],
 },
 {
 name: "Education & Coaching",
 chips: [
 { id: "tutoring", label: "Tutoring", slug: "other" },
 { id: "coaching", label: "Coaching", slug: "other" },
 ],
 },
 {
 name: "Other",
 chips: [
 { id: "other", label: "Other", slug: "other" },
 ],
 },
];

// Flat list for lookup / validation
const INDUSTRY_CHIPS: IndustryChip[] = INDUSTRY_CATEGORIES.flatMap((c) => c.chips);

// ── Product selection data (4 cards: Core selectable, 3 locked) ──────────────

type ProductCard = {
 id: string;
 name: string;
 description: string;
 price: string;
 badgeText: string;
 badgeTone: "green" | "amber" | "neutral";
 available: boolean;
 tooltip?: string;
};

const PRODUCT_CARDS: ProductCard[] = [
 {
 id: "core",
 name: "SERVLO Core",
 description: "Job management, invoicing, scheduling",
 price: "From $29/mo",
 badgeText: "Available now",
 badgeTone: "green",
 available: true,
 },
 {
 id: "core+grow",
 name: "Core + Grow",
 description: "Job management plus AI marketing tools",
 price: "From $29/mo + $15/mo add-on",
 badgeText: "Grow launching soon",
 badgeTone: "amber",
 available: false,
 tooltip: "Grow add-on launching in 4 to 6 weeks. Founding members get their first month free.",
 },
 {
 id: "core+leads",
 name: "Core + Leads",
 description: "Job management plus verified job leads",
 price: "From $29/mo + $12/lead",
 badgeText: "Coming Q4 2026",
 badgeTone: "neutral",
 available: false,
 tooltip: "Leads marketplace launching Q4 2026.",
 },
 {
 id: "core+grow+leads",
 name: "Full Platform",
 description: "Everything included. One login.",
 price: "Coming Q4 2026",
 badgeText: "Launching with Leads",
 badgeTone: "neutral",
 available: false,
 tooltip: "Full platform launches alongside Leads in Q4 2026.",
 },
];

// ── Plan tier options ───────────────────────────────────────────────────────

type PlanTier = {
 id: string;
 name: string;
 price: string;
 description: string;
 features: string[];
 recommended?: boolean;
};

function tiersForCore(): PlanTier[] {
 return [
 {
 id: "solo",
 name: "Solo",
 price: "$29",
 description: "Perfect for sole traders",
 features: ["1 user", "Unlimited jobs", "50 AI generations/mo"],
 },
 {
 id: "team",
 name: "Team",
 price: "$79",
 description: "For growing businesses",
 features: ["Unlimited team members", "Team timesheets & scheduling", "200 AI generations/mo"],
 recommended: true,
 },
 {
 id: "business",
 name: "Business",
 price: "$149",
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

// ── SVG icons ───────────────────────────────────────────────────────────────

// ── Password hints ──────────────────────────────────────────────────────────

function passwordHintLabel(rule: PasswordRuleKey): string {
 switch (rule) {
 case "length": return "Minimum 8 characters";
 case "upper": return "At least one uppercase letter";
 case "number": return "At least one number";
 case "noPersonal":return "Cannot contain your first name, last name, or email address";
 default: return "";
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

 // Step 1=credentials, 2=industries, 3=products, 4=plan tier, 5=trial
 const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

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

 // Industry selection
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

 // Product + plan. Core is the ONLY selectable product in signup
 const [selectedProductCombo] = useState("core");
 const [selectedPlanTier, setSelectedPlanTier] = useState("solo");

 // Billing frequency. Monthly or annual
 const [billingFrequency, setBillingFrequency] = useState<"monthly" | "annual">("monthly");
 const isAnnual = billingFrequency === "annual";

 // Promo code state
 const [promoOpen, setPromoOpen] = useState(false);
 const [promoCodeInput, setPromoCodeInput] = useState("");
 const [promoLoading, setPromoLoading] = useState(false);
 const [appliedPromoCode, setAppliedPromoCode] = useState("");
 const [promoResult, setPromoResult] = useState<{
 valid: boolean;
 discount?: string;
 percentOff?: number;
 error?: string;
 } | null>(null);

 // Stripe refs
 const stripeRef = useRef<Stripe | null>(null);
 const cardElementRef = useRef<StripeCardElement | null>(null);
 const cardMountRef = useRef<HTMLDivElement>(null);
 const [stripeReady, setStripeReady] = useState(false);
 const [stripeInitError, setStripeInitError] = useState(false);

 // Terms acceptance
 const [termsAccepted, setTermsAccepted] = useState(false);

 // UI state
 const [error, setError] = useState<string | null>(null);
 const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
 const [ownerSubmitting, setOwnerSubmitting] = useState(false);
 const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
 const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);

 const passwordRules = useMemo(
 () => normalizePasswordStrength(passwordInput, nameInput, emailInput),
 [passwordInput, nameInput, emailInput]
 );

 const abnDigits = abnDigitsFromInput(abnInput);
 const abnHas11 = abnDigits.length === 11;
 const abnValid = abnHas11 && validateAbnChecksum(abnInput);

 const needsOtherNote = selectedChipIds.has("other");
 const industriesJson = useMemo(() => JSON.stringify(selected), [selected]);
 const signupPrimaryIndustry = useMemo(
 () => primaryIndustrySlug(selected.length ? selected : ["other"]),
 [selected]
 );
 const _signupIndustryHeadline = formatIndustryLabels([signupPrimaryIndustry]) || "SERVLO";

 // Filtered categories: each category keeps only chips matching the search;
 // categories with no remaining chips are hidden.
 const filteredCategories = useMemo(() => {
 const q = industrySearch.trim().toLowerCase();
 if (!q) return INDUSTRY_CATEGORIES;
 return INDUSTRY_CATEGORIES
 .map((cat) => ({
 ...cat,
 chips: cat.chips.filter(
 (c) => c.label.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q)
 ),
 }))
 .filter((cat) => cat.chips.length > 0);
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

 // ABN lookup: fires whenever abnDigits changes and the checksum is valid.
 useEffect(() => {
 if (!abnValid) return;
 // Test ABN bypass. DEV ONLY. Skip the real lookup. Stripped from prod builds.
 if (IS_TEST_ABN_BYPASS_ENABLED && abnDigits === TEST_ABN_DIGITS) return;
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

 // Mount Stripe card element when reaching step 5 (trial) for Core-containing products.
 useEffect(() => {
 if (step !== 5) return;
 const hasCore = selectedProductCombo === "core" || selectedProductCombo.startsWith("core+");
 const priceId = getPriceId(selectedPlanTier, isAnnual);
 if (!hasCore || !priceId) return;

 setStripeReady(false);
 setStripeInitError(false);

 let mounted = true;
 stripePromise.then((stripeInstance) => {
 if (!mounted) return;
 if (!stripeInstance) {
 setStripeInitError(true);
 return;
 }
 if (!cardMountRef.current) return;
 if (cardElementRef.current) {
 cardElementRef.current.destroy();
 cardElementRef.current = null;
 }
 const elements = stripeInstance.elements();
 const card = elements.create("card", {
 style: {
 base: {
 color: "#e2e8f0",
 backgroundColor: "#1e293b",
 fontFamily: "system-ui, -apple-system, sans-serif",
 fontSize: "14px",
 "::placeholder": { color: "#64748b" },
 iconColor: "#94a3b8",
 },
 invalid: { color: "#ef4444", iconColor: "#ef4444" },
 },
 });
 card.mount(cardMountRef.current);
 card.on("ready", () => { if (mounted) setStripeReady(true); });
 stripeRef.current = stripeInstance;
 cardElementRef.current = card;
 });

 return () => {
 mounted = false;
 cardElementRef.current?.destroy();
 cardElementRef.current = null;
 setStripeReady(false);
 };
 // Re-mount if product/tier or billing frequency changes while on step 5.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [step, selectedProductCombo, selectedPlanTier, isAnnual]);

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
 if (!abnValid) return "Invalid ABN. Please re-enter your 11-digit ABN.";
 if (!abnConfirmed) return "Please confirm your ABN before continuing.";
 return null;
 }

 // ── Step navigation ──────────────────────────────────────────────────────

 function handleContinue(e: MouseEvent<HTMLButtonElement>) {
 e.preventDefault();
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
 setSelectedPlanTier("solo");
 setStep(4);
 }

 function handleContinueFromPlanTier(e: MouseEvent<HTMLButtonElement>) {
 e.preventDefault();
 setStep(5);
 }

 function handleBack(e: MouseEvent<HTMLButtonElement>) {
 e.preventDefault();
 setError(null);
 setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4 | 5);
 }

 // ── Core signup logic ────────────────────────────────────────────────────

 async function doSignup() {
 if (step !== 5) return;
 setError(null);

 if (!termsAccepted) {
 setError("Please accept the Terms of Service and Privacy Policy to continue.");
 return;
 }

 // EARLYACCESS is monthly-only. Clear it if user tries to combine with annual
 if (earlyAccessConflict) {
 setError("The EARLYACCESS discount applies to monthly plans only. Please switch to monthly billing or remove the promo code.");
 return;
 }

 // If any step-1 invariant fails (most commonly: password no longer meets
 // requirements because of `noPersonal` after a name change), auto-navigate
 // back to step 1 so the user can fix it in context. Previously they had
 // to click Back five times.
 const gate = validateStep1();
 if (gate) {
 setError(gate);
 setStep(1);
 return;
 }

 setOwnerSubmitting(true);

 try {
 const phoneDigits = phoneInput.replace(/\s/g, "");
 const phoneLocal = phoneDigits.startsWith("0") ? phoneDigits.slice(1) : phoneDigits;
 const phoneE164 = `+61${phoneLocal}`;

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
 "Account signup did not return a user id. If email confirmation is required, check your inbox, otherwise contact support."
 );
 return;
 }

 const accessToken = authData.session?.access_token;
 if (!accessToken) {
 setError("Account created. Confirm your email if required, then sign in to finish setup.");
 return;
 }

 // Immediately upsert profiles + businesses using service-role so data is
 // persisted even if /api/setup-business fails or times out. The helper
 // never throws. It returns a structured result we inspect for
 // diagnostics. The second-pass /api/setup-business below covers any
 // gaps; if BOTH fail the user is routed to /onboarding/complete-profile.
 const upsertResult = await immediateOwnerUpsert({
 accessToken,
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

 if (!upsertResult.ok) {
 console.warn(
 "[signup/owner] immediateOwnerUpsert partial:",
 {
 profileWritten: upsertResult.profileWritten,
 businessWritten: upsertResult.businessWritten,
 errors: upsertResult.errors,
 }
 );
 }

 // Module toggles are no longer chosen during signup, so we initialise the
 // workspace with the industry-recommended default set (no optional extras).
 const workspaceFeaturesEnabled = buildInitialEnabledFeatures(signupPrimaryIndustry, new Set());

 const params = typeof window !== "undefined"
 ? new URLSearchParams(window.location.search)
 : new URLSearchParams();
 const referralCode = params.get("ref") ?? undefined;
 // Use the UI-applied promo code (validated); fall back to URL param for legacy ?code= links
 const effectivePromoCode = appliedPromoCode || params.get("code") || undefined;

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
 referralCode: referralCode || undefined,
 promoCode: effectivePromoCode,
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
 if (res.status === 409 || (parsed.error && parsed.error.includes("ABN is already registered"))) {
 setError(parsed.error ?? "This ABN is already registered with SERVLO. Please sign in to your existing account.");
 setFieldErrors((prev) => ({ ...prev, abn: parsed.error ?? "ABN already registered" }));
 return;
 }
 console.warn("[signup/owner] setup-business failed, retrying", res.status, parsed);
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
 if (res.status === 409 || (parsed.error && parsed.error.includes("ABN is already registered"))) {
 setError(parsed.error ?? "This ABN is already registered with SERVLO. Please sign in to your existing account.");
 setFieldErrors((prev) => ({ ...prev, abn: parsed.error ?? "ABN already registered" }));
 return;
 }
 // Both setup-business attempts failed. The immediateOwnerUpsert pass
 // (above) may or may not have persisted the data. If it didn't, the
 // dashboard will render with empty business/profile rows and the user
 // would have to re-enter everything in Settings.
 //
 // Send them to the onboarding recovery page instead so they can
 // confirm their data and we get a clean record.
 console.error("[signup/owner] setup-business failed after retry, sending to onboarding recovery", parsed);
 setError("We had trouble setting up your workspace. We've got your account. Just confirm a few details on the next page.");
 router.push("/onboarding/complete-profile");
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

 // Stripe trial (Core-containing products with a known price tier).
 const hasCore = selectedProductCombo === "core" || selectedProductCombo.startsWith("core+");
 const priceId = getPriceId(selectedPlanTier, isAnnual);

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
 annual: isAnnual,
 // ABN passed so the create-trial route can run the dedup check
 // (one active subscription per ABN) and attach the ABN to the
 // Stripe customer as a tax ID.
 abn: abnRaw,
 ...(effectivePromoCode ? { promoCode: effectivePromoCode } : {}),
 }),
 });

 if (!trialRes.ok) {
 const trialErr = (await trialRes.json()) as { error?: string };
 console.warn("[signup/owner] trial setup failed", trialErr);
 }
 } catch (stripeErr) {
 console.warn("[signup/owner] stripe trial error, proceeding anyway", stripeErr);
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

 // Primary button. Matches sign-in page: white bg / black text
 const primaryBtn = "bg-white text-black hover:bg-neutral-100";

 // Input styling. Matches sign-in page
 const inputBase = "h-11 w-full rounded-lg border px-3 text-sm transition focus:outline-none " +
 "bg-white/[0.06] text-white placeholder-zinc-500";
 const inputOk = "border-neutral-700 focus:border-white focus:ring-2 focus:ring-white/20";
 const inputErr = "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";

 const step1Disabled =
 !allPasswordRequirementsMet(passwordRules) ||
 !isPhoneValid(phoneInput) ||
 !abnValid ||
 !abnConfirmed ||
 abnLookupLoading;

 const hasCore = selectedProductCombo === "core" || selectedProductCombo.startsWith("core+");
 const priceId = getPriceId(selectedPlanTier, isAnnual);
 const needsCard = hasCore && !!priceId;

 // EARLYACCESS + annual conflict
 const earlyAccessConflict = isAnnual && appliedPromoCode.toUpperCase() === "EARLYACCESS";

 // ── Auto-apply promo code (founder default + URL override) ───────────────
 // Priority:
 //   1. ?code=XXX URL param → validate + apply whatever the link says
 //   2. Otherwise, if founding spots remain, auto-apply EARLYACCESS
 //   3. If founding spots are gone, no-op (full price)
 useEffect(() => {
 let cancelled = false;
 (async () => {
 try {
 // Read URL param first
 const params = typeof window !== "undefined"
 ? new URLSearchParams(window.location.search)
 : new URLSearchParams();
 const urlCode = params.get("code")?.trim().toUpperCase();

 let codeToApply: string | null = null;

 if (urlCode) {
 // URL takes priority — always try whatever the link supplied
 codeToApply = urlCode;
 } else {
 // No URL override — check if founding spots remain
 try {
 const res = await fetch("/api/founders/count", { cache: "no-store" });
 if (res.ok) {
 const data = (await res.json()) as { remaining?: number; isFull?: boolean };
 if ((data.remaining ?? 0) > 0 && !data.isFull) {
 codeToApply = "EARLYACCESS";
 }
 }
 } catch (err) {
 console.warn("[signup] founder count fetch failed", err);
 }
 }

 if (!codeToApply || cancelled) return;

 // Validate whichever code we picked.
 try {
 const promoRes = await fetch("/api/stripe/validate-promo", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ code: codeToApply }),
 });
 const promoData = (await promoRes.json()) as { valid: boolean; discount?: string; percentOff?: number };
 if (cancelled) return;
 if (promoData.valid) {
 setAppliedPromoCode(codeToApply);
 setPromoResult(promoData);
 setPromoCodeInput(codeToApply);
 setPromoOpen(true);
 } else {
 // Code didn't validate. Pre-fill input so the user can see what we
 // tried; show the validation result so the red error renders. They
 // can edit or remove it.
 setPromoCodeInput(codeToApply);
 setPromoResult(promoData);
 setPromoOpen(true);
 }
 } catch (err) {
 console.warn("[signup] promo code validate failed", err);
 }
 } catch (err) {
 console.warn("[signup] auto-apply promo flow failed", err);
 }
 })();
 return () => { cancelled = true; };
 }, []);

 async function applyPromoCode() {
 const code = promoCodeInput.trim();
 if (!code) return;
 setPromoLoading(true);
 setPromoResult(null);
 try {
 const res = await fetch("/api/stripe/validate-promo", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ code }),
 });
 const data = await res.json() as { valid: boolean; discount?: string; percentOff?: number; error?: string };
 setPromoResult(data);
 if (data.valid) {
 setAppliedPromoCode(code);
 } else {
 setAppliedPromoCode("");
 }
 } catch {
 setPromoResult({ valid: false, error: "Unable to validate code. Try again." });
 setAppliedPromoCode("");
 } finally {
 setPromoLoading(false);
 }
 }

 const currentTiers = tiersForCore();

 const showConfirmCheckbox = abnValid && !abnLookupLoading && (
 abnLookup?.status === "active" ||
 abnLookup?.status === "skipped" ||
 abnLookup?.status === "error" ||
 abnLookup === null
 );

 // ── Render ───────────────────────────────────────────────────────────────

 return (
 <>
 <EnterpriseModal isOpen={enterpriseModalOpen} onClose={() => setEnterpriseModalOpen(false)} />
 <main
 className="auth-theme relative flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 py-10 sm:py-16 [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,sans-serif]"
 >
 <Link href="/" className="absolute left-4 top-4 flex items-center gap-1.5 text-sm text-neutral-400 transition hover:text-white">
 <ArrowLeft size={15} />
 Back to homepage
 </Link>
 <div
 className="auth-card mx-auto flex w-full max-w-2xl flex-col rounded-2xl border border-neutral-800 bg-[#111111] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] sm:p-10"
 style={{ minHeight: "640px" }}
 >
 <div className="mb-4 flex justify-center">
 <Image src="/servlo-master-white.svg" alt="SERVLO" width={140} height={40} unoptimized
 className="drop-shadow-[0_0_28px_rgba(255,255,255,0.2)] h-10 w-auto" />
 </div>
 <h1 className="text-xl font-bold text-white sm:text-3xl">
 Create your account
 </h1>
 <p className="mt-2 text-sm text-slate-400">
 Create your account and set up your business in minutes.
 </p>

 {/* Step indicator: 5 segments */}
 <div className="mt-4 flex items-center gap-1">
 {([1, 2, 3, 4, 5] as const).map((s) => (
 <div
 key={s}
 className={`h-1 flex-1 rounded-full transition-colors ${
 s < step ? "bg-white" : s === step ? "bg-white/60" : "bg-neutral-700"
 }`}
 />
 ))}
 </div>


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
 <label htmlFor="name" className="mb-1 block text-sm font-medium text-zinc-300">
 Full name
 </label>
 <input
 id="name" name="name" value={nameInput}
 onChange={(e) => { setNameInput(e.target.value); if (fieldErrors.name) clearFieldError("name"); }}
 onBlur={handleNameBlur}
 required
 className={`${inputBase} ${fieldErrors.name ? inputErr : inputOk}`}
 />
 {fieldErrors.name ? <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p> : null}
 </div>
 <div>
 <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-300">
 Email
 </label>
 <input
 id="email" name="email" type="email" autoComplete="email"
 value={emailInput}
 onChange={(e) => { setEmailInput(e.target.value); if (fieldErrors.email) clearFieldError("email"); }}
 onBlur={handleEmailBlur}
 required
 className={`${inputBase} ${fieldErrors.email ? inputErr : inputOk}`}
 />
 {fieldErrors.email ? <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p> : null}
 </div>
 <div className="sm:col-span-2">
 <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-300">
 Password
 </label>
 <input
 id="password" name="password" type="password" autoComplete="new-password"
 value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
 required
 className={`${inputBase} ${inputOk}`}
 />
 <PasswordStrengthHints rules={passwordRules} />
 </div>

 <div>
 <div className="mb-1 flex items-center justify-between">
 <label htmlFor="business_name" className="block text-sm font-medium text-zinc-300">
 Business name
 </label>
 <span className={`text-xs ${businessNameInput.length > 80 ? (businessNameInput.length > 100 ? "text-red-400" : "text-amber-400") : "text-zinc-500"}`}>
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
 className={`${inputBase} ${fieldErrors.businessName ? inputErr : inputOk}`}
 />
 {fieldErrors.businessName ? <p className="mt-1 text-xs text-red-400">{fieldErrors.businessName}</p> : null}
 </div>

 {/* ABN */}
 <div>
 <label htmlFor="abn" className="mb-1 block text-sm font-medium text-zinc-300">
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
 `${inputBase} pr-9`,
 abnHas11
 ? abnValid ? "border-emerald-500" : "border-red-500"
 : "border-neutral-700 focus:border-white"
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
 <p className="mt-1 text-xs font-medium text-red-400">Invalid ABN. Please check the number.</p>
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
 Looking up ABN in the Australian Business Register.
 </span>
 ) : abnLookup?.status === "active" ? (
 <span className="font-semibold text-emerald-400">
 ✓ {abnLookup.entityName}. ABN active.
 </span>
 ) : abnLookup?.status === "inactive" ? (
 <span className="text-amber-400">
 ⚠ {abnLookup.entityName}. This ABN is not currently active.
 </span>
 ) : abnLookup?.status === "not_found" ? (
 <span className="text-amber-400">
 ⚠ ABN not found in the Australian Business Register.
 </span>
 ) : (
 <span className="font-semibold text-emerald-400">
 ✓ Valid ABN. Enter your registered business name above to confirm.
 </span>
 )}
 </div>
 ) : null}

 {/* Confirm checkbox, only when box shows active or fallback text */}
 {showConfirmCheckbox ? (
 <label className="mt-2 flex cursor-pointer items-start gap-2">
 <input
 type="checkbox"
 checked={abnConfirmed}
 onChange={(e) => setAbnConfirmed(e.target.checked)}
 className="mt-0.5 h-4 w-4 shrink-0 accent-white"
 />
 <span className="text-xs text-slate-300">I confirm this is my business ABN</span>
 </label>
 ) : null}
 </div>

 {/* Phone, AU only with static prefix */}
 <div className="sm:col-span-2">
 <label htmlFor="phone_number" className="mb-1 block text-sm font-medium text-zinc-300">
 Phone number
 </label>
 <div className={`flex h-11 items-center overflow-hidden rounded-lg border bg-white/[0.06] transition ${fieldErrors.phone ? "border-red-500 focus-within:border-red-500" : "border-neutral-700 focus-within:border-white"}`}>
 <span className="select-none border-r border-white/15 bg-white/[0.08] px-3 text-sm text-zinc-300 h-full flex items-center gap-1.5 shrink-0">
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
 className="h-full flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-zinc-500"
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
 className={`w-full sm:w-auto ${primaryBtn} disabled:pointer-events-none disabled:opacity-50`}
 >
 Continue
 </Button>
 </div>
 </div>

 {/* ── Step 2: Industries (categorised) ───────────────────────── */}
 <div className={step === 2 ? "space-y-4" : "hidden"} aria-hidden={step !== 2}>
 <div>
 <h2 className="text-lg font-semibold text-white">
 What industries do you serve?
 </h2>
 <p className="mt-1 text-sm text-slate-400">
 Select all that apply. We&apos;ll tailor your workspace. You can change this later.
 </p>
 </div>

 {/* Search */}
 <input
 type="text"
 placeholder="Search your industry..."
 value={industrySearch}
 onChange={(e) => setIndustrySearch(e.target.value)}
 className={`${inputBase} ${inputOk}`}
 />

 {/* Selected counter */}
 {selectedChipIds.size > 0 ? (
 <p className="text-xs font-semibold text-slate-400">
 Selected: {selectedChipIds.size} {selectedChipIds.size === 1 ? "industry" : "industries"}
 </p>
 ) : null}

 {/* Categorised chip grid */}
 <div className="max-h-72 space-y-4 overflow-y-auto rounded-lg border border-neutral-700 bg-white/[0.03] p-4">
 {filteredCategories.length === 0 ? (
 <p className="text-sm text-slate-500">No industries match your search.</p>
 ) : (
 filteredCategories.map((cat) => (
 <div key={cat.name} className="space-y-2">
 <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
 {cat.name}
 </p>
 <div className="flex flex-wrap gap-2">
 {cat.chips.map((chip) => {
 const on = selectedChipIds.has(chip.id);
 return (
 <button
 key={chip.id}
 type="button"
 onClick={() => toggleChip(chip.id)}
 className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-medium transition ${
 on
 ? "border-white bg-white text-black"
 : "border-white/20 bg-white/[0.04] text-slate-300 hover:border-white/40"
 }`}
 >
 {on ? <Check size={10} strokeWidth={3} aria-hidden /> : null}
 {chip.label}
 </button>
 );
 })}
 </div>
 </div>
 ))
 )}
 </div>

 {/* Custom note for "Other" */}
 {needsOtherNote ? (
 <div>
 <label htmlFor="industry_other_field" className="mb-1 block text-sm font-medium text-zinc-300">
 Tell us about your business
 </label>
 <textarea
 id="industry_other_field"
 value={otherNote}
 onChange={(e) => setOtherNote(e.target.value)}
 rows={3}
 className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none bg-white/[0.06] text-white placeholder-zinc-500 ${inputOk}`}
 placeholder="e.g. Plumbing and gas fitting across Adelaide"
 />
 </div>
 ) : null}

 <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
 <Button type="button" variant="dark-ghost" onClick={handleBack} className="w-full sm:w-auto">Back</Button>
 <div className="flex gap-2">
 <Button type="button" variant="dark-ghost" onClick={handleContinueFromIndustries} className="flex-1 text-slate-400 text-sm sm:flex-none">
 Skip
 </Button>
 <Button type="button" onClick={handleContinueFromIndustries} className={`flex-1 sm:flex-none ${primaryBtn}`}>Continue</Button>
 </div>
 </div>
 </div>

 {/* ── Step 3: Product selection (4 cards, 2x2 grid) ─────────── */}
 <div className={step === 3 ? "space-y-5" : "hidden"} aria-hidden={step !== 3}>
 <div>
 <h2 className="text-lg font-semibold text-white">
 Choose your plan
 </h2>
 <p className="mt-1 text-sm text-slate-400">
 Start with Core. Add Grow and Leads when they launch.
 </p>
 </div>

 <div className="grid gap-3 sm:grid-cols-2">
 {PRODUCT_CARDS.map((card) => {
 const isCore = card.id === "core";
 const isSelected = isCore; // Core is always selected; nothing else is selectable.
 const badgeClass =
 card.badgeTone === "green"
 ? "bg-emerald-500/15 text-emerald-300"
 : card.badgeTone === "amber"
 ? "bg-amber-500/15 text-amber-300"
 : "bg-neutral-700 text-neutral-300";
 return (
 <div
 key={card.id}
 className="relative"
 onMouseEnter={() => { if (!card.available) setHoveredCardId(card.id); }}
 onMouseLeave={() => setHoveredCardId(null)}
 >
 <button
 type="button"
 onClick={() => {
 // Core is always selected; locked cards are not interactive.
 }}
 disabled={!card.available}
 aria-disabled={!card.available}
 className={`relative flex w-full flex-col overflow-hidden rounded-xl p-4 text-left transition disabled:cursor-not-allowed ${
 !card.available ? "opacity-60" : ""
 }`}
 style={{
 background: "#0a0a0a",
 border: isSelected
 ? "2px solid rgba(255,255,255,0.75)"
 : "2px solid #262626",
 boxShadow: isSelected
 ? "0 0 20px rgba(255,255,255,0.08)"
 : undefined,
 }}
 >
 {/* Top accent bar */}
 <div
 className="absolute left-0 right-0 top-0 h-[3px] rounded-t-xl"
 style={{ background: isSelected ? "rgba(255,255,255,0.8)" : "#262626" }}
 />

 {/* Status icon: checkmark for selected Core, lock for locked */}
 {isSelected ? (
 <span
 className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white"
 >
 <Check size={11} strokeWidth={3} className="text-black" />
 </span>
 ) : (
 <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-neutral-600">
 <Lock size={11} aria-hidden />
 </span>
 )}

 {/* Locked overlay */}
 {!card.available ? (
 <div className="absolute inset-0 rounded-xl bg-neutral-950/40" />
 ) : null}

 <div className="relative pt-1">
 <p className="text-sm font-bold text-white">{card.name}</p>
 <p className="mt-1 text-xs text-slate-300">{card.description}</p>
 <p className="mt-3 text-xs font-semibold text-slate-200">{card.price}</p>
 <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
 {card.badgeText}
 </span>
 </div>
 </button>

 {/* Hover tooltip for locked cards */}
 {!card.available && hoveredCardId === card.id && card.tooltip ? (
 <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-medium text-slate-300 shadow-xl">
 {card.tooltip}
 </div>
 ) : null}
 </div>
 );
 })}
 </div>

 <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
 <Button type="button" variant="dark-ghost" onClick={handleBack} className="w-full sm:w-auto">Back</Button>
 {/* Core is always selected. Continue is always enabled */}
 <Button type="button" onClick={handleContinueFromProducts} className={`w-full sm:w-auto ${primaryBtn}`}>Continue</Button>
 </div>
 </div>

 {/* ── Step 4: Plan tier ────────────────────────────────────── */}
 <div className={step === 4 ? "space-y-4" : "hidden"} aria-hidden={step !== 4}>
 <div>
 <h2 className="text-lg font-semibold text-white">
 Choose your plan
 </h2>
 <p className="mt-1 text-sm text-slate-400">
 Founding 50 members lock in their price for life. 30-day money-back guarantee on every plan.
 </p>
 </div>

 {/* Selected product banner (Core only; uses core-blue accent) */}
 <div
 className="rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2.5"
 >
 <p className="text-xs text-slate-300">Selected product</p>
 <p className="text-sm font-semibold text-white">SERVLO Core</p>
 </div>

 {/* Billing frequency toggle */}
 <div className="flex items-center justify-center gap-1 rounded-xl border border-neutral-600 bg-neutral-900 p-1 w-fit mx-auto">
 <button
 type="button"
 onClick={() => setBillingFrequency("monthly")}
 className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
 !isAnnual
 ? "bg-white text-black shadow"
 : "text-slate-400 hover:text-slate-200"
 }`}
 >
 Monthly
 </button>
 <button
 type="button"
 onClick={() => setBillingFrequency("annual")}
 className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
 isAnnual
 ? "bg-white text-black shadow"
 : "text-slate-400 hover:text-slate-200"
 }`}
 >
 Annual
 <span className="ml-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
 Save 17%
 </span>
 </button>
 </div>

 <div className="grid gap-3 sm:grid-cols-2">
 {currentTiers.map((tier) => {
 const on = selectedPlanTier === tier.id;
 const isEnterprise = tier.id === "enterprise";
 const annualInfo = ANNUAL_DISPLAY[tier.id];
 if (isEnterprise) {
 return (
 <button
 key={tier.id} type="button"
 onClick={() => setEnterpriseModalOpen(true)}
 className="relative flex flex-col items-start gap-2 rounded-lg border-2 border-neutral-500 p-4 text-left transition hover:border-neutral-400"
 >
 <div className="flex items-baseline gap-1">
 <span className="text-xl font-bold text-slate-100">{tier.price}</span>
 </div>
 <p className="text-sm font-semibold text-slate-200">{tier.name}</p>
 <p className="text-xs text-slate-400">{tier.description}</p>
 <ul className="mt-1 space-y-0.5">
 {tier.features.map((f) => (
 <li key={f} className="flex items-center gap-1.5 text-xs text-slate-300">
 <Check size={11} className="shrink-0 text-white" strokeWidth={3} aria-hidden />
 {f}
 </li>
 ))}
 </ul>
 <span className="mt-1 text-xs font-semibold text-white">Contact us →</span>
 </button>
 );
 }
 return (
 <button
 key={tier.id} type="button"
 onClick={() => setSelectedPlanTier(tier.id)}
 className={`relative flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition ${
 on
 ? "border-white bg-black/60 ring-2 ring-white/30"
 : "border-neutral-500 hover:border-neutral-400"
 }`}
 >
 {tier.recommended ? (
 <span className="absolute right-3 top-2 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
 Most popular
 </span>
 ) : null}
 {isAnnual && annualInfo ? (
 <div>
 <div className="flex items-baseline gap-1">
 <span className="text-xl font-bold text-slate-100">{annualInfo.mo}</span>
 <span className="text-xs text-slate-400">/ month</span>
 </div>
 <p className="text-xs text-slate-500">{annualInfo.yr}/yr billed annually</p>
 </div>
 ) : (
 <div className="flex items-baseline gap-1">
 <span className="text-xl font-bold text-slate-100">{tier.price}</span>
 <span className="text-xs text-slate-400">/ month</span>
 </div>
 )}
 <p className="text-sm font-semibold text-slate-200">{tier.name}</p>
 <p className="text-xs text-slate-400">{tier.description}</p>
 <ul className="mt-1 space-y-0.5">
 {tier.features.map((f) => (
 <li key={f} className="flex items-center gap-1.5 text-xs text-slate-300">
 <Check size={11} className="shrink-0 text-white" strokeWidth={3} aria-hidden />
 {f}
 </li>
 ))}
 </ul>
 </button>
 );
 })}
 </div>

 <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
 <Button type="button" variant="dark-ghost" onClick={handleBack} className="w-full sm:w-auto">Back</Button>
 <Button type="button" onClick={handleContinueFromPlanTier} className={`w-full sm:w-auto ${primaryBtn}`}>Continue</Button>
 </div>
 </div>

 {/* ── Step 5: Trial / Stripe ───────────────────────────────── */}
 <div className={step === 5 ? "space-y-5" : "hidden"} aria-hidden={step !== 5}>
 <div>
 <h2 className="text-lg font-semibold text-white">
 {needsCard ? "Almost there. Payment details" : "Reserve your spot"}
 </h2>
 <p className="mt-1 text-sm text-slate-400">
 {needsCard
 ? "You'll be charged today. 30-day money-back guarantee if it's not for you."
 : "This product is coming soon. Reserve your spot and we'll notify you at launch."}
 </p>
 </div>

 {/* Founder auto-apply banner — surfaces the discount up front so the user
     knows they got the deal without having to dig through the promo code
     section. Renders only when the promo validated successfully. */}
 {needsCard && appliedPromoCode === "EARLYACCESS" && promoResult?.valid ? (
 <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
 <div className="flex items-start gap-3">
 <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/30">
 <Check size={12} className="text-emerald-300" strokeWidth={3} aria-hidden />
 </div>
 <div className="flex-1">
 <p className="text-sm font-bold text-emerald-200">
 Founding 50 discount applied
 </p>
 <p className="mt-0.5 text-xs text-emerald-300/90">
 <span className="font-mono font-semibold">EARLYACCESS</span> auto-applied
 {promoResult.discount ? <> &middot; {promoResult.discount}</> : null}
 . Your founding rate is locked in for life.
 </p>
 </div>
 </div>
 </div>
 ) : null}

 {/* Annual billing toggle (repeated on payment step) */}
 {needsCard && (
 <div className="flex items-center justify-center gap-1 rounded-xl border border-neutral-600 bg-neutral-900 p-1 w-fit">
 <button
 type="button"
 onClick={() => setBillingFrequency("monthly")}
 className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
 !isAnnual
 ? "bg-white text-black shadow"
 : "text-slate-400 hover:text-slate-200"
 }`}
 >
 Monthly
 </button>
 <button
 type="button"
 onClick={() => setBillingFrequency("annual")}
 className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
 isAnnual
 ? "bg-white text-black shadow"
 : "text-slate-400 hover:text-slate-200"
 }`}
 >
 Annual
 <span className="ml-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
 Save 17%
 </span>
 </button>
 </div>
 )}

 {/* Summary */}
 <div className="rounded-lg border border-neutral-800 bg-white/[0.04] px-4 py-3">
 <div className="flex items-start justify-between">
 <div>
 <p className="text-sm font-semibold text-white">SERVLO Core</p>
 <p className="text-xs text-slate-400 capitalize">
 {selectedPlanTier} · {isAnnual ? "Annual" : "Monthly"}
 </p>
 </div>
 <div className="text-right">
 {(() => {
 const annualInfo = ANNUAL_DISPLAY[selectedPlanTier];
 if (isAnnual && annualInfo) {
 return (
 <>
 <p className="text-sm font-bold text-white">{annualInfo.mo}<span className="text-xs font-normal text-slate-400">/mo</span></p>
 <p className="text-xs text-slate-500">{annualInfo.yr}/yr billed annually</p>
 </>
 );
 }
 const tier = currentTiers.find((t) => t.id === selectedPlanTier);
 const tierPrice = tier?.price ?? "TBA";
 const hasUnit = tierPrice.includes("/");
 return (
 <p className="text-sm font-bold text-white">
 {tierPrice}{!hasUnit ? <span className="text-xs font-normal text-slate-400">/mo</span> : null}
 </p>
 );
 })()}
 {needsCard ? (
 <p className="text-xs text-emerald-400">30-day money-back</p>
 ) : (
 <p className="text-xs text-slate-400">Reserve. No charge.</p>
 )}
 {promoResult?.valid && appliedPromoCode && (
 <p className="text-xs text-emerald-400 mt-0.5">+ {promoResult.discount}</p>
 )}
 </div>
 </div>
 </div>

 {/* EARLYACCESS + annual conflict warning */}
 {earlyAccessConflict && (
 <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-300">
 The EARLYACCESS founding member discount applies to monthly plans only. Switch to monthly to use EARLYACCESS, or continue with annual pricing without the discount.
 </div>
 )}

 {/* Stripe card element (Core + known price only) */}
 {needsCard ? (
 <div>
 <label className="mb-2 block text-sm font-medium text-zinc-300">Card details</label>
 {stripeInitError ? (
 <div className="rounded-md border border-red-700/50 bg-red-950/30 px-3 py-3 text-sm text-red-300">
 Card input failed to load. Please refresh the page or contact{" "}
 <a href="mailto:support@servlo.com.au" className="underline">support@servlo.com.au</a>.
 </div>
 ) : (
 <div className="relative">
 <div
 ref={cardMountRef}
 className="rounded-lg border border-neutral-700 bg-white/[0.06] px-3 py-3.5 focus-within:border-white transition"
 style={{ minHeight: "44px" }}
 />
 {!stripeReady && (
 <div className="pointer-events-none absolute inset-0 flex items-center px-3">
 <span className="text-sm text-slate-500">Loading card input…</span>
 </div>
 )}
 </div>
 )}
 <p className="mt-1.5 text-xs text-slate-500">
 Secured by Stripe. Cancel anytime, full refund in the first 30 days.
 </p>

 {/* Promo code */}
 {!promoOpen ? (
 <button
 type="button"
 onClick={() => setPromoOpen(true)}
 className="mt-2 text-xs text-slate-400 hover:text-slate-200 underline"
 >
 Have a promo code?
 </button>
 ) : (
 <div className="mt-3 space-y-2">
 <div className="flex gap-2">
 <input
 type="text"
 value={promoCodeInput}
 onChange={(e) => {
 setPromoCodeInput(e.target.value.toUpperCase());
 setPromoResult(null);
 if (appliedPromoCode) setAppliedPromoCode("");
 }}
 placeholder="PROMO CODE"
 className={`flex-1 rounded-lg border px-3 py-2 text-sm font-mono uppercase transition focus:outline-none bg-white/[0.06] text-white placeholder:text-zinc-500 ${inputOk}`}
 />
 <button
 type="button"
 onClick={applyPromoCode}
 disabled={promoLoading || !promoCodeInput.trim()}
 className="rounded-md border border-neutral-500 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-neutral-800 disabled:opacity-50"
 >
 {promoLoading ? "…" : "Apply"}
 </button>
 </div>
 {promoResult && (
 <p className={`text-xs ${promoResult.valid ? "text-emerald-400" : "text-red-400"}`}>
 {promoResult.valid
 ? `✓ ${promoResult.discount}`
 : promoResult.error ?? "Invalid code"}
 </p>
 )}
 {earlyAccessConflict && promoResult?.valid && (
 <p className="text-xs text-amber-400">
 EARLYACCESS only works with monthly billing. Switch to monthly above to apply this discount.
 </p>
 )}
 </div>
 )}
 </div>
 ) : null}

 {/* Terms of Service + Privacy Policy checkbox */}
 <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-neutral-800 bg-white/[0.03] px-3 py-2.5">
 <input
 type="checkbox"
 checked={termsAccepted}
 onChange={(e) => setTermsAccepted(e.target.checked)}
 className="mt-0.5 h-4 w-4 shrink-0 accent-white"
 />
 <span className="text-xs text-slate-300">
 I agree to the{" "}
 <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-white underline hover:text-neutral-300">
 Terms of Service
 </Link>{" "}
 and{" "}
 <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-white underline hover:text-neutral-300">
 Privacy Policy
 </Link>
 .
 </span>
 </label>

 <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
 <Button type="button" variant="dark-ghost" onClick={handleBack} disabled={ownerSubmitting} className="w-full sm:w-auto">
 Back
 </Button>
 <Button
 type="button"
 onClick={() => doSignup()}
 disabled={ownerSubmitting || !termsAccepted}
 className={`w-full sm:w-auto ${primaryBtn} disabled:pointer-events-none disabled:opacity-50`}
 >
 {ownerSubmitting
 ? "Setting up..."
 : needsCard
 ? "Sign Up"
 : "Reserve My Spot"}
 </Button>
 </div>
 </div>
 </form>

 <p className="mt-5 text-sm text-slate-400">
 Already have an account?{" "}
 <Link href="/auth/login" className="font-semibold text-white hover:text-neutral-300">
 Sign in
 </Link>
 </p>
 </div>
 </main>
 </>
 );
}
