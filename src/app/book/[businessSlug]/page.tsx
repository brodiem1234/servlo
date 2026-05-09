import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBusinessBrand } from "@/lib/business-brand";
import { BookingFormClient } from "./booking-form-client";

type Props = {
  params: Promise<{ businessSlug: string }>;
};

export const dynamic = "force-dynamic";

export default async function BookingPage({ params }: Props) {
  const { businessSlug } = await params;
  const admin = createAdminClient();

  // Look up business by booking_slug or owner_id (booking_slug may not exist yet — fall back to id)
  const { data: business } = await admin
    .from("businesses")
    .select("id, owner_id, business_name, phone, email, accent_colour, booking_enabled, booking_service_types")
    .eq("booking_slug", businessSlug)
    .maybeSingle();

  // Fallback: try owner_id directly (for embed use)
  const resolvedBusiness = business;
  if (!resolvedBusiness) return notFound();

  const bookingEnabled = (resolvedBusiness as { booking_enabled?: boolean | null }).booking_enabled !== false;
  if (!bookingEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <div>
          <p className="text-lg font-semibold text-gray-700">Online booking is not available for this business.</p>
        </div>
      </main>
    );
  }

  const brand = await getBusinessBrand(resolvedBusiness.owner_id);
  const accent = brand.colorPrimary || resolvedBusiness.accent_colour || "#3B82F6";
  const displayName = brand.businessName || resolvedBusiness.business_name || "Book a service";
  const logoUrl = brand.logoUrl;
  const serviceTypes = (resolvedBusiness as { booking_service_types?: string[] | null }).booking_service_types ?? [];

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: accent, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={displayName} style={{ maxHeight: 48, maxWidth: 160, objectFit: "contain" }} />
        ) : (
          <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{displayName}</span>
        )}
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Request a Service</h1>
        <p style={{ color: "#64748b", marginBottom: 24, fontSize: 15 }}>
          Fill in your details and we&apos;ll be in touch to confirm your booking.
        </p>
        <BookingFormClient
          ownerId={resolvedBusiness.owner_id}
          accent={accent}
          serviceTypes={serviceTypes}
        />
      </div>
    </main>
  );
}
