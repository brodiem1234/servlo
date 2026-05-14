import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[var(--text-primary)]">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{sub}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const admin = createAdminClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalUsersResult,
    activeSubsResult,
    foundersResult,
    planBreakdownResult,
    recentSignupsResult,
    aiUsageResult,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_status", "active"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("is_founding_member", true),
    admin.from("profiles").select("plan").neq("plan", null),
    admin.from("profiles")
      .select("id, email, plan, is_founding_member, created_at, subscription_status")
      .order("created_at", { ascending: false })
      .limit(10),
    admin.from("ai_usage_log")
      .select("prompt_tokens, completion_tokens, cost_aud_cents")
      .gte("created_at", thirtyDaysAgo),
  ]);

  const totalUsers = totalUsersResult.count ?? 0;
  const activeSubscriptions = activeSubsResult.count ?? 0;
  const founders = foundersResult.count ?? 0;

  // Plan breakdown
  const planCounts: Record<string, number> = {};
  for (const row of (planBreakdownResult.data ?? []) as { plan?: string }[]) {
    const plan = row.plan ?? "unknown";
    planCounts[plan] = (planCounts[plan] ?? 0) + 1;
  }

  // AI usage
  const aiLogs = (aiUsageResult.data ?? []) as { prompt_tokens?: number; completion_tokens?: number; cost_aud_cents?: number }[];
  const totalAICalls = aiLogs.length;
  const totalAITokens = aiLogs.reduce((s, r) => s + (r.prompt_tokens ?? 0) + (r.completion_tokens ?? 0), 0);
  const totalAICostCents = aiLogs.reduce((s, r) => s + (r.cost_aud_cents ?? 0), 0);

  const recentSignups = (recentSignupsResult.data ?? []) as {
    id: string;
    email?: string;
    plan?: string;
    is_founding_member?: boolean;
    created_at?: string;
    subscription_status?: string;
  }[];

  return (
    <section className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admin Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)]">Internal metrics and management tools</p>
        </div>
        <Link
          href="/dashboard/admin/launch-checklist"
          className="rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Launch Checklist →
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Users" value={totalUsers} />
        <StatCard label="Active Subscriptions" value={activeSubscriptions} />
        <StatCard label="Founding Members" value={`${founders}/50`} />
        <StatCard
          label="AI Usage (30d)"
          value={totalAICalls}
          sub={`${(totalAITokens / 1000).toFixed(1)}k tokens · $${(totalAICostCents / 100).toFixed(2)}`}
        />
      </div>

      {/* Plan breakdown */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Users by Plan</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Object.entries(planCounts).sort(([, a], [, b]) => b - a).map(([plan, count]) => (
            <div key={plan} className="rounded-lg bg-[var(--bg-secondary)] p-2.5 text-center">
              <p className="text-lg font-bold text-[var(--text-primary)]">{count}</p>
              <p className="text-xs text-[var(--text-muted)] capitalize">{plan}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent signups */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Signups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Email</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Plan</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Status</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {recentSignups.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2.5 text-[var(--text-primary)]">
                    {u.email ?? "—"}
                    {u.is_founding_member && <span className="ml-2 text-[10px] font-bold text-amber-500">FOUNDER</span>}
                  </td>
                  <td className="px-4 py-2.5 capitalize text-[var(--text-secondary)]">{u.plan ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      u.subscription_status === "active"
                        ? "bg-green-500/15 text-green-400 border border-green-500/20"
                        : "bg-zinc-100 dark:bg-white/5 text-[var(--text-secondary)] border border-zinc-200 dark:border-white/10"
                    }`}>
                      {u.subscription_status ?? "trial"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--text-muted)]">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString("en-AU") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <h3 className="font-semibold text-[var(--text-primary)] mb-3">Send Announcement</h3>
          <form action="/api/admin/announce" method="POST" className="space-y-2">
            <input name="subject" placeholder="Subject" required className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] focus:outline-none" />
            <textarea name="message" placeholder="Message body (HTML supported)" rows={3} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none resize-none" />
            <button type="submit" className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Send to all users
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <h3 className="font-semibold text-[var(--text-primary)] mb-3">Grant Founding Member</h3>
          <form action="/api/admin/grant-founder" method="POST" className="space-y-2">
            <input name="email" type="email" placeholder="User email" required className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] focus:outline-none" />
            <button type="submit" className="w-full rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-700">
              Grant Founder Status
            </button>
          </form>
          <p className="mt-2 text-xs text-[var(--text-muted)]">{founders}/100 slots used</p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <h3 className="font-semibold text-[var(--text-primary)] mb-3">Override AI Limit</h3>
          <form action="/api/admin/override-ai-limit" method="POST" className="space-y-2">
            <input name="email" type="email" placeholder="User email" required className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] focus:outline-none" />
            <input name="limit" type="number" placeholder="New monthly limit" required min="0" className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] focus:outline-none" />
            <button type="submit" className="w-full rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-700">
              Apply Override
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
