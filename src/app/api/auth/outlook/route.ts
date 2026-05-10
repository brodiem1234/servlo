import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
  if (!process.env.AZURE_AD_CLIENT_ID) {
    return NextResponse.json({ error: "Microsoft OAuth not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/auth/login", _req.url));

  const params = new URLSearchParams({
    client_id: process.env.AZURE_AD_CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/outlook/callback`,
    response_type: "code",
    scope: "Mail.Read Mail.Send Mail.ReadWrite User.Read offline_access",
    response_mode: "query",
    state: user.id,
  });

  return NextResponse.redirect(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`);
}
