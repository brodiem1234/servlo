"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";

type MfaFactor = {
  id: string;
  status: "verified" | "unverified";
  friendly_name: string | null;
  factor_type: string;
};

export default function SecurityPage() {
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const loadFactors = async () => {
    setLoading(true);
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.all ?? []) as MfaFactor[]);
    setLoading(false);
  };

  useEffect(() => { loadFactors(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startEnroll = async () => {
    setError(null);
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator app",
    });
    if (error || !data) {
      setError(error?.message ?? "Enrolment failed");
      setEnrolling(false);
      return;
    }
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setFactorId(data.id);
  };

  const verifyEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || !code) return;
    setVerifying(true);
    setError(null);
    const challengeRes = await supabase.auth.mfa.challenge({ factorId });
    if (challengeRes.error) {
      setError(challengeRes.error.message);
      setVerifying(false);
      return;
    }
    const verifyRes = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeRes.data.id,
      code,
    });
    setVerifying(false);
    if (verifyRes.error) {
      setError(verifyRes.error.message);
      return;
    }
    setQrCode(null);
    setSecret(null);
    setFactorId(null);
    setCode("");
    setEnrolling(false);
    showToast("Two-factor authentication enabled");
    await loadFactors();
  };

  const unenroll = async (id: string) => {
    if (!confirm("Remove this two-factor method? You will need to set it up again to re-enable it.")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) { setError(error.message); return; }
    showToast("2FA method removed");
    await loadFactors();
  };

  const verifiedFactors = factors.filter((f) => f.status === "verified");

  return (
    <section className="space-y-6 max-w-xl">
      <div>
        <a href="/dashboard/owner/settings" className="mb-1 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <span>←</span> Back to Settings
        </a>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Security</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage two-factor authentication to protect your account.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center text-sm text-[var(--text-muted)]">Loading…</div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Two-factor authentication</p>
              <p className="text-xs text-[var(--text-muted)]">
                {verifiedFactors.length > 0
                  ? `${verifiedFactors.length} method enabled`
                  : "Not enabled — your account is protected by password only"}
              </p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${verifiedFactors.length > 0 ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"}`}>
              {verifiedFactors.length > 0 ? "Enabled" : "Disabled"}
            </span>
          </div>

          {verifiedFactors.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{f.friendly_name ?? "Authenticator app"}</p>
                <p className="text-xs text-[var(--text-muted)]">TOTP · Active</p>
              </div>
              <button
                type="button"
                onClick={() => unenroll(f.id)}
                className="rounded border border-red-200 dark:border-red-800 px-3 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Remove
              </button>
            </div>
          ))}

          {!enrolling && (
            <button
              type="button"
              onClick={startEnroll}
              className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              + Add authenticator app
            </button>
          )}
        </div>
      )}

      {/* Enrolment flow */}
      {enrolling && qrCode ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Set up authenticator app</h2>
          <ol className="space-y-3 text-sm text-[var(--text-secondary)]">
            <li>1. Install an authenticator app (Google Authenticator, Authy, 1Password, etc.)</li>
            <li>2. Scan this QR code with your app:</li>
          </ol>
          <div className="flex justify-center">
            <Image src={qrCode} alt="2FA QR code" width={200} height={200} unoptimized className="rounded-lg border border-[var(--border)]" />
          </div>
          {secret ? (
            <details className="rounded-lg border border-[var(--border)] p-3">
              <summary className="cursor-pointer text-xs text-[var(--text-muted)]">Can&apos;t scan? Enter the secret key manually</summary>
              <code className="mt-2 block break-all text-xs text-[var(--text-primary)]">{secret}</code>
            </details>
          ) : null}
          <form onSubmit={verifyEnroll} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">3. Enter the 6-digit code from your app</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="h-12 w-40 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-center text-xl font-mono tracking-widest text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                placeholder="000000"
              />
            </div>
            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
            <div className="flex gap-2">
              <button type="submit" disabled={verifying || code.length !== 6} className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {verifying ? "Verifying…" : "Enable 2FA"}
              </button>
              <button type="button" onClick={() => { setEnrolling(false); setQrCode(null); setSecret(null); setFactorId(null); setCode(""); }} className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {error && !enrolling ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {toast ? (
        <div className="fixed bottom-6 right-6 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg z-50">{toast}</div>
      ) : null}
    </section>
  );
}
