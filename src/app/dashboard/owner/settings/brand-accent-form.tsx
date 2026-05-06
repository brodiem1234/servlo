"use client";

import { BrandAccentSwatches } from "@/components/brand-accent-swatches";
import { normalizeAccentColour, type AccentPresetHex } from "@/lib/brand-accent";
import { applyAccentToDocument } from "@/lib/dashboard/accent-css";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useEffect, useState, useTransition, type FormEvent } from "react";

type Props = {
  savedAccent: AccentPresetHex;
};

export function BrandAccentForm({ savedAccent }: Props) {
  const [accent, setAccent] = useState<AccentPresetHex>(savedAccent);
  const [toast, setToast] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setAccent(savedAccent);
  }, [savedAccent]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    startTransition(() => {
      void (async () => {
        const selectedColour = normalizeAccentColour(accent);
        const supabase = createSupabaseBrowser();
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setErr("Your session expired. Sign in again.");
          return;
        }

        const res = await fetch("/api/update-accent-colour", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ accentColour: selectedColour })
        });

        let parsed: { success?: boolean; error?: string };
        try {
          parsed = (await res.json()) as typeof parsed;
        } catch {
          setErr("Invalid response from server.");
          return;
        }

        if (!res.ok || parsed.error) {
          setErr(parsed.error ?? `Could not save (${res.status}).`);
          return;
        }

        applyAccentToDocument(selectedColour, { persist: true });
        setAccent(selectedColour);
        setToast(true);
        window.setTimeout(() => setToast(false), 3000);
      })();
    });
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <BrandAccentSwatches name="accent_colour" value={accent} onChange={setAccent} />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save brand colour"}
        </button>
      </form>
      {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-900 shadow-lg"
        >
          Brand colour updated
        </div>
      ) : null}
    </>
  );
}
