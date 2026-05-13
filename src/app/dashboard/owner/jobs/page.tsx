import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwnerWorkspaceFeatures } from "@/lib/owner-workspace-context";
import { guardWorkspaceNav } from "@/lib/workspace-feature-guard";
import { revalidateOwnerWorkspaceRoutes } from "@/lib/dashboard/revalidate-owner";
import JobsManager from "./jobs-manager";
import { employeeAssignmentEmailTemplate, sendEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { filterDemoEntities } from "@/lib/demo/visibility";
import FirstVisitBanner from "@/components/dashboard/first-visit-banner";
import { canCreateJob } from "@/lib/plan-limits";
import { fireJobAutomations } from "@/lib/job-automations";
import { sendJobCompletionSurvey } from "@/lib/job-survey";
import { getNextJobNumber } from "@/lib/sequences";

export const dynamic = "force-dynamic";

/** Given a base date and a recurrence rule, return the next `count` ISO date strings. */
function generateRecurringDates(base: Date, rule: string, count: number): string[] {
  const results: string[] = [];
  let current = new Date(base);
  for (let i = 0; i < count; i++) {
    switch (rule) {
      case "weekly":
        current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 7);
        break;
      case "fortnightly":
        current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 14);
        break;
      case "monthly":
        current = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate());
        break;
      case "quarterly":
        current = new Date(current.getFullYear(), current.getMonth() + 3, current.getDate());
        break;
      case "annually":
        current = new Date(current.getFullYear() + 1, current.getMonth(), current.getDate());
        break;
      default:
        return results;
    }
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    results.push(`${y}-${m}-${d}`);
  }
  return results;
}

type JobsPageProps = {
  searchParams?: Promise<{ client?: string | string[]; openJob?: string; today?: string }>;
};

export default async function OwnerJobsPage({ searchParams }: JobsPageProps) {
  const sp = searchParams ? await searchParams : {};
  const clientRaw = sp.client;
  const initialClientId =
    typeof clientRaw === "string" ? clientRaw.trim() || undefined : undefined;
  const initialOpenJobId =
    typeof sp.openJob === "string" ? sp.openJob.trim() || undefined : undefined;
  const initialScheduleToday = sp.today === "today";

  const { user, enabled, supabase: sb } = await requireOwnerWorkspaceFeatures();
  guardWorkspaceNav(enabled, "scheduling");

  // Attempt full column select; fall back to base columns if schema is ahead of DB
  const [jobsResultFull, clientsResult, employeesResult] = await Promise.all([
    sb
      .from("jobs")
      .select(
        "id, owner_id, title, description, client_id, employee_id, job_type, scheduled_date, scheduled_start, scheduled_end, address, suburb, state, priority, notes, status, materials_cost, labour_hours, hourly_rate, revenue, recurrence_rule, digital_signoff_image, signoff_name, signoff_at, created_at, is_demo"
      )
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .order("scheduled_date", { ascending: true }),
    sb.from("clients").select("id, full_name, is_demo").eq("owner_id", user.id).is("deleted_at", null).order("full_name"),
    sb.from("employees").select("id, full_name, role, is_demo").eq("owner_id", user.id).is("deleted_at", null).order("full_name")
  ]);

  // If the full query errored (likely a missing column), retry with only the base columns
  let jobsRaw: unknown[] = [];
  if (jobsResultFull.error) {
    const fallback = await sb
      .from("jobs")
      .select(
        "id, owner_id, title, description, client_id, employee_id, job_type, scheduled_date, scheduled_start, scheduled_end, address, suburb, state, priority, notes, status, materials_cost, labour_hours, hourly_rate, created_at, is_demo"
      )
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .order("scheduled_date", { ascending: true });
    jobsRaw = (fallback.data ?? []) as unknown[];
  } else {
    jobsRaw = (jobsResultFull.data ?? []) as unknown[];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jobs = jobsRaw as any[];
  const clients = (clientsResult.data ?? []) as { id: string; full_name: string | null; is_demo: boolean }[];
  const employees = (employeesResult.data ?? []) as { id: string; full_name: string | null; role: string | null; is_demo: boolean }[];

  const clientNameById = new Map((clients ?? []).map((c: { id: string; full_name: string | null }) => [c.id, c.full_name]));
  const employeeNameById = new Map(
    (employees ?? []).map((e: { id: string; full_name: string | null }) => [e.id, e.full_name])
  );

  const photoUrlsByJob: Record<string, Array<{ url: string; label: "before" | "after" }>> = {};
  const jobIds = jobs.map((job) => job.id);
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

    // Plan enforcement: free plan is limited to 5 jobs per month
    const jobCheck = await canCreateJob(owner.id);
    if (!jobCheck.allowed) {
      throw new Error(
        jobCheck.reason === 'free_job_limit'
          ? `Free plan limit reached: you've used 5 jobs this month. Upgrade to create unlimited jobs.`
          : 'Unable to create job at this time.'
      );
    }

    // Auto-assign job number
    const jobNumber = await getNextJobNumber(sb, owner.id).catch(() => null);

    const { data: inserted, error } = await sb
      .from("jobs")
      .insert({
        owner_id: owner.id,
        is_demo: false,
        status: "scheduled",
        job_number: jobNumber,
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
        hourly_rate: Number(formData.get("hourly_rate") ?? 0) || 0,
        revenue: Number(formData.get("revenue_amount") ?? 0) || null,
        recurrence_rule: String(formData.get("recurrence_rule") ?? "") || null
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!inserted?.id) throw new Error("Job was not saved.");

    // Create next 3 recurring instances if a recurrence_rule is set.
    const recurrenceRule = String(formData.get("recurrence_rule") ?? "").trim();
    const scheduledDateRaw = String(formData.get("scheduled_date") ?? "").trim();
    if (recurrenceRule && scheduledDateRaw && inserted.id) {
      const baseDate = new Date(scheduledDateRaw + "T00:00:00");
      const instances = generateRecurringDates(baseDate, recurrenceRule, 3);
      if (instances.length > 0) {
        const baseJobData = {
          owner_id: owner.id,
          is_demo: false,
          status: "scheduled" as const,
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? ""),
          client_id: String(formData.get("client_id") ?? "") || null,
          employee_id: String(formData.get("employee_id") ?? "") || null,
          job_type: String(formData.get("job_type") ?? ""),
          scheduled_start: String(formData.get("scheduled_start") ?? "") || null,
          scheduled_end: String(formData.get("scheduled_end") ?? "") || null,
          address: String(formData.get("address") ?? ""),
          suburb: String(formData.get("suburb") ?? ""),
          state: String(formData.get("state") ?? ""),
          priority: String(formData.get("priority") ?? "normal"),
          notes: String(formData.get("notes") ?? ""),
          materials_cost: Number(formData.get("materials_cost") ?? 0) || 0,
          labour_hours: Number(formData.get("labour_hours") ?? 0) || 0,
          hourly_rate: Number(formData.get("hourly_rate") ?? 0) || 0,
          revenue: Number(formData.get("revenue_amount") ?? 0) || null,
          recurrence_rule: recurrenceRule
        };
        await sb.from("jobs").insert(instances.map((d) => ({ ...baseJobData, scheduled_date: d })));
      }
    }

    revalidateOwnerWorkspaceRoutes();
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
        hourly_rate: Number(formData.get("hourly_rate") ?? 0) || 0,
        revenue: Number(formData.get("revenue_amount") ?? 0) || null,
        recurrence_rule: String(formData.get("recurrence_rule") ?? "") || null
      })
      .eq("id", id)
      .eq("owner_id", owner.id);
    if (error) throw new Error(error.message);

    // Create next 3 recurring instances if a recurrence_rule is set on update.
    const recurrenceRule = String(formData.get("recurrence_rule") ?? "").trim();
    const scheduledDateRaw = String(formData.get("scheduled_date") ?? "").trim();
    const createInstances = String(formData.get("create_recurring_instances") ?? "") === "true";
    if (createInstances && recurrenceRule && scheduledDateRaw) {
      const baseDate = new Date(scheduledDateRaw + "T00:00:00");
      const instances = generateRecurringDates(baseDate, recurrenceRule, 3);
      if (instances.length > 0) {
        const baseJobData = {
          owner_id: owner.id,
          is_demo: false,
          status: "scheduled" as const,
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? ""),
          client_id: String(formData.get("client_id") ?? "") || null,
          employee_id: String(formData.get("employee_id") ?? "") || null,
          job_type: String(formData.get("job_type") ?? ""),
          scheduled_start: String(formData.get("scheduled_start") ?? "") || null,
          scheduled_end: String(formData.get("scheduled_end") ?? "") || null,
          address: String(formData.get("address") ?? ""),
          suburb: String(formData.get("suburb") ?? ""),
          state: String(formData.get("state") ?? ""),
          priority: String(formData.get("priority") ?? "normal"),
          notes: String(formData.get("notes") ?? ""),
          materials_cost: Number(formData.get("materials_cost") ?? 0) || 0,
          labour_hours: Number(formData.get("labour_hours") ?? 0) || 0,
          hourly_rate: Number(formData.get("hourly_rate") ?? 0) || 0,
          revenue: Number(formData.get("revenue_amount") ?? 0) || null,
          recurrence_rule: recurrenceRule
        };
        await sb.from("jobs").insert(instances.map((d) => ({ ...baseJobData, scheduled_date: d })));
      }
    }

    revalidateOwnerWorkspaceRoutes();
  }

  async function updateJobStatusAction(formData: FormData): Promise<{ invoiceId?: string }> {
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

    // Fire automations for this status change (fire-and-forget, non-fatal)
    fireJobAutomations(owner.id, id, status).catch((e) => {
      console.warn("[automations] error", e);
    });

    // When a job is completed, auto-generate a draft invoice.
    let invoiceId: string | undefined;
    if (status === "completed") {
      const { data: job } = await sb
        .from("jobs")
        .select("client_id, title, materials_cost, labour_hours, hourly_rate, is_demo")
        .eq("id", id)
        .eq("owner_id", owner.id)
        .maybeSingle();
      if (job && !job.is_demo) {
        const materialsAmt = Number(job.materials_cost ?? 0);
        const labourAmt = Number(job.labour_hours ?? 0) * Number(job.hourly_rate ?? 0);
        const subtotal = materialsAmt + labourAmt;
        const gst = subtotal * 0.1;
        const total = subtotal + gst;

        // Get next invoice number
        const { data: existingNums } = await sb
          .from("invoices")
          .select("invoice_number")
          .eq("owner_id", owner.id);
        const max = (existingNums ?? []).reduce((highest: number, item: { invoice_number: string | null }) => {
          const match = /^INV-?(\d+)$/i.exec(item.invoice_number ?? "");
          const num = match ? Number(match[1]) : 0;
          return Number.isFinite(num) ? Math.max(highest, num) : highest;
        }, 0);
        const invoiceNumber = `INV-${String(max + 1).padStart(5, "0")}`;

        const issueDate = new Date().toISOString().slice(0, 10);
        const dueAt = new Date();
        dueAt.setDate(dueAt.getDate() + 14);
        const dueDate = dueAt.toISOString().slice(0, 10);

        const { data: inv } = await sb
          .from("invoices")
          .insert({
            owner_id: owner.id,
            client_id: job.client_id,
            invoice_number: invoiceNumber,
            status: "draft",
            subtotal,
            gst,
            total,
            issue_date: issueDate,
            due_date: dueDate,
            notes: `Auto-generated from job: ${job.title ?? id}`,
            job_id: id
          })
          .select("id")
          .maybeSingle();
        if (inv?.id) {
          invoiceId = inv.id;
          // Add a single line item for labour if there's a cost to track
          if (subtotal > 0) {
            const lineItems = [];
            if (materialsAmt > 0) {
              lineItems.push({
                invoice_id: inv.id,
                description: "Materials",
                quantity: 1,
                unit_price: materialsAmt,
                gst_applicable: true,
                line_total: materialsAmt
              });
            }
            if (labourAmt > 0) {
              lineItems.push({
                invoice_id: inv.id,
                description: `Labour (${job.labour_hours}h @ $${job.hourly_rate}/hr)`,
                quantity: 1,
                unit_price: labourAmt,
                gst_applicable: true,
                line_total: labourAmt
              });
            }
            if (lineItems.length > 0) {
              await sb.from("invoice_items").insert(lineItems);
            }
          }
        }
        // Notify the owner that the job is complete
        await createNotification(owner.id, {
          type: "job_completed",
          title: `Job completed: ${job.title ?? "Untitled"}`,
          body: subtotal > 0 ? `Invoice ${invoiceNumber} ($${total.toFixed(2)}) generated.` : undefined,
          actionUrl: invoiceId ? `/dashboard/owner/finance?tab=invoices` : `/dashboard/owner/jobs`,
        });

        // Send satisfaction survey to client (fire-and-forget)
        sendJobCompletionSurvey(owner.id, id, job.client_id, job.title).catch(() => {});

        // Queue auto follow-up sequence (fire-and-forget)
        {
          const now2 = new Date();
          const addDays2 = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
          const appUrl2 = process.env.NEXT_PUBLIC_APP_URL ?? "https://servlo.app";
          const clientNameForSeq = job.client_id
            ? (await sb.from("clients").select("full_name").eq("id", job.client_id).maybeSingle()).data?.full_name ?? "there"
            : "there";
          void (async () => {
            try {
              await sb.from("job_follow_up_queue").insert([
                { owner_id: owner.id, job_id: id, client_id: job.client_id, send_at: now2.toISOString(), type: "completion", subject: `Job completed: ${job.title}`, body: `Hi ${clientNameForSeq},\n\nYour job "${job.title}" has been completed. Thank you for your business!`, channel: "email", status: "pending" },
                { owner_id: owner.id, job_id: id, client_id: job.client_id, send_at: addDays2(now2, 1).toISOString(), type: "survey", subject: `How did we do? — ${job.title}`, body: `Hi ${clientNameForSeq}, we'd love your feedback: ${appUrl2}/feedback/${id}`, channel: "email", status: "pending" },
                { owner_id: owner.id, job_id: id, client_id: job.client_id, send_at: addDays2(now2, 3).toISOString(), type: "review_request", subject: "Would you leave us a Google review?", body: `Hi ${clientNameForSeq}, a review would mean the world to us: ${appUrl2}/review`, channel: "email", status: "pending" },
                { owner_id: owner.id, job_id: id, client_id: job.client_id, send_at: addDays2(now2, 90).toISOString(), type: "maintenance_reminder", subject: "Time for your next maintenance check?", body: `Hi ${clientNameForSeq}, it's been 3 months since "${job.title}". Book now: ${appUrl2}/book`, channel: "email", status: "pending" },
              ]);
            } catch { /* table may not exist yet */ }
          })();
        }
      }
    }

    revalidateOwnerWorkspaceRoutes();
    return { invoiceId };
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
    revalidateOwnerWorkspaceRoutes();
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
    revalidateOwnerWorkspaceRoutes();
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
    let uploaded = false;
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
      uploaded = true;
    }
    // Keep has_photos flag in sync.
    if (uploaded) {
      await sb.from("jobs").update({ has_photos: true }).eq("id", jobId).eq("owner_id", owner.id);
    }
    revalidateOwnerWorkspaceRoutes();
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
        is_demo: false,
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
          is_demo: false,
          full_name,
          phone: phone || null,
          email: email || null,
          notes: ""
        })
        .select("id, full_name")
        .maybeSingle();
      if (fb.error) return { ok: false, message: fb.error.message };
      revalidateOwnerWorkspaceRoutes();
      return { ok: true, id: fb.data?.id, label: fb.data?.full_name ?? full_name };
    }
    revalidateOwnerWorkspaceRoutes();
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
        is_demo: false,
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
      revalidateOwnerWorkspaceRoutes();
      return { ok: true, id: full.data.id, label: full.data.full_name ?? full_name };
    }
    const fb = await sb
      .from("employees")
      .insert({
        owner_id: owner.id,
        is_demo: false,
        full_name,
        phone: phone || null,
        email: ""
      })
      .select("id, full_name")
      .maybeSingle();
    if (fb.error) return { ok: false, message: fb.error.message };
    revalidateOwnerWorkspaceRoutes();
    return { ok: true, id: fb.data?.id, label: fb.data?.full_name ?? full_name };
  }

  async function saveJobSignoffAction(formData: FormData): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) return { ok: false, message: "Not signed in" };
    const jobId = String(formData.get("job_id") ?? "");
    const signoffImage = String(formData.get("signoff_image") ?? "");
    const signoffName = String(formData.get("signoff_name") ?? "");
    if (!jobId || !signoffImage) return { ok: false, message: "Missing data" };
    const { error } = await sb
      .from("jobs")
      .update({
        digital_signoff_image: signoffImage,
        signoff_name: signoffName || null,
        signoff_at: new Date().toISOString()
      })
      .eq("id", jobId)
      .eq("owner_id", owner.id);
    if (error) return { ok: false, message: error.message };
    revalidateOwnerWorkspaceRoutes();
    return { ok: true };
  }

  async function clearJobSignoffAction(formData: FormData): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) return { ok: false, message: "Not signed in" };
    const jobId = String(formData.get("job_id") ?? "");
    if (!jobId) return { ok: false, message: "Missing job id" };
    const { error } = await sb
      .from("jobs")
      .update({ digital_signoff_image: null, signoff_name: null, signoff_at: null })
      .eq("id", jobId)
      .eq("owner_id", owner.id);
    if (error) return { ok: false, message: error.message };
    revalidateOwnerWorkspaceRoutes();
    return { ok: true };
  }

  async function sendJobToClientAction(formData: FormData): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient();
    const {
      data: { user: owner }
    } = await sb.auth.getUser();
    if (!owner) return { ok: false, message: "Not signed in" };
    const jobId = String(formData.get("job_id") ?? "");
    if (!jobId) return { ok: false, message: "Missing job id" };
    const { data: job } = await sb
      .from("jobs")
      .select("title, notes, status, scheduled_date, client_id, signoff_name, signoff_at, is_demo")
      .eq("id", jobId)
      .eq("owner_id", owner.id)
      .maybeSingle();
    if (!job) return { ok: false, message: "Job not found" };
    if (job.is_demo) return { ok: false, message: "Cannot send demo job emails" };
    if (!job.client_id) return { ok: false, message: "No client linked to this job" };
    const { data: client } = await sb.from("clients").select("full_name, email").eq("id", job.client_id).maybeSingle();
    if (!client?.email) return { ok: false, message: "Client has no email address" };

    const completedDate = job.scheduled_date
      ? new Date(job.scheduled_date).toLocaleDateString("en-AU")
      : "—";
    const signoffNote =
      job.signoff_name && job.signoff_at
        ? `<p style="margin:0 0 8px">Signed off by <strong>${job.signoff_name}</strong> on ${new Date(job.signoff_at).toLocaleString("en-AU")}.</p>`
        : "";

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
        <h2 style="margin:0 0 16px">Job Summary — ${job.title ?? "Job"}</h2>
        <p style="margin:0 0 8px"><strong>Client:</strong> ${client.full_name ?? "—"}</p>
        <p style="margin:0 0 8px"><strong>Date:</strong> ${completedDate}</p>
        ${job.notes ? `<p style="margin:0 0 8px"><strong>Notes:</strong> ${job.notes}</p>` : ""}
        ${signoffNote}
        <p style="margin:16px 0 0;color:#64748b;font-size:13px">Thank you for your business.</p>
      </div>
    `;

    try {
      await sendEmail(client.email, `Job Summary — ${job.title ?? "Job"}`, html);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: "Failed to send email" };
    }
  }

  async function deleteJobAction(formData: FormData): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) return { ok: false };
    const id = String(formData.get("id") ?? "");
    const { error } = await sb.from("jobs").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("owner_id", owner.id);
    if (error) return { ok: false, message: error.message };
    revalidateOwnerWorkspaceRoutes();
    return { ok: true };
  }

  async function restoreJobAction(formData: FormData): Promise<{ ok: boolean; message?: string }> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) return { ok: false };
    const id = String(formData.get("id") ?? "");
    const { error } = await sb.from("jobs").update({ deleted_at: null }).eq("id", id).eq("owner_id", owner.id);
    if (error) return { ok: false, message: error.message };
    revalidateOwnerWorkspaceRoutes();
    return { ok: true };
  }

  const jobsMapped = jobs.map((job) => ({
    ...job,
    client_name: job.client_id ? clientNameById.get(job.client_id) ?? null : null,
    employee_name: job.employee_id ? employeeNameById.get(job.employee_id) ?? null : null
  }));
  const visibleJobs = filterDemoEntities(jobsMapped);
  const clientRefs = filterDemoEntities(clients ?? []).map((c: any) => ({
    id: c.id,
    label: c.full_name ?? "Unnamed client"
  }));
  const employeeRefs = filterDemoEntities(employees ?? []).map((e: any) => ({
    id: e.id,
    label: e.role === "contractor"
      ? `${e.full_name ?? "Unnamed"} (Contractor)`
      : (e.full_name ?? "Unnamed employee")
  }));

  return (
    <section className="space-y-5">
      <FirstVisitBanner
        pageKey="jobs"
        title="Your job management hub"
        description="Create, schedule, and track every job. Assign staff, attach photos, and get client sign-offs."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Jobs</h1>
      </div>
      <JobsManager
        jobs={visibleJobs}
        clients={clientRefs}
        employees={employeeRefs}
        initialClientId={initialClientId}
        initialScheduleToday={initialScheduleToday}
        initialOpenJobId={initialOpenJobId}
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
        saveJobSignoffAction={saveJobSignoffAction}
        clearJobSignoffAction={clearJobSignoffAction}
        sendJobToClientAction={sendJobToClientAction}
        deleteJobAction={deleteJobAction}
        restoreJobAction={restoreJobAction}
      />
    </section>
  );
}


