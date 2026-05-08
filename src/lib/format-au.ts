/**
 * Australian date and currency formatting utilities.
 */

/**
 * Format a date as DD/MM/YYYY (Australian standard).
 */
export function formatDateAU(date: string | Date | null | undefined): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Format a date as "1 January 2026" (long Australian format).
 */
export function formatDateLongAU(date: string | Date | null | undefined): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Format a value in cents as AUD currency ($X,XXX.XX).
 */
export function formatCurrencyAU(cents: number | null | undefined): string {
  const amount = (cents ?? 0) / 100;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount);
}

/**
 * Format a dollar value as AUD currency ($X,XXX.XX).
 */
export function formatCurrencyFromDollars(dollars: number | null | undefined): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(dollars ?? 0);
}

/**
 * Format an ABN with standard spacing: XX XXX XXX XXX.
 */
export function formatABN(abn: string | null | undefined): string {
  if (!abn) return "";
  const digits = abn.replace(/\D/g, "");
  if (digits.length !== 11) return abn;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
}

/**
 * Australian financial year quarters.
 */
export const AUS_QUARTERS = [
  { label: "Q1 (Jul–Sep)", start: "-07-01", end: "-09-30" },
  { label: "Q2 (Oct–Dec)", start: "-10-01", end: "-12-31" },
  { label: "Q3 (Jan–Mar)", start: "-01-01", end: "-03-31" },
  { label: "Q4 (Apr–Jun)", start: "-04-01", end: "-06-30" },
] as const;
