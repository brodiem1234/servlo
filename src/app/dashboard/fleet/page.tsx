import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FleetDashboard from "./fleet-dashboard";

export const dynamic = "force-dynamic";

export default async function FleetDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // ── Vehicles ─────────────────────────────────────────────────────────────
  const { data: vehiclesRaw, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("id, name, make, model, year, registration, status, odometer_km, assigned_to, fuel_type")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("name");

  const vehicles =
    vehiclesError?.code === "42P01" ? [] : (vehiclesRaw ?? []);

  // ── Upcoming service records ──────────────────────────────────────────────
  const { data: serviceRaw, error: serviceError } = await supabase
    .from("vehicle_service_records")
    .select("id, vehicle_id, service_type, service_date, next_service_date, next_service_km, cost")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("next_service_date", { ascending: true })
    .limit(5);

  const serviceRecords =
    serviceError?.code === "42P01" ? [] : (serviceRaw ?? []);

  // ── Recent trips ─────────────────────────────────────────────────────────
  const { data: tripsRaw, error: tripsError } = await supabase
    .from("vehicle_trips")
    .select("id, vehicle_id, trip_date, distance_km, purpose, fuel_cost")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("trip_date", { ascending: false })
    .limit(10);

  const trips = tripsError?.code === "42P01" ? [] : (tripsRaw ?? []);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const minus30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status === "active").length;

  const dueForService = serviceRecords.filter((s) => {
    if (!s.next_service_date) return false;
    const d = new Date(s.next_service_date);
    return d >= now && d <= in30Days;
  }).length;

  const fuelSpend30d = trips
    .filter((t) => {
      if (!t.trip_date) return false;
      return new Date(t.trip_date) >= minus30Days;
    })
    .reduce((sum, t) => sum + (t.fuel_cost ?? 0), 0);

  return (
    <FleetDashboard
      vehicles={vehicles}
      serviceRecords={serviceRecords}
      trips={trips}
      stats={{ totalVehicles, activeVehicles, dueForService, fuelSpend30d }}
    />
  );
}
