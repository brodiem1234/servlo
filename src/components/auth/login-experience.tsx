"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { authUrl } from "@/lib/auth/site-origin";
import { AlertTriangle, Loader2 } from "lucide-react";

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
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
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

  const onGoogleSignIn = useCallback(async () => {
    setOauthLoading("google");
    setInlineError(null);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setInlineError(error.message || "Unable to connect to Google.");
        setOauthLoading(null);
      }
      // On success the browser redirects — don't reset loading state
    } catch (e) {
      setInlineError(e instanceof Error ? e.message : "Google sign-in failed.");
      setOauthLoading(null);
    }
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
      if (error) {
        setInlineError(error.message || "Unable to connect to Microsoft.");
        setOauthLoading(null);
      }
    } catch (e) {
      setInlineError(e instanceof Error ? e.message : "Microsoft sign-in failed.");
      setOauthLoading(null);
    }
  }, []);

  const submitResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus(null);
    const email = resetEmail.trim();
    if (!email) {
      setResetStatus({ ok: false, message: "Enter your email address." });
      return;
    }
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authUrl("/auth/reset-password"),
    });
    if (error) {
      setResetStatus({ ok: false, message: error.message });
      return;
    }
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

      if (error) {
        setInlineError(mapSignInError(error.message));
        return;
      }

      // Persist remember-me — readable by server component on next visit
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
      setInlineError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const anyOauthLoading = oauthLoading !== null;

  return (
    <main className="auth-theme relative flex min-h-screen items-center justify-center bg-[#f8fafc] px-6 py-16">
      <div className="auth-card mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Image src="/logo.png" alt="SERVLO" width={48} height={48} />
          <span className="text-lg font-bold tracking-wide text-[#1e3a5f] dark:text-white">SERVLO</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-400">
          Access your dashboard and continue managing your business.
        </p>

        {flashSuccess ? (
          <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{flashSuccess}</p>
        ) : null}

        {mode === "login" ? (
          <>
            <div className="mt-6 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={anyOauthLoading}
                onClick={onGoogleSignIn}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white font-medium text-[#374151] shadow-sm hover:bg-slate-50 disabled:opacity-60"
              >
                {oauthLoading === "google" ? (
                  <Loader2 size={18} className="animate-spin shrink-0" />
                ) : (
                  <GoogleLogo />
                )}
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={anyOauthLoading}
                onClick={onMicrosoftSignIn}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white font-medium text-[#374151] shadow-sm hover:bg-slate-50 disabled:opacity-60"
              >
                {oauthLoading === "microsoft" ? (
                  <Loader2 size={18} className="animate-spin shrink-0" />
                ) : (
                  <MicrosoftLogo />
                )}
                Continue with Microsoft
              </Button>
              <p className="text-center text-xs text-slate-500">
                Make sure pop-ups are enabled in your browser for Google and Microsoft sign-in to work.
              </p>
            </div>
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">or</span>
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={emailValue}
                  required
                  onChange={() => setInlineError(null)}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  onChange={() => setInlineError(null)}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => {
                    setMode("reset");
                    setResetStatus(null);
                  }}
                  className="mt-2 block text-xs font-semibold text-[var(--accent-color)] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input
                  name="remember_me"
                  type="checkbox"
                  defaultChecked={rememberMeChecked}
                  className="h-4 w-4 rounded border-slate-300 text-[var(--accent-color)]"
                />
                Remember me
              </label>
              {inlineError ? (
                <div className="flex items-start gap-2.5 rounded-md border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-300">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
                  <span>{inlineError}</span>
                </div>
              ) : null}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[var(--accent-color)] text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setResetStatus(null);
              }}
              className="text-xs font-semibold text-[var(--accent-color)] hover:underline"
            >
              ← Back to sign in
            </button>
            <form onSubmit={submitResetEmail} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(ev) => setResetEmail(ev.target.value)}
                  required
                  autoComplete="email"
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                />
              </div>
              {resetStatus ? (
                <p
                  className={`text-sm ${resetStatus.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}
                >
                  {resetStatus.message}
                </p>
              ) : null}
              <Button
                type="submit"
                className="w-full bg-[var(--accent-color)] text-white transition hover:bg-[var(--accent-hover)]"
              >
                Send reset link
              </Button>
            </form>
          </div>
        )}

        <p className="mt-5 text-sm text-slate-400">
          New to SERVLO?{" "}
          <Link href="/auth/signup" className="font-semibold text-[var(--accent-color)] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
