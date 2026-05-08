import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  created_at: string;
};

function notifIcon(type: string): string {
  if (type === "payment_received" || type === "invoice_paid") return "💰";
  if (type === "quote_accepted") return "📋";
  if (type === "quote_declined") return "📋";
  if (type === "job_scheduled" || type === "job_completed") return "📅";
  if (type === "new_lead") return "🔔";
  if (type === "payment_failed") return "⚠️";
  if (type === "founding_member") return "🎉";
  if (type === "weekly_summary") return "📊";
  if (type === "success") return "✅";
  return "🔔";
}

function groupByDate(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: Notification[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "This week", items: [] },
    { label: "Older", items: [] },
  ];

  for (const n of notifications) {
    const d = new Date(n.created_at);
    if (d >= today) groups[0].items.push(n);
    else if (d >= yesterday) groups[1].items.push(n);
    else if (d >= weekAgo) groups[2].items.push(n);
    else groups[3].items.push(n);
  }

  return groups.filter((g) => g.items.length > 0);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, href, read, created_at")
    .eq("owner_id", user.id)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(100);

  const allNotifications = notifications ?? [];
  const unreadCount = allNotifications.filter((n) => !n.read).length;
  const groups = groupByDate(allNotifications as Notification[]);

  async function markAllReadAction(): Promise<void> {
    "use server";
    const sb = await createClient();
    const { data: { user: owner } } = await sb.auth.getUser();
    if (!owner) return;
    await sb.from("notifications").update({ read: true }).eq("owner_id", owner.id).eq("read", false);
    revalidatePath("/dashboard/owner/notifications");
  }

  return (
    <section className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
          <p className="text-sm text-[var(--text-secondary)]">Last 30 days</p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllReadAction}>
            <button
              type="submit"
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              Mark all as read ({unreadCount})
            </button>
          </form>
        )}
      </div>

      {allNotifications.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
          <p className="text-2xl mb-2">🔔</p>
          <p className="font-semibold text-[var(--text-primary)]">No notifications</p>
          <p className="text-sm text-[var(--text-muted)]">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{group.label}</p>
              <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
                {group.items.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${!n.read ? "bg-[var(--bg-secondary)]/40" : ""}`}
                  >
                    <span className="mt-0.5 text-lg shrink-0">{notifIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                        {n.title}
                      </p>
                      {n.body && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{n.body}</p>}
                      <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <div className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-color)]" />}
                    {n.href && (
                      <a href={n.href} className="shrink-0 text-xs text-[var(--accent-color)] hover:underline">
                        View →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
