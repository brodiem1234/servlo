export type TrialProfileFields = {
  trial_end?: string | null;
  /** Legacy / alternate column — keep writes in sync where present. */
  trial_end_date?: string | null;
  trial_start?: string | null;
  subscription_status?: string | null;
};

/**
 * Whole calendar days remaining in the trial window (floored at 0).
 * Reads `trial_end` first, then `trial_end_date`, then derives from `trial_start + 30d`,
 * then falls back to “fresh trial” when status still looks like `trialing`.
 */
export function computeTrialDaysRemaining(profile: TrialProfileFields | null | undefined): number {
  const status = String(profile?.subscription_status ?? "trialing").toLowerCase();

  let endIso = profile?.trial_end ?? profile?.trial_end_date ?? null;

  if (!endIso && profile?.trial_start) {
    const end = new Date(profile.trial_start);
    end.setDate(end.getDate() + 30);
    endIso = end.toISOString();
  }

  if (!endIso && (status === "trialing" || status === "trial")) {
    const end = new Date();
    end.setDate(end.getDate() + 30);
    endIso = end.toISOString();
  }

  if (!endIso) return 0;

  const ms = new Date(endIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
