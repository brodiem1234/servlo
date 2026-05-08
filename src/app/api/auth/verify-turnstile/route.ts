import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getIP } from "@/lib/rate-limit";

/**
 * POST /api/auth/verify-turnstile
 * Body: { token: string }
 * Returns: { success: boolean, error?: string }
 *
 * Verifies a Cloudflare Turnstile token server-side.
 * If TURNSTILE_SECRET_KEY is not set, returns success: true (graceful fallback for dev).
 */
export async function POST(req: NextRequest) {
  const rateLimitResponse = await checkRateLimit("authRoutes", getIP(req));
  if (rateLimitResponse) return rateLimitResponse;

  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // No secret key configured — skip in dev/staging
  if (!secretKey) {
    return NextResponse.json({ success: true });
  }

  try {
    const { token } = (await req.json()) as { token?: string };
    if (!token) {
      return NextResponse.json({ success: false, error: "Missing token" }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      undefined;

    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip) formData.append("remoteip", ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };

    if (data.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Verification failed", codes: data["error-codes"] },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("[turnstile] verify error:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
