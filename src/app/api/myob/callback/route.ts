import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MYOB_CLIENT_ID = process.env.MYOB_CLIENT_ID ?? "";
const MYOB_CLIENT_SECRET = process.env.MYOB_CLIENT_SECRET ?? "";
const MYOB_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.app"}/api/myob/callback`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.app";

/**
 * GET /api/myob/callback
 * MYOB OAuth2 callback — exchanges code for tokens and stores them.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const stateB64 = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(`${APP_URL}/dashboard/owner/settings?tab=integrations&myob=error&reason=${encodeURIComponent(errorParam)}`);
  }
  if (!code || !stateB64) {
    return NextResponse.redirect(`${APP_URL}/dashboard/owner/settings?tab=integrations&myob=error&reason=missing_params`);
  }

  let userId: string;
  try {
    const state = JSON.parse(Buffer.from(stateB64, "base64url").toString()) as { user_id: string };
    userId = state.user_id;
  } catch {
    return NextResponse.redirect(`${APP_URL}/dashboard/owner/settings?tab=integrations&myob=error&reason=invalid_state`);
  }

  // Exchange code for tokens
  let tokenData: { access_token: string; refresh_token: string; expires_in: number };
  try {
    const tokenRes = await fetch("https://secure.myob.com/oauth2/v1/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: MYOB_CLIENT_ID,
        client_secret: MYOB_CLIENT_SECRET,
        redirect_uri: MYOB_REDIRECT_URI,
        code,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new Error("Token exchange failed");
    tokenData = await tokenRes.json();
  } catch {
    return NextResponse.redirect(`${APP_URL}/dashboard/owner/settings?tab=integrations&myob=error&reason=token_exchange`);
  }

  // Fetch company files to get tenant name
  let tenantId = "";
  let tenantName = "";
  try {
    const cfRes = await fetch("https://api.myob.com/accountright/", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "x-myobapi-key": MYOB_CLIENT_ID,
      },
    });
    if (cfRes.ok) {
      const files = await cfRes.json() as Array<{ Id: string; Name: string }>;
      if (files.length > 0) {
        tenantId = files[0].Id;
        tenantName = files[0].Name;
      }
    }
  } catch { /* best-effort */ }

  const expiresAt = new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000).toISOString();

  const admin = createAdminClient();
  await admin.from("accounting_connections").upsert(
    {
      owner_id: userId,
      provider: "myob",
      tenant_id: tenantId || null,
      tenant_name: tenantName || null,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      scopes: "CompanyFile",
      is_active: true,
    },
    { onConflict: "owner_id,provider" }
  );

  return NextResponse.redirect(`${APP_URL}/dashboard/owner/settings?tab=integrations&myob=connected`);
}
