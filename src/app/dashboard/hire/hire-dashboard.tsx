"use client";

import { useState, useRef, useCallback } from "react";
import {
  Briefcase,
  Users,
  TrendingUp,
  CheckCircle,
  MapPin,
  Star,
  Plus,
  X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface JobPosting {
  id: string;
  title: string;
  employment_type: string;
  status: string;
  location: string | null;
  published_at: string | null;
  closes_at: string | null;
  created_at: string;
  [key: string]: unknown;
}

interface JobApplication {
  id: string;
  posting_id: string | null;
  applicant_name: string;
  stage: string;
  applied_at: string | null;
  rating: number | null;
  [key: string]: unknown;
}

interface OnboardingTask {
  id: string;
  employee_id: string | null;
  task: string;
  category: string;
  completed: boolean;
  due_date: string | null;
  [key: string]: unknown;
}

interface Stats {
  activePostings: number;
  totalApplicants: number;
  newApplicants: number;
  offersMade: number;
}

interface Props {
  postings: Record<string, unknown>[];
  applications: Record<string, unknown>[];
  onboardingTasks: Record<string, unknown>[];
  stats: Stats;
}

// ─── Toast ───────────────────────────────────────────────────────────────────

interface ToastMsg {
  id: number;
  message: string;
  type: "success" | "error";
}

let toastCounter = 0;

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const show = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  return { toasts, show };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMPLOYMENT_TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  full_time: { bg: "#1e3a5f", color: "#60a5fa", label: "Full-time" },
  part_time: { bg: "#2d1b69", color: "#a78bfa", label: "Part-time" },
  casual: { bg: "#374151", color: "#9ca3af", label: "Casual" },
  subcontractor: { bg: "#431407", color: "#fb923c", label: "Subcontractor" },
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  published: { bg: "#052e16", color: "#4ade80", label: "Published" },
  draft: { bg: "#1f2937", color: "#6b7280", label: "Draft" },
  closed: { bg: "#450a0a", color: "#f87171", label: "Closed" },
};

const ATS_STAGES = ["applied", "screening", "interview", "offer", "hired"] as const;
type ATSStage = (typeof ATS_STAGES)[number];

const STAGE_LABELS: Record<ATSStage, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
};

const CATEGORY_STYLES: Record<string, { bg: string; color: string }> = {
  admin: { bg: "#1e3a5f", color: "#60a5fa" },
  safety: { bg: "#431407", color: "#fb923c" },
  training: { bg: "#2d1b69", color: "#a78bfa" },
  access: { bg: "#052e16", color: "#4ade80" },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function StarRating({ rating }: { rating: number | null }) {
  return (
    <div className="flex gap-0.5" aria-label={`Rating: ${rating ?? 0} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={11}
          fill={rating && n <= rating ? "#fbbf24" : "none"}
          stroke={rating && n <= rating ? "#fbbf24" : "#4b5563"}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HireDashboard({ postings: initialPostings, applications: initialApplications, onboardingTasks: initialTasks, stats }: Props) {
  const [tab, setTab] = useState<"board" | "ats" | "onboarding" | "post">("board");
  const [postings, setPostings] = useState<JobPosting[]>(initialPostings as JobPosting[]);
  const [applications, setApplications] = useState<JobApplication[]>(initialApplications as JobApplication[]);
  const [tasks, setTasks] = useState<OnboardingTask[]>(initialTasks as OnboardingTask[]);
  const { toasts, show: toast } = useToast();

  // local stats (may change after posting new jobs)
  const liveStats = {
    activePostings: postings.filter((p) => p.status === "published").length || stats.activePostings,
    totalApplicants: applications.length || stats.totalApplicants,
    newApplicants: stats.newApplicants,
    offersMade: applications.filter((a) => a.stage === "offer").length || stats.offersMade,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            SERVLO HIRE
          </h1>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: "#1e1b4b", color: "#6366F1", border: "1px solid #6366F133" }}
          >
            Q3 2026
          </span>
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Recruitment &amp; HR — post jobs, track applicants, onboard staff
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Postings", value: liveStats.activePostings, Icon: Briefcase },
          { label: "Total Applicants", value: liveStats.totalApplicants, Icon: Users },
          { label: "New This Week", value: liveStats.newApplicants, Icon: TrendingUp },
          { label: "Offers Made", value: liveStats.offersMade, Icon: CheckCircle },
        ].map(({ label, value, Icon }) => (
          <div
            key={label}
            className="flex flex-col gap-2 rounded-xl p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                {label}
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#6366F115" }}>
                <Icon size={15} style={{ color: "#6366F1" }} />
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <nav className="flex flex-wrap gap-1" role="tablist" aria-label="Hire sections">
          {(["board", "ats", "onboarding", "post"] as const).map((t) => {
            const labels = { board: "Job Board", ats: "ATS Pipeline", onboarding: "Onboarding", post: "Post a Job" };
            const active = tab === t;
            return (
              <button
                key={t}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  color: active ? "#6366F1" : "var(--text-muted)",
                  borderBottom: active ? "2px solid #6366F1" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {labels[t]}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {tab === "board" && (
        <JobBoardTab postings={postings} applications={applications} onPostJob={() => setTab("post")} />
      )}
      {tab === "ats" && (
        <ATSPipelineTab
          applications={applications}
          postings={postings}
          onStageChange={(id, stage) => {
            setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, stage } : a)));
          }}
          toast={toast}
        />
      )}
      {tab === "onboarding" && (
        <OnboardingTab tasks={tasks} onTasksChange={setTasks} toast={toast} />
      )}
      {tab === "post" && (
        <PostJobTab
          onPosted={(posting) => {
            setPostings((prev) => [posting, ...prev]);
            setTab("board");
          }}
          onCancel={() => setTab("board")}
          toast={toast}
        />
      )}

      {/* Toast container */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-lg px-4 py-3 text-sm font-medium shadow-lg"
            style={{
              background: t.type === "success" ? "#052e16" : "#450a0a",
              color: t.type === "success" ? "#4ade80" : "#f87171",
              border: `1px solid ${t.type === "success" ? "#4ade8040" : "#f8717140"}`,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Job Board Tab ────────────────────────────────────────────────────────────

function JobBoardTab({
  postings,
  applications,
  onPostJob,
}: {
  postings: JobPosting[];
  applications: JobApplication[];
  onPostJob: () => void;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Job Postings
        </h2>
        <button
          onClick={onPostJob}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: "#6366F1", color: "#fff" }}
          aria-label="Create a new job posting"
        >
          <Plus size={13} />
          Post a Job
        </button>
      </div>

      {postings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Briefcase size={36} style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No job postings yet. Create your first posting to start hiring.
          </p>
          <button
            onClick={onPostJob}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "#6366F1", color: "#fff" }}
          >
            Post a Job
          </button>
        </div>
      ) : (
        <ul role="list" aria-label="Job postings">
          {postings.map((p) => {
            const typeStyle = EMPLOYMENT_TYPE_STYLES[p.employment_type] ?? EMPLOYMENT_TYPE_STYLES.full_time;
            const statusStyle = STATUS_STYLES[p.status] ?? STATUS_STYLES.draft;
            const appCount = applications.filter((a) => a.posting_id === p.id).length;
            return (
              <li
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>
                    {p.title}
                  </p>
                  {p.location && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={11} style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {p.location}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: typeStyle.bg, color: typeStyle.color }}
                  >
                    {typeStyle.label}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    {statusStyle.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <Users size={12} style={{ color: "var(--text-muted)" }} />
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {appCount} applicant{appCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Posted {formatDate(p.created_at)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── ATS Pipeline Tab ─────────────────────────────────────────────────────────

function ATSPipelineTab({
  applications,
  postings,
  onStageChange,
  toast,
}: {
  applications: JobApplication[];
  postings: JobPosting[];
  onStageChange: (id: string, stage: string) => void;
  toast: (msg: string, type?: "success" | "error") => void;
}) {
  const dragId = useRef<string | null>(null);

  const handleDragStart = (id: string) => {
    dragId.current = id;
  };

  const handleDrop = async (stage: ATSStage) => {
    const id = dragId.current;
    if (!id) return;
    dragId.current = null;

    const app = applications.find((a) => a.id === id);
    if (!app || app.stage === stage) return;

    onStageChange(id, stage);
    try {
      const res = await fetch(`/api/hire/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error("Failed to update stage");
      toast(`Moved to ${STAGE_LABELS[stage]}`, "success");
    } catch {
      onStageChange(id, app.stage); // revert
      toast("Failed to move applicant", "error");
    }
  };

  return (
    <div>
      <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        Drag applicant cards between columns to update their stage.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ATS_STAGES.map((stage) => {
          const stageApps = applications.filter((a) => a.stage === stage);
          return (
            <div
              key={stage}
              className="rounded-xl p-3 min-h-[200px]"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(stage)}
              role="region"
              aria-label={`${STAGE_LABELS[stage]} column, ${stageApps.length} applicant${stageApps.length !== 1 ? "s" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {STAGE_LABELS[stage]}
                </span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-xs font-bold"
                  style={{ background: "#6366F120", color: "#6366F1" }}
                >
                  {stageApps.length}
                </span>
              </div>

              {stageApps.length === 0 ? (
                <div
                  className="rounded border border-dashed p-3 text-center"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    No applicants
                  </p>
                </div>
              ) : (
                <ul className="space-y-2" role="list">
                  {stageApps.map((app) => {
                    const posting = postings.find((p) => p.id === app.posting_id);
                    return (
                      <li
                        key={app.id}
                        draggable
                        onDragStart={() => handleDragStart(app.id)}
                        className="rounded-lg p-3 cursor-grab active:cursor-grabbing"
                        style={{ background: "#ffffff08", border: "1px solid var(--border)" }}
                        aria-label={`${app.applicant_name}, drag to move stage. Use keyboard: press Enter to select then arrow keys.`}
                        tabIndex={0}
                        role="button"
                      >
                        <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {app.applicant_name}
                        </p>
                        {posting && (
                          <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {posting.title}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {formatDate(app.applied_at)}
                          </span>
                          <StarRating rating={app.rating} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Onboarding Tab ───────────────────────────────────────────────────────────

function OnboardingTab({
  tasks,
  onTasksChange,
  toast,
}: {
  tasks: OnboardingTask[];
  onTasksChange: (t: OnboardingTask[]) => void;
  toast: (msg: string, type?: "success" | "error") => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newCategory, setNewCategory] = useState("admin");
  const [newDueDate, setNewDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const grouped = tasks.reduce<Record<string, OnboardingTask[]>>((acc, t) => {
    const cat = t.category || "admin";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  const toggleTask = async (task: OnboardingTask) => {
    const updated = { ...task, completed: !task.completed };
    onTasksChange(tasks.map((t) => (t.id === task.id ? updated : t)));
    try {
      const res = await fetch(`/api/hire/onboarding/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: updated.completed }),
      });
      if (!res.ok) throw new Error();
    } catch {
      onTasksChange(tasks.map((t) => (t.id === task.id ? task : t)));
      toast("Failed to update task", "error");
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/hire/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: newTask.trim(),
          category: newCategory,
          due_date: newDueDate || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add task");
      }
      const { task: created } = await res.json();
      onTasksChange([...tasks, created as OnboardingTask]);
      setNewTask("");
      setNewCategory("admin");
      setNewDueDate("");
      setShowAdd(false);
      toast("Task added", "success");
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Failed to add task", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Onboarding Tasks
        </h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: "#6366F1", color: "#fff" }}
          aria-label="Add a new onboarding task"
        >
          <Plus size={13} />
          Add Task
        </button>
      </div>

      {showAdd && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          role="form"
          aria-label="Add onboarding task form"
        >
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }} htmlFor="new-task-text">
              Task description *
            </label>
            <input
              id="new-task-text"
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="e.g. Sign employment agreement"
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{
                background: "#ffffff08",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }} htmlFor="new-task-category">
                Category
              </label>
              <select
                id="new-task-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  background: "#ffffff08",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="admin">Admin</option>
                <option value="safety">Safety</option>
                <option value="training">Training</option>
                <option value="access">Access</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }} htmlFor="new-task-due">
                Due date
              </label>
              <input
                id="new-task-due"
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  background: "#ffffff08",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={addTask}
              disabled={saving || !newTask.trim()}
              className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: "#6366F1", color: "#fff" }}
            >
              {saving ? "Adding…" : "Add Task"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: "#ffffff10", color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {tasks.length === 0 && !showAdd ? (
        <div
          className="rounded-xl flex flex-col items-center justify-center py-16 gap-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <CheckCircle size={36} style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No onboarding tasks. Add tasks to track new hire onboarding.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "#6366F1", color: "#fff" }}
          >
            Add Task
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, catTasks]) => {
            const catStyle = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.admin;
            return (
              <div
                key={category}
                className="rounded-xl overflow-hidden"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div
                  className="px-4 py-2.5 flex items-center gap-2"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                    style={{ background: catStyle.bg, color: catStyle.color }}
                  >
                    {category}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {catTasks.filter((t) => t.completed).length}/{catTasks.length} completed
                  </span>
                </div>
                <ul role="list" aria-label={`${category} tasks`}>
                  {catTasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task)}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: "#6366F1" }}
                        aria-label={`Mark "${task.task}" as ${task.completed ? "incomplete" : "complete"}`}
                      />
                      <span
                        className="flex-1 text-sm"
                        style={{
                          color: task.completed ? "var(--text-muted)" : "var(--text-primary)",
                          textDecoration: task.completed ? "line-through" : "none",
                        }}
                      >
                        {task.task}
                      </span>
                      {task.due_date && (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Due {formatDate(task.due_date)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Post a Job Tab ───────────────────────────────────────────────────────────

function PostJobTab({
  onPosted,
  onCancel,
  toast,
}: {
  onPosted: (posting: JobPosting) => void;
  onCancel: () => void;
  toast: (msg: string, type?: "success" | "error") => void;
}) {
  const [form, setForm] = useState({
    title: "",
    employment_type: "full_time",
    trade: "",
    location: "",
    salary_min: "",
    salary_max: "",
    salary_type: "annual",
    description: "",
    requirements: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const submit = async () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const requirements = form.requirements
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      const res = await fetch("/api/hire/postings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, requirements }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create posting");
      }
      const { posting } = await res.json();
      toast("Job posted successfully", "success");
      onPosted(posting as JobPosting);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Failed to create posting", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = "w-full rounded-lg px-3 py-2 text-sm";
  const fieldStyle = {
    background: "#ffffff08",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };
  const labelClass = "block text-xs font-medium mb-1";
  const labelStyle = { color: "var(--text-secondary)" };

  return (
    <div
      className="rounded-xl p-6 space-y-5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      role="form"
      aria-label="Post a new job"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Post a New Job
        </h2>
        <button onClick={onCancel} aria-label="Cancel and go back to Job Board">
          <X size={16} style={{ color: "var(--text-muted)" }} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} style={labelStyle} htmlFor="pj-title">
            Job title *
          </label>
          <input
            id="pj-title"
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Senior Plumber"
            className={fieldClass}
            style={{
              ...fieldStyle,
              borderColor: errors.title ? "#f87171" : "var(--border)",
            }}
          />
          {errors.title && (
            <p className="mt-1 text-xs" style={{ color: "#f87171" }}>
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} style={labelStyle} htmlFor="pj-type">
            Employment type
          </label>
          <select
            id="pj-type"
            value={form.employment_type}
            onChange={(e) => update("employment_type", e.target.value)}
            className={fieldClass}
            style={fieldStyle}
          >
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="casual">Casual</option>
            <option value="subcontractor">Subcontractor</option>
          </select>
        </div>

        <div>
          <label className={labelClass} style={labelStyle} htmlFor="pj-trade">
            Trade / specialisation
          </label>
          <input
            id="pj-trade"
            type="text"
            value={form.trade}
            onChange={(e) => update("trade", e.target.value)}
            placeholder="e.g. Plumbing"
            className={fieldClass}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className={labelClass} style={labelStyle} htmlFor="pj-location">
            Location
          </label>
          <input
            id="pj-location"
            type="text"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="e.g. Sydney NSW"
            className={fieldClass}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className={labelClass} style={labelStyle} htmlFor="pj-salary-type">
            Salary type
          </label>
          <select
            id="pj-salary-type"
            value={form.salary_type}
            onChange={(e) => update("salary_type", e.target.value)}
            className={fieldClass}
            style={fieldStyle}
          >
            <option value="annual">Annual</option>
            <option value="hourly">Hourly</option>
          </select>
        </div>

        <div>
          <label className={labelClass} style={labelStyle} htmlFor="pj-sal-min">
            Salary min ($)
          </label>
          <input
            id="pj-sal-min"
            type="number"
            value={form.salary_min}
            onChange={(e) => update("salary_min", e.target.value)}
            placeholder="e.g. 60000"
            className={fieldClass}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className={labelClass} style={labelStyle} htmlFor="pj-sal-max">
            Salary max ($)
          </label>
          <input
            id="pj-sal-max"
            type="number"
            value={form.salary_max}
            onChange={(e) => update("salary_max", e.target.value)}
            placeholder="e.g. 80000"
            className={fieldClass}
            style={fieldStyle}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} style={labelStyle} htmlFor="pj-desc">
            Description
          </label>
          <textarea
            id="pj-desc"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
            placeholder="Describe the role, responsibilities, and what you're looking for…"
            className={fieldClass}
            style={fieldStyle}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} style={labelStyle} htmlFor="pj-req">
            Requirements (comma-separated)
          </label>
          <input
            id="pj-req"
            type="text"
            value={form.requirements}
            onChange={(e) => update("requirements", e.target.value)}
            placeholder="e.g. White card, Cert III Plumbing, Own vehicle"
            className={fieldClass}
            style={fieldStyle}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-lg px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: "#6366F1", color: "#fff" }}
        >
          {submitting ? "Posting…" : "Post Job"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "#ffffff10", color: "var(--text-secondary)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
