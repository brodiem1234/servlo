import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const abn = req.nextUrl.searchParams.get("abn");
  if (!abn) return NextResponse.json({ error: "ABN required" }, { status: 400 });

  const cleanAbn = abn.replace(/\s/g, "");

  try {
    // ABR lookup via public API
    const res = await fetch(
      `https://abr.business.gov.au/json/AbnDetails.aspx?abn=${cleanAbn}&callback=callback`,
      { next: { revalidate: 3600 } }
    );
    const text = await res.text();
    // Parse JSONP: callback({...})
    const jsonStr = text.replace(/^callback\(/, "").replace(/\)$/, "");
    const data = JSON.parse(jsonStr);

    if (data.AbnStatus === "Active") {
      return NextResponse.json({
        abn: data.Abn,
        entityName: data.EntityName || data.BusinessName?.[0]?.OrganisationName || "",
        entityType: data.EntityTypeName,
        status: "active",
        state: data.BusinessAddress?.StateCode,
        postcode: data.BusinessAddress?.Postcode,
      });
    }
    return NextResponse.json({ error: "ABN not found or inactive" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "ABN lookup failed" }, { status: 500 });
  }
}
