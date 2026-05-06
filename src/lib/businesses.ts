/**
 * `businesses` keeps both `owner_id` and `user_id` set to the same auth user uuid.
 * Always pass both on upsert/insert from application code; DB trigger also mirrors if only one is sent.
 */
export function businessesRowForOwner(ownerUserId: string, fields: { accent_colour: string }) {
  return {
    owner_id: ownerUserId,
    user_id: ownerUserId,
    accent_colour: fields.accent_colour
  };
}

/** Unique constraint used for PostgREST upsert — prefer `user_id` when both columns exist. */
export const BUSINESSES_UPSERT_ON_CONFLICT = "user_id" as const;

/** Prefer matching either column for reads (legacy rows / migrations). */
export function businessesOwnerOrEq(userId: string): string {
  return `owner_id.eq.${userId},user_id.eq.${userId}`;
}
