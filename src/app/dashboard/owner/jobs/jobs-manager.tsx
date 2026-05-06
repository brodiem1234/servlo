"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  materials_cost?: number | null;
  labour_hours?: number | null;
  hourly_rate?: number | null;
};

type RefOpt = { id: string; label: string };

type QuickCreateJobRefResult = { ok: boolean; id?: string; label?: string; message?: string };

type Props = {
  jobs: Job[];
  clients: RefOpt[];
  employees: RefOpt[];
  createJobAction: (formData: FormData) => Promise<void>;
  updateJobAction: (formData: FormData) => Promise<void>;
  updateJobStatusAction: (formData: FormData) => Promise<void>;
  createInvoiceFromJobAction: (formData: FormData) => Promise<void>;
  updateJobScheduleAction: (formData: FormData) => Promise<void>;
  updateJobEmployeeAction: (formData: FormData) => Promise<void>;
  uploadJobPhotoAction: (formData: FormData) => Promise<void>;
  jobPhotosByJob: Record<string, Array<{ url: string; label: "before" | "after" }>>;
  quickCreateClientForJobAction: (formData: FormData) => Promise<QuickCreateJobRefResult>;
  quickCreateEmployeeForJobAction: (formData: FormData) => Promise<QuickCreateJobRefResult>;
};

const ADD_NEW_CLIENT = "__add_new_client__";
const ADD_NEW_EMPLOYEE = "__add_new_employee__";

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
  notes: "",
  materials_cost: "0",
  labour_hours: "0",
  hourly_rate: "0",
  revenue_amount: "0"
};

function toDateKey(input: Date) {
  const year = input.getFullYear();
  const month = String(input.getMonth() + 1).padStart(2, "0");
  const day = String(input.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseTimeToMinutes(value: string | null) {
  if (!value) return null;
  const trimmed = value.slice(0, 5);
  const [hours, minutes] = trimmed.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function startOfWeek(date: Date) {
  const clone = new Date(date);
  const day = (clone.getDay() + 6) % 7;
  clone.setDate(clone.getDate() - day);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

export default function JobsManager({
  jobs,
  clients,
  employees,
  createJobAction,
  updateJobAction,
  updateJobStatusAction,
  createInvoiceFromJobAction,
  updateJobScheduleAction,
  updateJobEmployeeAction,
  uploadJobPhotoAction,
  jobPhotosByJob,
  quickCreateClientForJobAction,
  quickCreateEmployeeForJobAction
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calendarView, setCalendarView] = useState<"today" | "week" | "month">("month");
  const [values, setValues] = useState(empty);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [focusDate, setFocusDate] = useState(() => new Date());
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [activeTab, setActiveTab] = useState<"details" | "photos">("details");
  const [photoLabel, setPhotoLabel] = useState<"before" | "after">("before");
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [quickAdd, setQuickAdd] = useState<null | "client" | "employee">(null);
  const [clientOptions, setClientOptions] = useState<RefOpt[]>(clients);
  const [employeeOptions, setEmployeeOptions] = useState<RefOpt[]>(employees);
  const [quickClientSaving, setQuickClientSaving] = useState(false);
  const [quickEmployeeSaving, setQuickEmployeeSaving] = useState(false);

  useEffect(() => {
    setClientOptions(clients);
  }, [clients]);

  useEffect(() => {
    setEmployeeOptions(employees);
  }, [employees]);

  const closeJobOverlay = () => {
    setOpen(false);
    setQuickAdd(null);
  };

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

  const normalizeStatus = (status: string | null) => {
    const raw = (status ?? "scheduled").toLowerCase();
    if (raw === "complete" || raw === "completed") return "completed";
    if (["in_progress", "in-progress", "en_route", "on_site"].includes(raw)) return "in_progress";
    if (raw === "cancelled") return "cancelled";
    return "scheduled";
  };

  useEffect(() => {
    console.log("JobsManager jobs:", jobs);
    if (jobs.length === 0) {
      console.log("Jobs array is empty.");
    }
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const title = (job.title ?? "").toLowerCase();
      const clientName = (job.client_name ?? "").toLowerCase();
      const query = search.trim().toLowerCase();
      const matchesSearch = !query || title.includes(query) || clientName.includes(query);

      const matchesClient = clientFilter === "all" || job.client_id === clientFilter;

      const jobStatus = normalizeStatus(job.status);
      const matchesStatus = statusFilter === "all" || jobStatus === statusFilter;

      const jobPriorityRaw = (job.priority ?? "").toLowerCase();
      const jobPriority = jobPriorityRaw === "normal" ? "medium" : jobPriorityRaw;
      const matchesPriority = priorityFilter === "all" || jobPriority === priorityFilter;

      const dateKey = job.scheduled_date ? job.scheduled_date.slice(0, 10) : "";
      const matchesFrom = !fromDate || (dateKey && dateKey >= fromDate);
      const matchesTo = !toDate || (dateKey && dateKey <= toDate);

      return matchesSearch && matchesClient && matchesStatus && matchesPriority && matchesFrom && matchesTo;
    });
  }, [jobs, search, clientFilter, statusFilter, priorityFilter, fromDate, toDate]);

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
    for (const job of filteredJobs) {
      if (!job.scheduled_date) continue;
      const dateKey = job.scheduled_date.slice(0, 10);
      const bucket = map.get(dateKey) ?? [];
      bucket.push(job);
      map.set(dateKey, bucket);
    }
    return map;
  }, [filteredJobs]);

  const todayKey = toDateKey(focusDate);
  const todayJobs = useMemo(
    () => (jobsByDate.get(todayKey) ?? []).sort((a, b) => (parseTimeToMinutes(a.scheduled_start) ?? 0) - (parseTimeToMinutes(b.scheduled_start) ?? 0)),
    [jobsByDate, todayKey]
  );

  const weekStart = useMemo(() => startOfWeek(focusDate), [focusDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, idx) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + idx)),
    [weekStart]
  );

  const submit = async (fd: FormData) => {
    try {
      if (editing) await updateJobAction(fd);
      else await createJobAction(fd);
      router.refresh();
      setToast({ type: "success", message: editing ? "Job updated" : "Job created" });
      closeJobOverlay();
    } catch (error) {
      setToast({ type: "error", message: "Unable to save job" });
      console.error(error);
    }
  };

  const quickUpdateStatus = async (id: string, status: string) => {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", status);
    try {
      await updateJobStatusAction(fd);
      router.refresh();
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Unable to update status" });
    }
  };

  const quickUpdateSchedule = async (id: string, scheduledDate: string) => {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("scheduled_date", scheduledDate);
    try {
      await updateJobScheduleAction(fd);
      router.refresh();
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Unable to reschedule job" });
    }
  };

  const quickAssignEmployee = async (id: string, employeeId: string) => {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("employee_id", employeeId);
    try {
      await updateJobEmployeeAction(fd);
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("SERVLO", { body: "Job assignment updated." });
        } else if (Notification.permission !== "denied") {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            new Notification("SERVLO", { body: "Job assignment updated." });
          }
        }
      }
      router.refresh();
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Unable to assign employee" });
    }
  };

  const uploadPhotos = async () => {
    if (!editing || !values.id || selectedPhotos.length === 0) return;
    const fd = new FormData();
    fd.set("job_id", values.id);
    fd.set("photo_label", photoLabel);
    for (const file of selectedPhotos) {
      fd.append("photos", file);
    }
    try {
      await uploadJobPhotoAction(fd);
      setSelectedPhotos([]);
      setToast({ type: "success", message: "Photos uploaded" });
      router.refresh();
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Unable to upload photos" });
    }
  };

  const submitQuickClient = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setQuickClientSaving(true);
    try {
      const res = await quickCreateClientForJobAction(fd);
      if (!res.ok) {
        setToast({ type: "error", message: res.message ?? "Could not create client" });
        return;
      }
      if (res.id) {
        const label = res.label ?? "Client";
        setClientOptions((prev) => {
          if (prev.some((p) => p.id === res.id)) return prev;
          return [...prev, { id: res.id!, label }];
        });
        setValues((p) => ({ ...p, client_id: res.id! }));
      }
      setQuickAdd(null);
      setToast({ type: "success", message: "Client added" });
      router.refresh();
    } finally {
      setQuickClientSaving(false);
    }
  };

  const submitQuickEmployee = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setQuickEmployeeSaving(true);
    try {
      const res = await quickCreateEmployeeForJobAction(fd);
      if (!res.ok) {
        setToast({ type: "error", message: res.message ?? "Could not create employee" });
        return;
      }
      if (res.id) {
        const label = res.label ?? "Employee";
        setEmployeeOptions((prev) => {
          if (prev.some((p) => p.id === res.id)) return prev;
          return [...prev, { id: res.id!, label }];
        });
        setValues((p) => ({ ...p, employee_id: res.id! }));
      }
      setQuickAdd(null);
      setToast({ type: "success", message: "Employee added" });
      router.refresh();
    } finally {
      setQuickEmployeeSaving(false);
    }
  };

  function startAdd() {
    setEditing(false);
    setValues(empty);
    setActiveTab("details");
    setQuickAdd(null);
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
      ,
      materials_cost: String(job.materials_cost ?? 0),
      labour_hours: String(job.labour_hours ?? 0),
      hourly_rate: String(job.hourly_rate ?? 0),
      revenue_amount: "0"
    });
    setActiveTab("details");
    setQuickAdd(null);
    setOpen(true);
  }

  function clearFilters() {
    setSearch("");
    setClientFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setFromDate("");
    setToDate("");
  }

  function navigateCalendar(direction: -1 | 1) {
    if (calendarView === "month") {
      setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
      return;
    }
    if (calendarView === "week") {
      setFocusDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + direction * 7));
      return;
    }
    setFocusDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + direction));
  }

  const currentCalendarLabel =
    calendarView === "month"
      ? monthLabel
      : calendarView === "week"
        ? `${weekDays[0].toLocaleDateString("en-AU")} - ${weekDays[6].toLocaleDateString("en-AU")}`
        : focusDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-md border bg-white p-1 text-sm">
          <button onClick={() => setView("list")} className={`rounded px-3 py-1 ${view === "list" ? "bg-[#0db8c8] text-white" : ""}`}>List View</button>
          <button onClick={() => setView("calendar")} className={`rounded px-3 py-1 ${view === "calendar" ? "bg-[#0db8c8] text-white" : ""}`}>Calendar View</button>
        </div>
        <button onClick={startAdd} className="rounded-md bg-[#0db8c8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a9dab]">Add Job</button>
      </div>
      <div className="grid gap-3 rounded-xl border bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or client"
          className="h-10 rounded border px-3 text-sm"
        />
        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="h-10 rounded border px-3 text-sm">
          <option value="all">All clients</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.label}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded border px-3 text-sm">
          <option value="all">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="h-10 rounded border px-3 text-sm">
          <option value="all">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-10 rounded border px-3 text-sm" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-10 rounded border px-3 text-sm" />
        <button type="button" onClick={clearFilters} className="h-10 rounded border px-3 text-sm">
          Clear filters
        </button>
      </div>

      {toast ? (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            toast.type === "success"
              ? "bg-green-50 text-[#22c55e]"
              : toast.type === "error"
                ? "bg-red-50 text-[#ef4444]"
                : "bg-cyan-50 text-[#0db8c8]"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
      {view === "calendar" ? (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-3 rounded-md border bg-white p-1 text-sm w-fit">
            <button onClick={() => setCalendarView("today")} className={`rounded px-3 py-1 ${calendarView === "today" ? "bg-[#0db8c8] text-white" : ""}`}>Today</button>
            <button onClick={() => setCalendarView("week")} className={`rounded px-3 py-1 ${calendarView === "week" ? "bg-[#0db8c8] text-white" : ""}`}>Week</button>
            <button onClick={() => setCalendarView("month")} className={`rounded px-3 py-1 ${calendarView === "month" ? "bg-[#0db8c8] text-white" : ""}`}>Month</button>
          </div>
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigateCalendar(-1)}
              className="rounded border px-3 py-1 text-sm"
            >
              ←
            </button>
            <p className="text-sm font-semibold text-slate-100">{currentCalendarLabel}</p>
            <button
              type="button"
              onClick={() => navigateCalendar(1)}
              className="rounded border px-3 py-1 text-sm"
            >
              →
            </button>
          </div>
          {calendarView === "today" ? (
            <div className="space-y-1">
              {Array.from({ length: 13 }, (_, i) => 7 + i).map((hour) => (
                <div key={hour} className="relative border-t pt-1 min-h-14">
                  <p className="text-xs text-slate-400">{`${String(hour).padStart(2, "0")}:00`}</p>
                </div>
              ))}
              <div className="relative -mt-[740px] h-[780px]">
                {todayJobs.map((job) => {
                  const start = parseTimeToMinutes(job.scheduled_start) ?? 9 * 60;
                  const end = parseTimeToMinutes(job.scheduled_end) ?? start + 60;
                  const dayStart = 7 * 60;
                  const dayEnd = 19 * 60;
                  const top = Math.max(0, start - dayStart);
                  const height = Math.max(28, Math.min(dayEnd, end) - Math.max(dayStart, start));
                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => startEdit(job)}
                      className={`absolute left-20 right-2 rounded px-2 py-1 text-left text-xs font-medium ${
                        statusClasses[normalizeStatus(job.status)] ?? statusClasses.scheduled
                      }`}
                      style={{ top, height }}
                    >
                      <p className="truncate">{job.title ?? "Untitled job"}</p>
                      <p className="truncate text-[10px]">
                        {(job.scheduled_start ?? "--:--").slice(0, 5)} - {(job.scheduled_end ?? "--:--").slice(0, 5)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {calendarView === "week" ? (
            <div>
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase text-slate-300">
                {weekDays.map((day) => (
                  <div key={toDateKey(day)}>{day.toLocaleDateString("en-AU", { weekday: "short", day: "numeric" })}</div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const key = toDateKey(day);
                  const jobsOnDay = jobsByDate.get(key) ?? [];
                  return (
                    <div key={key} className="min-h-[180px] rounded border p-2">
                      <div className="space-y-1">
                        {jobsOnDay.map((job) => (
                          <button
                            key={job.id}
                            type="button"
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData("text/job-id", job.id);
                            }}
                            onClick={() => startEdit(job)}
                            className={`block w-full truncate rounded px-2 py-1 text-left text-xs ${
                              statusClasses[normalizeStatus(job.status)] ?? statusClasses.scheduled
                            }`}
                            title={job.title ?? "Untitled job"}
                          >
                            {(job.scheduled_start ?? "--:--").slice(0, 5)} {job.title ?? "Untitled job"}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          {calendarView === "month" ? (
            <>
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase text-slate-300">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="min-h-[120px] rounded border bg-slate-50" />;
                  }

                  const dateKey = toDateKey(date);
                  const jobsOnDate = jobsByDate.get(dateKey) ?? [];

                  return (
                    <div
                      key={dateKey}
                      className="min-h-[120px] rounded border p-2"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        const jobId = event.dataTransfer.getData("text/job-id");
                        if (jobId) quickUpdateSchedule(jobId, dateKey);
                      }}
                    >
                      <p className="mb-2 text-xs font-semibold text-slate-200">{date.getDate()}</p>
                      <div className="space-y-1">
                        {jobsOnDate.map((job) => (
                          <button
                            key={job.id}
                            type="button"
                            onClick={() => startEdit(job)}
                            className={`block w-full truncate rounded px-2 py-1 text-left text-xs font-medium ${
                              statusClasses[normalizeStatus(job.status)] ?? statusClasses.scheduled
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
            </>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white p-4 shadow-sm">
          <table className="w-full min-w-[700px] text-sm">
            <thead><tr className="border-b text-left"><th className="px-2 py-2">Title</th><th className="px-2 py-2">Client</th><th className="px-2 py-2">Date</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Priority</th><th className="px-2 py-2">Employee</th><th className="px-2 py-2">Actions</th></tr></thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-6 text-center text-sm text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <p>No jobs yet. Add your first job to get started.</p>
                      <button onClick={startAdd} className="rounded-md bg-[#0db8c8] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a9dab]">
                        Add your first job
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="border-b hover:bg-slate-50">
                    <td className="px-2 py-2">{job.title ?? "-"}</td>
                    <td className="px-2 py-2">{job.client_name ?? "-"}</td>
                    <td className="px-2 py-2">{job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString("en-AU") : "-"}</td>
                    <td className="px-2 py-2">
                      <select
                        value={normalizeStatus(job.status)}
                        onChange={(e) => quickUpdateStatus(job.id, e.target.value)}
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          statusClasses[normalizeStatus(job.status)] ?? statusClasses.scheduled
                        }`}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 capitalize">{(job.priority ?? "normal").replace("normal", "medium")}</td>
                    <td className="px-2 py-2">
                      <select
                        value={job.employee_id ?? ""}
                        onChange={(e) => quickAssignEmployee(job.id, e.target.value)}
                        className="h-8 rounded border px-2 text-xs"
                      >
                        <option value="">Unassigned</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2 space-x-2">
                      <button onClick={() => startEdit(job)} className="rounded border px-2 py-1 text-xs">Edit</button>
                      {normalizeStatus(job.status) === "completed" ? (
                        <form action={createInvoiceFromJobAction} className="inline">
                          <input type="hidden" name="job_id" value={job.id} />
                          <button type="submit" className="rounded bg-[#0db8c8] px-2 py-1 text-xs text-white hover:bg-[#0a9dab]">
                            Create Invoice
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="flex h-full w-full flex-col md:flex-row md:justify-end md:overflow-hidden">
            {quickAdd === "client" ? (
              <aside className="flex max-h-[45vh] w-full shrink-0 flex-col gap-3 overflow-y-auto border-b border-slate-200 bg-white p-5 shadow-xl md:h-full md:max-h-none md:max-w-sm md:border-b-0 md:border-r md:border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">New client</h3>
                  <button type="button" onClick={() => setQuickAdd(null)} className="text-sm text-slate-500 hover:text-slate-800">
                    Close
                  </button>
                </div>
                <p className="text-xs text-slate-500">Adds a client and selects them on this job.</p>
                <form className="grid gap-2" onSubmit={submitQuickClient}>
                  <input name="full_name" required placeholder="Name" autoComplete="name" className="h-10 rounded border px-3 text-sm" />
                  <input name="phone" type="tel" placeholder="Phone" autoComplete="tel" className="h-10 rounded border px-3 text-sm" />
                  <input name="email" type="email" placeholder="Email" autoComplete="email" className="h-10 rounded border px-3 text-sm" />
                  <div className="mt-1 flex gap-2">
                    <button type="button" onClick={() => setQuickAdd(null)} className="rounded border px-3 py-2 text-sm">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={quickClientSaving}
                      className="rounded bg-[#0db8c8] px-3 py-2 text-sm text-white hover:bg-[#0a9dab] disabled:opacity-60"
                    >
                      {quickClientSaving ? "Saving…" : "Save client"}
                    </button>
                  </div>
                </form>
              </aside>
            ) : null}
            {quickAdd === "employee" ? (
              <aside className="flex max-h-[45vh] w-full shrink-0 flex-col gap-3 overflow-y-auto border-b border-slate-200 bg-white p-5 shadow-xl md:h-full md:max-h-none md:max-w-sm md:border-b-0 md:border-r md:border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">New employee</h3>
                  <button type="button" onClick={() => setQuickAdd(null)} className="text-sm text-slate-500 hover:text-slate-800">
                    Close
                  </button>
                </div>
                <p className="text-xs text-slate-500">Adds an employee and assigns them on this job.</p>
                <form className="grid gap-2" onSubmit={submitQuickEmployee}>
                  <input name="full_name" required placeholder="Name" autoComplete="name" className="h-10 rounded border px-3 text-sm" />
                  <input name="role" placeholder="Role (e.g. electrician)" defaultValue="employee" className="h-10 rounded border px-3 text-sm" />
                  <input name="phone" type="tel" placeholder="Phone" autoComplete="tel" className="h-10 rounded border px-3 text-sm" />
                  <div className="mt-1 flex gap-2">
                    <button type="button" onClick={() => setQuickAdd(null)} className="rounded border px-3 py-2 text-sm">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={quickEmployeeSaving}
                      className="rounded bg-[#0db8c8] px-3 py-2 text-sm text-white hover:bg-[#0a9dab] disabled:opacity-60"
                    >
                      {quickEmployeeSaving ? "Saving…" : "Save employee"}
                    </button>
                  </div>
                </form>
              </aside>
            ) : null}
            <div className="flex h-full min-h-0 w-full max-w-2xl flex-col overflow-y-auto bg-white p-5 shadow-xl md:shrink-0">
            <h2 className="text-lg font-semibold text-slate-100">{editing ? "Edit Job" : "Add Job"}</h2>
            <div className="mt-3 rounded-md border bg-white p-1 text-sm w-fit">
              <button onClick={() => setActiveTab("details")} className={`rounded px-3 py-1 ${activeTab === "details" ? "bg-[#0db8c8] text-white" : ""}`}>Details</button>
              <button onClick={() => setActiveTab("photos")} className={`rounded px-3 py-1 ${activeTab === "photos" ? "bg-[#0db8c8] text-white" : ""}`}>Photos</button>
            </div>
            <form action={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={values.id} />
              {activeTab === "details" ? (
                <>
              <input name="title" value={values.title} onChange={(e) => setValues((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="h-10 rounded border px-3" />
              <input name="job_type" value={values.job_type} onChange={(e) => setValues((p) => ({ ...p, job_type: e.target.value }))} placeholder="Job type" className="h-10 rounded border px-3" />
              <select
                name="client_id"
                value={values.client_id}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === ADD_NEW_CLIENT) {
                    setQuickAdd("client");
                    return;
                  }
                  setValues((p) => ({ ...p, client_id: v }));
                }}
                className="h-10 rounded border px-3"
              >
                <option value="">Client</option>
                {clientOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
                <option disabled className="text-slate-400">
                  ────────────
                </option>
                <option value={ADD_NEW_CLIENT}>+ Add new client</option>
              </select>
              <select
                name="employee_id"
                value={values.employee_id}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === ADD_NEW_EMPLOYEE) {
                    setQuickAdd("employee");
                    return;
                  }
                  setValues((p) => ({ ...p, employee_id: v }));
                }}
                className="h-10 rounded border px-3"
              >
                <option value="">Employee</option>
                {employeeOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
                <option disabled className="text-slate-400">
                  ────────────
                </option>
                <option value={ADD_NEW_EMPLOYEE}>+ Add new employee</option>
              </select>
              <input type="date" name="scheduled_date" value={values.scheduled_date} onChange={(e) => setValues((p) => ({ ...p, scheduled_date: e.target.value }))} className="h-10 rounded border px-3" />
              <select name="priority" value={values.priority} onChange={(e) => setValues((p) => ({ ...p, priority: e.target.value }))} className="h-10 rounded border px-3"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select>
              <input type="time" name="scheduled_start" value={values.scheduled_start} onChange={(e) => setValues((p) => ({ ...p, scheduled_start: e.target.value }))} className="h-10 rounded border px-3" />
              <input type="time" name="scheduled_end" value={values.scheduled_end} onChange={(e) => setValues((p) => ({ ...p, scheduled_end: e.target.value }))} className="h-10 rounded border px-3" />
              <input name="address" value={values.address} onChange={(e) => setValues((p) => ({ ...p, address: e.target.value }))} placeholder="Address" className="h-10 rounded border px-3" />
              <input name="suburb" value={values.suburb} onChange={(e) => setValues((p) => ({ ...p, suburb: e.target.value }))} placeholder="Suburb" className="h-10 rounded border px-3" />
              <input name="state" value={values.state} onChange={(e) => setValues((p) => ({ ...p, state: e.target.value }))} placeholder="State" className="h-10 rounded border px-3" />
              <textarea name="description" value={values.description} onChange={(e) => setValues((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="min-h-20 rounded border px-3 py-2 sm:col-span-2" />
              <textarea name="notes" value={values.notes} onChange={(e) => setValues((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="min-h-20 rounded border px-3 py-2 sm:col-span-2" />
              <div className="sm:col-span-2 rounded border p-3">
                <p className="mb-2 text-sm font-semibold text-slate-100">Costs</p>
                <div className="grid gap-2 sm:grid-cols-4">
                  <input type="number" step="0.01" name="materials_cost" value={values.materials_cost} onChange={(e) => setValues((p) => ({ ...p, materials_cost: e.target.value }))} placeholder="Materials cost" className="h-10 rounded border px-3" />
                  <input type="number" step="0.1" name="labour_hours" value={values.labour_hours} onChange={(e) => setValues((p) => ({ ...p, labour_hours: e.target.value }))} placeholder="Labour hours" className="h-10 rounded border px-3" />
                  <input type="number" step="0.01" name="hourly_rate" value={values.hourly_rate} onChange={(e) => setValues((p) => ({ ...p, hourly_rate: e.target.value }))} placeholder="Hourly rate" className="h-10 rounded border px-3" />
                  <input type="number" step="0.01" value={values.revenue_amount} onChange={(e) => setValues((p) => ({ ...p, revenue_amount: e.target.value }))} placeholder="Revenue" className="h-10 rounded border px-3" />
                </div>
                {(() => {
                  const revenue = Number(values.revenue_amount || 0);
                  const costs = Number(values.materials_cost || 0) + Number(values.labour_hours || 0) * Number(values.hourly_rate || 0);
                  const profit = revenue - costs;
                  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
                  return (
                    <p className="mt-2 text-sm text-slate-400">
                      Profit margin: ${profit.toFixed(2)} ({margin.toFixed(1)}%)
                    </p>
                  );
                })()}
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => closeJobOverlay()} className="rounded border px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="rounded bg-[#0db8c8] px-4 py-2 text-sm text-white hover:bg-[#0a9dab]">{editing ? "Save Changes" : "Create Job"}</button>
              </div>
                </>
              ) : null}
              {activeTab === "photos" ? (
                <div className="sm:col-span-2 space-y-3">
                  {!editing ? <p className="text-sm text-slate-400">Save the job first, then upload photos.</p> : null}
                  {editing ? (
                    <div className="space-y-2">
                      <select
                        value={photoLabel}
                        onChange={(e) => setPhotoLabel(e.target.value === "after" ? "after" : "before")}
                        className="h-10 rounded border px-3 text-sm"
                      >
                        <option value="before">Before</option>
                        <option value="after">After</option>
                      </select>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="block w-full text-sm"
                        onChange={(e) => setSelectedPhotos(Array.from(e.target.files ?? []))}
                      />
                      <button type="button" onClick={uploadPhotos} className="rounded bg-[#0db8c8] px-4 py-2 text-sm text-white hover:bg-[#0a9dab]">Upload Photos</button>
                    </div>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {(jobPhotosByJob[values.id] ?? []).map((photo, idx) => (
                      <div key={`${photo.url}-${idx}`} className="rounded border p-2">
                        <Image
                          src={photo.url}
                          alt={`Job photo ${idx + 1}`}
                          width={320}
                          height={96}
                          className="h-24 w-full rounded object-cover"
                          unoptimized
                        />
                        <p className="mt-1 text-xs font-medium capitalize text-slate-300">{photo.label}</p>
                      </div>
                    ))}
                    {(jobPhotosByJob[values.id] ?? []).length === 0 ? (
                      <p className="text-sm text-slate-400">No photos uploaded yet.</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


