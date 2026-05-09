"use client";

import { useEffect, useState, useCallback } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

type Task = {
  id: string;
  label: string;
  description: string;
  done: boolean;
  href?: string;
  icon: string;
  priority: "high" | "medium" | "low";
};

type TaskGroup = {
  label: string;
  tasks: Task[];
};

// ─── Industry-specific task sets ────────────────────────────────────────────
type IndustrySlug = "trades" | "cleaning" | "events" | "marketing" | "health" | "field_services" | "other";

const INDUSTRY_EXTRA: Record<IndustrySlug, Task[]> = {
  trades: [
    { id: "add_compliance", label: "Add a compliance document", description: "Upload a SWMS, JSA or induction record to stay compliant", done: false, href: "/dashboard/owner/compliance", icon: "📋", priority: "high" },
    { id: "add_pricebook", label: "Build your pricebook", description: "Add your labour rates and materials for faster quoting", done: false, href: "/dashboard/owner/pricebook", icon: "💰", priority: "medium" },
  ],
  cleaning: [
    { id: "add_schedule", label: "Schedule your first job", description: "Use the scheduler to plan your cleaning rounds", done: false, href: "/dashboard/schedule", icon: "📅", priority: "high" },
    { id: "setup_recurring", label: "Set up recurring invoices", description: "Automate billing for regular cleaning clients", done: false, href: "/dashboard/owner/invoices", icon: "🔄", priority: "medium" },
  ],
  events: [
    { id: "add_quote", label: "Send your first quote", description: "Create and share a professional quote with a client", done: false, href: "/dashboard/owner/quotes", icon: "📄", priority: "high" },
    { id: "add_pricebook", label: "Add your packages to pricebook", description: "Set up your event packages and add-ons", done: false, href: "/dashboard/owner/pricebook", icon: "💰", priority: "medium" },
  ],
  marketing: [
    { id: "setup_comms", label: "Set up client comms", description: "Configure messaging for client communication", done: false, href: "/dashboard/owner/comms", icon: "💬", priority: "high" },
    { id: "launch_campaign", label: "Launch your first campaign", description: "Create an email or SMS campaign via GROW", done: false, href: "/dashboard/grow/email", icon: "📧", priority: "medium" },
  ],
  health: [
    { id: "add_compliance", label: "Upload compliance documents", description: "Add registrations, insurance and certifications", done: false, href: "/dashboard/owner/compliance", icon: "🏥", priority: "high" },
    { id: "setup_portal", label: "Activate client portal", description: "Give clients a way to book and view invoices online", done: false, href: "/dashboard/owner/settings?tab=portal", icon: "🌐", priority: "medium" },
  ],
  field_services: [
    { id: "add_fleet", label: "Register your vehicles", description: "Add your fleet for service tracking and trip logs", done: false, href: "/dashboard/fleet", icon: "🚛", priority: "medium" },
    { id: "add_pricebook", label: "Build your pricebook", description: "Set up your service rates for faster invoicing", done: false, href: "/dashboard/owner/pricebook", icon: "💰", priority: "medium" },
  ],
  other: [],
};

const CORE_TASKS: Task[] = [
  { id: "account_created",  label: "Create your account",       description: "Welcome to SERVLO! Your account is ready.",        done: true,  icon: "✅", priority: "high" },
  { id: "add_business",     label: "Set up your business",      description: "Add your ABN, address and contact details",        done: false, href: "/dashboard/owner/settings?tab=profile",    icon: "🏢", priority: "high" },
  { id: "add_client",       label: "Add your first client",     description: "Import or create your first client record",        done: false, href: "/dashboard/owner/clients",                  icon: "👤", priority: "high" },
  { id: "create_job",       label: "Create your first job",     description: "Create a job and assign it to a client",          done: false, href: "/dashboard/owner/jobs",                     icon: "🔧", priority: "high" },
  { id: "send_invoice",     label: "Send your first invoice",   description: "Create and send an invoice to get paid",          done: false, href: "/dashboard/owner/invoices",                 icon: "🧾", priority: "high" },
  { id: "invite_team",      label: "Invite a team member",      description: "Add an employee or contractor to collaborate",    done: false, href: "/dashboard/owner/team",                     icon: "👥", priority: "medium" },
  { id: "setup_brand",      label: "Customise your brand",      description: "Add your logo and brand colour to documents",     done: false, href: "/dashboard/owner/settings?tab=appearance",  icon: "🎨", priority: "low" },
];

export default function OnboardingChecklist() {
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const load = useCallback(async () => {
    if (typeof window !== "undefined" && localStorage.getItem("servlo_checklist_dismissed") === "true") {
      setLoading(false);
      return;
    }

    const sb = createSupabaseBrowser();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const [profileRes, clientRes, jobRes, invoiceRes, businessRes, employeeRes, quoteRes, complianceRes, pricebookRes] = await Promise.all([
      sb.from("profiles").select("onboarding_completed, industry_tags").eq("id", user.id).maybeSingle(),
      sb.from("clients").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("is_demo", false),
      sb.from("jobs").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("is_demo", false),
      sb.from("invoices").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("is_demo", false),
      sb.from("businesses").select("phone, logo_url, accent_colour, abn").eq("owner_id", user.id).maybeSingle(),
      sb.from("employees").select("id", { count: "exact", head: true }).eq("owner_id", user.id).is("deleted_at", null),
      sb.from("quotes").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("is_demo", false),
      sb.from("compliance_documents").select("id", { count: "exact", head: true }).eq("owner_id", user.id).is("deleted_at", null),
      sb.from("pricebook_items").select("id", { count: "exact", head: true }).eq("owner_id", user.id).is("deleted_at", null),
    ]);

    if (profileRes.data?.onboarding_completed) { setLoading(false); return; }

    const biz = businessRes.data;
    const industryTags: string[] = profileRes.data?.industry_tags ?? [];
    const primaryIndustry: IndustrySlug = (industryTags[0] as IndustrySlug) ?? "other";

    // Core tasks with real completion data
    const coreTasks: Task[] = CORE_TASKS.map((t) => {
      let done = t.done;
      if (t.id === "add_business")   done = Boolean(biz?.phone && biz?.abn);
      if (t.id === "add_client")     done = (clientRes.count ?? 0) > 0;
      if (t.id === "create_job")     done = (jobRes.count ?? 0) > 0;
      if (t.id === "send_invoice")   done = (invoiceRes.count ?? 0) > 0;
      if (t.id === "invite_team")    done = (employeeRes.count ?? 0) > 0;
      if (t.id === "setup_brand")    done = Boolean(biz?.accent_colour || biz?.logo_url);
      return { ...t, done };
    });

    // Industry-specific extras with real completion data
    const extras = (INDUSTRY_EXTRA[primaryIndustry] ?? []).map((t) => {
      let done = t.done;
      if (t.id === "add_quote")      done = (quoteRes.count ?? 0) > 0;
      if (t.id === "add_compliance") done = (complianceRes.count ?? 0) > 0;
      if (t.id === "add_pricebook")  done = (pricebookRes.count ?? 0) > 0;
      return { ...t, done };
    });

    const allTasks = [...coreTasks, ...extras];
    const allDone = allTasks.every((t) => t.done);

    if (allDone) {
      await sb.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
      setLoading(false);
      return;
    }

    const coreGroup: TaskGroup = { label: "Core Setup", tasks: coreTasks };
    const extraGroup: TaskGroup | null = extras.length > 0 ? {
      label: primaryIndustry.charAt(0).toUpperCase() + primaryIndustry.slice(1).replace("_", " ") + " Essentials",
      tasks: extras,
    } : null;

    setGroups([coreGroup, ...(extraGroup ? [extraGroup] : [])]);
    setVisible(true);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDismiss() {
    if (typeof window !== "undefined") localStorage.setItem("servlo_checklist_dismissed", "true");
    if (userId) {
      const sb = createSupabaseBrowser();
      await sb.from("profiles").update({ onboarding_completed: true }).eq("id", userId);
    }
    setVisible(false);
  }

  if (loading || !visible) return null;

  const allTasks = groups.flatMap((g) => g.tasks);
  const completedCount = allTasks.filter((t) => t.done).length;
  const totalCount = allTasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount;

  if (allDone && !celebrating) {
    setCelebrating(true);
    setTimeout(() => setVisible(false), 5000);
  }

  if (allDone && celebrating) {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5 mb-6 text-center" role="status" aria-live="polite">
        <div className="text-4xl mb-2">🎉</div>
        <h2 className="font-bold text-emerald-300">You&apos;re all set up!</h2>
        <p className="text-sm text-emerald-400/80 mt-1">Congrats on completing your setup. SERVLO is ready to help grow your business.</p>
      </div>
    );
  }

  // Next incomplete task
  const nextTask = allTasks.find((t) => !t.done);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] mb-6 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--bg-primary)] transition-colors text-left"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-controls="checklist-body"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Progress ring */}
          <div className="relative h-10 w-10 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke="var(--accent-color)" strokeWidth="3"
                strokeDasharray={`${progressPct * 0.942} 94.2`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)]">
              {completedCount}/{totalCount}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-[var(--text-primary)] text-sm">Get started with SERVLO</h2>
            {nextTask && !collapsed && (
              <p className="text-xs text-[var(--text-muted)] truncate">Next: {nextTask.label}</p>
            )}
            {collapsed && (
              <p className="text-xs text-[var(--text-muted)]">{progressPct}% complete</p>
            )}
          </div>
        </div>
        <span className="text-[var(--text-muted)] text-sm flex-shrink-0 ml-2">{collapsed ? "▼" : "▲"}</span>
      </button>

      {/* Progress bar */}
      <div className="h-1 w-full bg-[var(--bg-secondary)]">
        <div
          className="h-1 bg-[var(--accent-color)] transition-all duration-500"
          style={{ width: `${progressPct}%` }}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progressPct}% complete`}
        />
      </div>

      {/* Body */}
      {!collapsed && (
        <div id="checklist-body" className="px-5 py-4 space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">{group.label}</h3>
              <ul className="space-y-2" role="list">
                {group.tasks.map((task) => (
                  <li key={task.id}>
                    <div className={`flex items-start gap-3 rounded-lg p-2.5 transition-colors ${task.done ? "opacity-60" : "hover:bg-[var(--bg-primary)]"}`}>
                      {/* Checkbox */}
                      <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center mt-0.5 ${task.done ? "bg-emerald-500/20 border-0" : "border-2 border-[var(--border)]"}`}>
                        {task.done ? (
                          <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 12 12" fill="none" aria-hidden>
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <span className="text-xs" aria-hidden>{task.icon}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {task.done ? (
                          <span className="text-sm text-[var(--text-muted)] line-through">{task.label}</span>
                        ) : task.href ? (
                          <a
                            href={task.href}
                            className="text-sm font-medium text-[var(--accent-color)] hover:underline"
                            aria-label={task.label}
                          >
                            {task.label}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-[var(--text-primary)]">{task.label}</span>
                        )}
                        {!task.done && (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">{task.description}</p>
                        )}
                      </div>

                      {/* Priority badge for high-priority incomplete tasks */}
                      {!task.done && task.priority === "high" && (
                        <span className="flex-shrink-0 rounded-full bg-red-500/15 border border-red-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-red-400 uppercase tracking-wide">
                          Priority
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <span className="text-xs text-[var(--text-muted)]">{completedCount} of {totalCount} tasks complete</span>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              Dismiss checklist
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
