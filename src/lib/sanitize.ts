/**
 * Server-safe HTML sanitization utilities.
 *
 * Uses a simple regex approach — no DOM needed server-side.
 *
 * NOTE: For richer sanitization, install 'sanitize-html' or 'DOMPurify'
 * (with jsdom for SSR). Current implementation strips all HTML tags.
 * Apply to: notes fields, descriptions, any freeform text that might contain HTML.
 * Do NOT apply to: fields intended to support markdown/HTML (if any).
 */

/**
 * Strip all HTML tags from a string. Returns the plain-text content.
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

/**
 * Sanitize a nullable/undefined string field — strip HTML and trim whitespace.
 */
export function sanitizeText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const stripped = stripHtml(value);
  return stripped.length > 0 ? stripped : null;
}

/**
 * Sanitize a required string field.
 */
export function sanitizeRequired(value: string): string {
  return stripHtml(value).trim();
}
