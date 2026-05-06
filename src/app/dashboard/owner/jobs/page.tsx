import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import JobsManager from "./jobs-manager";
import { employeeAssignmentEmailTemplate, sendEmail } from "@/lib/email";
import { filterDemoEntities } from "@/lib/demo/visibility";

type JobsPageProps = {
  searchParams?: Promise<{ client?: string | string[] }>;
};

export default async function OwnerJobsPage({ searchParams }: JobsPageProps) {
  const sp = searchParams ? await searchParams : {};
  const clientRaw = sp.client;
  const initialClientId =
    typeof clientRaw === "string" ? clientRaw.trim() || undefined : undefined;

  const sb = await createClient();
  const {
    data: { user }
  } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: jobs }, { data: clients }, { data: employees }] = await Promise.all([
    sb
      .from("jobs")
      .select(
        "id, owner_id, title, description, client_id, employee_id, job_type, scheduled_date, scheduled_start, scheduled_end, address, suburb, state, priority, notes, status, materials_cost, labour_hours, hourly_rate, created_at, is_demo, clients:clients(full_name), employees:employees(full_name)"
      )
      .eq("owner_id", user.id)
      .order("scheduled_date", { ascending: true }),
    sb.from("clients").select("id, full_name, is_demo").eq("owner_id", user.id).order("full_name"),
    sb.from("employees").select("id, full_name, is_demo").eq("owner_id", user.id).order("full_name")
  ]);

  const photoUrlsByJob: Record<string, Array<{ url: string; label: "before" | "after" }>> = {};
  const jobIds = (jobs ?? []).map((job) => job.id);
  if (jobIds.length > 0) {
    const { data: photoRows } = await sb
      .from("job_photos")
      .select("job_id, storage_path, label")
      .in("job_id", jobIds);
    for (const row of photoRows ?? []) {
      const { data } = sb.storage.from("job-photos").getPublicUrl(row.storage_path);
      const label: "before" | "after" = row.label === "after" ? "after" : "before";
      const current = photoUrlsByJob[row.job_id] ?? [];
      current.push({ url: data.publicUrl, label });
      photoUrlsByJob[row.job_id] = current;
    }
  }

  async function createJobAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const { error } = await sb.from("jobs").insert({
      owner_id: owner.id,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      client_id: String(formData.get("client_id") ?? "") || null,
      employee_id: String(formData.get("employee_id") ?? "") || null,
      job_type: String(formData.get("job_type") ?? ""),
      scheduled_date: String(formData.get("scheduled_date") ?? "") || null,
      scheduled_start: String(formData.get("scheduled_start") ?? "") || null,
      scheduled_end: String(formData.get("scheduled_end") ?? "") || null,
      address: String(formData.get("address") ?? ""),
      suburb: String(formData.get("suburb") ?? ""),
      state: String(formData.get("state") ?? ""),
      priority: String(formData.get("priority") ?? "normal"),
      notes: String(formData.get("notes") ?? ""),
      materials_cost: Number(formData.get("materials_cost") ?? 0) || 0,
      labour_hours: Number(formData.get("labour_hours") ?? 0) || 0,
      hourly_rate: Number(formData.get("hourly_rate") ?? 0) || 0
    });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/jobs");
  }

  async function updateJobAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    const { error } = await sb
      .from("jobs")
      .update({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        client_id: String(formData.get("client_id") ?? "") || null,
        employee_id: String(formData.get("employee_id") ?? "") || null,
        job_type: String(formData.get("job_type") ?? ""),
        scheduled_date: String(formData.get("scheduled_date") ?? "") || null,
        scheduled_start: String(formData.get("scheduled_start") ?? "") || null,
        scheduled_end: String(formData.get("scheduled_end") ?? "") || null,
        address: String(formData.get("address") ?? ""),
        suburb: String(formData.get("suburb") ?? ""),
        state: String(formData.get("state") ?? ""),
        priority: String(formData.get("priority") ?? "normal"),
        notes: String(formData.get("notes") ?? ""),
        materials_cost: Number(formData.get("materials_cost") ?? 0) || 0,
        labour_hours: Number(formData.get("labour_hours") ?? 0) || 0,
        hourly_rate: Number(formData.get("hourly_rate") ?? 0) || 0
      })
      .eq("id", id)
      .eq("owner_id", owner.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/jobs");
  }

  async function updateJobStatusAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "scheduled");
    const { error } = await sb.from("jobs").update({ status }).eq("id", id).eq("owner_id", owner.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/jobs");
  }

  async function createInvoiceFromJobAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const jobId = String(formData.get("job_id") ?? "");
    const { data: jobCheck } = await sb
      .from("jobs")
      .select("is_demo")
      .eq("id", jobId)
      .eq("owner_id", owner.id)
      .maybeSingle();
    if (jobCheck?.is_demo) return;

    const { data: job } = await sb
      .from("jobs")
      .select("id, title, client_id, scheduled_date")
      .eq("id", jobId)
      .eq("owner_id", owner.id)
      .maybeSingle();
    if (!job) return;
    const query = new URLSearchParams({
      prefill_client_id: String(job.client_id ?? ""),
      prefill_title: String(job.title ?? ""),
      prefill_date: String(job.scheduled_date ?? ""),
      prefill_job_id: String(job.id)
    });
    redirect(`/dashboard/owner/invoices?${query.toString()}`);
  }

  async function updateJobScheduleAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    const scheduledDate = String(formData.get("scheduled_date") ?? "");
    const { error } = await sb
      .from("jobs")
      .update({ scheduled_date: scheduledDate || null })
      .eq("id", id)
      .eq("owner_id", owner.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/owner/jobs");
  }

  async function updateJobEmployeeAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const id = String(formData.get("id") ?? "");
    const employeeId = String(formData.get("employee_id") ?? "") || null;
    const { data: updatedJob, error } = await sb
      .from("jobs")
      .update({ employee_id: employeeId })
      .eq("id", id)
      .eq("owner_id", owner.id)
      .select("title, scheduled_date, is_demo")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (employeeId && !updatedJob?.is_demo) {
      const { data: employee } = await sb.from("employees").select("full_name, email, is_demo").eq("id", employeeId).maybeSingle();
      if (employee?.email && !employee.is_demo) {
        await sendEmail(
          employee.email,
          `New job assignment: ${updatedJob?.title ?? "SERVLO job"}`,
          employeeAssignmentEmailTemplate({
            employeeName: employee.full_name ?? "there",
            jobTitle: updatedJob?.title ?? "SERVLO job",
            scheduledDate: updatedJob?.scheduled_date
              ? new Date(updatedJob.scheduled_date).toLocaleDateString("en-AU")
              : "-"
          })
        );
      }
    }
    revalidatePath("/dashboard/owner/jobs");
  }

  async function uploadJobPhotoAction(formData: FormData) {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) redirect("/auth/login");
    const jobId = String(formData.get("job_id") ?? "");
    const { data: photoJob } = await sb.from("jobs").select("is_demo").eq("id", jobId).eq("owner_id", owner.id).maybeSingle();
    if (photoJob?.is_demo) return;

    const label = String(formData.get("photo_label") ?? "before").toLowerCase() === "after" ? "after" : "before";
    const files = formData.getAll("photos").filter((entry): entry is File => entry instanceof File);
    for (const file of files) {
      if (!file.name) continue;
      const bytes = await file.arrayBuffer();
      const path = `${jobId}/${label}-${Date.now()}-${file.name}`;
      const { error } = await sb.storage.from("job-photos").upload(path, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false
      });
      if (error) throw new Error(error.message);
      await sb.from("job_photos").insert({
        job_id: jobId,
        owner_id: owner.id,
        storage_path: path,
        label
      });
    }
    revalidatePath("/dashboard/owner/jobs");
  }

  type QuickCreateJobRefResult = { ok: boolean; id?: string; label?: string; message?: string };

  async function quickCreateClientForJobAction(formData: FormData): Promise<QuickCreateJobRefResult> {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) return { ok: false, message: "Not signed in" };
    const full_name = String(formData.get("full_name") ?? "").trim();
    if (!full_name) return { ok: false, message: "Name is required" };
    const phone = String(formData.get("phone") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const { data, error } = await sb
      .from("clients")
      .insert({
        owner_id: owner.id,
        full_name,
        phone: phone || null,
        email: email || null,
        status: "active",
        source: "other",
        portal_token: crypto.randomUUID(),
        company_name: "",
        abn: "",
        address: "",
        suburb: "",
        state: "",
        postcode: "",
        notes: ""
      })
      .select("id, full_name")
      .maybeSingle();
    if (error) {
      const fb = await sb
        .from("clients")
        .insert({
          owner_id: owner.id,
          full_name,
          phone: phone || null,
          email: email || null,
          notes: ""
        })
        .select("id, full_name")
        .maybeSingle();
      if (fb.error) return { ok: false, message: fb.error.message };
      revalidatePath("/dashboard/owner/jobs");
      revalidatePath("/dashboard/owner/clients");
      return { ok: true, id: fb.data?.id, label: fb.data?.full_name ?? full_name };
    }
    revalidatePath("/dashboard/owner/jobs");
    revalidatePath("/dashboard/owner/clients");
    return { ok: true, id: data?.id, label: data?.full_name ?? full_name };
  }

  async function quickCreateEmployeeForJobAction(formData: FormData): Promise<QuickCreateJobRefResult> {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) return { ok: false, message: "Not signed in" };
    const full_name = String(formData.get("full_name") ?? "").trim();
    if (!full_name) return { ok: false, message: "Name is required" };
    const phone = String(formData.get("phone") ?? "").trim();
    const role = String(formData.get("role") ?? "employee").trim() || "employee";
    const full = await sb
      .from("employees")
      .insert({
        owner_id: owner.id,
        full_name,
        email: "",
        phone: phone || null,
        trade_type: "",
        licences: [],
        hourly_rate: 0,
        role
      })
      .select("id, full_name")
      .maybeSingle();
    if (!full.error && full.data) {
      revalidatePath("/dashboard/owner/jobs");
      revalidatePath("/dashboard/owner/employees");
      return { ok: true, id: full.data.id, label: full.data.full_name ?? full_name };
    }
    const fb = await sb
      .from("employees")
      .insert({
        owner_id: owner.id,
        full_name,
        phone: phone || null,
        email: ""
      })
      .select("id, full_name")
      .maybeSingle();
    if (fb.error) return { ok: false, message: fb.error.message };
    revalidatePath("/dashboard/owner/jobs");
    revalidatePath("/dashboard/owner/employees");
    return { ok: true, id: fb.data?.id, label: fb.data?.full_name ?? full_name };
  }

  const jobsMapped = (jobs ?? []).map((job: any) => ({
    ...job,
    client_name: job.clients?.full_name ?? null,
    employee_name: job.employees?.full_name ?? null
  }));
  const visibleJobs = filterDemoEntities(jobsMapped);
  const clientRefs = filterDemoEntities(clients ?? []).map((c: any) => ({
    id: c.id,
    label: c.full_name ?? "Unnamed client"
  }));
  const employeeRefs = filterDemoEntities(employees ?? []).map((e: any) => ({
    id: e.id,
    label: e.full_name ?? "Unnamed employee"
  }));

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Jobs</h1>
      </div>
      <JobsManager
        jobs={visibleJobs}
        clients={clientRefs}
        employees={employeeRefs}
        initialClientId={initialClientId}
        createJobAction={createJobAction}
        updateJobAction={updateJobAction}
        updateJobStatusAction={updateJobStatusAction}
        createInvoiceFromJobAction={createInvoiceFromJobAction}
        updateJobScheduleAction={updateJobScheduleAction}
        updateJobEmployeeAction={updateJobEmployeeAction}
        uploadJobPhotoAction={uploadJobPhotoAction}
        jobPhotosByJob={photoUrlsByJob}
        quickCreateClientForJobAction={quickCreateClientForJobAction}
        quickCreateEmployeeForJobAction={quickCreateEmployeeForJobAction}
      />
    </section>
  );
}


