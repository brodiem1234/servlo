"use client";

import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, FormEvent, MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { SignupFormState } from "@/app/auth/signup/signup-form-state";
import { signUpAction } from "@/app/auth/signup/signup-actions";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import {
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
import { ThemeToggleCorner } from "@/components/theme-toggle-corner";
import { BrandAccentSwatches } from "@/components/brand-accent-swatches";
import { DEFAULT_ACCENT_HEX, normalizeAccentColour, type AccentPresetHex } from "@/lib/brand-accent";

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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<"owner" | "client">("owner");
  const [selected, setSelected] = useState<IndustrySlug[]>([]);
  const [otherNote, setOtherNote] = useState("");
  const [accentColour, setAccentColour] = useState<AccentPresetHex>(DEFAULT_ACCENT_HEX);
  const [localError, setLocalError] = useState<string | null>(null);
  const [ownerSubmitting, setOwnerSubmitting] = useState(false);

  const needsOtherNote = selected.includes("other");
  const industriesJson = useMemo(() => JSON.stringify(selected), [selected]);
  const displayedError = localError ?? state.error;

  useEffect(() => {
    if (!selected.includes("other")) setOtherNote("");
  }, [selected]);

  useEffect(() => {
    setLocalError(null);
  }, [role]);

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
    setStep(2);
  }

  function handleContinueFromIndustries(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setStep(3);
  }

  function handleBack(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setStep((s) => (s === 3 ? 2 : 1));
  }

  async function handleOwnerSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (role !== "owner" || step !== 3) return;

    const form = formRef.current;
    if (!form?.checkValidity()) {
      form?.reportValidity();
      return;
    }

    setLocalError(null);
    setOwnerSubmitting(true);

    try {
      const fd = new FormData(form);
      const fullName = String(fd.get("name") ?? "").trim();
      const email = String(fd.get("email") ?? "").trim();
      const password = String(fd.get("password") ?? "");
      const businessName = String(fd.get("business_name") ?? "").trim();
      const abn = String(fd.get("abn") ?? "").trim();
      const phoneNumber = String(fd.get("phone_number") ?? "").trim();

      if (!email || !password) {
        setLocalError("Email and password are required.");
        return;
      }

      const supabase = createSupabaseBrowser();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            business_name: businessName,
            abn,
            phone_number: phoneNumber,
            role: "owner",
            industry_tags: selected.join(","),
            industry_other_note: otherNote || ""
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

      const baseSetupBody = {
        userId,
        businessName,
        abn,
        phone: phoneNumber,
        industries: selected
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
          action={role === "client" ? formAction : undefined}
          onSubmit={role === "owner" ? handleOwnerSignup : undefined}
          className="mt-6 space-y-6"
        >
          <input type="hidden" name="industry_tags_json" value={industriesJson} />
          <input type="hidden" name="industry_other_note" value={otherNote} />
          {role === "client" ? (
            <input type="hidden" name="accent_colour" value={accentColour} readOnly />
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
                  const r = e.target.value === "client" ? "client" : "owner";
                  setRole(r);
                  setStep(1);
                }}
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200"
              >
                <option value="owner">Business owner</option>
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
                required
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200"
              />
            </div>
            <div>
              <label htmlFor="business_name" className="mb-1 block text-sm font-medium text-slate-300">
                Business name
              </label>
              <input
                id="business_name"
                name="business_name"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200"
              />
            </div>
            <div>
              <label htmlFor="abn" className="mb-1 block text-sm font-medium text-slate-300">
                ABN
              </label>
              <input id="abn" name="abn" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="phone_number" className="mb-1 block text-sm font-medium text-slate-300">
                Phone number
              </label>
              <input
                id="phone_number"
                name="phone_number"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-200"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
              {role === "owner" ? (
                <Button type="button" onClick={handleContinue} className={`w-full sm:w-auto ${accentBtn}`}>
                  Continue
                </Button>
              ) : (
                <SubmitPrimary className={`w-full sm:ml-auto sm:w-auto ${accentBtn}`}>Create account</SubmitPrimary>
              )}
            </div>
          </div>

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

          <div className={step === 3 ? "space-y-4" : "hidden"} aria-hidden={step !== 3}>
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
              <SubmitPrimary externalPending={ownerSubmitting} className={accentBtn}>
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
