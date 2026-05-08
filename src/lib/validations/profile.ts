/**
 * Profile and business update validation schemas.
 */

const AU_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"] as const;
type AUState = typeof AU_STATES[number];

export type UpdateProfileInput = {
  full_name?: string;
  phone?: string | null;
};

export type UpdateBusinessInput = {
  business_name?: string;
  abn?: string | null;
  address?: string | null;
  suburb?: string | null;
  state?: AUState | null;
  postcode?: string | null;
  phone?: string | null;
  email?: string | null;
  accent_colour?: string | null;
};

function isAUState(v: unknown): v is AUState {
  return typeof v === "string" && (AU_STATES as readonly string[]).includes(v);
}

function isEmail(v: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && v.length <= 254;
}

function isAUPostcode(v: string): boolean {
  return /^\d{4}$/.test(v);
}

function isHexColour(v: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(v);
}

export function validateUpdateProfile(data: unknown): { ok: true; data: UpdateProfileInput } | { ok: false; errors: string[] } {
  if (!data || typeof data !== "object") return { ok: false, errors: ["Invalid request body"] };
  const d = data as Record<string, unknown>;
  const errors: string[] = [];

  if (d.full_name !== undefined) {
    if (typeof d.full_name !== "string" || d.full_name.trim().length === 0) errors.push("full_name must be a non-empty string");
    if (typeof d.full_name === "string" && d.full_name.length > 200) errors.push("full_name must be ≤200 chars");
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      full_name: typeof d.full_name === "string" ? d.full_name.trim() : undefined,
      phone: typeof d.phone === "string" ? d.phone.trim().slice(0, 20) : (d.phone as null | undefined),
    },
  };
}

export function validateUpdateBusiness(data: unknown): { ok: true; data: UpdateBusinessInput } | { ok: false; errors: string[] } {
  if (!data || typeof data !== "object") return { ok: false, errors: ["Invalid request body"] };
  const d = data as Record<string, unknown>;
  const errors: string[] = [];

  if (d.business_name !== undefined && (typeof d.business_name !== "string" || d.business_name.trim().length === 0)) {
    errors.push("business_name must be a non-empty string");
  }
  if (d.business_name && typeof d.business_name === "string" && d.business_name.length > 200) {
    errors.push("business_name must be ≤200 chars");
  }
  if (d.email !== undefined && d.email !== null && typeof d.email === "string" && !isEmail(d.email)) {
    errors.push("email is invalid");
  }
  if (d.state !== undefined && d.state !== null && !isAUState(d.state)) {
    errors.push("state must be an Australian state code");
  }
  if (d.postcode !== undefined && d.postcode !== null && typeof d.postcode === "string" && !isAUPostcode(d.postcode)) {
    errors.push("postcode must be a 4-digit Australian postcode");
  }
  if (d.accent_colour !== undefined && d.accent_colour !== null && typeof d.accent_colour === "string" && !isHexColour(d.accent_colour)) {
    errors.push("accent_colour must be a 6-digit hex colour code (e.g. #1a2b3c)");
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      business_name: typeof d.business_name === "string" ? d.business_name.trim() : undefined,
      abn: typeof d.abn === "string" ? d.abn.trim().slice(0, 11) : (d.abn as null | undefined),
      address: typeof d.address === "string" ? d.address.trim().slice(0, 500) : (d.address as null | undefined),
      suburb: typeof d.suburb === "string" ? d.suburb.trim().slice(0, 100) : (d.suburb as null | undefined),
      state: d.state as AUState | null | undefined,
      postcode: typeof d.postcode === "string" ? d.postcode.trim().slice(0, 4) : (d.postcode as null | undefined),
      phone: typeof d.phone === "string" ? d.phone.trim().slice(0, 20) : (d.phone as null | undefined),
      email: typeof d.email === "string" ? d.email.toLowerCase().trim() : (d.email as null | undefined),
      accent_colour: typeof d.accent_colour === "string" ? d.accent_colour : (d.accent_colour as null | undefined),
    },
  };
}
