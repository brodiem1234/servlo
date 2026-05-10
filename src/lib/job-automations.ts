import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { getBusinessBrand } from "@/lib/business-brand";

/**
 * Fire all active automations for a given owner + job status change.
 * Called from the updateJobStatusAction server action after a successful update.
 * Non-fatal — errors are logged but not thrown.
 */
export async function fireJobAutomations(
  ownerId: string,
  jobId: string,
  newStatus: string
): Promise<void> {
  const admin = createAdminClient();

  const { data: automations } = await admin
    .from("job_automations")
    .select("id, action_type, email_subject, message_body")
    .eq("owner_id", ownerId)
    .eq("trigger_status", newStatus)
    .eq("is_active", true);

  if (!automations || automations.length === 0) return;

  const { data: job } = await admin
    .from("jobs")
    .select("id, title, address, suburb, scheduled_date, client_id")
    .eq("id", jobId)
    .maybeSingle();

  if (!job) return;

  let clientEmail: string | null = null;
  let clientPhone: string | null = null;
  let clientName: string | null = null;

  if (job.client_id) {
    const { data: client } = await admin
      .from("clients")
      .select("full_name, email, phone")
      .eq("id", job.client_id)
      .maybeSingle();
    clientEmail = client?.email ?? null;
    clientPhone = client?.phone ?? null;
    clientName = client?.full_name ?? null;
  }

  const brand = await getBusinessBrand(ownerId);
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "hello@servlo.com.au";
  const fromName = brand.emailFromName || brand.businessName || "SERVLO";

  for (const auto of automations) {
    const body = auto.message_body
      .replace(/\{job_title\}/g, job.title ?? "your job")
      .replace(/\{client_name\}/g, clientName ?? "there")
      .replace(/\{status\}/g, newStatus)
      .replace(/\{address\}/g, [job.address, job.suburb].filter(Boolean).join(", ") || "")
      .replace(/\{scheduled_date\}/g, job.scheduled_date ? new Date(job.scheduled_date as string).toLocaleDateString("en-AU") : "");

    let status = "sent";
    let recipient: string | null = null;

    try {
      if (auto.action_type === "email" && clientEmail) {
        recipient = clientEmail;
        const subject = (auto.email_subject || `Job update: ${job.title ?? ""}`)
          .replace(/\{job_title\}/g, job.title ?? "your job")
          .replace(/\{status\}/g, newStatus);
        await sendEmail(clientEmail, subject, `<p>${body.replace(/\n/g, "<br>")}</p>`, `${fromName} <${fromEmail}>`);
      } else if (auto.action_type === "sms" && clientPhone) {
        recipient = clientPhone;
        const result = await sendSms(clientPhone, body);
        if (!result.ok) status = "failed";
      }
    } catch {
      status = "failed";
    }

    await admin
      .from("job_automation_log")
      .insert({ owner_id: ownerId, automation_id: auto.id, job_id: jobId, action_type: auto.action_type, recipient, status })
      .then(undefined, () => {});
  }
}
