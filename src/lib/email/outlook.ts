import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken, encryptToken } from "./token-encryption";
import type { EmailMessage } from "./gmail";

const MS_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const GRAPH_API = "https://graph.microsoft.com/v1.0";

export async function refreshOutlookToken(ownerId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: biz } = await admin
    .from("businesses")
    .select("email_refresh_token, email_token_expiry, email_access_token")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (!biz?.email_refresh_token) return null;

  if (biz.email_token_expiry && new Date(biz.email_token_expiry).getTime() > Date.now() + 5 * 60_000) {
    return decryptToken(biz.email_access_token!);
  }

  const refreshToken = decryptToken(biz.email_refresh_token);
  const res = await fetch(MS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AZURE_AD_CLIENT_ID ?? "",
      client_secret: process.env.AZURE_AD_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: "Mail.Read Mail.Send Mail.ReadWrite offline_access",
    }),
  });

  if (!res.ok) {
    await admin.from("businesses").update({ email_sync_enabled: false }).eq("owner_id", ownerId);
    return null;
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  const expiry = new Date(Date.now() + data.expires_in * 1000).toISOString();

  await admin.from("businesses")
    .update({ email_access_token: encryptToken(data.access_token), email_token_expiry: expiry })
    .eq("owner_id", ownerId);

  return data.access_token;
}

export async function sendOutlookEmail(
  ownerId: string,
  opts: { to: string; subject: string; bodyHtml: string; bodyText?: string }
): Promise<void> {
  const accessToken = await refreshOutlookToken(ownerId);
  if (!accessToken) throw new Error("Outlook not connected or token expired");

  const res = await fetch(`${GRAPH_API}/me/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: opts.subject,
        body: { contentType: "HTML", content: opts.bodyHtml },
        toRecipients: [{ emailAddress: { address: opts.to } }],
      },
      saveToSentItems: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Outlook send failed: ${err}`);
  }
}

export async function fetchOutlookMessages(ownerId: string, clientEmail: string): Promise<EmailMessage[]> {
  const accessToken = await refreshOutlookToken(ownerId);
  if (!accessToken) return [];

  const filter = encodeURIComponent(`from/emailAddress/address eq '${clientEmail}' or toRecipients/any(r: r/emailAddress/address eq '${clientEmail}')`);
  const res = await fetch(
    `${GRAPH_API}/me/messages?$filter=${filter}&$top=50&$select=id,conversationId,from,toRecipients,subject,body,receivedDateTime,isDraft,sentDateTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];

  const data = await res.json() as {
    value?: Array<{
      id: string;
      conversationId: string;
      from?: { emailAddress?: { address?: string; name?: string } };
      toRecipients?: Array<{ emailAddress?: { address?: string } }>;
      subject?: string;
      body?: { content?: string };
      receivedDateTime?: string;
      sentDateTime?: string;
      isDraft?: boolean;
    }>;
  };

  return (data.value ?? []).map((msg) => ({
    id: msg.id,
    threadId: msg.conversationId,
    from: `${msg.from?.emailAddress?.name ?? ""} <${msg.from?.emailAddress?.address ?? ""}>`.trim(),
    to: msg.toRecipients?.[0]?.emailAddress?.address ?? "",
    subject: msg.subject ?? "",
    bodyText: (msg.body?.content ?? "").replace(/<[^>]*>/g, ""),
    bodyHtml: msg.body?.content ?? "",
    date: msg.receivedDateTime ?? msg.sentDateTime ?? new Date().toISOString(),
    direction: msg.sentDateTime && !msg.receivedDateTime ? "outbound" : "inbound",
  }));
}

export { type EmailMessage };
