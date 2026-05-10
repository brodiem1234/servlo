import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("clients")
    .select("full_name, email, phone, suburb, state, postcode, client_type, status, created_at")
    .eq("owner_id", user.id)
    .eq("is_demo", false)
    .is("deleted_at", null)
    .order("full_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = "ContactName,EmailAddress,Phone,Suburb,State,PostalCode,ClientType,Status,CreatedAt";
  const rows = (data ?? []).map((r) =>
    [
      JSON.stringify(r.full_name ?? ""),
      JSON.stringify(r.email ?? ""),
      JSON.stringify(r.phone ?? ""),
      JSON.stringify(r.suburb ?? ""),
      JSON.stringify(r.state ?? ""),
      JSON.stringify(r.postcode ?? ""),
      JSON.stringify(r.client_type ?? "customer"),
      JSON.stringify(r.status ?? ""),
      JSON.stringify(r.created_at ?? "")
    ].join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="servlo-clients.csv"`
    }
  });
}
