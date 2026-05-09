"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

interface Props {
  token: string;
  invitedEmail: string;
  businessName: string;
  ownerName: string;
  role: string;
  isLoggedIn: boolean;
  loggedInEmail?: string;
}

export function InviteAcceptClient({
  token,
  invitedEmail,
  businessName,
  ownerName,
  role,
  isLoggedIn,
  loggedInEmail,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isExistingAccount = isLoggedIn || (loggedInEmail && loggedInEmail.toLowerCase() === invitedEmail.toLowerCase());

  async function handleAccept() {
    setLoading(true);
    setError(null);
    try {
      const body: { token: string; name?: string; password?: string } = { token };
      if (!isExistingAccount) {
        if (!name.trim()) { setError("Please enter your name."); setLoading(false); return; }
        if (password.length < 8) { setError("Password must be at least 8 characters."); setLoading(false); return; }
        body.name = name.trim();
        body.password = password;
      }

      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json() as { ok?: boolean; error?: string; role?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      if (!isExistingAccount) {
        const supabase = createSupabaseBrowser();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: invitedEmail,
          password,
        });
        if (signInError) {
          throw new Error("Your account was created, but sign-in failed. Please sign in with your new password.");
        }
      }

      setSuccess(true);
      // Redirect to employee dashboard after a moment
      setTimeout(() => {
        router.push("/dashboard/employee");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Check size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-white">You&apos;re in!</h2>
        <p className="text-slate-400">
          You&apos;ve joined <strong className="text-white">{businessName}</strong> as a {role}.<br />
          Redirecting you to your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <p className="text-xs text-slate-400 mb-1">You&apos;ve been invited to</p>
        <p className="font-bold text-white text-lg">{businessName}</p>
        <p className="text-sm text-slate-300 mt-0.5">
          Invited by <strong>{ownerName}</strong> · Role: <strong className="capitalize">{role}</strong>
        </p>
      </div>

      {isExistingAccount ? (
        <p className="text-sm text-slate-400">
          You&apos;re signed in as <strong className="text-white">{loggedInEmail ?? invitedEmail}</strong>.
          Click below to accept.
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-400">
            Create your account to accept the invitation.
            Your email: <strong className="text-white">{invitedEmail}</strong>
          </p>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="h-10 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                value={invitedEmail}
                readOnly
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="h-10 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </>
      )}

      {error && (
        <p className="rounded-lg bg-red-900/30 border border-red-700/50 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        onClick={handleAccept}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Accepting...
          </>
        ) : (
          isExistingAccount ? "Accept invitation" : "Create account and join"
        )}
      </button>
    </div>
  );
}
