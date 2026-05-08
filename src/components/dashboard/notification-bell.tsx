"use client";
import { useEffect, useState, useRef } from "react";
import { Bell, Check, X } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  action_url: string | null;
  read: boolean;
  created_at: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function notifIcon(type: string): string {
  if (type === "payment_received" || type === "invoice_paid") return "💰";
  if (type === "quote_accepted") return "📋";
  if (type === "quote_declined") return "📋";
  if (type === "job_scheduled" || type === "job_completed") return "📅";
  if (type === "new_lead") return "🔔";
  if (type === "payment_failed") return "⚠️";
  if (type === "founding_member") return "🎉";
  if (type === "weekly_summary") return "📊";
  if (type === "info") return "ℹ️";
  if (type === "success") return "✅";
  if (type === "warning") return "⚠️";
  if (type === "error") return "❌";
  return "🔔";
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const sb = createSupabaseBrowser();

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await sb.from("notifications")
        .select("id, type, title, body, action_url, read, created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications(data ?? []);
      setLoading(false);

      // Subscribe to realtime new notifications
      const channel = sb.channel("notifications")
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `owner_id=eq.${user.id}`,
        }, (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setAnimate(true);
          setTimeout(() => setAnimate(false), 1000);
        })
        .subscribe();

      cleanup = () => { sb.removeChannel(channel); };
    }

    load();
    return () => { cleanup?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markAllRead() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    await sb.from("notifications").update({ read: true }).eq("owner_id", user.id).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function markRead(id: string, actionUrl: string | null) {
    await sb.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (actionUrl) window.location.href = actionUrl;
    setOpen(false);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`relative rounded border border-[var(--border)] p-2 text-[var(--text-primary)] transition-all ${animate ? "ring-2 ring-[var(--accent-color)] ring-offset-1" : ""}`}
        aria-label="Notifications"
      >
        <Bell size={16} className={animate ? "animate-bounce" : ""} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Notifications</p>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <Check size={12} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-auto">
            {loading && <p className="px-4 py-3 text-sm text-[var(--text-muted)]">Loading…</p>}
            {!loading && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">No notifications yet</p>
            )}
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => markRead(n.id, n.action_url)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-secondary)] ${!n.read ? "bg-[var(--bg-secondary)]/50" : ""}`}
              >
                <span className="mt-0.5 text-base">{notifIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{n.title}</p>
                  {n.body && <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{n.body}</p>}
                  <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-color)]" />}
              </button>
            ))}
          </div>
          {notifications.length > 0 && (
            <div className="border-t border-[var(--border)] px-4 py-2">
              <a
                href="/dashboard/owner/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs text-[var(--accent-color)] hover:underline"
              >
                View all notifications →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
