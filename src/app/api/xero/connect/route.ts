import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID ?? "";
const XERO_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.app"}/api/xero/callback`;
const XERO_SCOPES = "openid profile email accounting.transactions accounting.contacts offline_access";

/**
 * GET /api/xero/connect
 * Redirects to Xero OAuth2 authorisation URL.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_APP_URL));
  }

  if (!XERO_CLIENT_ID) {
    return NextResponse.json({ error: "Xero integration not configured. Set XERO_CLIENT_ID." }, { status: 501 });
  }

  const state = Buffer.from(JSON.stringify({ user_id: user.id, ts: Date.now() })).toString("base64url");

  const url = new URL("https://login.xero.com/identity/connect/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", XERO_CLIENT_ID);
  url.searchParams.set("redirect_uri", XERO_REDIRECT_URI);
  url.searchParams.set("scope", XERO_SCOPES);
  url.searchParams.set("state", state);

  return NextResponse.redirect(url);
}
