import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MYOB_CLIENT_ID = process.env.MYOB_CLIENT_ID ?? "";
const MYOB_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au"}/api/myob/callback`;
const MYOB_SCOPES = "CompanyFile";

/**
 * GET /api/myob/connect
 * Redirects to MYOB AccountRight OAuth2 authorisation URL.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_APP_URL));
  }

  if (!MYOB_CLIENT_ID) {
    return NextResponse.json({ error: "MYOB integration not configured. Set MYOB_CLIENT_ID." }, { status: 501 });
  }

  const state = Buffer.from(JSON.stringify({ user_id: user.id, ts: Date.now() })).toString("base64url");

  const url = new URL("https://secure.myob.com/oauth2/account/authorize");
  url.searchParams.set("client_id", MYOB_CLIENT_ID);
  url.searchParams.set("redirect_uri", MYOB_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", MYOB_SCOPES);
  url.searchParams.set("state", state);

  return NextResponse.redirect(url);
}
