"use client";

import { useState, useRef, useEffect } from "react";
import { usePresence } from "@/lib/presence";

interface Props {
  businessId: string;
  currentUserId: string;
  currentUserName: string;
  plan: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "#0891b2", "#7c3aed", "#059669", "#d97706", "#dc2626", "#db2777",
];

function colorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) & 0xffffffff;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function OnlineMembersIndicator({ businessId, currentUserId, currentUserName, plan }: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const canShowPresence = ["team", "business", "enterprise"].includes(plan);

  const allOnline = usePresence(
    canShowPresence ? businessId : null,
    canShowPresence ? { id: currentUserId, name: currentUserName } : null
  );
  // Filter out the current user
  const others = allOnline.filter((u) => u.userId !== currentUserId);

  // Close popover when clicking outside
  useEffect(() => {
    if (!popoverOpen) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [popoverOpen]);

  // Only show for paid team plans
  if (!canShowPresence) return null;
  if (others.length === 0) return null;

  const visible = others.slice(0, 3);
  const overflow = others.length - 3;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setPopoverOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full px-2 py-1 hover:bg-[var(--bg-secondary)] transition-colors"
        aria-label="Show online team members"
      >
        <div className="flex -space-x-1.5">
          {visible.map((user) => (
            <div
              key={user.userId}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-[var(--bg-secondary)]"
              style={{ background: colorForUser(user.userId) }}
              title={user.name}
            >
              {getInitials(user.name)}
            </div>
          ))}
          {overflow > 0 && (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--border)] text-[10px] font-bold text-[var(--text-secondary)] ring-2 ring-[var(--bg-secondary)]"
            >
              +{overflow}
            </div>
          )}
        </div>
        <span className="hidden text-xs text-[var(--text-muted)] sm:block">
          {others.length === 1 ? "1 online" : `${others.length} online`}
        </span>
      </button>

      {popoverOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[220px] rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Online now
          </p>
          <div className="space-y-2">
            {others.map((user) => (
              <div key={user.userId} className="flex items-center gap-2.5">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ background: colorForUser(user.userId) }}
                >
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {user.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {user.currentPage}
                  </p>
                </div>
                <div className="ml-auto h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
