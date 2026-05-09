"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { authUrl } from "@/lib/auth/site-origin";
import { AlertTriangle, Loader2, Eye, EyeOff } from "lucide-react";

type Props = {
  emailValue: string;
  rememberMeChecked: boolean;
  signInAction: (formData: FormData) => Promise<void>;
  flashError?: string;
  flashSuccess?: string;
};

function GoogleLogo() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 21 21" aria-hidden>
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

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
  "h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 transition " +
  "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 " +
  "dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder-zinc-500 " +
  "dark:focus:border-blue-500 dark:focus:ring-blue-500/20";

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
  const [oauthLoading, setOauthLoading] = useState<"google" | "microsoft" | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onGoogleSignIn = useCallback(async () => {
    setOauthLoading("google");
    setInlineError(null);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) { setInlineError(error.message || "Unable to connect to Google."); setOauthLoading(null); }
    } catch (e) { setInlineError(e instanceof Error ? e.message : "Google sign-in failed."); setOauthLoading(null); }
  }, []);

  const onMicrosoftSignIn = useCallback(async () => {
    setOauthLoading("microsoft");
    setInlineError(null);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: { scopes: "email", redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) { setInlineError(error.message || "Unable to connect to Microsoft."); setOauthLoading(null); }
    } catch (e) { setInlineError(e instanceof Error ? e.message : "Microsoft sign-in failed."); setOauthLoading(null); }
  }, []);

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

  const anyOauthLoading = oauthLoading !== null;

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#F4F4F5] px-4 py-16 dark:bg-[#0A0A0A]">
      <div className="mx-auto w-full max-w-[480px] rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none dark:backdrop-blur-xl">

        {/* Logo with glow */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/servlo-master-dark.svg"
            alt="SERVLO"
            width={140}
            height={36}
            priority
            unoptimized
            className="block dark:hidden drop-shadow-[0_0_32px_rgba(0,0,0,0.35)]"
          />
          <Image
            src="/servlo-master-white.svg"
            alt="SERVLO"
            width={140}
            height={36}
            priority
            unoptimized
            className="hidden dark:block drop-shadow-[0_0_28px_rgba(59,130,246,0.55)]"
          />
        </div>

        <h1 className="text-[32px] font-bold leading-tight text-zinc-900 dark:text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-zinc-500">Continue your business from where you left off.</p>

        {flashSuccess && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            {flashSuccess}
          </p>
        )}

        {mode === "login" ? (
          <>
            {/* OAuth buttons */}
            <div className="mt-7 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={anyOauthLoading}
                onClick={onGoogleSignIn}
                className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
              >
                {oauthLoading === "google" ? <Loader2 size={18} className="animate-spin" /> : <GoogleLogo />}
                Continue with Google
              </button>
              <button
                type="button"
                disabled={anyOauthLoading}
                onClick={onMicrosoftSignIn}
                className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200 dark:hover:bg-white/[0.08]"
              >
                {oauthLoading === "microsoft" ? <Loader2 size={18} className="animate-spin" /> : <MicrosoftLogo />}
                Continue with Microsoft
              </button>
            </div>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                or sign in with email
              </span>
              <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
            </div>

            {/* Email/password form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode("reset"); setResetStatus(null); }}
                    className="text-xs font-semibold text-blue-500 hover:text-blue-400"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <input
                  name="remember_me"
                  type="checkbox"
                  defaultChecked={rememberMeChecked}
                  className="h-4 w-4 rounded border-zinc-300 accent-blue-500 dark:border-zinc-600"
                />
                Remember me
              </label>

              {inlineError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-300">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
                  <span>{inlineError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
              >
                {submitting ? <><Loader2 size={16} className="mr-2 animate-spin" />Signing in&hellip;</> : "Sign in"}
              </button>
            </form>
          </>
        ) : (
          /* Password reset mode */
          <div className="mt-7 space-y-4">
            <button
              type="button"
              onClick={() => { setMode("login"); setResetStatus(null); }}
              className="text-sm font-semibold text-blue-500 hover:text-blue-400"
            >
              &larr; Back to sign in
            </button>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            <form onSubmit={submitResetEmail} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                <p className={`text-sm ${resetStatus.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {resetStatus.message}
                </p>
              )}
              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center rounded-lg bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-600"
              >
                Send reset link
              </button>
            </form>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          New to SERVLO?{" "}
          <Link href="/auth/signup" className="font-semibold text-blue-500 hover:text-blue-400">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
