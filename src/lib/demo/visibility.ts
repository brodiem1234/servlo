/**
 * Owner-facing lists show both real and demo rows. Demo rows use `DemoBadge` in the UI.
 * Financial aggregates still use `excludeDemoFinancial`.
 */
export function filterDemoEntities<T extends { is_demo?: boolean | null }>(
  rows: T[] | null | undefined
): T[] {
  return rows ?? [];
}

export function hasNonDemo<T extends { is_demo?: boolean | null }>(rows: T[] | null | undefined): boolean {
  return (rows ?? []).some((r) => !r.is_demo);
}

/** Never include demo rows in money/reminder aggregates. */
export function excludeDemoFinancial<T extends { is_demo?: boolean | null }>(
  rows: T[] | null | undefined
): T[] {
  return (rows ?? []).filter((r) => !r.is_demo);
}

export function isDemoRow(row: { is_demo?: boolean | null } | null | undefined): boolean {
  return Boolean(row?.is_demo);
}
