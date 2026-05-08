import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID ?? "";
const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET ?? "";
const XERO_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au"}/api/xero/callback`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.com.au";

/**
 * GET /api/xero/callback
 * Xero OAuth2 callback — exchanges code for tokens and stores them.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const stateB64 = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(`${APP_URL}/dashboard/owner/settings?tab=integrations&xero=error&reason=${encodeURIComponent(errorParam)}`);
  }

  if (!code || !stateB64) {
    return NextResponse.redirect(`${APP_URL}/dashboard/owner/settings?tab=integrations&xero=error&reason=missing_params`);
  }

  let userId: string;
  try {
    const state = JSON.parse(Buffer.from(stateB64, "base64url").toString()) as { user_id: string };
    userId = state.user_id;
  } catch {
    return NextResponse.redirect(`${APP_URL}/dashboard/owner/settings?tab=integrations&xero=error&reason=invalid_state`);
  }

  // Exchange code for tokens
  let tokenData: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  try {
    const tokenRes = await fetch("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: XERO_REDIRECT_URI,
      }),
    });
    if (!tokenRes.ok) throw new Error("Token exchange failed");
    tokenData = await tokenRes.json();
  } catch {
    return NextResponse.redirect(`${APP_URL}/dashboard/owner/settings?tab=integrations&xero=error&reason=token_exchange`);
  }

  // Fetch Xero tenants to get org name
  let tenantId = "";
  let tenantName = "";
  try {
    const tenantsRes = await fetch("https://api.xero.com/connections", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (tenantsRes.ok) {
      const tenants = await tenantsRes.json() as Array<{ tenantId: string; tenantName: string }>;
      if (tenants.length > 0) {
        tenantId = tenants[0].tenantId;
        tenantName = tenants[0].tenantName;
      }
    }
  } catch { /* best-effort */ }

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  const admin = createAdminClient();
  await admin.from("accounting_connections").upsert(
    {
      owner_id: userId,
      provider: "xero",
      tenant_id: tenantId || null,
      tenant_name: tenantName || null,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      scopes: "accounting.transactions accounting.contacts",
      is_active: true,
    },
    { onConflict: "owner_id,provider" }
  );

  return NextResponse.redirect(`${APP_URL}/dashboard/owner/settings?tab=integrations&xero=connected`);
}
