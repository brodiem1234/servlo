/**
 * Sentry test endpoint — delete this after verifying error capture works.
 * GET /api/sentry-test — intentionally throws an error.
 */
export async function GET() {
  throw new Error("Sentry test error — delete this endpoint after verification");
}
