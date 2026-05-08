import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/require-admin";

// Env vars that are safe to report as present/missing (never expose values)
const KNOWN_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "CRON_SECRET",
];

export async function GET(req: NextRequest) {
  const admin_check = await checkAdminAccess();
  if (!admin_check) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (key) {
    // Single key check
    if (!KNOWN_ENV_VARS.includes(key)) {
      return NextResponse.json({ error: "Unknown env var" }, { status: 400 });
    }
    return NextResponse.json({ key, present: Boolean(process.env[key]) });
  }

  // Return all known env vars as present/missing
  const results: Record<string, boolean> = {};
  for (const k of KNOWN_ENV_VARS) {
    results[k] = Boolean(process.env[k]);
  }

  return NextResponse.json({ ok: true, vars: results });
}
