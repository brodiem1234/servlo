"use client";

import { useState, useRef, useEffect } from "react";

type VoiceNoteResult = {
  transcript: string;
  summary: string;
  action_items: string[];
};

type Props = {
  context?: string;
  onResult?: (result: VoiceNoteResult) => void;
  className?: string;
};

export function VoiceNote({ context, onResult, className }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<VoiceNoteResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") { setSupported(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-AU";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let full = "";
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript + " ";
      }
      setTranscript(full.trim());
    };
    recognition.onerror = () => {
      setIsRecording(false);
      setError("Microphone error. Please check browser permissions.");
    };
    recognitionRef.current = recognition;
  }, []);

  const startRecording = () => {
    setError(null);
    setResult(null);
    setTranscript("");
    recognitionRef.current?.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const processTranscript = async () => {
    if (!transcript.trim()) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript_raw: transcript, context }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(d.message ?? "Processing failed");
      }
      const data = await res.json() as VoiceNoteResult;
      setResult(data);
      onResult?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  if (!supported) {
    return (
      <div className={`rounded-lg border border-[var(--border)] p-4 text-sm text-[var(--text-muted)] ${className ?? ""}`}>
        Voice notes require a browser that supports the Web Speech API (Chrome or Edge recommended).
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            <span className="h-2 w-2 rounded-full bg-white" aria-hidden /> Record
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 rounded-full bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 animate-pulse"
          >
            <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden /> Stop
          </button>
        )}
        {transcript && !isRecording && (
          <button
            type="button"
            onClick={processTranscript}
            disabled={processing}
            className="rounded-md bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {processing ? "Processing…" : <><span aria-hidden>✨</span> Summarise</>}
          </button>
        )}
      </div>

      {isRecording && (
        <p className="text-xs text-red-600 dark:text-red-400 animate-pulse">Recording…</p>
      )}

      {transcript ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
          <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Transcript</p>
          <p className="text-sm text-[var(--text-primary)]">{transcript}</p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {result ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wide">Summary</p>
            <p className="text-sm text-[var(--text-primary)]">{result.summary}</p>
          </div>
          {result.action_items.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wide">Action items</p>
              <ul className="space-y-1">
                {result.action_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="mt-0.5 text-[var(--accent-color)]">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
