"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent, KeyboardEvent, MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { authUrl } from "@/lib/auth/site-origin";
import {
  allPasswordRequirementsMet,
  normalizePasswordStrength,
  abnDigitsFromInput,
  formatAbnDigits,
  validateAbnChecksum,
  toPhoneE164,
  type PasswordRequirementState,
  type PasswordRuleKey
} from "@/lib/auth/signup-field-validation";
import {
  Check,
  ClipboardList,
  HardHat,
  HeartPulse,
  LucideIcon,
  Megaphone,
  PartyPopper,
  Sparkles,
  Tags
} from "lucide-react";
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

// ── Phone country selector ──────────────────────────────────────────────────

const PHONE_COUNTRIES = [
  { code: "AU", flag: "🇦🇺", dialCode: "61", label: "+61" },
  { code: "NZ", flag: "🇳🇿", dialCode: "64", label: "+64" },
  { code: "GB", flag: "🇬🇧", dialCode: "44", label: "+44" },
  { code: "US", flag: "🇺🇸", dialCode: "1",  label: "+1" },
  { code: "CA", flag: "🇨🇦", dialCode: "1",  label: "+1 CA" },
] as const;
type PhoneCountryCode = typeof PHONE_COUNTRIES[number]["code"];

function formatLocalPhone(value: string, countryCode: PhoneCountryCode): string {
  const digits = value.replace(/\D/g, "");
  if (countryCode === "AU" || countryCode === "NZ") {
    const d = digits.slice(0, 10);
    if (d.length <= 4) return d;
    if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  }
  if (countryCode === "GB") {
    const d = digits.slice(0, 11);
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)} ${d.slice(5)}`;
  }
  // US / CA
  const d = digits.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

function phoneLocalDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isPhoneValid(value: string): boolean {
  return phoneLocalDigits(value).length >= 8;
}

// ── Industry options ────────────────────────────────────────────────────────

const OPTIONS: Array<{ slug: IndustrySlug; label: string; sub: string; Icon: LucideIcon }> = [
  { slug: "trades",        label: "Trades",               sub: "Electricians, plumbers, builders, landscapers, concreters, painters", Icon: HardHat },
  { slug: "cleaning",      label: "Cleaning",             sub: "Residential, commercial, NDIS",                                       Icon: Sparkles },
  { slug: "events",        label: "Events & hire",        sub: "Coordinators, AV, equipment hire",                                   Icon: PartyPopper },
  { slug: "marketing",     label: "Marketing & agencies", sub: "Studios, freelancers, digital shops",                                 Icon: Megaphone },
  { slug: "health",        label: "Health & wellness",    sub: "Clinics, mobile practitioners, studios",                             Icon: HeartPulse },
  { slug: "field_services",label: "Field services",       sub: "Pest control, inspections, maintenance",                             Icon: ClipboardList },
  { slug: "other",         label: "Other",                sub: "We'll learn how you work",                                           Icon: Tags },
];

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

// ── Password hint display ───────────────────────────────────────────────────

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
          <li key={key} className={`flex items-center gap-2 ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-[#94a3b8]"}`}>
            <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${ok ? "bg-emerald-600/15" : "bg-slate-700/40"}`}>
              {ok ? <Check className="h-2.5 w-2.5 text-emerald-600" strokeWidth={3} aria-hidden /> : null}
            </span>
            <span>{passwordHintLabel(key)}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ── Main form component ─────────────────────────────────────────────────────

export function SignupForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Step state (1 = credentials, 2 = industries, 3 = workspace preview)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Credential fields
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [businessNameInput, setBusinessNameInput] = useState("");

  // ABN
  const [abnInput, setAbnInput] = useState("");
  const [abnConfirmed, setAbnConfirmed] = useState(false);

  // Phone
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountryCode>("AU");

  // Industry selection
  const [selected, setSelected] = useState<IndustrySlug[]>([]);
  const [otherNote, setOtherNote] = useState("");

  // Feature toggles
  const [optionalFeatureOn, setOptionalFeatureOn] = useState<Record<string, boolean>>({});

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [ownerSubmitting, setOwnerSubmitting] = useState(false);
  const [oauthWorking, setOauthWorking] = useState(false);

  const oauthRedirect = authUrl("/auth/callback");

  const onGoogleSignUp = useCallback(async () => {
    setOauthWorking(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error: e } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: oauthRedirect } });
      if (e) { window.alert(e.message || "Unable to connect to Google."); setOauthWorking(false); }
    } catch (e) { window.alert(e instanceof Error ? e.message : "Google sign-up failed."); setOauthWorking(false); }
  }, [oauthRedirect]);

  const onMicrosoftSignUp = useCallback(async () => {
    setOauthWorking(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error: e } = await supabase.auth.signInWithOAuth({ provider: "azure", options: { scopes: "email", redirectTo: oauthRedirect } });
      if (e) { window.alert(e.message || "Unable to connect to Microsoft."); setOauthWorking(false); }
    } catch (e) { window.alert(e instanceof Error ? e.message : "Microsoft sign-up failed."); setOauthWorking(false); }
  }, [oauthRedirect]);

  const passwordRules = useMemo(
    () => normalizePasswordStrength(passwordInput, nameInput, emailInput),
    [passwordInput, nameInput, emailInput]
  );

  const abnDigits = abnDigitsFromInput(abnInput);
  const abnHas11  = abnDigits.length === 11;
  const abnValid  = abnHas11 && validateAbnChecksum(abnInput);

  const needsOtherNote = selected.includes("other");
  const industriesJson = useMemo(() => JSON.stringify(selected), [selected]);
  const signupPrimaryIndustry = useMemo(
    () => primaryIndustrySlug(selected.length ? selected : ["other"]),
    [selected]
  );
  const signupRecommendedIds = useMemo(() => recommendedFeaturesForIndustry(signupPrimaryIndustry), [signupPrimaryIndustry]);
  const signupOptionalIds    = useMemo(() => optionalFeaturesForIndustry(signupPrimaryIndustry), [signupPrimaryIndustry]);
  const signupIndustryHeadline = formatIndustryLabels([signupPrimaryIndustry]) || "SERVLO";

  useEffect(() => {
    if (!selected.includes("other")) setOtherNote("");
  }, [selected]);

  // Reset ABN confirmation when ABN changes
  useEffect(() => {
    setAbnConfirmed(false);
  }, [abnInput]);

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

  function validateStep1(): string | null {
    if (!nameInput.trim()) return "Full name is required.";
    if (!emailInput.trim()) return "Email is required.";
    if (!businessNameInput.trim()) return "Business name is required.";
    if (!allPasswordRequirementsMet(passwordRules)) return "Please meet every password requirement before continuing.";
    if (!isPhoneValid(phoneInput)) return "Enter a valid phone number.";
    if (!abnHas11) return "ABN must be 11 digits.";
    if (!abnValid) return "Invalid ABN — please re-enter your 11-digit ABN.";
    if (!abnConfirmed) return "Please confirm your ABN before continuing.";
    return null;
  }

  function toggleIndustry(slug: IndustrySlug) {
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  function handleContinue(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const gate = validateStep1();
    if (gate) { setError(gate); return; }
    setError(null);
    setStep(2);
  }

  function handleContinueFromIndustries(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const nextOptional = Object.fromEntries(signupOptionalIds.map((id) => [id, false]));
    setOptionalFeatureOn(nextOptional);
    setStep(3);
  }

  function handleContinueFromWorkspacePreview(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    formRef.current?.requestSubmit();
  }

  function handleBack(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setError(null);
    setStep((s) => (s === 3 ? 2 : s === 2 ? 1 : 1) as 1 | 2 | 3);
  }

  async function handleOwnerSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step !== 3) return;

    setError(null);

    const gate = validateStep1();
    if (gate) { setError(gate); return; }

    setOwnerSubmitting(true);

    try {
      const selectedCountry = PHONE_COUNTRIES.find((c) => c.code === phoneCountry) ?? PHONE_COUNTRIES[0];
      const phoneE164 = toPhoneE164(phoneInput, selectedCountry.dialCode);
      const abnRaw = abnDigitsFromInput(abnInput); // digits only

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
            accent_colour: DEFAULT_ACCENT_HEX
          }
        }
      });

      if (authError) {
        console.error("[signup/owner] signUp failed", authError);
        setError(authError.message);
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
        setError(
          "Account created. Confirm your email if required, then sign in to finish setup."
        );
        return;
      }

      const optionalChosen = new Set(
        signupOptionalIds.filter((id) => Boolean(optionalFeatureOn[id]))
      );
      const workspaceFeaturesEnabled = buildInitialEnabledFeatures(signupPrimaryIndustry, optionalChosen);

      const setupBody = {
        userId,
        businessName: businessNameInput.trim(),
        abn: abnRaw,
        phone: phoneE164,
        industries: selected,
        workspaceFeaturesEnabled,
        accentColour: DEFAULT_ACCENT_HEX
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
        console.warn("[signup/owner] setup-business failed — retrying with default accent", res.status, parsed);
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
        console.error("[signup/owner] setup-business failed after retry — continuing to dashboard", parsed);
        router.push("/dashboard");
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

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("[signup/owner] unexpected error", err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setOwnerSubmitting(false);
    }
  }

  const accentBtn = "bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)]";
  const industrySelectedRing =
    "border-[var(--accent-color)] bg-[color-mix(in_srgb,var(--accent-color)_14%,transparent)] ring-2 ring-[color-mix(in_srgb,var(--accent-color)_45%,transparent)]";

  const step1Disabled =
    !allPasswordRequirementsMet(passwordRules) ||
    !isPhoneValid(phoneInput) ||
    !abnValid ||
    !abnConfirmed;

  return (
    <>
      <ThemeToggleCorner />
      <main className="auth-theme flex min-h-screen items-center justify-center bg-[#f8fafc] px-6 py-16">
      <div className="auth-card mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex justify-center">
          <Image src="/logo.png" alt="SERVLO" width={64} height={64} />
        </div>
        <h1 className="text-3xl font-bold text-white">Create your account</h1>
        <p className="mt-2 text-sm text-slate-400">
          Start your 30 day free trial and set up your business in minutes.
        </p>

        {/* OAuth — only on step 1 */}
        {step === 1 ? (
          <div className="mt-5 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={oauthWorking}
              onClick={onGoogleSignUp}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white font-medium text-[#374151] shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              <GoogleLogoSmall />
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={oauthWorking}
              onClick={onMicrosoftSignUp}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white font-medium text-[#374151] shadow-sm hover:bg-slate-50 disabled:opacity-60"
            >
              <MicrosoftLogoSmall />
              Continue with Microsoft
            </Button>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">or sign up with email</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200 whitespace-pre-wrap break-words">
            {error}
          </p>
        ) : null}

        <form
          ref={formRef}
          onSubmit={handleOwnerSignup}
          className="mt-6 space-y-6"
        >
          <input type="hidden" name="industry_tags_json" value={industriesJson} />
          <input type="hidden" name="industry_other_note" value={otherNote} />
          <input type="hidden" name="accent_colour" value={DEFAULT_ACCENT_HEX} readOnly />

          {/* ── Step 1: Credentials ── */}
          <div className={step === 1 ? "grid gap-4 sm:grid-cols-2" : "hidden"} aria-hidden={step !== 1}>
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-300">
                Full name
              </label>
              <input
                id="name"
                name="name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200"
              />
              <PasswordStrengthHints rules={passwordRules} />
            </div>

            <div>
              <label htmlFor="business_name" className="mb-1 block text-sm font-medium text-slate-300">
                Business name
              </label>
              <input
                id="business_name"
                name="business_name"
                value={businessNameInput}
                onChange={(e) => setBusinessNameInput(e.target.value)}
                required
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200"
              />
            </div>

            {/* ABN */}
            <div>
              <label htmlFor="abn" className="mb-1 block text-sm font-medium text-slate-300">
                ABN
              </label>
              <div className="relative">
                <input
                  id="abn"
                  name="abn"
                  value={abnInput}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="51 824 753 556"
                  onKeyDown={blockAbnKeyDown}
                  onChange={(e) => setAbnInput(formatAbnDigits(e.target.value.replace(/\D/g, "")))}
                  className={[
                    "h-10 w-full rounded-md border px-3 pr-9 text-sm text-slate-200 transition-colors",
                    abnHas11
                      ? abnValid
                        ? "border-emerald-500"
                        : "border-red-500"
                      : "border-slate-300"
                  ].join(" ")}
                  required
                />
                {abnValid ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" aria-label="Valid ABN">
                    <Check size={15} strokeWidth={3} />
                  </span>
                ) : null}
              </div>
              {abnInput.trim() && !abnHas11 ? (
                <p className="mt-1 text-xs font-medium text-amber-500">ABN must be 11 digits</p>
              ) : abnHas11 && !abnValid ? (
                <p className="mt-1 text-xs font-medium text-red-400">Invalid ABN — please re-enter</p>
              ) : null}
              {/* Confirmation checkbox — only shown when checksum passes */}
              {abnValid ? (
                <label className="mt-2 flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={abnConfirmed}
                    onChange={(e) => setAbnConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent-color)]"
                  />
                  <span className="text-xs text-slate-300">I confirm this is my business ABN</span>
                </label>
              ) : null}
            </div>

            {/* Phone number with country selector */}
            <div className="sm:col-span-2">
              <label htmlFor="phone_number" className="mb-1 block text-sm font-medium text-slate-300">
                Phone number
              </label>
              <div className="flex gap-2">
                <select
                  value={phoneCountry}
                  onChange={(e) => {
                    setPhoneCountry(e.target.value as PhoneCountryCode);
                    setPhoneInput("");
                  }}
                  aria-label="Country code"
                  className="h-10 shrink-0 rounded-md border border-slate-300 px-2 text-sm text-slate-200"
                  style={{ minWidth: "92px" }}
                >
                  {PHONE_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.label}
                    </option>
                  ))}
                </select>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  value={phoneInput}
                  autoComplete="tel-national"
                  inputMode="tel"
                  placeholder="0412 345 678"
                  onKeyDown={blockPhoneKeyDown}
                  onChange={(e) => setPhoneInput(formatLocalPhone(e.target.value, phoneCountry))}
                  required
                  className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm text-slate-200"
                />
              </div>
              {phoneInput.trim() && !isPhoneValid(phoneInput) ? (
                <p className="mt-1 text-xs font-medium text-amber-500">Enter a valid phone number.</p>
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

          {/* ── Step 2: Industries ── */}
          <div className={step === 2 ? "space-y-4" : "hidden"} aria-hidden={step !== 2}>
            <div>
              <h2 className="text-lg font-semibold text-white">What industries do you serve?</h2>
              <p className="mt-1 text-sm text-slate-400">
                Select all that apply — we&apos;ll tailor your dashboard. Optional: skip if you&apos;d rather set this up
                later.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {OPTIONS.map(({ slug, label, sub, Icon }) => {
                const on = selected.includes(slug);
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => toggleIndustry(slug)}
                    className={`flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition ${
                      on ? industrySelectedRing : "border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex w-full items-start gap-2">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                          on
                            ? "border-[var(--accent-color)] bg-[var(--accent-color)] text-white"
                            : "border-slate-500 text-transparent"
                        }`}
                        aria-hidden
                      >
                        ✓
                      </span>
                      <Icon className="h-5 w-5 shrink-0 text-[var(--accent-color)]" aria-hidden />
                      <span className="text-sm font-semibold text-white">{label}</span>
                    </div>
                    <p className="pl-9 text-xs text-slate-400">{sub}</p>
                  </button>
                );
              })}
            </div>

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
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-200"
                  placeholder="e.g. Plumbing and gas fitting across Adelaide"
                />
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button type="button" variant="dark-ghost" onClick={handleBack}>
                Back
              </Button>
              <Button type="button" onClick={handleContinueFromIndustries} className={accentBtn}>
                Continue
              </Button>
            </div>
          </div>

          {/* ── Step 3: Workspace preview / create account ── */}
          <div className={step === 3 ? "space-y-4" : "hidden"} aria-hidden={step !== 3}>
            <WorkspaceSetupPreview
              primaryIndustryLabel={signupIndustryHeadline}
              recommendedIds={signupRecommendedIds}
              optionalIds={signupOptionalIds}
              optionalOn={optionalFeatureOn}
              setOptionalOn={(id, on) => setOptionalFeatureOn((prev) => ({ ...prev, [id]: on }))}
              onBack={handleBack}
              onContinue={handleContinueFromWorkspacePreview}
              submitting={ownerSubmitting}
            />
          </div>
        </form>

        <p className="mt-5 text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-[var(--accent-color)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
    </>
  );
}
