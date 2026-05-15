"use client";

import type { MouseEventHandler } from "react";
import { Button } from "@/components/ui/button";
import type { WorkspaceFeatureId } from "@/lib/workspace-features";
import { FEATURE_DESCRIPTIONS, FEATURE_LABELS } from "@/lib/workspace-features";
import { WorkspaceFeatureSwitch } from "@/components/workspace-feature-switch";
import { Check, ChevronRight } from "lucide-react";

type Props = {
  primaryIndustryLabel: string;
  recommendedIds: WorkspaceFeatureId[];
  optionalIds: WorkspaceFeatureId[];
  optionalOn: Record<string, boolean>;
  setOptionalOn: (id: WorkspaceFeatureId, on: boolean) => void;
  onBack: MouseEventHandler<HTMLButtonElement>;
  onContinue: MouseEventHandler<HTMLButtonElement>;
  submitting?: boolean;
};

export function WorkspaceSetupPreview({
  primaryIndustryLabel: _primaryIndustryLabel,
  recommendedIds,
  optionalIds,
  optionalOn,
  setOptionalOn,
  onBack,
  onContinue,
  submitting = false
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Your SERVLO Core workspace is ready
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Recommended modules stay on by default; optionally tune extras below. You can change this anytime in Settings.
        </p>
      </div>

      <div className="rounded-xl border-2 border-slate-500 bg-slate-900/40 p-4">
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
        <div className="rounded-xl border-2 border-slate-500 bg-slate-900/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Optional — toggle on or off</p>
          <ul className="mt-3 space-y-3">
            {optionalIds.map((id) => (
              <li key={id}>
                <WorkspaceFeatureSwitch
                  checked={Boolean(optionalOn[id])}
                  onCheckedChange={(on) => setOptionalOn(id, on)}
                  className="border-slate-600/70 bg-slate-950/35 hover:bg-slate-900/65"
                  label={<span className="text-slate-100">{FEATURE_LABELS[id]}</span>}
                  description={<span className="text-slate-400">{FEATURE_DESCRIPTIONS[id]}</span>}
                />
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
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-white text-black hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-60"
        >
          {submitting ? "Working…" : (
            <>
              Looks good, let&apos;s go!
              <ChevronRight className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
