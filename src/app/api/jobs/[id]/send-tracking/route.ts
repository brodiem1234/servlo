import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/sms";

/**
 * POST /api/jobs/:id/send-tracking
 * Auth-gated. Generates a tracking_token for the job and sends an SMS to the client.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: jobId } = await params;

  // Fetch job and verify ownership
  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .select("id, title, client_id, status, scheduled_start, tracking_token")
    .eq("id", jobId)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (jobErr || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Generate or reuse tracking token
  const trackingToken = job.tracking_token ?? crypto.randomUUID();

  // Save token to job
  const admin = createAdminClient();
  await admin
    .from("jobs")
    .update({ tracking_token: trackingToken })
    .eq("id", jobId);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.servlo.com.au";
  const trackingUrl = `${appUrl}/track/${trackingToken}`;

  // Send SMS to client if they have a phone
  let stub = true;
  if (job.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("full_name, phone")
      .eq("id", job.client_id)
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (client?.phone) {
      const clientName = client.full_name ?? "there";
      const jobTitle = job.title ?? "your service job";
      const message = `Hi ${clientName}, your technician is on the way for "${jobTitle}". Track them here: ${trackingUrl}`;

      const result = await sendSms(client.phone, message);
      stub = !result.ok || result.sid === "dev-noop";

      // Best-effort log
      try {
        await admin.from("sms_messages").insert({
          owner_id: user.id,
          client_id: job.client_id,
          to_number: client.phone,
          from_number: process.env.TWILIO_FROM_NUMBER ?? null,
          message,
          direction: "outbound",
          status: result.ok ? "sent" : "failed",
          sent_at: new Date().toISOString(),
          is_stub: stub,
          external_id: result.sid && result.sid !== "dev-noop" ? result.sid : null,
        });
      } catch {
        // sms_messages table not yet created
      }
    }
  }

  return NextResponse.json({ tracking_url: trackingUrl, stub });
}
