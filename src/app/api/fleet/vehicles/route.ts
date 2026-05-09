import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data, error } = await supabase
    .from("vehicles")
    .select("id, name, make, model, year, registration, status, odometer_km, fuel_type, assigned_to")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("name");

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ vehicles: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ vehicles: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, make, model, year, registration, fuel_type, status } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      owner_id: user.id,
      name: name.trim(),
      make: make || null,
      model: model || null,
      year: year ? Number(year) : null,
      registration: registration || null,
      fuel_type: fuel_type || "petrol",
      status: status || "active",
    })
    .select("id, name, make, model, year, registration, status, odometer_km, fuel_type")
    .single();

  if (error) {
    if (error.code === "42P01")
      return NextResponse.json(
        { error: "Vehicles table not ready. Apply migrations." },
        { status: 503 }
      );
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ vehicle: data }, { status: 201 });
}
