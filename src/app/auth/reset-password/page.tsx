"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { ThemeToggleCorner } from "@/components/theme-toggle-corner";

export default function ResetPasswordPage() {
  const [phase, setPhase] = useState<"checking" | "ready" | "invalid">("checking");
  const settledRef = useRef(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowser();

    const finish = () => {
      if (settledRef.current) return;
      settledRef.current = true;
      setPhase("ready");
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session?.user) finish();
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || (session?.user && event === "SIGNED_IN")) {
        finish();
      }
    });

    const t = window.setTimeout(() => {
      if (cancelled || settledRef.current) return;
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled || settledRef.current) return;
        if (session?.user) {
          finish();
          return;
        }
        setPhase((p) => (p === "checking" ? "invalid" : p));
      });
    }, 2400);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      data.subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!password.trim()) {
      setError("Enter a new password.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setWorking(true);
    const supabase = createSupabaseBrowser();
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setWorking(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    window.location.href = "/auth/login?success=" + encodeURIComponent("Password updated successfully");
  }

  return (
    <>
      <ThemeToggleCorner />
      <main className="auth-theme relative flex min-h-screen items-center justify-center bg-[#F4F4F5] px-4 py-10 dark:bg-[#0A0A0A] sm:py-16">
        <div className="auth-card mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none dark:backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex justify-center">
            <Image src="/servlo-master-dark.svg" alt="SERVLO" width={140} height={36} priority unoptimized
              className="block dark:hidden drop-shadow-[0_0_32px_rgba(0,0,0,0.35)]" />
            <Image src="/servlo-master-white.svg" alt="SERVLO" width={140} height={36} priority unoptimized
              className="hidden dark:block drop-shadow-[0_0_28px_rgba(255,255,255,0.2)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Set a new password</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Choose a strong password you haven&apos;t used elsewhere.
          </p>

          {phase === "checking" ? (
            <p className="mt-8 text-sm text-[var(--text-muted)]">Verifying recovery link…</p>
          ) : null}

          {phase === "invalid" ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-red-700 dark:text-red-300">
                This reset link is invalid or has expired. Request a new one from sign in.
              </p>
              <Link href="/auth/login" className="inline-block font-semibold text-[var(--accent-color)] hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : null}

          {phase === "ready" ? (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="npw" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                  New password
                </label>
                <input
                  id="npw"
                  type="password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  autoComplete="new-password"
                  required
                  className="h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder-zinc-500 dark:focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="npw2" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                  Confirm password
                </label>
                <input
                  id="npw2"
                  type="password"
                  value={confirm}
                  onChange={(ev) => setConfirm(ev.target.value)}
                  autoComplete="new-password"
                  required
                  className="h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder-zinc-500 dark:focus:border-blue-500"
                />
              </div>
              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              <Button
                type="submit"
                disabled={working}
                className="w-full bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)]"
              >
                {working ? "Updating…" : "Update password"}
              </Button>
            </form>
          ) : null}

          <p className="mt-6 text-sm text-[var(--text-secondary)]">
            <Link href="/auth/login" className="font-semibold text-[var(--accent-color)] hover:underline">
              Sign in instead
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
