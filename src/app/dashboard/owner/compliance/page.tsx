import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ComplianceManager from "./compliance-manager";

export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("compliance_documents")
    .select("id, name, doc_type, template_key, status, signed_at, expiry_date, job_id, created_at")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  let docs: {
    id: string;
    name: string;
    doc_type: string;
    template_key: string | null;
    status: string;
    signed_at: string | null;
    expiry_date: string | null;
    job_id: string | null;
    created_at: string;
  }[] = [];

  if (error) {
    if (error.code !== "42P01") {
      console.error("compliance_documents fetch error:", error);
    }
  } else {
    docs = data ?? [];
  }

  return (
    <div className="space-y-5">
      {/* Preview-mode banner — file upload isn't built yet, this surface is
          metadata-only for now. Stops customers expecting full PDF storage. */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        <strong className="text-amber-100">Preview feature.</strong> Document
        records and statuses are tracked here for compliance reference. PDF
        upload + signed-copy storage is coming in a future update — for now,
        store your master copy in your own filesystem and link it via the
        notes field.
      </div>
      <ComplianceManager initialDocs={docs} />
    </div>
  );
}
