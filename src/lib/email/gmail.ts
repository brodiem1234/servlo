import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken, encryptToken } from "./token-encryption";

const GMAIL_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  date: string;
  direction: "inbound" | "outbound";
}

export async function refreshGmailToken(ownerId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: biz } = await admin
    .from("businesses")
    .select("email_refresh_token, email_token_expiry, email_access_token")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (!biz?.email_refresh_token) return null;

  // Check if still valid (5 min buffer)
  if (biz.email_token_expiry && new Date(biz.email_token_expiry).getTime() > Date.now() + 5 * 60_000) {
    return decryptToken(biz.email_access_token!);
  }

  // Refresh
  const refreshToken = decryptToken(biz.email_refresh_token);
  const res = await fetch(GMAIL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    // Token refresh failed — disable sync
    await admin
      .from("businesses")
      .update({ email_sync_enabled: false })
      .eq("owner_id", ownerId);
    return null;
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  const expiry = new Date(Date.now() + data.expires_in * 1000).toISOString();

  await admin
    .from("businesses")
    .update({
      email_access_token: encryptToken(data.access_token),
      email_token_expiry: expiry,
    })
    .eq("owner_id", ownerId);

  return data.access_token;
}

export async function sendGmailEmail(
  ownerId: string,
  opts: { to: string; subject: string; bodyHtml: string; bodyText?: string; fromName?: string; fromEmail?: string }
): Promise<void> {
  const accessToken = await refreshGmailToken(ownerId);
  if (!accessToken) throw new Error("Gmail not connected or token expired");

  const from = opts.fromEmail
    ? (opts.fromName ? `${opts.fromName} <${opts.fromEmail}>` : opts.fromEmail)
    : undefined;

  const headers = [
    `To: ${opts.to}`,
    from ? `From: ${from}` : "",
    `Subject: =?UTF-8?B?${Buffer.from(opts.subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
  ].filter(Boolean).join("\r\n");

  const rawEmail = `${headers}\r\n\r\n${opts.bodyHtml}`;
  const encoded = Buffer.from(rawEmail).toString("base64url");

  const res = await fetch(`${GMAIL_API}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encoded }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail send failed: ${err}`);
  }
}

export async function fetchGmailThreads(ownerId: string, clientEmail: string): Promise<EmailMessage[]> {
  const accessToken = await refreshGmailToken(ownerId);
  if (!accessToken) return [];

  const query = `from:${clientEmail} OR to:${clientEmail}`;
  const res = await fetch(
    `${GMAIL_API}/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];

  const data = await res.json() as { messages?: { id: string; threadId: string }[] };
  const messages: EmailMessage[] = [];

  for (const msg of (data.messages ?? []).slice(0, 20)) {
    const detail = await fetchGmailMessage(accessToken, msg.id);
    if (detail) messages.push(detail);
  }

  return messages;
}

async function fetchGmailMessage(accessToken: string, messageId: string): Promise<EmailMessage | null> {
  const res = await fetch(`${GMAIL_API}/users/me/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;

  const data = await res.json() as {
    id: string;
    threadId: string;
    payload: {
      headers: { name: string; value: string }[];
      parts?: { mimeType: string; body: { data?: string } }[];
      body?: { data?: string };
      mimeType: string;
    };
    labelIds?: string[];
    internalDate?: string;
  };

  const headers = data.payload?.headers ?? [];
  const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

  const from = getHeader("From");
  const to = getHeader("To");
  const subject = getHeader("Subject");
  const date = data.internalDate ? new Date(parseInt(data.internalDate)).toISOString() : new Date().toISOString();

  let bodyHtml = "";
  let bodyText = "";

  function extractBody(parts?: { mimeType: string; body: { data?: string }; parts?: unknown[] }[]) {
    if (!parts) return;
    for (const part of parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        bodyHtml = Buffer.from(part.body.data, "base64").toString("utf8");
      } else if (part.mimeType === "text/plain" && part.body?.data) {
        bodyText = Buffer.from(part.body.data, "base64").toString("utf8");
      }
      if (part.parts) extractBody(part.parts as typeof parts);
    }
  }

  if (data.payload.parts) {
    extractBody(data.payload.parts);
  } else if (data.payload.body?.data) {
    if (data.payload.mimeType === "text/html") {
      bodyHtml = Buffer.from(data.payload.body.data, "base64").toString("utf8");
    } else {
      bodyText = Buffer.from(data.payload.body.data, "base64").toString("utf8");
    }
  }

  const isSent = data.labelIds?.includes("SENT") ?? false;

  return {
    id: data.id,
    threadId: data.threadId,
    from,
    to,
    subject,
    bodyText: bodyText || bodyHtml.replace(/<[^>]*>/g, ""),
    bodyHtml: bodyHtml || `<p>${bodyText}</p>`,
    date,
    direction: isSent ? "outbound" : "inbound",
  };
}
