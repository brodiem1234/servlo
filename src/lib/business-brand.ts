/**
 * Business brand settings helper.
 * Used by email templates and PDF routes to apply white-label branding.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface BusinessBrand {
  businessName: string;
  logoUrl: string | null;
  colorPrimary: string;
  emailFromName: string;
  phone: string | null;
  address: string | null;
  accentColour: string;
}

/**
 * Returns brand settings for a given owner.
 * Falls back to business_name and accent_colour when brand fields are not set.
 */
export async function getBusinessBrand(ownerId: string): Promise<BusinessBrand> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("businesses")
    .select("business_name, accent_colour, brand_logo_url, brand_color_primary, brand_company_name, brand_email_from_name, brand_phone, brand_address")
    .eq("owner_id", ownerId)
    .maybeSingle();

  const businessName = (data as Record<string, string | null> | null)?.brand_company_name || (data as Record<string, string | null> | null)?.business_name || "SERVLO";
  const accentColour = (data as Record<string, string | null> | null)?.accent_colour || "#3B82F6";
  const colorPrimary = (data as Record<string, string | null> | null)?.brand_color_primary || accentColour;

  return {
    businessName,
    logoUrl: (data as Record<string, string | null> | null)?.brand_logo_url ?? null,
    colorPrimary,
    accentColour,
    emailFromName: (data as Record<string, string | null> | null)?.brand_email_from_name || businessName,
    phone: (data as Record<string, string | null> | null)?.brand_phone ?? null,
    address: (data as Record<string, string | null> | null)?.brand_address ?? null,
  };
}
