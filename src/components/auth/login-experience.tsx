"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { authUrl } from "@/lib/auth/site-origin";
import { AlertTriangle, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";

type Props = {
  emailValue: string;
  rememberMeChecked: boolean;
  signInAction: (formData: FormData) => Promise<void>;
  flashError?: string;
  flashSuccess?: string;
};

function mapSignInError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "Incorrect email or password. Please try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please check your email and confirm your account before signing in.";
  }
  return raw;
}

const inputCls =
  "h-11 w-full rounded-lg border border-neutral-700 bg-white/[0.06] px-3 text-sm text-white transition " +
  "placeholder-zinc-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20";

export function LoginExperience({
  emailValue,
  rememberMeChecked,
  signInAction: _signInAction,
  flashError,
  flashSuccess,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [resetEmail, setResetEmail] = useState(emailValue);
  const [resetStatus, setResetStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(flashError ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submitResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus(null);
    const email = resetEmail.trim();
    if (!email) { setResetStatus({ ok: false, message: "Enter your email address." }); return; }
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: authUrl("/auth/reset-password") });
    if (error) { setResetStatus({ ok: false, message: error.message }); return; }
    setResetStatus({ ok: true, message: "Check your email for a reset link" });
  };

  async function handleEmailSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const rememberMe = formData.get("remember_me") === "on";
    setSubmitting(true);
    setInlineError(null);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setInlineError(mapSignInError(error.message)); return; }
      const oneYear = 60 * 60 * 24 * 365;
      if (rememberMe) {
        document.cookie = `servlo_remember_email=${encodeURIComponent(email)}; path=/; max-age=${oneYear}; samesite=lax`;
        document.cookie = `servlo_persist_session=true; path=/; max-age=${oneYear}; samesite=lax`;
      } else {
        document.cookie = "servlo_remember_email=; path=/; max-age=0; samesite=lax";
        document.cookie = "servlo_persist_session=false; path=/; max-age=0; samesite=lax";
      }
      router.push("/dashboard/owner");
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 py-10 sm:py-16 [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,sans-serif]">
      <Link href="/" className="absolute left-4 top-4 flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white">
        <ArrowLeft size={15} />
        Back to homepage
      </Link>
      <div className="mx-auto w-full max-w-[480px] rounded-2xl border border-neutral-800 bg-[#111111] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] sm:p-10">

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/servlo-master-white.svg"
            alt="SERVLO"
            width={140}
            height={40}
            priority
            unoptimized
            className="drop-shadow-[0_0_28px_rgba(255,255,255,0.2)] h-10 w-auto"
          />
        </div>

        <h1 className="text-2xl font-bold leading-tight text-white sm:text-[32px]">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-400">Continue your business from where you left off.</p>

        {flashSuccess && (
          <p className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {flashSuccess}
          </p>
        )}

        {mode === "login" ? (
          <>
            {/* Email/password form */}
            <form onSubmit={handleEmailSignIn} className="mt-7 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={emailValue}
                  required
                  autoComplete="email"
                  onChange={() => setInlineError(null)}
                  className={inputCls}
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode("reset"); setResetStatus(null); }}
                    className="text-xs font-semibold text-white hover:text-neutral-300 transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    onChange={() => setInlineError(null)}
                    className={inputCls + " pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input
                  name="remember_me"
                  type="checkbox"
                  defaultChecked={rememberMeChecked}
                  className="h-4 w-4 rounded accent-white"
                />
                Remember me
              </label>

              {inlineError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-700/40 bg-red-900/20 px-3 py-2.5 text-sm text-red-300">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
                  <span>{inlineError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-white text-sm font-semibold text-black transition hover:bg-neutral-100 disabled:opacity-60"
              >
                {submitting ? <><Loader2 size={16} className="mr-2 animate-spin" />Signing in...</> : "Sign in"}
              </button>
            </form>
          </>
        ) : (
          /* Password reset mode */
          <div className="mt-7 space-y-4">
            <button
              type="button"
              onClick={() => { setMode("login"); setResetStatus(null); }}
              className="text-sm font-semibold text-white hover:text-neutral-300 transition"
            >
              &larr; Back to sign in
            </button>
            <p className="text-sm text-slate-400">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            <form onSubmit={submitResetEmail} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(ev) => setResetEmail(ev.target.value)}
                  required
                  autoComplete="email"
                  className={inputCls}
                />
              </div>
              {resetStatus && (
                <p className={`text-sm ${resetStatus.ok ? "text-emerald-400" : "text-red-400"}`}>
                  {resetStatus.message}
                </p>
              )}
              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center rounded-lg bg-white text-sm font-semibold text-black transition hover:bg-neutral-100"
              >
                Send reset link
              </button>
            </form>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-zinc-400 sm:text-sm">
          New to SERVLO?{" "}
          <Link href="/auth/signup" className="font-semibold text-white hover:text-neutral-300 transition">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
