import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SurveyForm } from "./survey-form";

export const metadata: Metadata = {
  title: "Job Satisfaction Survey · SERVLO",
  description: "Share your feedback about the service you received.",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SurveyPage({ params }: PageProps) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: job } = await admin
    .from("jobs")
    .select("id, title, completed_at, survey_token")
    .eq("survey_token", token)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo / brand */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <span className="text-3xl font-bold tracking-tight text-white">SERVLO</span>
        <span className="text-sm text-gray-400">Australian Service Business Management</span>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
        {!job ? (
          <div className="text-center">
            <p className="text-lg font-semibold text-white">Survey not found</p>
            <p className="mt-2 text-sm text-gray-400">
              This survey link is invalid or has expired.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-white">How did we do?</h1>
              {job.title && (
                <p className="mt-1 text-sm text-gray-400">
                  Feedback for: <span className="text-gray-200">{job.title}</span>
                </p>
              )}
            </div>

            <SurveyForm jobId={job.id} token={token} />
          </>
        )}
      </div>

      <p className="mt-8 text-xs text-gray-600">
        Powered by SERVLO &middot; servlo.app
      </p>
    </div>
  );
}
