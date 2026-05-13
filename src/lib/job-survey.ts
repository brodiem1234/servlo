import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { getBusinessBrand } from "@/lib/business-brand";

/**
 * Send a satisfaction survey link to the client after job completion.
 * Generates a unique survey_token, stores it on the job, emails the client.
 * Fire-and-forget — non-fatal if email fails.
 */
export async function sendJobCompletionSurvey(
  ownerId: string,
  jobId: string,
  clientId: string | null | undefined,
  jobTitle: string | null | undefined
): Promise<void> {
  if (!clientId) return;

  const admin = createAdminClient();

  // Get client email
  const { data: client } = await admin
    .from("clients")
    .select("email, full_name")
    .eq("id", clientId)
    .maybeSingle();

  if (!client?.email) return;

  // Get or generate survey token
  const { data: jobRow } = await admin
    .from("jobs")
    .select("survey_token")
    .eq("id", jobId)
    .maybeSingle();

  let token = (jobRow as any)?.survey_token;
  if (!token) {
    // Generate a new token
    token = crypto.randomUUID();
    await admin.from("jobs").update({ survey_token: token }).eq("id", jobId);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.app";
  const surveyUrl = `${appUrl}/survey/${token}?job=${jobId}`;

  const brand = await getBusinessBrand(ownerId);
  const businessName = brand.businessName ?? "Your service provider";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "hello@servlo.com.au";
  const fromName = brand.emailFromName || businessName;
  const clientFirstName = client.full_name?.split(" ")[0] ?? "there";
  const title = jobTitle ?? "your recent service";

  await sendEmail(
    client.email,
    `How did we do? — ${title}`,
    `<p style="font-family:Arial,sans-serif;font-size:15px;color:#0f172a;">Hi ${clientFirstName},</p>
<p style="font-family:Arial,sans-serif;font-size:15px;color:#0f172a;">
  Thank you for choosing ${businessName}! We hope ${title} went well.
  We'd love to hear your feedback — it only takes 30 seconds.
</p>
<p style="text-align:center;margin:24px 0;">
  <a href="${surveyUrl}" style="background:${brand.accentColour ?? "#3B82F6"};color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-family:Arial,sans-serif;font-size:15px;font-weight:600;display:inline-block;">
    Rate your experience ⭐
  </a>
</p>
<p style="font-family:Arial,sans-serif;font-size:13px;color:#64748b;">
  ${businessName} · Powered by SERVLO
</p>`,
    `${fromName} <${fromEmail}>`
  );
}
