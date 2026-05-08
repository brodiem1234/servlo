/**
 * Client validation schemas.
 * NOTE: Install zod (npm install zod) to use z.object() based schemas.
 */

const AU_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"] as const;
type AUState = typeof AU_STATES[number];

export type CreateClientInput = {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  company_name?: string | null;
  abn?: string | null;
  address?: string | null;
  suburb?: string | null;
  state?: AUState | null;
  postcode?: string | null;
  notes?: string | null;
};

export type UpdateClientInput = Partial<CreateClientInput>;

function isAUState(v: unknown): v is AUState {
  return typeof v === "string" && (AU_STATES as readonly string[]).includes(v);
}

function isEmail(v: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && v.length <= 254;
}

function isAUPostcode(v: string): boolean {
  return /^\d{4}$/.test(v);
}

function truncate(v: unknown, max: number): string | null | undefined {
  if (v === null) return null;
  if (v === undefined) return undefined;
  if (typeof v !== "string") return undefined;
  return v.trim().slice(0, max) || null;
}

export function validateCreateClient(data: unknown): { ok: true; data: CreateClientInput } | { ok: false; errors: string[] } {
  if (!data || typeof data !== "object") return { ok: false, errors: ["Invalid request body"] };
  const d = data as Record<string, unknown>;
  const errors: string[] = [];

  if (!d.full_name || typeof d.full_name !== "string" || d.full_name.trim().length === 0) errors.push("full_name is required");
  if (d.full_name && typeof d.full_name === "string" && d.full_name.length > 200) errors.push("full_name must be ≤200 chars");
  if (d.email !== undefined && d.email !== null && typeof d.email === "string" && !isEmail(d.email)) errors.push("email is invalid");
  if (d.state !== undefined && d.state !== null && !isAUState(d.state)) errors.push("state must be an Australian state code");
  if (d.postcode !== undefined && d.postcode !== null && typeof d.postcode === "string" && !isAUPostcode(d.postcode)) errors.push("postcode must be a 4-digit Australian postcode");
  if (d.notes !== undefined && typeof d.notes === "string" && d.notes.length > 10000) errors.push("notes must be ≤10000 chars");

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      full_name: (d.full_name as string).trim(),
      email: typeof d.email === "string" ? d.email.toLowerCase().trim() : (d.email as null | undefined),
      phone: truncate(d.phone, 20),
      company_name: truncate(d.company_name, 200),
      abn: truncate(d.abn, 11),
      address: truncate(d.address, 500),
      suburb: truncate(d.suburb, 100),
      state: d.state as AUState | null | undefined,
      postcode: truncate(d.postcode, 4),
      notes: truncate(d.notes, 10000),
    },
  };
}

export function validateUpdateClient(data: unknown): { ok: true; data: UpdateClientInput } | { ok: false; errors: string[] } {
  const result = validateCreateClient({ full_name: "placeholder", ...(data as object) });
  if (!result.ok) {
    // For partial updates, only report errors on provided fields
    const d = data as Record<string, unknown>;
    const relevantErrors = result.errors.filter((e) => {
      if (e.includes("full_name") && d.full_name === undefined) return false;
      return true;
    });
    if (relevantErrors.length > 0) return { ok: false, errors: relevantErrors };
  }
  // Re-validate as partial
  if (!data || typeof data !== "object") return { ok: false, errors: ["Invalid request body"] };
  const d = data as Record<string, unknown>;
  const errors: string[] = [];
  if (d.email !== undefined && d.email !== null && typeof d.email === "string" && !isEmail(d.email)) errors.push("email is invalid");
  if (d.state !== undefined && d.state !== null && !isAUState(d.state)) errors.push("state must be an Australian state code");
  if (d.postcode !== undefined && d.postcode !== null && typeof d.postcode === "string" && !isAUPostcode(d.postcode)) errors.push("postcode must be a 4-digit Australian postcode");
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, data: d as UpdateClientInput };
}
