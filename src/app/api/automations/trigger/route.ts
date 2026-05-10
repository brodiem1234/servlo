import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { getBusinessBrand } from "@/lib/business-brand";

/**
 * POST /api/automations/trigger
 * Called internally after a job status change to fire any configured automations.
 * Expects { job_id, new_status }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { job_id?: string; new_status?: string };
  const { job_id, new_status } = body;

  if (!job_id || !new_status) {
    return NextResponse.json({ error: "job_id and new_status required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Load active automations for this status
  const { data: automations } = await admin
    .from("job_automations")
    .select("id, action_type, email_subject, message_body")
    .eq("owner_id", user.id)
    .eq("trigger_status", new_status)
    .eq("is_active", true);

  if (!automations || automations.length === 0) {
    return NextResponse.json({ ok: true, fired: 0 });
  }

  // Load job + client details
  const { data: job } = await admin
    .from("jobs")
    .select("id, title, address, suburb, scheduled_date, client_id")
    .eq("id", job_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

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

  const brand = await getBusinessBrand(user.id);
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "hello@servlo.com.au";
  const fromName = brand.emailFromName || brand.businessName || "SERVLO";

  let fired = 0;
  for (const auto of automations) {
    // Replace template variables
    const body = auto.message_body
      .replace(/\{job_title\}/g, job.title ?? "your job")
      .replace(/\{client_name\}/g, clientName ?? "there")
      .replace(/\{status\}/g, new_status)
      .replace(/\{address\}/g, [job.address, job.suburb].filter(Boolean).join(", ") || "")
      .replace(/\{scheduled_date\}/g, job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString("en-AU") : "");

    let status = "sent";
    let recipient: string | null = null;

    try {
      if (auto.action_type === "email" && clientEmail) {
        recipient = clientEmail;
        const subject = (auto.email_subject || `Job update: ${job.title ?? ""}`)
          .replace(/\{job_title\}/g, job.title ?? "your job")
          .replace(/\{status\}/g, new_status);
        await sendEmail(
          clientEmail,
          subject,
          `<p>${body.replace(/\n/g, "<br>")}</p>`,
          `${fromName} <${fromEmail}>`
        );
        fired++;
      } else if (auto.action_type === "sms" && clientPhone) {
        recipient = clientPhone;
        const result = await sendSms(clientPhone, body);
        if (result.ok) fired++;
        else status = "failed";
      }
    } catch {
      status = "failed";
    }

    // Log the execution
    await admin.from("job_automation_log").insert({
      owner_id: user.id,
      automation_id: auto.id,
      job_id,
      action_type: auto.action_type,
      recipient,
      status,
    }).then(undefined, () => { /* best-effort log */ });
  }

  return NextResponse.json({ ok: true, fired });
}
