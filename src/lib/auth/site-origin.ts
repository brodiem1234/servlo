/**
 * Canonical public origin for auth redirects (reset password, OAuth).
 * Prefer NEXT_PUBLIC_APP_URL in dev/local; fallback matches production hostname.
 */
export function getAuthSiteOrigin(): string {
  const fromEnv = (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    ""
  )
    .trim()
    .replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return "https://servlo.com.au";
}

export function authUrl(path: string): string {
  const base = getAuthSiteOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
