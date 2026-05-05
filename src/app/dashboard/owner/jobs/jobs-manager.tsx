"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Job = {
  id: string;
  owner_id?: string | null;
  title: string | null;
  description: string | null;
  client_id: string | null;
  employee_id: string | null;
  job_type: string | null;
  scheduled_date: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  priority: string | null;
  notes: string | null;
  status: string | null;
  client_name: string | null;
};

type RefOpt = { id: string; label: string };

type Props = {
  jobs: Job[];
  clients: RefOpt[];
  employees: RefOpt[];
  createJobAction: (formData: FormData) => Promise<void>;
  updateJobAction: (formData: FormData) => Promise<void>;
};

const empty = {
  id: "",
  title: "",
  description: "",
  client_id: "",
  employee_id: "",
  job_type: "",
  scheduled_date: "",
  scheduled_start: "",
  scheduled_end: "",
  address: "",
  suburb: "",
  state: "",
  priority: "normal",
  notes: ""
};

export default function JobsManager({ jobs, clients, employees, createJobAction, updateJobAction }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [values, setValues] = useState(empty);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const statusClasses: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    in_progress: "bg-orange-100 text-orange-700",
    completed: "bg-green-100 text-green-700",
    complete: "bg-green-100 text-green-700",
    en_route: "bg-orange-100 text-orange-700",
    on_site: "bg-orange-100 text-orange-700",
    "in-progress": "bg-orange-100 text-orange-700",
    cancelled: "bg-red-100 text-red-700"
  };

  useEffect(() => {
    console.log("JobsManager jobs:", jobs);
    if (jobs.length === 0) {
      console.log("Jobs array is empty.");
    }
  }, [jobs]);

  const monthLabel = useMemo(
    () =>
      monthDate.toLocaleDateString("en-AU", {
        month: "long",
        year: "numeric"
      }),
    [monthDate]
  );

  const calendarDays = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday start
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - startOffset + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) return null;
      return new Date(year, month, dayNumber);
    });
  }, [monthDate]);

  const jobsByDate = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of jobs) {
      if (!job.scheduled_date) continue;
      const dateKey = job.scheduled_date.slice(0, 10);
      const bucket = map.get(dateKey) ?? [];
      bucket.push(job);
      map.set(dateKey, bucket);
    }
    return map;
  }, [jobs]);

  const submit = async (fd: FormData) => {
    try {
      if (editing) await updateJobAction(fd);
      else await createJobAction(fd);
      router.refresh();
      setToast({ type: "success", message: editing ? "Job updated" : "Job created" });
      setOpen(false);
    } catch (error) {
      setToast({ type: "error", message: "Unable to save job" });
      console.error(error);
    }
  };

  function startAdd() {
    setEditing(false);
    setValues(empty);
    setOpen(true);
  }

  function startEdit(job: Job) {
    setEditing(true);
    setValues({
      id: job.id,
      title: job.title ?? "",
      description: job.description ?? "",
      client_id: job.client_id ?? "",
      employee_id: job.employee_id ?? "",
      job_type: job.job_type ?? "",
      scheduled_date: job.scheduled_date ? job.scheduled_date.slice(0, 10) : "",
      scheduled_start: job.scheduled_start ?? "",
      scheduled_end: job.scheduled_end ?? "",
      address: job.address ?? "",
      suburb: job.suburb ?? "",
      state: job.state ?? "",
      priority: job.priority ?? "normal",
      notes: job.notes ?? ""
    });
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-md border bg-white p-1 text-sm">
          <button onClick={() => setView("list")} className={`rounded px-3 py-1 ${view === "list" ? "bg-[#3b82f6] text-white" : ""}`}>List View</button>
          <button onClick={() => setView("calendar")} className={`rounded px-3 py-1 ${view === "calendar" ? "bg-[#3b82f6] text-white" : ""}`}>Calendar View</button>
        </div>
        <button onClick={startAdd} className="rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white">Add Job</button>
      </div>

      {toast ? (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            toast.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
      {view === "calendar" ? (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="rounded border px-3 py-1 text-sm"
            >
              Prev
            </button>
            <p className="text-sm font-semibold text-[#1e3a5f]">{monthLabel}</p>
            <button
              type="button"
              onClick={() => setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="rounded border px-3 py-1 text-sm"
            >
              Next
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase text-slate-500">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="min-h-[120px] rounded border bg-slate-50" />;
              }

              const dateKey = date.toISOString().slice(0, 10);
              const jobsOnDate = jobsByDate.get(dateKey) ?? [];

              return (
                <div key={dateKey} className="min-h-[120px] rounded border p-2">
                  <p className="mb-2 text-xs font-semibold text-slate-600">{date.getDate()}</p>
                  <div className="space-y-1">
                    {jobsOnDate.map((job) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => startEdit(job)}
                        className={`block w-full truncate rounded px-2 py-1 text-left text-xs font-medium ${
                          statusClasses[job.status ?? "scheduled"] ?? statusClasses.scheduled
                        }`}
                        title={job.title ?? "Untitled job"}
                      >
                        {job.title ?? "Untitled job"}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white p-4 shadow-sm">
          <table className="w-full min-w-[700px] text-sm">
            <thead><tr className="border-b text-left"><th className="px-2 py-2">Title</th><th className="px-2 py-2">Client</th><th className="px-2 py-2">Date</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Priority</th><th className="px-2 py-2">Actions</th></tr></thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-6 text-center text-sm text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <p>No jobs yet. Add your first job to get started.</p>
                      <button onClick={startAdd} className="rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white">
                        Add your first job
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="border-b hover:bg-slate-50">
                    <td className="px-2 py-2">{job.title ?? "-"}</td>
                    <td className="px-2 py-2">{job.client_name ?? "-"}</td>
                    <td className="px-2 py-2">{job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString("en-AU") : "-"}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          statusClasses[job.status ?? "scheduled"] ?? statusClasses.scheduled
                        }`}
                      >
                        {job.status ?? "scheduled"}
                      </span>
                    </td>
                    <td className="px-2 py-2 capitalize">{job.priority ?? "normal"}</td>
                    <td className="px-2 py-2"><button onClick={() => startEdit(job)} className="rounded border px-2 py-1 text-xs">Edit</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-[#1e3a5f]">{editing ? "Edit Job" : "Add Job"}</h2>
            <form action={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={values.id} />
              <input name="title" value={values.title} onChange={(e) => setValues((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="h-10 rounded border px-3" />
              <input name="job_type" value={values.job_type} onChange={(e) => setValues((p) => ({ ...p, job_type: e.target.value }))} placeholder="Job type" className="h-10 rounded border px-3" />
              <select name="client_id" value={values.client_id} onChange={(e) => setValues((p) => ({ ...p, client_id: e.target.value }))} className="h-10 rounded border px-3"><option value="">Client</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
              <select name="employee_id" value={values.employee_id} onChange={(e) => setValues((p) => ({ ...p, employee_id: e.target.value }))} className="h-10 rounded border px-3"><option value="">Employee</option>{employees.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
              <input type="date" name="scheduled_date" value={values.scheduled_date} onChange={(e) => setValues((p) => ({ ...p, scheduled_date: e.target.value }))} className="h-10 rounded border px-3" />
              <select name="priority" value={values.priority} onChange={(e) => setValues((p) => ({ ...p, priority: e.target.value }))} className="h-10 rounded border px-3"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select>
              <input type="time" name="scheduled_start" value={values.scheduled_start} onChange={(e) => setValues((p) => ({ ...p, scheduled_start: e.target.value }))} className="h-10 rounded border px-3" />
              <input type="time" name="scheduled_end" value={values.scheduled_end} onChange={(e) => setValues((p) => ({ ...p, scheduled_end: e.target.value }))} className="h-10 rounded border px-3" />
              <input name="address" value={values.address} onChange={(e) => setValues((p) => ({ ...p, address: e.target.value }))} placeholder="Address" className="h-10 rounded border px-3" />
              <input name="suburb" value={values.suburb} onChange={(e) => setValues((p) => ({ ...p, suburb: e.target.value }))} placeholder="Suburb" className="h-10 rounded border px-3" />
              <input name="state" value={values.state} onChange={(e) => setValues((p) => ({ ...p, state: e.target.value }))} placeholder="State" className="h-10 rounded border px-3" />
              <textarea name="description" value={values.description} onChange={(e) => setValues((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="min-h-20 rounded border px-3 py-2 sm:col-span-2" />
              <textarea name="notes" value={values.notes} onChange={(e) => setValues((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="min-h-20 rounded border px-3 py-2 sm:col-span-2" />
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded border px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="rounded bg-[#1e3a5f] px-4 py-2 text-sm text-white">{editing ? "Save Changes" : "Create Job"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}


