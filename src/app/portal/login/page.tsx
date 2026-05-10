"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function PortalLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const sb = createSupabaseBrowser();
      const { error: otpError } = await sb.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/dashboard/client`,
        },
      });
      if (otpError) {
        setError(otpError.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-lg">
        {/* Logo / Brand */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#1e293b]">Client Portal</h1>
          <p className="mt-1 text-sm text-[#64748b]">Powered by SERVLO</p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#dcfce7]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#15803d"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#1e293b]">Check your inbox</h2>
            <p className="text-sm text-[#64748b]">
              We&apos;ve sent a magic link to{" "}
              <span className="font-medium text-[#1e293b]">{email}</span>.
              Click the link to sign in — no password needed.
            </p>
            <p className="text-xs text-[#94a3b8]">
              The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="text-sm text-[#3b82f6] hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="portal-email"
                className="mb-1.5 block text-sm font-medium text-[#374151]"
              >
                Your email address
              </label>
              <input
                id="portal-email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm text-[#1e293b] placeholder-[#9ca3af] shadow-sm focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-[#fecaca] bg-[#fee2e2] px-3 py-2 text-sm text-[#dc2626]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="w-full rounded-lg bg-[#3b82f6] py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Sending link…" : "Send magic link"}
            </button>

            <p className="text-center text-xs text-[#94a3b8]">
              We&apos;ll email you a secure link to access your portal.{" "}
              <br />
              No password required.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
