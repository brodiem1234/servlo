export type PasswordRuleKey = "length" | "upper" | "number" | "noPersonal";

export type PasswordRequirementState = Record<PasswordRuleKey, boolean>;

export function normalizePasswordStrength(
  password: string,
  fullName: string,
  email: string
): PasswordRequirementState {
  const lowerPw = password.toLowerCase();

  const nameParts = fullName
    .trim()
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length >= 2);

  let noPersonalOk = password.length >= 8;
  if (fullName.trim()) {
    for (const part of nameParts) {
      if (part && lowerPw.includes(part)) {
        noPersonalOk = false;
        break;
      }
    }
  }

  const localEmail = (email.split("@")[0] ?? "").toLowerCase().trim();
  if (email && localEmail.length >= 2 && lowerPw.includes(localEmail)) {
    noPersonalOk = false;
  }
  const fullMail = email.trim().toLowerCase();
  if (fullMail.length >= 3 && lowerPw.includes(fullMail)) {
    noPersonalOk = false;
  }

  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    noPersonal: noPersonalOk
  };
}

export function allPasswordRequirementsMet(state: PasswordRequirementState): boolean {
  return Object.values(state).every(Boolean);
}

/** Digits only (ABN validation). */
export function abnDigitsFromInput(value: string): string {
  return value.replace(/\D/g, "");
}

/** Test ABN that bypasses real validation (all zeros). */
export const TEST_ABN_DIGITS = "00000000000";

/**
 * Validates an ABN using the official Australian checksum algorithm.
 * Subtract 1 from the first digit, multiply each digit by its weight
 * [10,1,3,5,7,9,11,13,15,17,19], sum must be divisible by 89.
 */
export function validateAbnChecksum(abn: string): boolean {
  const digits = abn.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  // Test bypass — accepts 00 000 000 000 without real checksum validation.
  if (digits === TEST_ABN_DIGITS) return true;
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const d = digits.split("").map(Number);
  d[0] -= 1;
  const sum = d.reduce((acc, digit, i) => acc + digit * weights[i], 0);
  return sum % 89 === 0;
}

/**
 * Converts a local phone number + dial code to E.164 format.
 * Strips leading zero (AU/NZ/GB convention) before prepending the country code.
 */
export function toPhoneE164(localInput: string, dialCode: string): string {
  const digits = localInput.replace(/\D/g, "");
  const stripped = digits.startsWith("0") ? digits.slice(1) : digits;
  return `+${dialCode}${stripped}`;
}

/** Count digits for validation; skips the single leading '+' for international entries. */
export function phoneDigitsCount(value: string): number {
  const trimmed = value.trim();
  const body = trimmed.startsWith("+") ? trimmed.slice(1) : trimmed;
  return body.replace(/\D/g, "").length;
}

export function validatePhoneMinimum(value: string, minDigits = 10): boolean {
  return phoneDigitsCount(value) >= minDigits;
}

export function formatAbnDigits(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  const a = d.slice(0, 2);
  const b = d.slice(2, 5);
  const c = d.slice(5, 8);
  const e = d.slice(8, 11);
  let out = a;
  if (b) out += ` ${b}`;
  if (c) out += ` ${c}`;
  if (e) out += ` ${e}`;
  return out;
}

/**
 * Formats typed phone numbers: AU mobile without leading "+" as `04XX XXX XXX`.
 * With "+" prefix (international), groups remaining digits in threes after the '+'.
 */
export function formatPhoneInput(value: string): string {
  const trimmed = value;
  const intl = trimmed.startsWith("+");
  let digits = trimmed.replace(/^\+/, "").replace(/\D/g, "");
  if (!intl && digits.startsWith("4") && !digits.startsWith("0")) {
    digits = `0${digits}`;
  }
  const cap = intl ? Math.min(digits.length, 15) : 10;
  digits = digits.slice(0, cap);

  if (intl) {
    if (digits.length === 0) return "+";
    const chunks: string[] = [];
    for (let i = 0; i < digits.length; i += 3) {
      chunks.push(digits.slice(i, i + 3));
    }
    return `+${chunks.join(" ")}`;
  }

  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
}
