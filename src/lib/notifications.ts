import { createClient } from "@/lib/supabase/server";

export async function createNotification(ownerId: string, {
  type,
  title,
  body,
  actionUrl,
}: {
  type: "invoice_paid" | "quote_accepted" | "job_completed" | "new_lead" | "system";
  title: string;
  body?: string;
  actionUrl?: string;
}) {
  try {
    const sb = await createClient();
    await sb.from("notifications").insert({
      owner_id: ownerId,
      type,
      title,
      body: body ?? null,
      action_url: actionUrl ?? null,
      read: false,
    });
  } catch (e) {
    console.error("Failed to create notification:", e);
  }
}
