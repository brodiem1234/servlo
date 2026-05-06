"use client";

import { BrandAccentSwatches } from "@/components/brand-accent-swatches";
import { applyAccentToDocument } from "@/lib/dashboard/accent-css";
import { normalizeAccentColour, type AccentPresetHex } from "@/lib/brand-accent";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { saveBrandAccentAction } from "./brand-accent-action";

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
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(() => {
      void (async () => {
        const res = await saveBrandAccentAction(fd);
        if (res.ok) {
          const hex = normalizeAccentColour(String(fd.get("accent_colour") ?? accent));
          applyAccentToDocument(hex);
          setAccent(hex);
          setToast(true);
          window.setTimeout(() => setToast(false), 3000);
        } else {
          setErr(res.message);
        }
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
