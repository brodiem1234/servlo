"use client";

import type { MouseEventHandler } from "react";
import { Button } from "@/components/ui/button";
import type { WorkspaceFeatureId } from "@/lib/workspace-features";
import { FEATURE_LABELS } from "@/lib/workspace-features";
import { Check, ChevronRight } from "lucide-react";

type Props = {
  primaryIndustryLabel: string;
  recommendedIds: WorkspaceFeatureId[];
  optionalIds: WorkspaceFeatureId[];
  optionalOn: Record<string, boolean>;
  setOptionalOn: (id: WorkspaceFeatureId, on: boolean) => void;
  onBack: MouseEventHandler<HTMLButtonElement>;
  onContinue: MouseEventHandler<HTMLButtonElement>;
};

export function WorkspaceSetupPreview({
  primaryIndustryLabel,
  recommendedIds,
  optionalIds,
  optionalOn,
  setOptionalOn,
  onBack,
  onContinue
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Your {primaryIndustryLabel} workspace is ready
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Recommended modules stay on by default; optionally tune extras below. You can change this anytime in Settings.
        </p>
      </div>

      <div className="rounded-xl border border-slate-600 bg-slate-900/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recommended (always on)</p>
        <ul className="mt-3 space-y-2">
          {recommendedIds.map((id) => (
            <li key={id} className="flex items-start gap-2 text-sm text-slate-200">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
              <span>{FEATURE_LABELS[id]}</span>
            </li>
          ))}
        </ul>
      </div>

      {optionalIds.length > 0 ? (
        <div className="rounded-xl border border-slate-600 bg-slate-900/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Optional — toggle on or off</p>
          <ul className="mt-3 space-y-3">
            {optionalIds.map((id) => (
              <li key={id} className="flex items-center justify-between gap-3 text-sm text-slate-200">
                <span>{FEATURE_LABELS[id]}</span>
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-500 accent-[var(--accent-color)]"
                    checked={Boolean(optionalOn[id])}
                    onChange={(e) => setOptionalOn(id, e.target.checked)}
                  />
                  <span className="text-xs text-slate-400">{optionalOn[id] ? "On" : "Off"}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="dark-ghost" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)]"
        >
          Looks good, let&apos;s go
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
