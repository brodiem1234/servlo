/**
 * Job validation schemas.
 * NOTE: Install zod (npm install zod) to use z.object() based schemas.
 * Currently using manual validation helpers until zod is added to package.json.
 */

export type CreateJobInput = {
  title: string;
  client_id?: string | null;
  status?: "pending" | "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduled_date?: string | null;
  address?: string | null;
  suburb?: string | null;
  notes?: string | null;
  estimated_hours?: number | null;
  labour_rate_aud?: number | null;
  is_recurring?: boolean;
  recurrence_rule?: string | null;
};

export type UpdateJobInput = Partial<CreateJobInput>;

const JOB_STATUSES = ["pending", "scheduled", "in_progress", "completed", "cancelled"] as const;
type JobStatus = typeof JOB_STATUSES[number];

function isJobStatus(v: unknown): v is JobStatus {
  return typeof v === "string" && (JOB_STATUSES as readonly string[]).includes(v);
}

export function validateCreateJob(data: unknown): { ok: true; data: CreateJobInput } | { ok: false; errors: string[] } {
  if (!data || typeof data !== "object") return { ok: false, errors: ["Invalid request body"] };
  const d = data as Record<string, unknown>;
  const errors: string[] = [];

  if (!d.title || typeof d.title !== "string" || d.title.trim().length === 0) errors.push("title is required");
  if (d.title && typeof d.title === "string" && d.title.length > 200) errors.push("title must be ≤200 chars");
  if (d.client_id !== undefined && d.client_id !== null && !isUUID(d.client_id)) errors.push("client_id must be a UUID");
  if (d.status !== undefined && !isJobStatus(d.status)) errors.push("status must be one of: " + JOB_STATUSES.join(", "));
  if (d.notes !== undefined && typeof d.notes === "string" && d.notes.length > 5000) errors.push("notes must be ≤5000 chars");
  if (d.estimated_hours !== undefined && d.estimated_hours !== null) {
    const n = Number(d.estimated_hours);
    if (isNaN(n) || n < 0 || n > 999) errors.push("estimated_hours must be 0–999");
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      title: (d.title as string).trim(),
      client_id: d.client_id as string | null | undefined,
      status: (d.status as JobStatus | undefined) ?? "pending",
      scheduled_date: d.scheduled_date as string | null | undefined,
      address: truncate(d.address, 500),
      suburb: truncate(d.suburb, 100),
      notes: truncate(d.notes, 5000),
      estimated_hours: d.estimated_hours != null ? Number(d.estimated_hours) : null,
      labour_rate_aud: d.labour_rate_aud != null ? Number(d.labour_rate_aud) : null,
      is_recurring: Boolean(d.is_recurring),
      recurrence_rule: truncate(d.recurrence_rule, 500),
    },
  };
}

function isUUID(v: unknown): boolean {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function truncate(v: unknown, max: number): string | null | undefined {
  if (v === null) return null;
  if (v === undefined) return undefined;
  if (typeof v !== "string") return undefined;
  return v.trim().slice(0, max) || null;
}
