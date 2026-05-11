"use client";

import Image from "next/image";
import { ClipboardList, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import { useUndoToast } from "@/hooks/useUndoToast";
import { DemoBadge } from "@/components/demo-badge";
import { useEffect, useMemo, useState, useRef, type CSSProperties, type DragEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import SignaturePad from "@/components/dashboard/signature-pad";
import { PhotoGallery, type GalleryPhoto } from "@/components/dashboard/photo-gallery";
import { GeofenceClock } from "@/components/dashboard/geofence-clock";

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
  revenue?: number | null;
  recurrence_rule?: string | null;
  checklist?: Array<{ id: string; text: string; done: boolean }> | null;
  digital_signoff_image?: string | null;
  signoff_name?: string | null;
  signoff_at?: string | null;
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
  saveJobSignoffAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  clearJobSignoffAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  sendJobToClientAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  deleteJobAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  restoreJobAction: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
};

function JobRowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors" aria-label="Row actions">
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 min-w-[140px] rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-1 shadow-lg">
          <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)]">
            <Pencil size={14} />Edit
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
            <Trash2 size={14} />Delete
          </button>
        </div>
      )}
    </div>
  );
}

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
  revenue_amount: "0",
  recurrence_rule: "",
  digital_signoff_image: "",
  signoff_name: "",
  signoff_at: ""
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
  quickCreateEmployeeForJobAction,
  saveJobSignoffAction,
  clearJobSignoffAction,
  sendJobToClientAction,
  deleteJobAction,
  restoreJobAction,
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
  const [activeTab, setActiveTab] = useState<"details" | "costing" | "checklist" | "recurring" | "signoff" | "photos">("details");
  const [checklistItems, setChecklistItems] = useState<Array<{ id: string; text: string; done: boolean }>>([]);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [photoLabel, setPhotoLabel] = useState<"before" | "after">("before");
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [quickAdd, setQuickAdd] = useState<null | "client" | "employee">(null);
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);
  const [clientOptions, setClientOptions] = useState<RefOpt[]>(clients);
  const [deleteJobTarget, setDeleteJobTarget] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState(false);
  const [removedJobIds, setRemovedJobIds] = useState<Set<string>>(new Set());
  const { showUndo: showJobUndo } = useUndoToast();
  const [employeeOptions, setEmployeeOptions] = useState<RefOpt[]>(employees);
  const [quickClientSaving, setQuickClientSaving] = useState(false);
  const [quickEmployeeSaving, setQuickEmployeeSaving] = useState(false);
  const [suggestingTitle, setSuggestingTitle] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState("weekly");
  const [createRecurringInstances, setCreateRecurringInstances] = useState(false);
  const [signoffSaving, setSignoffSaving] = useState(false);
  const [clearingSignoff, setClearingSignoff] = useState(false);
  const [sendingToClient, setSendingToClient] = useState(false);
  const openJobDeepLinkDone = useRef(false);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  // Smart scheduling
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [smartSlots, setSmartSlots] = useState<Array<{ date: string; start: string; end: string; score: number; reason: string }>>([]);
  const [showSlots, setShowSlots] = useState(false);

  const handleFindSlots = async () => {
    setLoadingSlots(true);
    setSmartSlots([]);
    setShowSlots(false);
    try {
      const res = await fetch("/api/jobs/smart-schedule", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          employee_id: values.employee_id || undefined,
          preferred_date: values.scheduled_date || undefined,
          suburb: values.suburb || undefined,
          job_duration_hours: 2,
        }),
      });
      if (!res.ok) throw new Error("Could not load slots");
      const data = await res.json();
      setSmartSlots((data.slots ?? []).slice(0, 5));
      setShowSlots(true);
    } catch {
      // silently ignore — user keeps manual fields
    } finally {
      setLoadingSlots(false);
    }
  };

  const applySmartSlot = (slot: { date: string; start: string; end: string }) => {
    setValues((p) => ({ ...p, scheduled_date: slot.date, scheduled_start: slot.start, scheduled_end: slot.end }));
    setShowSlots(false);
    setSmartSlots([]);
  };

  const toggleSelectJob = (id: string) => setSelectedJobIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const selectAll = () => setSelectedJobIds(new Set(filteredJobs.filter((j) => !j.is_demo).map((j) => j.id)));
  const clearSelection = () => setSelectedJobIds(new Set());

  const runBulkAction = async () => {
    if (selectedJobIds.size === 0 || !bulkAction) return;
    const ids = Array.from(selectedJobIds);
    setBulkProcessing(true);
    try {
      let body: Record<string, unknown> = { job_ids: ids, action: bulkAction };
      if (bulkAction === "update_status") {
        const newStatus = window.prompt("Enter new status (scheduled/in_progress/completed/invoiced/cancelled):");
        if (!newStatus) { setBulkProcessing(false); return; }
        body.status = newStatus;
      }
      const res = await fetch("/api/jobs/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? "Bulk action failed");
      }
      const d = await res.json() as { affected?: number };
      setToast({ type: "success", message: `Done — ${d.affected ?? ids.length} job(s) updated` });
      clearSelection();
      router.refresh();
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Bulk action failed" });
    } finally {
      setBulkProcessing(false);
      setBulkAction("");
    }
  };

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
    setActiveTab("details");
    setIsRecurring(false);
    setRecurrenceFreq("weekly");
    setCreateRecurringInstances(false);
    setChecklistItems([]);
    setNewCheckItem("");
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
    pending:
      "border border-indigo-400 hover:opacity-90",
    scheduled:
      "border border-blue-400 hover:opacity-90",
    in_progress:
      "border border-amber-400 hover:opacity-90",
    completed:
      "border border-green-400 hover:opacity-90",
    cancelled:
      "border border-slate-400 hover:opacity-90"
  };

  const statusBlockInlineStyle: Record<string, React.CSSProperties> = {
    pending: { backgroundColor: "#6366F1", color: "#ffffff" },
    scheduled: { backgroundColor: "#3B82F6", color: "#ffffff" },
    in_progress: { backgroundColor: "#F59E0B", color: "#1a1a1a" },
    completed: { backgroundColor: "#10B981", color: "#ffffff" },
    cancelled: { backgroundColor: "#94A3B8", color: "#ffffff" }
  };

  const normalizeStatus = (status: string | null) => {
    const raw = (status ?? "scheduled").toLowerCase();
    if (raw === "complete" || raw === "completed") return "completed";
    if (["in_progress", "in-progress", "en_route", "on_site"].includes(raw)) return "in_progress";
    if (raw === "cancelled") return "cancelled";
    if (raw === "pending") return "pending";
    return "scheduled";
  };

  // Map normalizeStatus values to statusBlockClasses keys
  const toBlockStatusKey = (st: string) => st;

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

      return matchesSearch && matchesClient && matchesStatus && matchesPriority && matchesFrom && matchesTo && !removedJobIds.has(job.id);
    });
  }, [jobs, search, clientFilter, statusFilter, priorityFilter, fromDate, toDate, removedJobIds]);

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
    setIsRecurring(false);
    setRecurrenceFreq("weekly");
    setCreateRecurringInstances(false);
    setOpen(true);
  }

  function startAddWithDate(dateKey: string) {
    setEditing(false);
    setEditingDemo(false);
    setValues({ ...empty, scheduled_date: dateKey });
    setActiveTab("details");
    setQuickAdd(null);
    setIsRecurring(false);
    setRecurrenceFreq("weekly");
    setCreateRecurringInstances(false);
    setOpen(true);
  }

  function startEdit(job: Job) {
    setEditing(true);
    setEditingDemo(Boolean(job.is_demo));
    const rule = job.recurrence_rule ?? "";
    setIsRecurring(Boolean(rule));
    setRecurrenceFreq(rule || "weekly");
    setCreateRecurringInstances(false);
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
      notes: job.notes ?? "",
      materials_cost: String(job.materials_cost ?? 0),
      labour_hours: String(job.labour_hours ?? 0),
      hourly_rate: String(job.hourly_rate ?? 0),
      revenue_amount: String(job.revenue ?? 0),
      recurrence_rule: rule,
      digital_signoff_image: job.digital_signoff_image ?? "",
      signoff_name: job.signoff_name ?? "",
      signoff_at: job.signoff_at ?? ""
    });
    setActiveTab("details");
    setQuickAdd(null);
    // Load checklist from job
    const rawChecklist = job.checklist;
    setChecklistItems(Array.isArray(rawChecklist) ? rawChecklist : []);
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
    const blockKey = toBlockStatusKey(st);
    const cls = statusBlockClasses[blockKey] ?? statusBlockClasses.scheduled;
    const inlineStyle: CSSProperties = {
      ...(statusBlockInlineStyle[blockKey] ?? statusBlockInlineStyle.scheduled)
    };
    const time =
      job.scheduled_start || job.scheduled_end
        ? `${(job.scheduled_start ?? "—").slice(0, 5)}–${(job.scheduled_end ?? "—").slice(0, 5)}`
        : null;
    const draggable = Boolean(options?.draggable);
    const isHovered = hoveredJobId === job.id;

    const employeeName = displayEmployeeName(job);
    const tooltipNotes = job.notes ? (job.notes.length > 100 ? job.notes.slice(0, 100) + "…" : job.notes) : null;

    return (
      <div key={job.id} className={`relative ${options?.className ?? ""}`} style={options?.style}>
        <button
          type="button"
          data-job-block
          draggable={draggable}
          style={inlineStyle}
          onDragStart={
            draggable
              ? (event: DragEvent<HTMLButtonElement>) => {
                  event.dataTransfer.setData("text/job-id", job.id);
                }
              : undefined
          }
          onMouseEnter={() => setHoveredJobId(job.id)}
          onMouseLeave={() => setHoveredJobId(null)}
          onClick={(event) => {
            event.stopPropagation();
            startEdit(job);
          }}
          className={`block w-full rounded-md px-2 py-1.5 text-left text-xs font-semibold shadow-sm ${cls}`}
        >
          {time ? <p className="text-[10px] font-bold uppercase tracking-wide opacity-90">{time}</p> : null}
          <p className="flex flex-wrap items-center gap-1 leading-snug">
            <span className="line-clamp-2">{job.title ?? "Untitled job"}</span>
            {job.is_demo ? <DemoBadge className="!px-1.5 !py-px !text-[9px]" /> : null}
          </p>
          <p className="truncate text-[10px] font-normal opacity-95">{job.client_name ?? "—"}</p>
          <p className="truncate text-[10px] font-normal opacity-95">{employeeName !== "—" ? employeeName : ""}</p>
        </button>
        {isHovered ? (
          <div
            className="pointer-events-none absolute bottom-full left-0 z-50 mb-1.5 w-56 rounded-lg border border-white/10 bg-[#1e2433] p-2.5 shadow-xl text-xs text-[var(--text-primary)]"
            style={{ minWidth: "200px" }}
          >
            <p className="font-semibold leading-snug">{job.title ?? "Untitled job"}</p>
            {job.client_name ? <p className="mt-1 text-slate-600 dark:text-slate-400">Client: {job.client_name}</p> : null}
            {job.suburb ? <p className="text-slate-600 dark:text-slate-400">Location: {job.suburb}</p> : null}
            {employeeName !== "—" ? <p className="text-slate-600 dark:text-slate-400">Assigned: {employeeName}</p> : null}
            {tooltipNotes ? <p className="mt-1 border-t border-slate-100 pt-1 text-slate-500 dark:border-slate-700 dark:text-slate-400">{tooltipNotes}</p> : null}
          </div>
        ) : null}
      </div>
    );
  }

  const currentCalendarLabel =
    calendarView === "month"
      ? monthLabel
      : calendarView === "week"
        ? `${weekDays[0].toLocaleDateString("en-AU")} - ${weekDays[6].toLocaleDateString("en-AU")}`
        : focusDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  async function handleDeleteJobConfirm() {
    if (!deleteJobTarget) return;
    setDeletingJob(true);
    const fd = new FormData();
    fd.set("id", deleteJobTarget.id);
    const result = await deleteJobAction(fd);
    setDeletingJob(false);
    if (!result.ok) { setDeleteJobTarget(null); return; }
    const deletedId = deleteJobTarget.id;
    const deletedTitle = deleteJobTarget.title ?? "Job";
    setRemovedJobIds((prev) => new Set([...prev, deletedId]));
    setDeleteJobTarget(null);
    showJobUndo({
      message: `"${deletedTitle}" deleted.`,
      onUndo: async () => {
        const rfd = new FormData(); rfd.set("id", deletedId);
        await restoreJobAction(rfd);
        setRemovedJobIds((prev) => { const n = new Set(prev); n.delete(deletedId); return n; });
      },
    });
  }

  return (
    <div className="space-y-4">
      <DeleteConfirmModal
        isOpen={!!deleteJobTarget}
        onClose={() => setDeleteJobTarget(null)}
        onConfirm={handleDeleteJobConfirm}
        entityName={deleteJobTarget?.title ?? "this job"}
        entityType="job"
        loading={deletingJob}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-md border border-[var(--border)] bg-[var(--bg-card)] p-1 text-sm">
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
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => navigateCalendar(-1)} className="rounded border border-[var(--border)] px-3 py-1 text-sm text-[var(--text-primary)]">
                ←
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setFocusDate(now);
                  setMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
                }}
                className="rounded border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
              >
                Today
              </button>
              <button type="button" onClick={() => navigateCalendar(1)} className="rounded border border-[var(--border)] px-3 py-1 text-sm text-[var(--text-primary)]">
                →
              </button>
            </div>
            <p className="text-center text-sm font-semibold text-[var(--text-primary)]">{currentCalendarLabel}</p>
            <div className="w-[5.5rem]" aria-hidden />
          </div>
          {calendarView === "today" ? (
            <div
              className={`relative cursor-pointer rounded-lg border bg-[var(--bg-secondary)] transition-colors ${dragOverDateKey === todayKey ? "border-[var(--accent-color)] bg-[color-mix(in_srgb,var(--accent-color)_8%,var(--bg-secondary))]" : "border-[var(--border)]"}`}
              role="presentation"
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("[data-job-block]")) return;
                startAddWithDate(todayKey);
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOverDateKey(todayKey); }}
              onDragEnter={() => setDragOverDateKey(todayKey)}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverDateKey(null); }}
              onDrop={(e) => {
                setDragOverDateKey(null);
                const jobId = e.dataTransfer.getData("text/job-id");
                if (jobId) quickUpdateSchedule(jobId, todayKey);
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
                  const isDragTarget = dragOverDateKey === key;

                  // Separate timed vs all-day jobs
                  const timedJobs = jobsOnDay.filter((j) => j.scheduled_start && j.scheduled_end);
                  const allDayJobs = jobsOnDay.filter((j) => !j.scheduled_start || !j.scheduled_end);

                  const DAY_START_MIN = 7 * 60; // 7:00 AM
                  const DAY_END_MIN = 19 * 60; // 7:00 PM
                  const TOTAL_MINS = DAY_END_MIN - DAY_START_MIN;
                  const GRID_HEIGHT = 480; // px for time grid

                  return (
                    <div
                      key={key}
                      role="presentation"
                      onClick={(event) => {
                        if ((event.target as HTMLElement).closest("[data-job-block]")) return;
                        startAddWithDate(key);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragOverDateKey(key);
                      }}
                      onDragEnter={() => setDragOverDateKey(key)}
                      onDragLeave={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                          setDragOverDateKey(null);
                        }
                      }}
                      onDrop={(event) => {
                        setDragOverDateKey(null);
                        const jobId = event.dataTransfer.getData("text/job-id");
                        if (jobId) quickUpdateSchedule(jobId, key);
                      }}
                      className={`flex min-h-[520px] flex-col rounded-lg border bg-[var(--bg-secondary)] transition-colors ${
                        isDragTarget
                          ? "border-[var(--accent-color)] bg-[color-mix(in_srgb,var(--accent-color)_8%,var(--bg-secondary))]"
                          : "border-[var(--border)]"
                      } ${today ? "ring-2 ring-[var(--accent-color)] ring-offset-2 ring-offset-[var(--bg-card)]" : ""}`}
                    >
                      <div
                        className={`border-b border-[var(--border)] px-2 py-2 text-center text-[11px] font-semibold leading-tight ${
                          today ? "rounded-t-[calc(0.5rem-2px)] bg-[var(--accent-color)]/15 text-[var(--accent-color)]" : "text-[var(--text-primary)]"
                        }`}
                      >
                        <div>{day.toLocaleDateString("en-AU", { weekday: "short" })}</div>
                        <div className="text-xs">{day.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</div>
                      </div>
                      {/* All-day jobs strip at top */}
                      {allDayJobs.length > 0 ? (
                        <div className="flex flex-col gap-1 border-b border-[var(--border)] p-1.5">
                          {allDayJobs.map((job) => calendarJobBlock(job, { draggable: true }))}
                        </div>
                      ) : null}
                      {/* Timed jobs as positioned blocks */}
                      {timedJobs.length > 0 ? (
                        <div className="relative flex-1 overflow-hidden" style={{ height: GRID_HEIGHT }}>
                          {/* Hour grid lines */}
                          {Array.from({ length: 13 }, (_, i) => 7 + i).map((hour) => (
                            <div
                              key={hour}
                              className="absolute left-0 right-0 border-t border-[var(--border)]"
                              style={{ top: `${((hour * 60 - DAY_START_MIN) / TOTAL_MINS) * 100}%` }}
                            >
                              <span className="text-[9px] text-[var(--text-muted)] pl-0.5">{`${String(hour).padStart(2, "0")}:00`}</span>
                            </div>
                          ))}
                          {timedJobs.map((job) => {
                            const startMin = parseTimeToMinutes(job.scheduled_start) ?? DAY_START_MIN;
                            const endMin = parseTimeToMinutes(job.scheduled_end) ?? startMin + 60;
                            const clampedStart = Math.max(DAY_START_MIN, startMin);
                            const clampedEnd = Math.min(DAY_END_MIN, endMin);
                            const topPct = ((clampedStart - DAY_START_MIN) / TOTAL_MINS) * 100;
                            const heightPct = Math.max(4, ((clampedEnd - clampedStart) / TOTAL_MINS) * 100);
                            return calendarJobBlock(job, {
                              draggable: true,
                              style: { position: "absolute", top: `${topPct}%`, height: `${heightPct}%`, left: "4px", right: "4px" }
                            });
                          })}
                        </div>
                      ) : null}
                      {/* If no timed jobs, show empty flex space with hint */}
                      {timedJobs.length === 0 ? (
                        <div className="flex flex-1 flex-col p-1">
                          <p className="mt-auto pt-2 text-center text-[10px] text-[var(--text-muted)]">Click to add</p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          {calendarView === "month" ? (
            <>
              <div className="overflow-x-auto pb-1">
              <div className="min-w-[560px] grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase text-[var(--text-muted)]">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="mt-2 min-w-[560px] grid grid-cols-7 gap-2">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="min-h-[140px] rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]" />;
                  }

                  const dateKey = toDateKey(date);
                  const jobsOnDate = sortJobsByStartTime(jobsByDate.get(dateKey) ?? []);
                  const today = isDayToday(date);
                  const isDragTarget = dragOverDateKey === dateKey;
                  const MAX_VISIBLE = 3;
                  const visibleJobs = jobsOnDate.slice(0, MAX_VISIBLE);
                  const extraCount = jobsOnDate.length - MAX_VISIBLE;

                  return (
                    <div
                      key={dateKey}
                      role="presentation"
                      onClick={(event) => {
                        if ((event.target as HTMLElement).closest("[data-job-block]")) return;
                        // If there are jobs, switch to week view for that date; otherwise open new job
                        if (jobsOnDate.length > 0) {
                          setFocusDate(date);
                          setCalendarView("week");
                        } else {
                          startAddWithDate(dateKey);
                        }
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragOverDateKey(dateKey);
                      }}
                      onDragEnter={() => setDragOverDateKey(dateKey)}
                      onDragLeave={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                          setDragOverDateKey(null);
                        }
                      }}
                      onDrop={(event) => {
                        setDragOverDateKey(null);
                        const jobId = event.dataTransfer.getData("text/job-id");
                        if (jobId) quickUpdateSchedule(jobId, dateKey);
                      }}
                      className={`flex min-h-[140px] cursor-pointer flex-col rounded-lg border bg-[var(--bg-secondary)] p-2 transition-colors ${
                        isDragTarget
                          ? "border-[var(--accent-color)] bg-[color-mix(in_srgb,var(--accent-color)_8%,var(--bg-secondary))]"
                          : "border-[var(--border)]"
                      } ${today ? "ring-2 ring-[var(--accent-color)] ring-offset-1 ring-offset-[var(--bg-card)]" : ""}`}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-1">
                        <p
                          className={`inline-flex min-h-[1.25rem] min-w-[1.5rem] items-center justify-center rounded px-1 text-xs font-bold ${
                            today ? "bg-[var(--accent-color)] text-white" : "text-[var(--text-primary)]"
                          }`}
                        >
                          {date.getDate()}
                        </p>
                        {jobsOnDate.length > 0 ? (
                          <span className="rounded-full bg-[var(--accent-color)] px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                            {jobsOnDate.length}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                        {visibleJobs.map((job) => calendarJobBlock(job, { draggable: true }))}
                        {extraCount > 0 ? (
                          <p className="text-center text-[10px] font-semibold text-[var(--accent-color)]">
                            +{extraCount} more
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
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
          <>
          {selectedJobIds.size > 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">{selectedJobIds.size} selected</span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="h-9 rounded border border-[var(--border)] bg-[var(--bg-card)] px-2 text-sm text-[var(--text-primary)]"
              >
                <option value="">— Bulk action —</option>
                <option value="update_status">Update status</option>
                <option value="delete">Delete (soft)</option>
              </select>
              <button
                type="button"
                disabled={!bulkAction || bulkProcessing}
                onClick={runBulkAction}
                className="rounded bg-[var(--accent-color)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {bulkProcessing ? "Working…" : "Apply"}
              </button>
              <button type="button" onClick={clearSelection} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">Clear</button>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
            <table className="w-full min-w-[840px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                  <th className="px-2 py-2">
                    <input type="checkbox" onChange={(e) => { if (e.target.checked) selectAll(); else clearSelection(); }} checked={selectedJobIds.size > 0 && selectedJobIds.size === filteredJobs.filter((j) => !j.is_demo).length} className="rounded" />
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Job #</th>
                  <th className="px-2 py-2 font-medium">Title</th>
                  <th className="px-2 py-2 font-medium">Client</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Date</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Priority</th>
                  <th className="px-2 py-2 font-medium">Employee</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">Actions</th>
                  <th className="px-2 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-8 text-center text-sm text-[var(--text-muted)]">
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
                        <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                          {!job.is_demo && (
                            <input
                              type="checkbox"
                              checked={selectedJobIds.has(job.id)}
                              onChange={() => toggleSelectJob(job.id)}
                              className="rounded"
                            />
                          )}
                        </td>
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
                        <td className="px-2 py-2 w-8" onClick={(e) => e.stopPropagation()}>
                          <JobRowMenu
                            onEdit={() => startEdit(job)}
                            onDelete={() => setDeleteJobTarget(job)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          </>
          )}
        </>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="flex h-full w-full flex-col md:flex-row md:justify-end md:overflow-hidden">
            {quickAdd === "client" ? (
              <aside className="flex max-h-[45vh] w-full shrink-0 flex-col gap-3 overflow-y-auto border-b border-[var(--border)] bg-[#1e2433] p-5 shadow-xl md:h-full md:max-h-none md:max-w-sm md:border-b-0 md:border-r">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">New client</h3>
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
              <aside className="flex max-h-[45vh] w-full shrink-0 flex-col gap-3 overflow-y-auto border-b border-[var(--border)] bg-[#1e2433] p-5 shadow-xl md:h-full md:max-h-none md:max-w-sm md:border-b-0 md:border-r">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">New employee</h3>
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
            <div className="flex h-full min-h-0 w-full max-w-2xl flex-col overflow-y-auto bg-[#1e2433] p-5 shadow-xl md:shrink-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{editing ? "Edit Job" : "Add Job"}</h2>
              <button type="button" onClick={() => closeJobOverlay()} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] p-1 text-sm w-fit">
              <button type="button" onClick={() => setActiveTab("details")} className={`rounded px-3 py-1 ${activeTab === "details" ? "bg-[var(--accent-color)] text-white" : "text-[var(--text-primary)]"}`}>Details</button>
              <button type="button" onClick={() => setActiveTab("costing")} className={`rounded px-3 py-1 ${activeTab === "costing" ? "bg-[var(--accent-color)] text-white" : "text-[var(--text-primary)]"}`}>Costing</button>
              <button type="button" onClick={() => setActiveTab("checklist")} className={`rounded px-3 py-1 ${activeTab === "checklist" ? "bg-[var(--accent-color)] text-white" : "text-[var(--text-primary)]"}`}>
                Checklist{checklistItems.length > 0 ? ` (${checklistItems.filter(i => i.done).length}/${checklistItems.length})` : ""}
              </button>
              <button type="button" onClick={() => setActiveTab("recurring")} className={`rounded px-3 py-1 ${activeTab === "recurring" ? "bg-[var(--accent-color)] text-white" : "text-[var(--text-primary)]"}`}>Recurring</button>
              <button type="button" onClick={() => setActiveTab("signoff")} className={`rounded px-3 py-1 ${activeTab === "signoff" ? "bg-[var(--accent-color)] text-white" : "text-[var(--text-primary)]"}`}>Sign-off</button>
              <button type="button" onClick={() => setActiveTab("photos")} className={`rounded px-3 py-1 ${activeTab === "photos" ? "bg-[var(--accent-color)] text-white" : "text-[var(--text-primary)]"}`}>Photos</button>
            </div>
            <form action={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={values.id} />
              <input type="hidden" name="recurrence_rule" value={isRecurring ? recurrenceFreq : ""} />
              <input type="hidden" name="create_recurring_instances" value={String(createRecurringInstances)} />
              {/* Always carry costing values so they survive tab switches */}
              {activeTab !== "costing" ? (
                <>
                  <input type="hidden" name="materials_cost" value={values.materials_cost} />
                  <input type="hidden" name="labour_hours" value={values.labour_hours} />
                  <input type="hidden" name="hourly_rate" value={values.hourly_rate} />
                  <input type="hidden" name="revenue_amount" value={values.revenue_amount} />
                </>
              ) : null}
              {/* Always carry checklist JSON */}
              <input type="hidden" name="checklist" value={JSON.stringify(checklistItems)} />
              {/* Always carry core fields so they survive costing-only saves */}
              {activeTab !== "details" ? (
                <>
                  <input type="hidden" name="title" value={values.title} />
                  <input type="hidden" name="job_type" value={values.job_type} />
                  <input type="hidden" name="client_id" value={values.client_id} />
                  <input type="hidden" name="employee_id" value={values.employee_id} />
                  <input type="hidden" name="scheduled_date" value={values.scheduled_date} />
                  <input type="hidden" name="scheduled_start" value={values.scheduled_start} />
                  <input type="hidden" name="scheduled_end" value={values.scheduled_end} />
                  <input type="hidden" name="priority" value={values.priority} />
                  <input type="hidden" name="address" value={values.address} />
                  <input type="hidden" name="suburb" value={values.suburb} />
                  <input type="hidden" name="state" value={values.state} />
                  <input type="hidden" name="description" value={values.description} />
                  <input type="hidden" name="notes" value={values.notes} />
                </>
              ) : null}
              {activeTab === "details" ? (
                <>
              <div className="relative sm:col-span-2 flex gap-2">
                <input
                  name="title"
                  value={values.title}
                  onChange={(e) => setValues((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Job title"
                  className="h-10 flex-1 rounded border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                />
                <button
                  type="button"
                  disabled={suggestingTitle}
                  onClick={async () => {
                    if (!values.description && !values.job_type) return;
                    setSuggestingTitle(true);
                    try {
                      const res = await fetch("/api/ai/suggest-job-title", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ description: values.description, job_type: values.job_type }),
                      });
                      const json = await res.json() as { title?: string };
                      if (json.title) setValues((p) => ({ ...p, title: json.title! }));
                    } finally {
                      setSuggestingTitle(false);
                    }
                  }}
                  title="AI suggest title from description"
                  className="shrink-0 flex items-center gap-1 rounded border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors"
                  style={{ background: "var(--bg-secondary)" }}
                >
                  {suggestingTitle ? "…" : "✨ AI"}
                </button>
              </div>
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
              {/* Date / time row with smart scheduling */}
              <div className="sm:col-span-2 space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <input type="date" name="scheduled_date" value={values.scheduled_date} onChange={(e) => setValues((p) => ({ ...p, scheduled_date: e.target.value }))} className="h-10 rounded border px-3" />
                  <input type="time" name="scheduled_start" value={values.scheduled_start} onChange={(e) => setValues((p) => ({ ...p, scheduled_start: e.target.value }))} className="h-10 rounded border px-3" />
                  <input type="time" name="scheduled_end" value={values.scheduled_end} onChange={(e) => setValues((p) => ({ ...p, scheduled_end: e.target.value }))} className="h-10 rounded border px-3" />
                  <select name="priority" value={values.priority} onChange={(e) => setValues((p) => ({ ...p, priority: e.target.value }))} className="h-10 rounded border px-3"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select>
                  <button
                    type="button"
                    onClick={handleFindSlots}
                    disabled={loadingSlots}
                    className="flex items-center gap-1.5 h-10 rounded border border-sky-500/50 bg-sky-500/10 px-3 text-sm font-medium text-sky-400 hover:bg-sky-500/20 disabled:opacity-50 transition-colors"
                    title="AI suggests the best available time slots"
                  >
                    {loadingSlots ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/></svg>
                    ) : (
                      <span aria-hidden>⚡</span>
                    )}
                    Find best slot
                  </button>
                </div>
                {showSlots && smartSlots.length > 0 && (
                  <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-sky-400 uppercase tracking-wide">Suggested slots</p>
                      <button type="button" onClick={() => setShowSlots(false)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕ Close</button>
                    </div>
                    <div className="grid gap-1.5">
                      {smartSlots.map((slot, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => applySmartSlot(slot)}
                          className="flex items-center justify-between rounded-lg border border-sky-500/20 bg-[var(--bg-card)] px-3 py-2 text-left hover:border-sky-500/50 hover:bg-sky-500/10 transition-colors group"
                        >
                          <div>
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {new Date(slot.date + "T12:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}
                              {" · "}
                              {slot.start.slice(0, 5)}–{slot.end.slice(0, 5)}
                            </span>
                            <span className="ml-2 text-xs text-[var(--text-muted)]">{slot.reason}</span>
                          </div>
                          <span className="text-xs font-semibold text-sky-400 group-hover:text-sky-300">Pick →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <input name="address" value={values.address} onChange={(e) => setValues((p) => ({ ...p, address: e.target.value }))} placeholder="Address" className="h-10 rounded border px-3" />
              <input name="suburb" value={values.suburb} onChange={(e) => setValues((p) => ({ ...p, suburb: e.target.value }))} placeholder="Suburb" className="h-10 rounded border px-3" />
              <input name="state" value={values.state} onChange={(e) => setValues((p) => ({ ...p, state: e.target.value }))} placeholder="State" className="h-10 rounded border px-3" />
              <textarea name="description" value={values.description} onChange={(e) => setValues((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="min-h-20 rounded border px-3 py-2 sm:col-span-2" />
              <textarea name="notes" value={values.notes} onChange={(e) => setValues((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="min-h-20 rounded border px-3 py-2 sm:col-span-2" />
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => closeJobOverlay()} className="rounded border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)]">Cancel</button>
                <button type="submit" className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)]">{editing ? "Save Changes" : "Create Job"}</button>
              </div>
                </>
              ) : null}
              {activeTab === "costing" ? (
                <div className="sm:col-span-2 space-y-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Job Costing</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-[var(--text-muted)]">Materials Cost ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="materials_cost"
                        value={values.materials_cost}
                        onChange={(e) => setValues((p) => ({ ...p, materials_cost: e.target.value }))}
                        placeholder="0.00"
                        className="h-10 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-[var(--text-muted)]">Labour Hours</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        name="labour_hours"
                        value={values.labour_hours}
                        onChange={(e) => setValues((p) => ({ ...p, labour_hours: e.target.value }))}
                        placeholder="0.0"
                        className="h-10 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-[var(--text-muted)]">Hourly Rate ($/hr)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="hourly_rate"
                        value={values.hourly_rate}
                        onChange={(e) => setValues((p) => ({ ...p, hourly_rate: e.target.value }))}
                        placeholder="0.00"
                        className="h-10 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--text-muted)]">Revenue (from invoice, $)</label>
                    <input
                      type="number"
                      name="revenue_amount"
                      step="0.01"
                      min="0"
                      value={values.revenue_amount}
                      onChange={(e) => setValues((p) => ({ ...p, revenue_amount: e.target.value }))}
                      placeholder="0.00"
                      className="h-10 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                    />
                  </div>
                  {(() => {
                    const materials = Number(values.materials_cost || 0);
                    const hours = Number(values.labour_hours || 0);
                    const rate = Number(values.hourly_rate || 0);
                    const labourCost = hours * rate;
                    const totalCost = materials + labourCost;
                    const revenue = Number(values.revenue_amount || 0);
                    const profit = revenue - totalCost;
                    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
                    const marginColor = margin >= 40 ? "#10B981" : margin >= 20 ? "#F59E0B" : margin >= 0 ? "#EF4444" : "#EF4444";
                    const marginLabel = margin >= 40 ? "Healthy ✓" : margin >= 20 ? "Acceptable" : margin >= 0 ? "Low — review pricing" : "Loss-making ⚠";
                    const barWidth = Math.max(0, Math.min(100, margin));
                    return (
                      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4 space-y-3 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Profitability</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-[var(--bg-primary)] p-2">
                            <p className="text-[10px] text-[var(--text-muted)]">Cost</p>
                            <p className="font-bold text-[var(--text-primary)]">${totalCost.toFixed(0)}</p>
                          </div>
                          <div className="rounded-lg bg-[var(--bg-primary)] p-2">
                            <p className="text-[10px] text-[var(--text-muted)]">Revenue</p>
                            <p className="font-bold text-[var(--text-primary)]">${revenue.toFixed(0)}</p>
                          </div>
                          <div className="rounded-lg p-2" style={{ background: `${marginColor}18` }}>
                            <p className="text-[10px] text-[var(--text-muted)]">Profit</p>
                            <p className="font-bold" style={{ color: marginColor }}>${profit.toFixed(0)}</p>
                          </div>
                        </div>
                        {revenue > 0 && (
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span style={{ color: marginColor }}>{marginLabel}</span>
                              <span style={{ color: marginColor }} className="font-bold">{margin.toFixed(1)}% margin</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[var(--bg-primary)] overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, background: marginColor }} />
                            </div>
                          </div>
                        )}
                        {totalCost > 0 && (
                          <div className="flex justify-between text-xs text-[var(--text-muted)]">
                            <span>Labour: ${labourCost.toFixed(0)}</span>
                            <span>Materials: ${materials.toFixed(0)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => closeJobOverlay()} className="rounded border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)]">Cancel</button>
                    <button type="submit" className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)]">{editing ? "Save Changes" : "Create Job"}</button>
                  </div>
                </div>
              ) : null}

              {activeTab === "checklist" ? (
                <div className="sm:col-span-2 space-y-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Job Checklist</p>
                  <p className="text-xs text-[var(--text-muted)]">Add tasks that need to be completed for this job. Check them off as you go.</p>
                  {/* Add new item */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCheckItem}
                      onChange={(e) => setNewCheckItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const text = newCheckItem.trim();
                          if (!text) return;
                          setChecklistItems((prev) => [...prev, { id: crypto.randomUUID(), text, done: false }]);
                          setNewCheckItem("");
                        }
                      }}
                      placeholder="Add checklist item… (press Enter)"
                      className="h-9 flex-1 rounded border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const text = newCheckItem.trim();
                        if (!text) return;
                        setChecklistItems((prev) => [...prev, { id: crypto.randomUUID(), text, done: false }]);
                        setNewCheckItem("");
                      }}
                      className="shrink-0 rounded border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition"
                    >
                      + Add
                    </button>
                  </div>
                  {/* Checklist items */}
                  {checklistItems.length === 0 ? (
                    <p className="py-4 text-center text-sm text-[var(--text-muted)]">No checklist items yet — add one above.</p>
                  ) : (
                    <ul className="space-y-2">
                      {checklistItems.map((item) => (
                        <li key={item.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2">
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => setChecklistItems((prev) => prev.map((i) => i.id === item.id ? { ...i, done: !i.done } : i))}
                            className="h-4 w-4 shrink-0 rounded accent-[var(--accent-color)]"
                          />
                          <span className={`flex-1 text-sm ${item.done ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>
                            {item.text}
                          </span>
                          <button
                            type="button"
                            onClick={() => setChecklistItems((prev) => prev.filter((i) => i.id !== item.id))}
                            className="text-xs text-[var(--text-muted)] hover:text-red-400 transition"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {checklistItems.length > 0 && (
                    <p className="text-xs text-[var(--text-muted)]">
                      {checklistItems.filter((i) => i.done).length} of {checklistItems.length} tasks complete
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => closeJobOverlay()} className="rounded border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)]">Cancel</button>
                    <button type="submit" className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)]">{editing ? "Save Changes" : "Create Job"}</button>
                  </div>
                </div>
              ) : null}

              {activeTab === "recurring" ? (
                <div className="sm:col-span-2 space-y-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Recurring Job Setup</p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      role="switch"
                      aria-checked={isRecurring}
                      tabIndex={0}
                      onClick={() => setIsRecurring((v) => !v)}
                      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setIsRecurring((v) => !v); } }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] ${isRecurring ? "bg-[var(--accent-color)]" : "bg-slate-300 dark:bg-slate-600"}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${isRecurring ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </div>
                    <span className="text-sm text-[var(--text-primary)]">Make this recurring</span>
                  </label>
                  {isRecurring ? (
                    <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
                      <div>
                        <label className="mb-1 block text-xs text-[var(--text-muted)]">Frequency</label>
                        <select
                          value={recurrenceFreq}
                          onChange={(e) => setRecurrenceFreq(e.target.value)}
                          className="h-10 w-full rounded border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                        >
                          <option value="weekly">Weekly</option>
                          <option value="fortnightly">Fortnightly</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="annually">Annually</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-primary)]">
                        <input
                          type="checkbox"
                          checked={createRecurringInstances}
                          onChange={(e) => setCreateRecurringInstances(e.target.checked)}
                          className="rounded border border-[var(--border)]"
                        />
                        Create the next 3 job instances automatically when saving
                      </label>
                      <p className="text-xs text-[var(--text-muted)]">
                        Future job instances will be created automatically when you save.
                      </p>
                    </div>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => closeJobOverlay()} className="rounded border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)]">Cancel</button>
                    <button type="submit" className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)]">{editing ? "Save Changes" : "Create Job"}</button>
                  </div>
                </div>
              ) : null}

              {activeTab === "signoff" ? (
                <div className="sm:col-span-2 space-y-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Client Sign-off</p>
                  {editing && !editingDemo && (values.address || values.suburb) ? (
                    <GeofenceClock
                      jobId={values.id}
                      jobAddress={[values.address, values.suburb].filter(Boolean).join(", ")}
                    />
                  ) : null}
                  {!editing ? (
                    <p className="text-sm text-[var(--text-muted)]">Save the job first, then collect a signature.</p>
                  ) : editingDemo ? (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100">
                      This is a demo job — sign-off is disabled.
                    </p>
                  ) : values.digital_signoff_image ? (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-green-300 bg-green-50 p-3 dark:border-green-700 dark:bg-green-950/40">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-800 dark:text-green-300">Signed</p>
                        <p className="text-sm text-[var(--text-primary)]">
                          {values.signoff_name ? <>Signed by <strong>{values.signoff_name}</strong></> : "Signature collected"}
                          {values.signoff_at ? <> on {new Date(values.signoff_at).toLocaleString("en-AU")}</> : null}
                        </p>
                      </div>
                      <img
                        src={values.digital_signoff_image}
                        alt="Client signature"
                        className="max-w-xs rounded border border-[var(--border)]"
                      />
                      <button
                        type="button"
                        disabled={clearingSignoff}
                        onClick={async () => {
                          setClearingSignoff(true);
                          try {
                            const fd = new FormData();
                            fd.set("job_id", values.id);
                            const result = await clearJobSignoffAction(fd);
                            if (result.ok) {
                              setValues((p) => ({ ...p, digital_signoff_image: "", signoff_name: "", signoff_at: "" }));
                              setToast({ type: "success", message: "Signature cleared" });
                              router.refresh();
                            } else {
                              setToast({ type: "error", message: result.message ?? "Could not clear signature" });
                            }
                          } finally {
                            setClearingSignoff(false);
                          }
                        }}
                        className="rounded border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30 disabled:opacity-50"
                      >
                        {clearingSignoff ? "Clearing…" : "Clear signature"}
                      </button>
                    </div>
                  ) : (
                    <SignaturePad
                      saving={signoffSaving}
                      onSave={async (base64, signerName) => {
                        setSignoffSaving(true);
                        try {
                          const fd = new FormData();
                          fd.set("job_id", values.id);
                          fd.set("signoff_image", base64);
                          fd.set("signoff_name", signerName);
                          const result = await saveJobSignoffAction(fd);
                          if (result.ok) {
                            setValues((p) => ({
                              ...p,
                              digital_signoff_image: base64,
                              signoff_name: signerName,
                              signoff_at: new Date().toISOString()
                            }));
                            setToast({ type: "success", message: "Signature saved" });
                            router.refresh();
                          } else {
                            setToast({ type: "error", message: result.message ?? "Could not save signature" });
                          }
                        } finally {
                          setSignoffSaving(false);
                        }
                      }}
                    />
                  )}
                </div>
              ) : null}

              {activeTab === "photos" ? (
                <div className="sm:col-span-2 space-y-3">
                  {!editing ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-[var(--border)] p-8 text-center">
                      <span className="text-3xl" aria-hidden>📸</span>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Job Photos</p>
                      <p className="text-xs text-[var(--text-muted)]">Save the job first, then upload before/after photos.</p>
                    </div>
                  ) : null}
                  {editing && editingDemo ? (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100">
                      This is a demo job — uploads are disabled. Create a real job to store photos.
                    </p>
                  ) : null}
                  {editing && !editingDemo ? (
                    <div className="space-y-2">
                      <label className="text-xs text-[var(--text-muted)]">Photo label</label>
                      <select
                        value={photoLabel}
                        onChange={(e) => setPhotoLabel(e.target.value === "after" ? "after" : "before")}
                        className="h-10 rounded border border-[var(--border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)]"
                      >
                        <option value="before">Before</option>
                        <option value="after">After</option>
                      </select>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="block w-full text-sm text-[var(--text-primary)]"
                        onChange={(e) => setSelectedPhotos(Array.from(e.target.files ?? []))}
                      />
                      <button type="button" onClick={uploadPhotos} className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)]">Upload Photos</button>
                    </div>
                  ) : null}
                  {editing ? (
                    <PhotoGallery
                      jobId={values.id}
                      photos={(jobPhotosByJob[values.id] ?? []).map<GalleryPhoto>((p) => ({
                        url: p.url,
                        label: p.label,
                      }))}
                      onAnnotationSave={async (_jobId, dataUrl, label) => {
                        const fd = new FormData();
                        fd.set("job_id", _jobId);
                        fd.set("photo_label", label);
                        const blob = await (await fetch(dataUrl)).blob();
                        fd.append("photos", blob, "annotation.png");
                        await uploadJobPhotoAction(fd);
                        setToast({ type: "success", message: "Annotation saved" });
                      }}
                    />
                  ) : null}
                </div>
              ) : null}
            </form>
            {editing && !editingDemo && normalizeStatus(jobs.find((j) => j.id === values.id)?.status ?? null) === "completed" ? (
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  disabled={sendingToClient}
                  onClick={async () => {
                    setSendingToClient(true);
                    try {
                      const fd = new FormData();
                      fd.set("job_id", values.id);
                      const result = await sendJobToClientAction(fd);
                      if (result.ok) {
                        setToast({ type: "success", message: "Job summary sent to client" });
                      } else {
                        setToast({ type: "error", message: result.message ?? "Could not send email" });
                      }
                    } finally {
                      setSendingToClient(false);
                    }
                  }}
                  className="rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  {sendingToClient ? "Sending…" : "Send to Client"}
                </button>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Sends a job summary email to the linked client.</p>
              </div>
            ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


