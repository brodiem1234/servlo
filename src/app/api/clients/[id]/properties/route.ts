import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data: client } = await supabase.from("clients").select("id").eq("id", clientId).eq("owner_id", user.id).is("deleted_at", null).maybeSingle();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const { data, error } = await supabase.from("client_properties").select("id, address, suburb, state, postcode, property_type, notes, created_at").eq("client_id", clientId).eq("owner_id", user.id).is("deleted_at", null).order("created_at");
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ properties: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ properties: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { data: client } = await supabase.from("clients").select("id").eq("id", clientId).eq("owner_id", user.id).is("deleted_at", null).maybeSingle();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  if (!body.address?.trim()) return NextResponse.json({ error: "Address is required" }, { status: 400 });
  const { data, error } = await supabase.from("client_properties").insert({ owner_id: user.id, client_id: clientId, address: body.address.trim(), suburb: body.suburb || null, state: body.state || null, postcode: body.postcode || null, property_type: body.property_type || "residential", notes: body.notes || null }).select("id, address, suburb, state, postcode, property_type, notes, created_at").single();
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Table not ready. Apply migrations." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ property: data }, { status: 201 });
}
