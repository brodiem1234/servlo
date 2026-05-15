"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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

  const inputCls =
    "h-11 w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 text-sm text-white placeholder-zinc-500 transition " +
    "focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20";

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 py-10 sm:py-16 [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,sans-serif]">
      <Link href="/" className="absolute left-4 top-4 flex items-center gap-1.5 text-sm font-medium text-white/50 transition hover:text-white">
        <ArrowLeft size={15} />
        Back to homepage
      </Link>
      <div className="mx-auto w-full max-w-md rounded-2xl border border-neutral-800 bg-[#111111] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] sm:p-8">
        <div className="mb-6 flex justify-center">
          <Image src="/servlo-master-white.svg" alt="SERVLO" width={140} height={40} priority unoptimized
            className="drop-shadow-[0_0_28px_rgba(255,255,255,0.2)] h-10 w-auto" />
        </div>
        <h1 className="text-2xl font-bold text-white">Set a new password</h1>
        <p className="mt-2 text-sm text-slate-400">
          Choose a strong password you haven&apos;t used elsewhere.
        </p>

        {phase === "checking" ? (
          <p className="mt-8 text-sm text-slate-500">Verifying recovery link…</p>
        ) : null}

        {phase === "invalid" ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-red-400">
              This reset link is invalid or has expired. Request a new one from sign in.
            </p>
            <Link href="/auth/login" className="inline-block font-semibold text-white hover:text-neutral-300 transition">
              Back to sign in
            </Link>
          </div>
        ) : null}

        {phase === "ready" ? (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="npw" className="mb-1 block text-sm font-medium text-slate-400">
                New password
              </label>
              <input
                id="npw"
                type="password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                autoComplete="new-password"
                required
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="npw2" className="mb-1 block text-sm font-medium text-slate-400">
                Confirm password
              </label>
              <input
                id="npw2"
                type="password"
                value={confirm}
                onChange={(ev) => setConfirm(ev.target.value)}
                autoComplete="new-password"
                required
                className={inputCls}
              />
            </div>
            {error ? (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
            ) : null}
            <Button
              type="submit"
              disabled={working}
              className="w-full bg-white text-black hover:bg-neutral-100 disabled:opacity-50"
            >
              {working ? "Updating…" : "Update password"}
            </Button>
          </form>
        ) : null}

        <p className="mt-6 text-sm text-slate-400">
          <Link href="/auth/login" className="font-semibold text-white hover:text-neutral-300 transition">
            Sign in instead
          </Link>
        </p>
      </div>
    </main>
  );
}
