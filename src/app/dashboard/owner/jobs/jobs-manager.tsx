"use client";

import Image from "next/image";
import { ClipboardList } from "lucide-react";
import { DemoBadge } from "@/components/demo-badge";
import { useEffect, useMemo, useState, useRef, type CSSProperties, type DragEvent, type FormEvent } from "react";
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
  employee_name?: string | null;
  materials_cost?: number | null;
  labour_hours?: number | null;
  hourly_rate?: number | null;
  created_at?: string | null;
  is_demo?: boolean | null;
};

type RefOpt = { id: string; label: string };

type QuickCreateJobRefResult = { ok: boolean; id?: string; label?: string; message?: string };

type Props = {
  jobs: Job[];
  clients: RefOpt[];
  employees: RefOpt[];
  initialClientId?: string;
  /** When true, list view sets date filters to today (?today=today). Default shows all schedules. */
  initialScheduleToday?: boolean;
  /** Opens the job editor for this id once jobs are loaded (e.g. from schedule links). */
  initialOpenJobId?: string;
  createJobAction: (formData: FormData) => Promise<void>;
  updateJobAction: (formData: FormData) => Promise<void>;
  updateJobStatusAction: (formData: FormData) => Promise<{ invoiceId?: string }>;
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

function isDayToday(day: Date) {
  const n = new Date();
  return (
    day.getFullYear() === n.getFullYear() && day.getMonth() === n.getMonth() && day.getDate() === n.getDate()
  );
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

/** Monday–Sunday for the week containing `date`. */
function calendarWeekBoundsFrom(date: Date) {
  const start = startOfWeek(date);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { fromKey: toDateKey(start), toKey: toDateKey(end) };
}

function sortJobsByStartTime(dayJobs: Job[]) {
  return [...dayJobs].sort(
    (a, b) => (parseTimeToMinutes(a.scheduled_start) ?? 0) - (parseTimeToMinutes(b.scheduled_start) ?? 0)
  );
}

export default function JobsManager({
  jobs,
  clients,
  employees,
  initialClientId,
  initialScheduleToday = false,
  initialOpenJobId,
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
  const [editingDemo, setEditingDemo] = useState(false);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calendarView, setCalendarView] = useState<"today" | "week" | "month">("week");
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
  const openJobDeepLinkDone = useRef(false);

  useEffect(() => {
    setClientOptions(clients);
  }, [clients]);

  useEffect(() => {
    setEmployeeOptions(employees);
  }, [employees]);

  useEffect(() => {
    if (!initialClientId?.trim()) return;
    const id = initialClientId.trim();
    const exists = clients.some((c) => c.id === id);
    if (exists) setClientFilter(id);
  }, [initialClientId, clients]);

  useEffect(() => {
    if (initialScheduleToday === false) return;
    const k = toDateKey(new Date());
    setFromDate(k);
    setToDate(k);
  }, [initialScheduleToday]);

  useEffect(() => {
    const id = initialOpenJobId?.trim();
    if (!id || openJobDeepLinkDone.current) return;
    const job = jobs.find((j) => j.id === id);
    if (job) {
      startEdit(job);
      openJobDeepLinkDone.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOpenJobId, jobs]);

  const closeJobOverlay = () => {
    setOpen(false);
    setQuickAdd(null);
    setEditingDemo(false);
  };

  const statusPillClasses: Record<string, string> = {
    scheduled: "bg-orange-100 text-orange-900 ring-1 ring-inset ring-orange-300 dark:bg-orange-950 dark:text-orange-100 dark:ring-orange-700",
    in_progress:
      "bg-sky-100 text-sky-950 ring-1 ring-inset ring-sky-300 dark:bg-sky-950 dark:text-sky-100 dark:ring-sky-700",
    completed:
      "bg-green-100 text-green-900 ring-1 ring-inset ring-green-300 dark:bg-green-950 dark:text-green-100 dark:ring-green-700",
    cancelled: "bg-red-100 text-red-900 ring-1 ring-inset ring-red-300 dark:bg-red-950 dark:text-red-100 dark:ring-red-700"
  };

  const statusBlockClasses: Record<string, string> = {
    scheduled:
      "border border-orange-300 bg-orange-100 text-orange-950 hover:bg-orange-200 dark:border-orange-700 dark:bg-orange-950/90 dark:text-orange-50 dark:hover:bg-orange-900",
    in_progress:
      "border border-sky-300 bg-sky-100 text-sky-950 hover:bg-sky-200 dark:border-sky-700 dark:bg-sky-950/90 dark:text-sky-50 dark:hover:bg-sky-900",
    completed:
      "border border-green-300 bg-green-100 text-green-950 hover:bg-green-200 dark:border-green-700 dark:bg-green-950/90 dark:text-green-50 dark:hover:bg-green-900",
    cancelled:
      "border border-red-300 bg-red-100 text-red-950 hover:bg-red-200 dark:border-red-700 dark:bg-red-950/90 dark:text-red-50 dark:hover:bg-red-900"
  };

  const normalizeStatus = (status: string | null) => {
    const raw = (status ?? "scheduled").toLowerCase();
    if (raw === "complete" || raw === "completed") return "completed";
    if (["in_progress", "in-progress", "en_route", "on_site"].includes(raw)) return "in_progress";
    if (raw === "cancelled") return "cancelled";
    return "scheduled";
  };

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

  const jobNumberById = useMemo(() => {
    const sorted = [...jobs].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (ta !== tb) return ta - tb;
      return a.id.localeCompare(b.id);
    });
    const map = new Map<string, string>();
    sorted.forEach((j, i) => map.set(j.id, `JB${String(i + 1).padStart(5, "0")}`));
    return map;
  }, [jobs]);

  const listStats = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    for (const job of filteredJobs) {
      const s = normalizeStatus(job.status);
      if (s === "scheduled") pending += 1;
      else if (s === "in_progress") inProgress += 1;
      else if (s === "completed") completed += 1;
    }
    return { total: filteredJobs.length, pending, inProgress, completed };
  }, [filteredJobs]);

  const employeeNameById = useMemo(() => new Map(employees.map((e) => [e.id, e.label])), [employees]);

  const displayEmployeeName = (job: Job) =>
    job.employee_name ?? (job.employee_id ? employeeNameById.get(job.employee_id) ?? null : null) ?? "—";

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
      setSearch("");
      setClientFilter("all");
      setStatusFilter("all");
      setPriorityFilter("all");
      setFromDate("");
      setToDate("");
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
      const result = await updateJobStatusAction(fd);
      router.refresh();
      if (result?.invoiceId) {
        setToast({ type: "success", message: "Job completed — draft invoice created." });
      }
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
    setEditingDemo(false);
    setValues(empty);
    setActiveTab("details");
    setQuickAdd(null);
    setOpen(true);
  }

  function startAddWithDate(dateKey: string) {
    setEditing(false);
    setEditingDemo(false);
    setValues({ ...empty, scheduled_date: dateKey });
    setActiveTab("details");
    setQuickAdd(null);
    setOpen(true);
  }

  function startEdit(job: Job) {
    setEditing(true);
    setEditingDemo(Boolean(job.is_demo));
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

  function calendarJobBlock(
    job: Job,
    options?: { draggable?: boolean; className?: string; style?: CSSProperties }
  ) {
    const st = normalizeStatus(job.status);
    const cls = statusBlockClasses[st] ?? statusBlockClasses.scheduled;
    const time =
      job.scheduled_start || job.scheduled_end
        ? `${(job.scheduled_start ?? "—").slice(0, 5)}–${(job.scheduled_end ?? "—").slice(0, 5)}`
        : null;
    const draggable = Boolean(options?.draggable);
    return (
      <button
        key={job.id}
        type="button"
        data-job-block
        draggable={draggable}
        style={options?.style}
        onDragStart={
          draggable
            ? (event: DragEvent<HTMLButtonElement>) => {
                event.dataTransfer.setData("text/job-id", job.id);
              }
            : undefined
        }
        onClick={(event) => {
          event.stopPropagation();
          startEdit(job);
        }}
        className={`block w-full rounded-md px-2 py-1.5 text-left text-xs font-semibold shadow-sm ${cls} ${options?.className ?? ""}`}
      >
        {time ? <p className="text-[10px] font-bold uppercase tracking-wide opacity-90">{time}</p> : null}
        <p className="flex flex-wrap items-center gap-1 leading-snug">
          <span className="line-clamp-2">{job.title ?? "Untitled job"}</span>
          {job.is_demo ? <DemoBadge className="!px-1.5 !py-px !text-[9px]" /> : null}
        </p>
        <p className="truncate text-[10px] font-normal opacity-95">{job.client_name ?? "—"}</p>
        <p className="truncate text-[10px] font-normal opacity-95">{displayEmployeeName(job)}</p>
      </button>
    );
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
          <button onClick={() => setView("list")} className={`rounded px-3 py-1 ${view === "list" ? "bg-[var(--accent-color)] text-white" : ""}`}>List View</button>
          <button onClick={() => setView("calendar")} className={`rounded px-3 py-1 ${view === "calendar" ? "bg-[var(--accent-color)] text-white" : ""}`}>Calendar View</button>
        </div>
        <button onClick={startAdd} className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]">Add Job</button>
      </div>
      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[220px] flex-1 xl:max-w-md">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or client"
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const { fromKey, toKey } = calendarWeekBoundsFrom(new Date());
              setFromDate(fromKey);
              setToDate(toKey);
            }}
            className="h-10 shrink-0 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--accent-color)_8%,var(--bg-secondary))] px-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--accent-color)_14%,var(--bg-secondary))]"
          >
            This Week
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
          >
            <option value="all">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
          >
            <option value="all">All statuses</option>
            <option value="scheduled">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
          >
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button
            type="button"
            onClick={clearFilters}
            className="h-10 rounded-lg border border-[var(--border)] px-3 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
          >
            Clear filters
          </button>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
          />
          <button
            type="button"
            onClick={() => {
              const k = toDateKey(new Date());
              setFromDate(k);
              setToDate(k);
            }}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
          >
            Today only
          </button>
          <span className="hidden xl:block" aria-hidden />
        </div>
      </div>

      {toast ? (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            toast.type === "success"
              ? "bg-green-50 text-[#22c55e]"
              : toast.type === "error"
                ? "bg-red-50 text-[#ef4444]"
                : "bg-[color-mix(in_srgb,var(--accent-color)_12%,transparent)] text-[var(--accent-color)]"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
      {view === "calendar" ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] p-1 text-sm w-fit">
            <button
              type="button"
              onClick={() => setCalendarView("today")}
              className={`rounded px-3 py-1 ${calendarView === "today" ? "bg-[var(--accent-color)] text-white" : "text-[var(--text-primary)]"}`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCalendarView("week")}
              className={`rounded px-3 py-1 ${calendarView === "week" ? "bg-[var(--accent-color)] text-white" : "text-[var(--text-primary)]"}`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => {
                setCalendarView("month");
                setMonthDate(new Date(focusDate.getFullYear(), focusDate.getMonth(), 1));
              }}
              className={`rounded px-3 py-1 ${calendarView === "month" ? "bg-[var(--accent-color)] text-white" : "text-[var(--text-primary)]"}`}
            >
              Month
            </button>
          </div>
          <div className="mb-4 flex items-center justify-between gap-2">
            <button type="button" onClick={() => navigateCalendar(-1)} className="rounded border border-[var(--border)] px-3 py-1 text-sm text-[var(--text-primary)]">
              ←
            </button>
            <p className="text-center text-sm font-semibold text-[var(--text-primary)]">{currentCalendarLabel}</p>
            <button type="button" onClick={() => navigateCalendar(1)} className="rounded border border-[var(--border)] px-3 py-1 text-sm text-[var(--text-primary)]">
              →
            </button>
          </div>
          {calendarView === "today" ? (
            <div
              className="relative cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]"
              role="presentation"
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("[data-job-block]")) return;
                startAddWithDate(todayKey);
              }}
            >
              <div className="space-y-1">
                {Array.from({ length: 13 }, (_, i) => 7 + i).map((hour) => (
                  <div key={hour} className="relative min-h-14 border-t border-[var(--border)] pt-1">
                    <p className="text-xs text-[var(--text-muted)]">{`${String(hour).padStart(2, "0")}:00`}</p>
                  </div>
                ))}
              </div>
              <div className="pointer-events-none relative -mt-[728px] h-[728px]">
                <div className="pointer-events-auto absolute inset-y-0 left-16 right-0">
                  {todayJobs.map((job) => {
                    const start = parseTimeToMinutes(job.scheduled_start) ?? 9 * 60;
                    const end = parseTimeToMinutes(job.scheduled_end) ?? start + 60;
                    const dayStart = 7 * 60;
                    const dayEnd = 19 * 60;
                    const totalMinutes = dayEnd - dayStart;
                    const pxPerMinute = 728 / totalMinutes;
                    const topPx = Math.max(0, start - dayStart) * pxPerMinute;
                    const spanMinutes = Math.min(dayEnd, end) - Math.max(dayStart, start);
                    const heightPx = Math.max(44, spanMinutes * pxPerMinute);
                    return calendarJobBlock(job, {
                      className: "absolute left-0 right-2 overflow-hidden",
                      style: { top: topPx, height: heightPx }
                    });
                  })}
                </div>
              </div>
            </div>
          ) : null}
          {calendarView === "week" ? (
            <div className="overflow-x-auto pb-1">
              <div className="grid min-w-[840px] grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const key = toDateKey(day);
                  const jobsOnDay = sortJobsByStartTime(jobsByDate.get(key) ?? []);
                  const today = isDayToday(day);
                  return (
                    <div
                      key={key}
                      role="presentation"
                      onClick={(event) => {
                        if ((event.target as HTMLElement).closest("[data-job-block]")) return;
                        startAddWithDate(key);
                      }}
                      className={`flex min-h-[520px] flex-col rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] ${
                        today ? "ring-2 ring-[var(--accent-color)] ring-offset-2 ring-offset-[var(--bg-card)]" : ""
                      }`}
                    >
                      <div
                        className={`border-b border-[var(--border)] px-2 py-2 text-center text-[11px] font-semibold leading-tight ${
                          today ? "rounded-t-[calc(0.5rem-2px)] bg-[var(--accent-color)]/15 text-[var(--accent-color)]" : "text-[var(--text-primary)]"
                        }`}
                      >
                        <div>{day.toLocaleDateString("en-AU", { weekday: "short" })}</div>
                        <div className="text-xs">{day.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</div>
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-2">
                        {jobsOnDay.map((job) => calendarJobBlock(job, { draggable: true }))}
                        <p className="mt-auto pt-2 text-center text-[10px] text-[var(--text-muted)]">Click empty space to add</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          {calendarView === "month" ? (
            <>
              <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase text-[var(--text-muted)]">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="min-h-[140px] rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]" />;
                  }

                  const dateKey = toDateKey(date);
                  const jobsOnDate = sortJobsByStartTime(jobsByDate.get(dateKey) ?? []);
                  const today = isDayToday(date);

                  return (
                    <div
                      key={dateKey}
                      role="presentation"
                      onClick={(event) => {
                        if ((event.target as HTMLElement).closest("[data-job-block]")) return;
                        startAddWithDate(dateKey);
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        const jobId = event.dataTransfer.getData("text/job-id");
                        if (jobId) quickUpdateSchedule(jobId, dateKey);
                      }}
                      className={`flex min-h-[140px] cursor-pointer flex-col rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-2 ${
                        today ? "ring-2 ring-[var(--accent-color)] ring-offset-1 ring-offset-[var(--bg-card)]" : ""
                      }`}
                    >
                      <p
                        className={`mb-1.5 inline-flex min-h-[1.25rem] w-min min-w-[1.5rem] items-center justify-center rounded px-1 text-xs font-bold ${
                          today ? "bg-[var(--accent-color)] text-white" : "text-[var(--text-primary)]"
                        }`}
                      >
                        {date.getDate()}
                      </p>
                      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                        {jobsOnDate.map((job) => calendarJobBlock(job, { draggable: true }))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Summary</span>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-900 ring-1 ring-inset ring-slate-400/70 dark:bg-slate-700 dark:text-slate-50 dark:ring-slate-500">
              Total · {listStats.total}
            </span>
            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-900 ring-1 ring-inset ring-orange-200 dark:bg-orange-950 dark:text-orange-100 dark:ring-orange-800">
              Pending · {listStats.pending}
            </span>
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-950 ring-1 ring-inset ring-sky-200 dark:bg-sky-950 dark:text-sky-100 dark:ring-sky-700">
              In progress · {listStats.inProgress}
            </span>
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-900 ring-1 ring-inset ring-green-200 dark:bg-green-950 dark:text-green-100 dark:ring-green-800">
              Completed · {listStats.completed}
            </span>
          </div>
          {jobs.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-8 py-16 text-center shadow-sm">
              <div className="flex size-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent-color)_14%,transparent)] text-[var(--accent-color)]">
                <ClipboardList className="size-8 shrink-0" aria-hidden />
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">No jobs yet</h2>
              <p className="max-w-md text-sm text-[var(--text-secondary)]">Create your first job to get started.</p>
              <button
                type="button"
                onClick={startAdd}
                className="mt-2 inline-flex h-11 items-center rounded-lg bg-[var(--accent-color)] px-6 text-sm font-bold text-white hover:bg-[var(--accent-hover)]"
              >
                Add Job
              </button>
            </div>
          ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <table className="w-full min-w-[840px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Job #</th>
                  <th className="px-2 py-2 font-medium">Title</th>
                  <th className="px-2 py-2 font-medium">Client</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Date</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Priority</th>
                  <th className="px-2 py-2 font-medium">Employee</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-8 text-center text-sm text-[var(--text-muted)]">
                      <p>No jobs match your filters. Try adjusting search, dates or filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => {
                    const st = normalizeStatus(job.status);
                    return (
                      <tr
                        key={job.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => startEdit(job)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            startEdit(job);
                          }
                        }}
                        className="cursor-pointer border-b border-[var(--border)] hover:bg-[var(--bg-primary)]"
                      >
                        <td className="whitespace-nowrap px-2 py-2 font-mono text-xs font-medium tabular-nums text-[var(--text-muted)]">
                          {jobNumberById.get(job.id) ?? "—"}
                        </td>
                        <td className="px-2 py-2 font-medium text-[var(--text-primary)]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{job.title ?? "-"}</span>
                            {job.is_demo ? <DemoBadge /> : null}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-[var(--text-secondary)]">{job.client_name ?? "-"}</td>
                        <td className="whitespace-nowrap px-2 py-2 text-[var(--text-secondary)]">
                          {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString("en-AU") : "-"}
                        </td>
                        <td className="px-2 py-2" onClick={(event) => event.stopPropagation()}>
                          <select
                            aria-label="Job status"
                            value={st}
                            onChange={(event) => quickUpdateStatus(job.id, event.target.value)}
                            className={`h-8 max-w-[170px] cursor-pointer rounded-full px-2 py-1 text-xs font-semibold ${statusPillClasses[st] ?? statusPillClasses.scheduled}`}
                          >
                            <option value="scheduled">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-2 py-2 capitalize text-[var(--text-secondary)]">
                          {(job.priority ?? "normal").replace("normal", "medium")}
                        </td>
                        <td className="px-2 py-2" onClick={(event) => event.stopPropagation()}>
                          <select
                            value={job.employee_id ?? ""}
                            onChange={(event) => quickAssignEmployee(job.id, event.target.value)}
                            className="h-8 max-w-[160px] rounded border border-[var(--border)] bg-[var(--input-bg)] px-2 text-xs text-[var(--text-primary)]"
                          >
                            <option value="">Unassigned</option>
                            {employees.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-2 py-2" onClick={(event) => event.stopPropagation()}>
                          {st === "completed" && !job.is_demo ? (
                            <form action={createInvoiceFromJobAction} className="inline">
                              <input type="hidden" name="job_id" value={job.id} />
                              <button
                                type="submit"
                                className="rounded bg-[var(--accent-color)] px-2 py-1 text-xs font-medium text-white hover:bg-[var(--accent-hover)]"
                              >
                                Create Invoice
                              </button>
                            </form>
                          ) : st === "completed" && job.is_demo ? (
                            <span className="text-[10px] text-[var(--text-muted)]">Demo</span>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          )}
        </>
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
                      className="rounded bg-[var(--accent-color)] px-3 py-2 text-sm text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
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
                      className="rounded bg-[var(--accent-color)] px-3 py-2 text-sm text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
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
              <button onClick={() => setActiveTab("details")} className={`rounded px-3 py-1 ${activeTab === "details" ? "bg-[var(--accent-color)] text-white" : ""}`}>Details</button>
              <button onClick={() => setActiveTab("photos")} className={`rounded px-3 py-1 ${activeTab === "photos" ? "bg-[var(--accent-color)] text-white" : ""}`}>Photos</button>
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
                <button type="submit" className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)]">{editing ? "Save Changes" : "Create Job"}</button>
              </div>
                </>
              ) : null}
              {activeTab === "photos" ? (
                <div className="sm:col-span-2 space-y-3">
                  {!editing ? <p className="text-sm text-slate-400">Save the job first, then upload photos.</p> : null}
                  {editing && editingDemo ? (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100">
                      This is a demo job — uploads are disabled. Create a real job to store photos.
                    </p>
                  ) : null}
                  {editing && !editingDemo ? (
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
                      <button type="button" onClick={uploadPhotos} className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)]">Upload Photos</button>
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


