/** Rows tagged as onboarding demos — hide once the owner has any non-demo row of that kind. */
export function filterDemoEntities<T extends { is_demo?: boolean | null }>(
  rows: T[] | null | undefined
): T[] {
  const list = rows ?? [];
  const real = list.filter((r) => !r.is_demo);
  if (real.length > 0) return real;
  return list.filter((r) => Boolean(r.is_demo));
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
