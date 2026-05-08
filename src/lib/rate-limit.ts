/**
 * Rate limiting utilities for SERVLO API routes.
 *
 * NOTE: Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel
 * for production-grade rate limiting. Without these, rate limiting falls back
 * to a lightweight in-memory store (suitable for single-instance dev/preview;
 * not suitable for multi-instance production).
 * Set up at upstash.com — free tier covers this usage.
 *
 * TODO: npm install @upstash/ratelimit @upstash/redis
 * Then replace the in-memory fallback below with the Upstash implementation.
 */

import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// In-memory fallback (dev / no-Redis environments)
// ---------------------------------------------------------------------------

type WindowEntry = { count: number; resetAt: number };
const memStore = new Map<string, WindowEntry>();

function memCheck(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = memStore.get(key);
  if (!entry || entry.resetAt < now) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }
  if (entry.count >= limit) return false; // blocked
  entry.count += 1;
  return true;
}

// ---------------------------------------------------------------------------
// Limiter configs
// ---------------------------------------------------------------------------

type LimiterConfig = { limit: number; windowMs: number };

export const RATE_LIMIT_CONFIGS: Record<string, LimiterConfig> = {
  authRoutes:    { limit: 10,  windowMs: 60 * 1000 },        // 10/min
  billingRoutes: { limit: 20,  windowMs: 60 * 1000 },        // 20/min
  supportContact:{ limit: 5,   windowMs: 60 * 60 * 1000 },   // 5/hr
  bookingCreate: { limit: 20,  windowMs: 60 * 60 * 1000 },   // 20/hr
  foundersCount: { limit: 60,  windowMs: 60 * 1000 },        // 60/min
};

export type RateLimiterKey = keyof typeof RATE_LIMIT_CONFIGS;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns null if the request is allowed, or a 429 NextResponse if rate-limited.
 */
export async function checkRateLimit(
  limiterKey: RateLimiterKey,
  identifier: string
): Promise<NextResponse | null> {
  const cfg = RATE_LIMIT_CONFIGS[limiterKey];
  if (!cfg) return null; // unknown key — allow

  const key = `rl:${limiterKey}:${identifier}`;
  const allowed = memCheck(key, cfg.limit, cfg.windowMs);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(cfg.windowMs / 1000)) } }
    );
  }
  return null;
}

/**
 * Extract the best available IP identifier from a request.
 */
export function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
