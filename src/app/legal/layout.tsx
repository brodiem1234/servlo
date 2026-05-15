/**
 * Legacy /legal/* layout. The child pages here are redirect-only stubs
 * (terms, privacy, refund all redirect to their canonical /<name> routes)
 * so this layout is just a pass-through. Kept for symmetry with the Next.js
 * directory structure.
 */
export default function LegacyLegalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
