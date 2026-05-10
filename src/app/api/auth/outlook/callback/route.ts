import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptToken } from "@/lib/email/token-encryption";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const ownerId = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const redirectBase = `${appUrl}/dashboard/owner/settings`;

  if (error || !code || !ownerId) {
    return NextResponse.redirect(`${redirectBase}?tab=integrations&toast=outlook_error`);
  }

  const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AZURE_AD_CLIENT_ID ?? "",
      client_secret: process.env.AZURE_AD_CLIENT_SECRET ?? "",
      redirect_uri: `${appUrl}/api/auth/outlook/callback`,
      code,
      grant_type: "authorization_code",
      scope: "Mail.Read Mail.Send Mail.ReadWrite User.Read offline_access",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${redirectBase}?tab=integrations&toast=outlook_error`);
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  // Get Microsoft profile
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = profileRes.ok ? await profileRes.json() as { mail?: string; userPrincipalName?: string } : {};
  const email = profile.mail ?? profile.userPrincipalName ?? null;

  const admin = createAdminClient();
  await admin.from("businesses").update({
    email_provider: "outlook",
    email_access_token: encryptToken(tokens.access_token),
    email_refresh_token: tokens.refresh_token ? encryptToken(tokens.refresh_token) : undefined,
    email_token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    email_connected_address: email,
    email_sync_enabled: true,
  }).eq("owner_id", ownerId);

  return NextResponse.redirect(`${redirectBase}?tab=integrations&toast=outlook_connected`);
}
