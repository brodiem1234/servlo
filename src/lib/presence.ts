"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

export const PAGE_LABELS: Record<string, string> = {
  "/dashboard/owner": "Dashboard",
  "/dashboard/owner/jobs": "Jobs",
  "/dashboard/owner/clients": "Clients",
  "/dashboard/owner/finance": "Finance",
  "/dashboard/owner/invoices": "Invoices",
  "/dashboard/owner/quotes": "Quotes",
  "/dashboard/owner/team": "Team",
  "/dashboard/owner/reports": "Reports",
  "/dashboard/owner/settings": "Settings",
  "/dashboard/owner/timesheets": "Timesheets",
  "/dashboard/owner/pricebook": "Pricebook",
  "/dashboard/owner/forms": "Forms",
  "/dashboard/owner/comms": "Comms",
};

export function getPageLabel(pathname: string): string {
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
  if (pathname.includes("/jobs/")) return "Job detail";
  if (pathname.includes("/clients/")) return "Client detail";
  if (pathname.includes("/finance/")) return "Finance";
  if (pathname.includes("/invoices/")) return "Invoice detail";
  if (pathname.includes("/quotes/")) return "Quote detail";
  return "Dashboard";
}

export type OnlineUser = {
  userId: string;
  name: string;
  currentPage: string;
  currentJobId?: string;
  lastSeen: number;
};

export function usePresence(
  businessId: string | null | undefined,
  currentUser: { id: string; name: string } | null | undefined
): OnlineUser[] {
  const pathname = usePathname();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Derive jobId from pathname
  const currentJobId = (() => {
    const m = pathname.match(/\/jobs\/([^/]+)/);
    return m ? m[1] : undefined;
  })();

  const currentPage = getPageLabel(pathname);

  useEffect(() => {
    if (!businessId || !currentUser?.id) return;

    const supabase = createSupabaseBrowser();
    const channel = supabase.channel(`presence:business:${businessId}`, {
      config: { presence: { key: currentUser.id } },
    });

    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<string, unknown[]>;
      const users: OnlineUser[] = [];
      for (const [userId, presences] of Object.entries(state)) {
        if (!presences?.length) continue;
        // Take the most recent presence for this user
        const p = presences[presences.length - 1] as Record<string, unknown>;
        users.push({
          userId,
          name: String(p.name ?? "Unknown"),
          currentPage: String(p.currentPage ?? "Dashboard"),
          currentJobId: p.currentJobId ? String(p.currentJobId) : undefined,
          lastSeen: Number(p.lastSeen ?? Date.now()),
        });
      }
      setOnlineUsers(users);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          userId: currentUser.id,
          name: currentUser.name,
          currentPage,
          currentJobId: currentJobId ?? null,
          lastSeen: Date.now(),
        });
      }
    });

    return () => {
      channel.untrack().catch(() => {});
      supabase.removeChannel(channel);
      channelRef.current = null;
      // Mark user offline
      fetch("/api/presence/offline", { method: "POST" }).catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, currentUser?.id]);

  // Update tracking when page changes
  useEffect(() => {
    if (!channelRef.current || !currentUser?.id) return;
    channelRef.current.track({
      userId: currentUser.id,
      name: currentUser.name,
      currentPage,
      currentJobId: currentJobId ?? null,
      lastSeen: Date.now(),
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, currentUser?.id, currentPage, currentJobId]);

  return onlineUsers;
}
