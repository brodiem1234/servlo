"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

type Props = {
  userId: string;
};

export function ReseedDemoApiButton({ userId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      const sb = createSupabaseBrowser();
      const {
        data: { session }
      } = await sb.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError("No active session. Sign in again and retry.");
        return;
      }

      const res = await fetch("/api/setup-business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId, demoOnly: true })
      });

      const raw = await res.text();
      let parsed: { demoSeeded?: boolean; demoSeedError?: string; error?: string };
      try {
        parsed = JSON.parse(raw) as typeof parsed;
      } catch {
        parsed = { error: raw.slice(0, 280) || "Invalid response from server." };
      }

      if (!res.ok || parsed.error) {
        setError(parsed.demoSeedError ?? parsed.error ?? `Request failed (${res.status}).`);
        return;
      }
      if (!parsed.demoSeeded) {
        setError("Demo seed did not complete.");
        return;
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {busy ? "Reseeding…" : "Reseed demo data"}
      </button>
      {error ? <p className="max-w-md text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
