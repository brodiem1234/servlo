import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

// TODO: Install jszip (npm install jszip) to produce a ZIP file with individual CSVs.
// Currently returns all data as a single JSON download.

/** Convert an array of objects to a CSV string. */
function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];
  return lines.join("\n");
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();

    // Fetch all user's data in parallel
    const [
      clientsResult,
      jobsResult,
      invoicesResult,
      quotesResult,
      employeesResult,
      contractorsResult,
      timesheetsResult,
      businessResult,
    ] = await Promise.all([
      admin.from("clients").select("*").eq("owner_id", user.id).is("deleted_at", null),
      admin.from("jobs").select("*").eq("owner_id", user.id).is("deleted_at", null),
      admin.from("invoices").select("*").eq("owner_id", user.id).is("deleted_at", null),
      admin.from("quotes").select("*").eq("owner_id", user.id).is("deleted_at", null),
      admin.from("employees").select("*").eq("owner_id", user.id).is("deleted_at", null),
      admin.from("employees").select("*").eq("owner_id", user.id).eq("role", "contractor").is("deleted_at", null),
      admin.from("timesheets").select("*"),
      admin.from("businesses").select("*").eq("owner_id", user.id).maybeSingle(),
    ]);

    // Log the export
    await logAudit({
      userId: user.id,
      businessId: null,
      table: "account",
      recordId: user.id,
      action: "exported",
    });

    const exportDate = new Date().toISOString().slice(0, 10);

    const payload = {
      exportDate,
      exportedBy: user.email,
      business: businessResult.data ?? null,
      clients: clientsResult.data ?? [],
      jobs: jobsResult.data ?? [],
      invoices: invoicesResult.data ?? [],
      quotes: quotesResult.data ?? [],
      employees: (employeesResult.data ?? []).filter((e: Record<string, unknown>) => e.role !== "contractor"),
      contractors: contractorsResult.data ?? [],
      timesheets: timesheetsResult.data ?? [],
      csvFiles: {
        clients: toCSV((clientsResult.data ?? []) as Record<string, unknown>[]),
        jobs: toCSV((jobsResult.data ?? []) as Record<string, unknown>[]),
        invoices: toCSV((invoicesResult.data ?? []) as Record<string, unknown>[]),
        quotes: toCSV((quotesResult.data ?? []) as Record<string, unknown>[]),
      },
      readme: [
        "SERVLO Data Export",
        `Date: ${exportDate}`,
        `Account: ${user.email}`,
        "",
        "This file contains all your SERVLO data.",
        "CSV files for each entity type are included in the csvFiles object.",
        "",
        "Note: Install jszip on the server to receive this as a .zip file with",
        "individual CSV files instead of a single JSON bundle.",
      ].join("\n"),
    };

    const json = JSON.stringify(payload, null, 2);
    const bytes = new TextEncoder().encode(json);

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="servlo-export-${exportDate}.json"`,
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (err) {
    console.error("[account/export] error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
