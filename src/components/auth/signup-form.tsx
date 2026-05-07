"use client";

import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, FormEvent, KeyboardEvent, MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { SignupFormState } from "@/app/auth/signup/signup-form-state";
import { signUpAction } from "@/app/auth/signup/signup-actions";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import {
  allPasswordRequirementsMet,
  normalizePasswordStrength,
  abnDigitsFromInput,
  formatAbnDigits,
  formatPhoneInput,
  validatePhoneMinimum,
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
import { BrandAccentSwatches } from "@/components/brand-accent-swatches";
import { DEFAULT_ACCENT_HEX, normalizeAccentColour, type AccentPresetHex } from "@/lib/brand-accent";
import { WorkspaceSetupPreview } from "@/components/auth/workspace-setup-preview";
import {
  buildInitialEnabledFeatures,
  optionalFeaturesForIndustry,
  primaryIndustrySlug,
  recommendedFeaturesForIndustry
} from "@/lib/workspace-features";

const OPTIONS: Array<{ slug: IndustrySlug; label: string; sub: string; Icon: LucideIcon }> = [
  {
    slug: "trades",
    label: "Trades",
    sub: "Electricians, plumbers, builders, landscapers, concreters, painters",
    Icon: HardHat
  },
  {
    slug: "cleaning",
    label: "Cleaning",
    sub: "Residential, commercial, NDIS",
    Icon: Sparkles
  },
  {
    slug: "events",
    label: "Events & hire",
    sub: "Coordinators, AV, equipment hire",
    Icon: PartyPopper
  },
  {
    slug: "marketing",
    label: "Marketing & agencies",
    sub: "Studios, freelancers, digital shops",
    Icon: Megaphone
  },
  {
    slug: "health",
    label: "Health & wellness",
    sub: "Clinics, mobile practitioners, studios",
    Icon: HeartPulse
  },
  {
    slug: "field_services",
    label: "Field services",
    sub: "Pest control, inspections, maintenance",
    Icon: ClipboardList
  },
  {
    slug: "other",
    label: "Other",
    sub: "We'll learn how you work",
    Icon: Tags
  }
];

const initialSignupState: SignupFormState = { error: null };

export type SignupRoleOption = "owner" | "manager" | "employee" | "contractor" | "client";

function passwordHintLabel(rule: PasswordRuleKey): string {
  switch (rule) {
    case "length":
      return "Minimum 8 characters";
    case "upper":
      return "At least one uppercase letter";
    case "number":
      return "At least one number";
    case "noPersonal":
      return "Cannot contain your first name, last name, or email address";
    default:
      return "";
  }
}

function PasswordStrengthHints({ rules }: { rules: PasswordRequirementState }) {
  const order: PasswordRuleKey[] = ["length", "noPersonal", "upper", "number"];
  return (
    <ul className="mt-2 space-y-1 text-[11px] leading-snug" aria-live="polite">
      {order.map((key) => {
        const ok = rules[key];
        return (
          <li
            key={key}
            className={`flex items-center gap-2 ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-[#94a3b8]"}`}
          >
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

function SubmitPrimary({
  children,
  className,
  variant,
  disabled,
  externalPending,
  ...props
}: ComponentProps<typeof Button> & { externalPending?: boolean }) {
  const { pending } = useFormStatus();
  const busy = pending || Boolean(externalPending);
  const mergedDisabled = busy || disabled;
  return (
    <Button type="submit" {...props} className={className} variant={variant} disabled={mergedDisabled}>
      {busy ? "Working…" : children}
    </Button>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [state, formAction] = useFormState(signUpAction, initialSignupState);
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [role, setRole] = useState<SignupRoleOption>("owner");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [abnInput, setAbnInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [selected, setSelected] = useState<IndustrySlug[]>([]);
  const [otherNote, setOtherNote] = useState("");
  const [accentColour, setAccentColour] = useState<AccentPresetHex>(DEFAULT_ACCENT_HEX);
  const [optionalFeatureOn, setOptionalFeatureOn] = useState<Record<string, boolean>>({});
  const [localError, setLocalError] = useState<string | null>(null);
  const [ownerSubmitting, setOwnerSubmitting] = useState(false);

  const needsWizard = role === "owner" || role === "manager";
  const needsInvite = role === "employee" || role === "contractor" || role === "client";
  const passwordRules = useMemo(
    () => normalizePasswordStrength(passwordInput, nameInput, emailInput),
    [passwordInput, nameInput, emailInput]
  );

  const needsOtherNote = selected.includes("other");
  const industriesJson = useMemo(() => JSON.stringify(selected), [selected]);
  const signupPrimaryIndustry = useMemo(
    () => primaryIndustrySlug(selected.length ? selected : ["other"]),
    [selected]
  );
  const signupRecommendedIds = useMemo(() => recommendedFeaturesForIndustry(signupPrimaryIndustry), [signupPrimaryIndustry]);
  const signupOptionalIds = useMemo(() => optionalFeaturesForIndustry(signupPrimaryIndustry), [signupPrimaryIndustry]);
  const signupIndustryHeadline = formatIndustryLabels([signupPrimaryIndustry]) || "SERVLO";
  const displayedError = localError ?? state.error;

  useEffect(() => {
    if (!selected.includes("other")) setOtherNote("");
  }, [selected]);

  useEffect(() => {
    setLocalError(null);
  }, [role]);

  useEffect(() => {
    setStep(1);
  }, [role]);

  function blockAbnKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" || e.key === "Tab" || e.key === "Delete" || e.key.startsWith("Arrow")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^\d$/.test(e.key)) return;
    e.preventDefault();
  }

  function blockPhoneKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const el = e.currentTarget;
    if (e.key === "Backspace" || e.key === "Tab" || e.key === "Delete" || e.key.startsWith("Arrow")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^\d$/.test(e.key)) return;
    if (e.key === "+" && el.selectionStart === 0 && !el.value.includes("+")) return;
    e.preventDefault();
  }

  function validateOwnerStepOne(): string | null {
    if (!allPasswordRequirementsMet(passwordRules)) {
      return "Please meet every password requirement before continuing.";
    }
    if (!validatePhoneMinimum(phoneInput)) {
      return "Phone number must contain at least 10 digits.";
    }
    if (needsWizard) {
      if (abnDigitsFromInput(abnInput).length !== 11) {
        return "ABN must be 11 digits";
      }
    }
    return null;
  }

  function toggleIndustry(slug: IndustrySlug) {
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  function handleContinue(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const form = formRef.current;
    if (!form?.checkValidity()) {
      form?.reportValidity();
      return;
    }
    const gate = validateOwnerStepOne();
    if (gate) {
      setLocalError(gate);
      return;
    }
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
    setStep(4);
  }

  function handleBack(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setStep((s) => (s === 4 ? 3 : s === 3 ? 2 : 1));
  }

  async function handleOwnerSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!needsWizard || step !== 4) return;

    const form = formRef.current;
    if (!form?.checkValidity()) {
      form?.reportValidity();
      return;
    }

    setLocalError(null);
    const gate = validateOwnerStepOne();
    if (gate) {
      setLocalError(gate);
      return;
    }

    setOwnerSubmitting(true);

    try {
      const fd = new FormData(form);
      const fullName = String(fd.get("name") ?? "").trim();
      const email = String(fd.get("email") ?? "").trim();
      const password = String(fd.get("password") ?? "");
      const businessName = String(fd.get("business_name") ?? "").trim();
      const abnRaw = String(fd.get("abn") ?? "").trim();
      const phoneNumber = String(fd.get("phone_number") ?? "").trim();

      if (!email || !password) {
        setLocalError("Email and password are required.");
        return;
      }

      if (!allPasswordRequirementsMet(normalizePasswordStrength(password, fullName, email))) {
        setLocalError("Please meet every password requirement before continuing.");
        return;
      }

      if (!validatePhoneMinimum(phoneNumber)) {
        setLocalError("Phone number must contain at least 10 digits.");
        return;
      }

      if (abnDigitsFromInput(abnRaw).length !== 11) {
        setLocalError("ABN must be 11 digits");
        return;
      }

      const supabase = createSupabaseBrowser();
      const signupIntentRole = role === "manager" ? "manager" : "owner";
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            business_name: businessName,
            abn: abnRaw.replace(/\s/g, ""),
            phone_number: phoneNumber,
            role: signupIntentRole,
            industry_tags: selected.join(","),
            industry_other_note: otherNote || "",
            accent_colour: normalizeAccentColour(accentColour)
          }
        }
      });

      if (authError) {
        console.error("[signup/owner] signUp failed", authError);
        setLocalError(authError.message);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setLocalError(
          "Account signup did not return a user id. If email confirmation is required, check your inbox — otherwise contact support."
        );
        return;
      }

      const accessToken = authData.session?.access_token;
      if (!accessToken) {
        setLocalError(
          "Account created. Confirm your email if your project requires it, then sign in to finish setup."
        );
        return;
      }

      const optionalChosen = new Set(
        signupOptionalIds.filter((id) => Boolean(optionalFeatureOn[id]))
      );
      const workspaceFeaturesEnabled = buildInitialEnabledFeatures(signupPrimaryIndustry, optionalChosen);

      const baseSetupBody = {
        userId,
        businessName,
        abn: abnRaw.replace(/\s/g, ""),
        phone: phoneNumber,
        industries: selected,
        workspaceFeaturesEnabled
      };

      const postSetup = async (accentForInsert: string) => {
        return fetch("/api/setup-business", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ ...baseSetupBody, accentColour: accentForInsert })
        });
      };

      let res = await postSetup(normalizeAccentColour(accentColour));
      let raw = await res.text();
      let parsed: { success?: boolean; businessId?: string; demoSeeded?: boolean; demoSeedError?: string; error?: string };
      try {
        parsed = JSON.parse(raw) as typeof parsed;
      } catch {
        parsed = { error: raw.slice(0, 280) || "Invalid response from server." };
      }

      if (!res.ok || parsed.error) {
        console.warn("[signup/owner] setup-business failed — retrying with default teal", res.status, parsed);
        res = await postSetup(DEFAULT_ACCENT_HEX);
        raw = await res.text();
        try {
          parsed = JSON.parse(raw) as typeof parsed;
        } catch {
          parsed = { error: raw.slice(0, 280) || "Invalid response from server." };
        }
      }

      if (!res.ok || parsed.error) {
        console.error("[signup/owner] setup-business failed after teal retry — continuing to dashboard", parsed);
        router.push("/dashboard/owner");
        router.refresh();
        return;
      }

      if (parsed.demoSeeded !== true) {
        try {
          const demoRes = await fetch("/api/setup-business", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({ userId, demoOnly: true })
          });
          if (!demoRes.ok) {
            console.warn("[signup/owner] demo-only seed retry failed", demoRes.status, await demoRes.text());
          }
        } catch (demoErr) {
          console.warn("[signup/owner] demo-only seed retry threw", demoErr);
        }
      }

      router.push("/dashboard/owner");
      router.refresh();
    } catch (err) {
      console.error("[signup/owner] unexpected error", err);
      setLocalError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setOwnerSubmitting(false);
    }
  }

  const accentBtn = "bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)]";
  const industrySelectedRing =
    "border-[var(--accent-color)] bg-[color-mix(in_srgb,var(--accent-color)_14%,transparent)] ring-2 ring-[color-mix(in_srgb,var(--accent-color)_45%,transparent)]";

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

        {displayedError ? (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200 whitespace-pre-wrap break-words">
            {displayedError}
          </p>
        ) : null}

        <form
          ref={formRef}
          action={needsInvite ? formAction : undefined}
          onSubmit={needsWizard ? handleOwnerSignup : undefined}
          className="mt-6 space-y-6"
        >
          <input type="hidden" name="industry_tags_json" value={needsWizard ? industriesJson : "[]"} />
          <input type="hidden" name="industry_other_note" value={needsWizard ? otherNote : ""} />
          {needsInvite ? (
            <input type="hidden" name="accent_colour" value={DEFAULT_ACCENT_HEX} readOnly />
          ) : null}

          <div className={step === 1 ? "grid gap-4 sm:grid-cols-2" : "hidden"} aria-hidden={step !== 1}>
            <div className="sm:col-span-2">
              <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-300">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as SignupRoleOption);
                  setStep(1);
                }}
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200"
              >
                <option value="owner">Business Owner</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
                <option value="contractor">Contractor</option>
                <option value="client">Client</option>
              </select>
            </div>
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

            {needsWizard ? (
              <>
                <div>
                  <label htmlFor="business_name" className="mb-1 block text-sm font-medium text-slate-300">
                    Business name
                  </label>
                  <input
                    id="business_name"
                    name="business_name"
                    required
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label htmlFor="abn" className="mb-1 block text-sm font-medium text-slate-300">
                    ABN
                  </label>
                  <input
                    id="abn"
                    name="abn"
                    value={abnInput}
                    inputMode="numeric"
                    autoComplete="off"
                    onKeyDown={blockAbnKeyDown}
                    onChange={(e) => setAbnInput(formatAbnDigits(e.target.value.replace(/\D/g, "")))}
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200"
                    required={needsWizard}
                  />
                  {needsWizard && abnInput.trim() && abnDigitsFromInput(abnInput).length !== 11 ? (
                    <p className="mt-1 text-xs font-medium text-amber-500">ABN must be 11 digits</p>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <input type="hidden" name="business_name" value="" readOnly />
                <input type="hidden" name="abn" value="" readOnly />
                <div className="sm:col-span-2">
                  <label htmlFor="invite_code" className="mb-1 block text-sm font-medium text-slate-300">
                    Invite code
                  </label>
                  <input
                    id="invite_code"
                    name="invite_code"
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value)}
                    autoComplete="off"
                    required
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200"
                  />
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <label htmlFor="phone_number" className="mb-1 block text-sm font-medium text-slate-300">
                Phone number
              </label>
              <input
                id="phone_number"
                name="phone_number"
                value={phoneInput}
                autoComplete="tel"
                inputMode="tel"
                onKeyDown={blockPhoneKeyDown}
                onChange={(e) => setPhoneInput(formatPhoneInput(e.target.value))}
                required
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200"
              />
              {needsWizard || needsInvite ? (
                <>
                  {!validatePhoneMinimum(phoneInput) && phoneInput.trim() !== "" ? (
                    <p className="mt-1 text-xs font-medium text-amber-500">Enter at least 10 digits.</p>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
              {needsWizard ? (
                <Button
                  type="button"
                  onClick={handleContinue}
                  disabled={
                    !allPasswordRequirementsMet(passwordRules) ||
                    !validatePhoneMinimum(phoneInput) ||
                    abnDigitsFromInput(abnInput).length !== 11
                  }
                  className={`w-full sm:w-auto ${accentBtn} disabled:pointer-events-none disabled:opacity-50`}
                >
                  Continue
                </Button>
              ) : (
                <SubmitPrimary
                  disabled={
                    !allPasswordRequirementsMet(passwordRules) ||
                    !validatePhoneMinimum(phoneInput) ||
                    !inviteCodeInput.trim()
                  }
                  className={`w-full sm:ml-auto sm:w-auto ${accentBtn} disabled:pointer-events-none disabled:opacity-50`}
                >
                  Create account
                </SubmitPrimary>
              )}
            </div>
          </div>

          <div className={step === 2 && needsWizard ? "space-y-4" : "hidden"} aria-hidden={step !== 2 || !needsWizard}>
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

          <div className={step === 3 && needsWizard ? "space-y-4" : "hidden"} aria-hidden={step !== 3 || !needsWizard}>
            <WorkspaceSetupPreview
              primaryIndustryLabel={signupIndustryHeadline}
              recommendedIds={signupRecommendedIds}
              optionalIds={signupOptionalIds}
              optionalOn={optionalFeatureOn}
              setOptionalOn={(id, on) => setOptionalFeatureOn((prev) => ({ ...prev, [id]: on }))}
              onBack={handleBack}
              onContinue={handleContinueFromWorkspacePreview}
            />
          </div>

          <div className={step === 4 && needsWizard ? "space-y-4" : "hidden"} aria-hidden={step !== 4 || !needsWizard}>
            <div>
              <h2 className="text-lg font-semibold text-white">Choose your brand colour</h2>
              <p className="mt-1 text-sm text-slate-400">
                Choose your brand colour — you can change this anytime in settings. Default teal is fine if you want to
                move on quickly.
              </p>
            </div>

            <BrandAccentSwatches value={accentColour} onChange={setAccentColour} />

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button type="button" variant="dark-ghost" onClick={handleBack}>
                Back
              </Button>
              <SubmitPrimary
                externalPending={ownerSubmitting}
                disabled={
                  !allPasswordRequirementsMet(passwordRules) ||
                  !validatePhoneMinimum(phoneInput) ||
                  abnDigitsFromInput(abnInput).length !== 11
                }
                className={accentBtn}
              >
                Create account
              </SubmitPrimary>
            </div>
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
