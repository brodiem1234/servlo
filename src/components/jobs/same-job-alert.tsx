"use client";

import { usePresence } from "@/lib/presence";

interface Props {
  jobId: string;
  businessId: string;
  currentUserId: string;
  currentUserName: string;
}

/**
 * Shows a banner when another team member is viewing the same job.
 * Place this near the top of a job detail client component.
 */
export function SameJobAlert({ jobId, businessId, currentUserId, currentUserName }: Props) {
  const allOnline = usePresence(businessId, { id: currentUserId, name: currentUserName });

  // Filter to users viewing this specific job (excluding current user)
  const others = allOnline.filter(
    (u) => u.userId !== currentUserId && u.currentJobId === jobId
  );

  if (others.length === 0) return null;

  const names = others.map((u) => u.name);
  const label =
    names.length === 1
      ? `${names[0]} is also viewing this job`
      : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} are also viewing this job`;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="flex shrink-0 -space-x-1">
        {others.slice(0, 3).map((u) => (
          <div
            key={u.userId}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white ring-1 ring-amber-50 dark:ring-amber-950"
            title={u.name}
          >
            {u.name.slice(0, 1).toUpperCase()}
          </div>
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
}
