/**
 * ABN (Australian Business Number) validation.
 * Uses the official ATO weighting algorithm — no API required.
 * https://abr.business.gov.au/Help/AbnFormat
 */

export type ABNValidationResult =
  | { valid: true; formatted: string }
  | { valid: false; error: string };

/**
 * Validate an ABN string.
 * Returns { valid: true, formatted: 'XX XXX XXX XXX' } or { valid: false, error: string }.
 */
export function validateABN(abn: string): ABNValidationResult {
  // 1. Strip spaces and non-digits
  const digits = abn.replace(/\D/g, "");
  if (digits.length !== 11) {
    return { valid: false, error: "ABN must be 11 digits" };
  }

  // 2. Apply the ATO weighting algorithm
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const d = digits.split("").map(Number);

  // Subtract 1 from the first digit
  d[0] -= 1;

  // Multiply each digit by its weight and sum
  const sum = d.reduce((acc, digit, i) => acc + digit * weights[i], 0);

  // Valid if sum is divisible by 89
  if (sum % 89 !== 0) {
    return { valid: false, error: "Invalid ABN — checksum failed" };
  }

  // Format: XX XXX XXX XXX
  const formatted = `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
  return { valid: true, formatted };
}

/**
 * Format an ABN string with standard spacing.
 * Does NOT validate — use validateABN for validation.
 */
export function formatABN(abn: string | null | undefined): string {
  if (!abn) return "";
  const digits = abn.replace(/\D/g, "");
  if (digits.length !== 11) return abn;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
}
