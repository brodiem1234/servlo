"use server";

type AbrJsonpResponse = {
  Abn?: string;
  AbnStatus?: string;
  EntityName?: string;
  BusinessName?: Array<{ OrganisationName?: string } | string>;
  Message?: string;
};

export type AbnLookupResult =
  | { status: "active"; entityName: string }
  | { status: "inactive"; entityName: string }
  | { status: "not_found" }
  | { status: "skipped" }
  | { status: "error"; message: string };

/**
 * Look up an ABN in the Australian Business Register.
 * Returns "skipped" when ABR_GUID is not configured so callers can degrade
 * gracefully (fall back to algorithm-only validation).
 *
 * Register free at abr.business.gov.au/Tools/WebServices
 */
export async function lookupABN(abn: string): Promise<AbnLookupResult> {
  const guid = process.env.ABR_GUID;
  if (!guid || guid === "your_abr_guid_here") {
    return { status: "skipped" };
  }

  const cleanAbn = abn.replace(/\D/g, "");
  const url = `https://abr.business.gov.au/json/AbnDetails.aspx?abn=${cleanAbn}&callback=callback&guid=${encodeURIComponent(guid)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return { status: "error", message: `ABR API returned ${res.status}` };
    }

    const text = await res.text();

    // Strip JSONP wrapper: callback({...}) or callback({...});
    const stripped = text.trim().replace(/^callback\s*\(/, "").replace(/\)[\s;]*$/, "");
    const data = JSON.parse(stripped) as AbrJsonpResponse;

    const message = data.Message ?? "";
    if (!data.Abn || message.toLowerCase().includes("no records found") || message.toLowerCase().includes("search is not applicable")) {
      return { status: "not_found" };
    }

    // Prefer EntityName; fall back to first BusinessName entry
    let entityName = data.EntityName ?? "";
    if (!entityName && Array.isArray(data.BusinessName) && data.BusinessName.length > 0) {
      const first = data.BusinessName[0];
      entityName =
        typeof first === "string"
          ? first
          : (first as { OrganisationName?: string }).OrganisationName ?? "";
    }
    if (!entityName) entityName = "Unknown Entity";

    const abnStatus = (data.AbnStatus ?? "").toLowerCase();
    if (abnStatus === "active") {
      return { status: "active", entityName };
    }
    return { status: "inactive", entityName };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "ABR lookup failed",
    };
  }
}
