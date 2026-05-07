"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

type Task = {
  label: string;
  done: boolean;
  href?: string;
};

export default function OnboardingChecklist() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("servlo_checklist_dismissed") === "true") {
      setLoading(false);
      return;
    }

    async function loadData() {
      const sb = createSupabaseBrowser();
      const {
        data: { user }
      } = await sb.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const [profileRes, clientCountRes, jobCountRes, invoiceCountRes, businessRes] = await Promise.all([
        sb.from("profiles").select("onboarding_completed").eq("id", user.id).maybeSingle(),
        sb.from("clients").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("is_demo", false),
        sb.from("jobs").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("is_demo", false),
        sb.from("invoices").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("is_demo", false),
        sb.from("businesses").select("phone").eq("owner_id", user.id).maybeSingle()
      ]);

      if (profileRes.data?.onboarding_completed) {
        setLoading(false);
        return;
      }

      const clientCount = clientCountRes.count ?? 0;
      const jobCount = jobCountRes.count ?? 0;
      const invoiceCount = invoiceCountRes.count ?? 0;
      const business = businessRes.data;

      const nextTasks: Task[] = [
        { label: "Create your account", done: true },
        {
          label: "Add your first client",
          done: clientCount > 0,
          href: "/dashboard/owner/clients"
        },
        {
          label: "Create your first job",
          done: jobCount > 0,
          href: "/dashboard/owner/jobs"
        },
        {
          label: "Send your first invoice",
          done: invoiceCount > 0,
          href: "/dashboard/owner/finance"
        },
        {
          label: "Set up your profile",
          done: Boolean(business?.phone),
          href: "/dashboard/owner/settings?tab=profile"
        }
      ];

      setTasks(nextTasks);

      const allDone = nextTasks.every((t) => t.done);
      if (allDone) {
        await sb.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
        setLoading(false);
        return;
      }

      setVisible(true);
      setLoading(false);
    }

    loadData();
  }, []);

  async function handleDismiss() {
    if (typeof window !== "undefined") {
      localStorage.setItem("servlo_checklist_dismissed", "true");
    }
    if (userId) {
      const sb = createSupabaseBrowser();
      await sb.from("profiles").update({ onboarding_completed: true }).eq("id", userId);
    }
    setVisible(false);
  }

  if (loading || !visible) return null;

  const completedCount = tasks.filter((t) => t.done).length;
  const progressPct = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm mb-6">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h2 className="font-semibold text-[var(--text-primary)]">Get started with SERVLO</h2>
        <span className="text-xs text-[var(--text-muted)]">
          {completedCount}/{tasks.length} done
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5 mb-4">
        <div
          className="h-1.5 rounded-full bg-[var(--accent-color)] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Task list */}
      <ul className="space-y-2 mb-4">
        {tasks.map((task) => (
          <li key={task.label} className="flex items-center gap-3">
            {task.done ? (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-3 w-3 text-green-600"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[var(--border)]" />
            )}
            {task.done ? (
              <span className="text-sm text-[var(--text-muted)] line-through">{task.label}</span>
            ) : task.href ? (
              <a
                href={task.href}
                className="text-sm text-[var(--accent-color)] hover:underline"
              >
                {task.label}
              </a>
            ) : (
              <span className="text-sm text-[var(--text-primary)]">{task.label}</span>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handleDismiss}
        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
      >
        I&apos;ll do this later
      </button>
    </div>
  );
}
