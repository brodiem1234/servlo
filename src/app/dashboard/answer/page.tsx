import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnswerDashboard } from "./answer-dashboard";

export const dynamic = "force-dynamic";

export interface CallLog {
  id: string;
  caller_number: string | null;
  caller_name: string | null;
  direction: string;
  duration_seconds: number;
  outcome: string;
  transcript: string | null;
  ai_summary: string | null;
  called_at: string;
}

export interface AnswerStats {
  totalCalls: number;
  missedCalls: number;
  bookingsMade: number;
  avgDuration: number;
}

export default async function AnswerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let callLogs: CallLog[] = [];

  const { data, error } = await supabase
    .from("call_logs")
    .select(
      "id, caller_number, caller_name, direction, duration_seconds, outcome, transcript, ai_summary, called_at"
    )
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .order("called_at", { ascending: false })
    .limit(50);

  if (error) {
    if (error.code !== "42P01") {
      console.error("[AnswerPage] call_logs fetch error:", error.message);
    }
    callLogs = [];
  } else {
    callLogs = (data ?? []) as CallLog[];
  }

  const answeredLogs = callLogs.filter(
    (l) => l.outcome !== "missed" && l.outcome !== "voicemail"
  );
  const stats: AnswerStats = {
    totalCalls: callLogs.length,
    missedCalls: callLogs.filter(
      (l) => l.outcome === "missed" || l.outcome === "voicemail"
    ).length,
    bookingsMade: callLogs.filter((l) => l.outcome === "booked").length,
    avgDuration:
      answeredLogs.length > 0
        ? Math.round(
            answeredLogs.reduce((sum, l) => sum + (l.duration_seconds ?? 0), 0) /
              answeredLogs.length
          )
        : 0,
  };

  return <AnswerDashboard callLogs={callLogs} stats={stats} />;
}
