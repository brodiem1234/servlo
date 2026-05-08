import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** DELETE /api/xero/disconnect — removes Xero connection for the authenticated owner */
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  await admin
    .from("accounting_connections")
    .delete()
    .eq("owner_id", user.id)
    .eq("provider", "xero");

  return NextResponse.json({ ok: true });
}
