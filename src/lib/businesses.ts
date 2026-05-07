/** `businesses.owner_id` is canonical for workspace ownership. */
export function businessesRowForOwner(ownerUserId: string, fields: { accent_colour: string }) {
  return {
    owner_id: ownerUserId,
    accent_colour: fields.accent_colour
  };
}

/** Unique constraint used for PostgREST upsert. */
export const BUSINESSES_UPSERT_ON_CONFLICT = "owner_id" as const;

/** Canonical owner key for reads after owner/user sync migration. */
export function businessesOwnerOrEq(userId: string): string {
  return `owner_id.eq.${userId}`;
}
