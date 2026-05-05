import { createClient } from "@/lib/supabase/server";

export async function getClientContext() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { user: null, clientIds: [] as string[], profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  const email = user.email ?? profile?.email ?? null;
  const { data: linkedClients } = email
    ? await supabase.from("clients").select("id").eq("email", email)
    : { data: [] };

  return {
    user,
    profile: profile ?? null,
    clientIds: (linkedClients ?? []).map((client) => client.id)
  };
}

