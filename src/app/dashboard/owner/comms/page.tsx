import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommsClient } from "./comms-client";

export const dynamic = "force-dynamic";

export default async function CommsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: threads } = await supabase
    .from("email_threads")
    .select("id, subject, last_message_at, message_count, client_id, job_id")
    .eq("owner_id", user.id)
    .order("last_message_at", { ascending: false })
    .limit(50);

  // Load clients for display names
  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, email, phone")
    .eq("owner_id", user.id)
    .order("full_name");

  const clientMap: Record<string, { full_name: string | null; email: string | null; phone: string | null }> = {};
  for (const c of clients ?? []) {
    clientMap[c.id] = { full_name: c.full_name, email: c.email, phone: c.phone ?? null };
  }

  // Load email provider status
  const { data: biz } = await supabase
    .from("businesses")
    .select("email_provider, email_connected_address, email_sync_enabled")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <CommsClient
      threads={threads ?? []}
      clients={clients ?? []}
      clientMap={clientMap}
      emailProvider={(biz as { email_provider?: string | null } | null)?.email_provider ?? null}
      emailConnectedAddress={(biz as { email_connected_address?: string | null } | null)?.email_connected_address ?? null}
      emailSyncEnabled={(biz as { email_sync_enabled?: boolean | null } | null)?.email_sync_enabled ?? false}
    />
  );
}
