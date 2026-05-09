"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type JobExtraction = {
  title: string;
  description: string;
  client_name: string | null;
  address: string | null;
  scheduled_date: string | null;
  estimated_hours: number | null;
  priority: "low" | "medium" | "high";
};

type VoiceToJobResult = {
  transcript: string;
  job: JobExtraction;
};

type RecordingState = "idle" | "recording" | "processing";

export default function VoiceToJobButton() {
  const router = useRouter();
  const [state, setState] = useState<RecordingState>("idle");
  const [result, setResult] = useState<VoiceToJobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await sendAudio(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setState("recording");
    } catch {
      setError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setState("processing");
  };

  const sendAudio = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const res = await fetch("/api/ai/voice-to-job", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? "Processing failed");
      }

      const data = await res.json() as VoiceToJobResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setState("idle");
    }
  };

  const closeModal = () => {
    setResult(null);
    setError(null);
  };

  const handleClick = () => {
    if (state === "idle") startRecording();
    else if (state === "recording") stopRecording();
  };

  const priorityColour = (p: string) => {
    if (p === "high") return "text-red-600 dark:text-red-400";
    if (p === "low") return "text-green-600 dark:text-green-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  return (
    <>
      {/* Trigger button */}
      {state === "idle" && (
        <button
          onClick={handleClick}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
        >
          🎙️ Voice to Job
        </button>
      )}

      {state === "recording" && (
        <button
          onClick={handleClick}
          className="relative flex items-center gap-2 rounded-lg border border-red-500 bg-[var(--bg-card)] px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          {/* Pulsing red ring */}
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          Stop Recording
        </button>
      )}

      {state === "processing" && (
        <button
          disabled
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-muted)] cursor-not-allowed"
        >
          <svg
            className="h-4 w-4 animate-spin text-[var(--accent-color)]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Processing…
        </button>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Result modal */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Job Extracted from Voice</h2>
              <button
                onClick={closeModal}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Transcript */}
            <div className="mb-4 rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1">Transcript</p>
              <p className="text-sm text-[var(--text-secondary)]">{result.transcript}</p>
            </div>

            {/* Job fields */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Title</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{result.job.title}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Description</p>
                <p className="text-sm text-[var(--text-secondary)]">{result.job.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {result.job.client_name && (
                  <div>
                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Client</p>
                    <p className="text-sm text-[var(--text-secondary)]">{result.job.client_name}</p>
                  </div>
                )}
                {result.job.address && (
                  <div>
                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Address</p>
                    <p className="text-sm text-[var(--text-secondary)]">{result.job.address}</p>
                  </div>
                )}
                {result.job.scheduled_date && (
                  <div>
                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Scheduled</p>
                    <p className="text-sm text-[var(--text-secondary)]">{result.job.scheduled_date}</p>
                  </div>
                )}
                {result.job.estimated_hours != null && (
                  <div>
                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Est. Hours</p>
                    <p className="text-sm text-[var(--text-secondary)]">{result.job.estimated_hours}h</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Priority</p>
                  <p className={`text-sm font-medium capitalize ${priorityColour(result.job.priority)}`}>
                    {result.job.priority}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  closeModal();
                  router.push("/dashboard/owner/jobs");
                }}
                className="flex-1 rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Create Job
              </button>
              <button
                onClick={closeModal}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
