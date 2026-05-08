/**
 * Support contact validation schemas.
 */

const SUPPORT_CATEGORIES = ["Bug", "Question", "Feature request", "Billing", "Other"] as const;
type SupportCategory = typeof SUPPORT_CATEGORIES[number];

export type SupportContactInput = {
  category: SupportCategory;
  message: string;
};

function isSupportCategory(v: unknown): v is SupportCategory {
  return typeof v === "string" && (SUPPORT_CATEGORIES as readonly string[]).includes(v);
}

export function validateSupportContact(data: unknown): { ok: true; data: SupportContactInput } | { ok: false; errors: string[] } {
  if (!data || typeof data !== "object") return { ok: false, errors: ["Invalid request body"] };
  const d = data as Record<string, unknown>;
  const errors: string[] = [];

  if (!d.category || !isSupportCategory(d.category)) errors.push("category must be one of: " + SUPPORT_CATEGORIES.join(", "));
  if (!d.message || typeof d.message !== "string" || d.message.trim().length < 10) errors.push("message must be at least 10 characters");
  if (d.message && typeof d.message === "string" && d.message.length > 5000) errors.push("message must be ≤5000 chars");

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      category: d.category as SupportCategory,
      message: (d.message as string).trim().slice(0, 5000),
    },
  };
}
