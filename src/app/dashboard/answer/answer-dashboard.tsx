"use client";

import { useState, useCallback } from "react";
import {
  PhoneCall,
  CalendarCheck,
  VoicemailIcon,
  Clock,
  Phone,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  Plug,
  Mic,
  FileText,
} from "lucide-react";
import type { CallLog, AnswerStats } from "./page";

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
  callLogs: CallLog[];
  stats: AnswerStats;
}

type Tab = "calls" | "settings" | "integrations";
type OutcomeFilter = "all" | "answered" | "missed" | "booked" | "voicemail";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max) + "…";
}

// ── Outcome Badge ─────────────────────────────────────────────────────────────

const OUTCOME_STYLE: Record<string, { label: string; className: string }> = {
  answered: {
    label: "Answered",
    className: "bg-teal-500/15 text-teal-400 border border-teal-500/30",
  },
  booked: {
    label: "Booked",
    className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  },
  missed: {
    label: "Missed",
    className: "bg-red-500/15 text-red-400 border border-red-500/30",
  },
  voicemail: {
    label: "Voicemail",
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  },
  info_provided: {
    label: "Info Provided",
    className: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  },
};

function OutcomeBadge({ outcome }: { outcome: string }) {
  const style = OUTCOME_STYLE[outcome] ?? {
    label: outcome,
    className: "bg-white/10 text-slate-400 border border-white/10",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${style.className}`}
    >
      {style.label}
    </span>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastMessage {
  id: number;
  text: string;
  type: "success" | "error";
}

function Toast({ messages, onDismiss }: { messages: ToastMessage[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2" aria-live="polite">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium border ${
            m.type === "success"
              ? "bg-emerald-900/90 text-emerald-200 border-emerald-500/30"
              : "bg-red-900/90 text-red-200 border-red-500/30"
          }`}
        >
          {m.type === "success" ? (
            <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle size={15} className="shrink-0 text-red-400" />
          )}
          <span>{m.text}</span>
          <button
            onClick={() => onDismiss(m.id)}
            className="ml-2 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss notification"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Transcript Modal ──────────────────────────────────────────────────────────

function TranscriptModal({
  log,
  onClose,
}: {
  log: CallLog | null;
  onClose: () => void;
}) {
  if (!log) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transcript-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f1117] shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 id="transcript-title" className="text-sm font-semibold text-white">
              Call Transcript
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {log.caller_name ?? log.caller_number ?? "Unknown caller"} —{" "}
              {formatDateTime(log.called_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            aria-label="Close transcript"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {log.transcript ? (
            <pre className="whitespace-pre-wrap text-sm text-slate-300 font-mono leading-relaxed">
              {log.transcript}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <FileText size={32} className="text-slate-600" />
              <p className="text-sm text-slate-500">No transcript available for this call.</p>
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="w-full rounded-lg py-2 text-sm font-semibold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Recent Calls Tab ──────────────────────────────────────────────────────────

function RecentCallsTab({
  callLogs,
  onViewTranscript,
}: {
  callLogs: CallLog[];
  onViewTranscript: (log: CallLog) => void;
}) {
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("all");
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set());

  const toggleSummary = useCallback((id: string) => {
    setExpandedSummaries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filtered =
    outcomeFilter === "all"
      ? callLogs
      : callLogs.filter((l) => l.outcome === outcomeFilter);

  const filterOptions: { value: OutcomeFilter; label: string }[] = [
    { value: "all", label: "All Outcomes" },
    { value: "answered", label: "Answered" },
    { value: "missed", label: "Missed" },
    { value: "booked", label: "Booked" },
    { value: "voicemail", label: "Voicemail" },
  ];

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setOutcomeFilter(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              outcomeFilter === opt.value
                ? "text-white border"
                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
            }`}
            style={
              outcomeFilter === opt.value
                ? { background: "#14B8A620", color: "#14B8A6", borderColor: "#14B8A640" }
                : {}
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-[var(--bg-card,#ffffff08)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-6">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "#14B8A615" }}
            >
              <Phone size={24} style={{ color: "#14B8A6" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">No calls yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Connect Twilio to start receiving calls. Your AI agent will answer 24/7, capture
                leads, and make bookings automatically.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400 font-mono text-left w-full max-w-sm">
              <p className="text-slate-500 mb-1"># Required environment variables</p>
              <p>TWILIO_ACCOUNT_SID=ACxxxxxxxx</p>
              <p>TWILIO_AUTH_TOKEN=xxxxxxxx</p>
              <p>TWILIO_PHONE_NUMBER=+61xxxxxxxxx</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date / Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Caller
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Outcome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    AI Summary
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const isExpanded = expandedSummaries.has(log.id);
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {formatDateTime(log.called_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-slate-500 shrink-0" />
                          <div>
                            {log.caller_name && (
                              <p className="text-sm font-medium text-white leading-none">
                                {log.caller_name}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 mt-0.5">
                              {log.caller_number ?? "Unknown"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 tabular-nums whitespace-nowrap">
                        {formatDuration(log.duration_seconds)}
                      </td>
                      <td className="px-4 py-3">
                        <OutcomeBadge outcome={log.outcome} />
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {log.ai_summary ? (
                          <button
                            onClick={() => toggleSummary(log.id)}
                            className="text-xs text-slate-300 hover:text-white transition-colors text-left flex items-start gap-1"
                          >
                            <span>
                              {isExpanded
                                ? log.ai_summary
                                : truncate(log.ai_summary, 60)}
                            </span>
                            {log.ai_summary.length > 60 && (
                              <span className="shrink-0 mt-0.5">
                                {isExpanded ? (
                                  <ChevronUp size={12} className="text-slate-500" />
                                ) : (
                                  <ChevronDown size={12} className="text-slate-500" />
                                )}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-600">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onViewTranscript(log)}
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors whitespace-nowrap"
                        >
                          View Transcript
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── AI Agent Settings Tab ─────────────────────────────────────────────────────

function SettingsTab({ onSave }: { onSave: (msg: string) => void }) {
  const [greeting, setGreeting] = useState(
    "Hi! You've reached [Business Name]. I'm your AI assistant — how can I help you today?"
  );
  const [afterHours, setAfterHours] = useState("voicemail");
  const [aiVoice, setAiVoice] = useState("professional");

  const handleSave = () => {
    onSave("Settings saved successfully.");
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Business Greeting */}
      <div className="rounded-xl border border-white/10 bg-[var(--bg-card,#ffffff08)] p-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Business Greeting</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            The opening message your AI agent uses when answering a call.
          </p>
        </div>
        <textarea
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/40"
        />
        <button
          onClick={handleSave}
          className="rounded-lg px-4 py-2 text-xs font-semibold transition-colors text-white"
          style={{ background: "#14B8A6" }}
        >
          Save Greeting
        </button>
      </div>

      {/* Call Recording */}
      <div className="rounded-xl border border-white/10 bg-[var(--bg-card,#ffffff08)] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Call Recording</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Record and transcribe all inbound calls.
            </p>
            <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
              <Info size={11} /> Requires Twilio integration
            </p>
          </div>
          <div
            className="h-6 w-11 rounded-full bg-white/10 relative cursor-not-allowed"
            title="Requires Twilio"
          >
            <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-slate-500" />
          </div>
        </div>
      </div>

      {/* After-hours Handling */}
      <div className="rounded-xl border border-white/10 bg-[var(--bg-card,#ffffff08)] p-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">After-hours Handling</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            What happens when a call comes in outside business hours.
          </p>
        </div>
        <select
          value={afterHours}
          onChange={(e) => setAfterHours(e.target.value)}
          disabled
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-500 cursor-not-allowed focus:outline-none"
        >
          <option value="voicemail">Voicemail</option>
          <option value="sms">SMS Callback</option>
          <option value="custom">Custom Message</option>
        </select>
        <p className="text-xs text-slate-600">After-hours configuration available after Twilio setup.</p>
      </div>

      {/* Booking Integration */}
      <div className="rounded-xl border border-white/10 bg-[var(--bg-card,#ffffff08)] p-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Booking Integration</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Allow the AI agent to book appointments directly from a call.
          </p>
        </div>
        <select
          disabled
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-600 cursor-not-allowed focus:outline-none"
        >
          <option>Connect calendar (coming soon)</option>
        </select>
      </div>

      {/* AI Voice */}
      <div className="rounded-xl border border-white/10 bg-[var(--bg-card,#ffffff08)] p-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">AI Voice</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose the voice personality for your AI agent.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "professional", label: "Professional (default)" },
            { value: "friendly", label: "Friendly" },
            { value: "formal", label: "Formal" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setAiVoice(opt.value)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold border transition-colors ${
                aiVoice === opt.value
                  ? "text-white"
                  : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
              }`}
              style={
                aiVoice === opt.value
                  ? { background: "#14B8A620", color: "#14B8A6", borderColor: "#14B8A640", outline: "2px solid #14B8A640", outlineOffset: "2px" }
                  : {}
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save All */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors text-white"
          style={{ background: "#14B8A6" }}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}

// ── Integrations Tab ──────────────────────────────────────────────────────────

function IntegrationCard({
  icon: Icon,
  iconColor,
  iconBg,
  name,
  description,
  statusText,
  helpText,
  envSnippet,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  name: string;
  description: string;
  statusText: string;
  helpText: string;
  envSnippet?: string;
}) {
  const [showSnippet, setShowSnippet] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-[var(--bg-card,#ffffff08)] p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: iconBg }}
          >
            <Icon size={18} style={{ color: iconColor }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
          <span className="text-xs text-slate-500">{statusText}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500">{helpText}</p>
      <button
        onClick={() => setShowSnippet((v) => !v)}
        className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
      >
        {showSnippet ? "Hide" : "Connect"}
      </button>
      {showSnippet && envSnippet && (
        <pre className="rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-xs font-mono text-slate-300 whitespace-pre-wrap">
          {envSnippet}
        </pre>
      )}
    </div>
  );
}

function IntegrationsTab() {
  return (
    <div className="space-y-4 max-w-2xl">
      <IntegrationCard
        icon={PhoneCall}
        iconColor="#f87171"
        iconBg="#ef444415"
        name="Twilio"
        description="Phone number, call routing & SMS"
        statusText="Not connected"
        helpText="Provides your virtual phone number, inbound call routing, and SMS capabilities. Required for ANSWER to work."
        envSnippet={`TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nTWILIO_AUTH_TOKEN=your_auth_token_here\nTWILIO_PHONE_NUMBER=+61xxxxxxxxx`}
      />
      <IntegrationCard
        icon={Mic}
        iconColor="#a78bfa"
        iconBg="#8b5cf615"
        name="ElevenLabs"
        description="AI Voice Synthesis"
        statusText="Not connected"
        helpText="Powers natural-sounding AI voice. Without ElevenLabs, ANSWER falls back to a basic TTS voice."
        envSnippet={`ELEVENLABS_API_KEY=your_api_key_here\nELEVENLABS_VOICE_ID=your_voice_id_here`}
      />
      <IntegrationCard
        icon={FileText}
        iconColor="#60a5fa"
        iconBg="#3b82f615"
        name="Whisper (OpenAI)"
        description="Call transcription"
        statusText="Requires OPENAI_API_KEY"
        helpText="Transcribes calls in real time using OpenAI Whisper. Enables AI summaries and searchable call history."
        envSnippet={`OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
      />

      {/* Coming soon banner */}
      <div
        className="rounded-xl border p-5 flex items-start gap-3"
        style={{ background: "#14B8A60a", borderColor: "#14B8A630" }}
      >
        <Plug size={18} style={{ color: "#14B8A6" }} className="shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#14B8A6" }}>
            Coming Q3 2026
          </p>
          <p className="text-xs text-slate-500 mt-1">
            SERVLO ANSWER is currently in early access. One-click Twilio setup, calendar booking
            integration, and automatic AI follow-up SMS are on the roadmap. Reach out to get early
            access.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export function AnswerDashboard({ callLogs, stats }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("calls");
  const [transcriptLog, setTranscriptLog] = useState<CallLog | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "calls", label: "Recent Calls" },
    { key: "settings", label: "AI Agent Settings" },
    { key: "integrations", label: "Integrations" },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary, white)" }}>
                SERVLO ANSWER
              </h1>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  background: "#0d4a47",
                  color: "#14B8A6",
                  border: "1px solid #14B8A633",
                }}
              >
                Q3 2026 — Early Access
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted, #94a3b8)" }}>
              AI Phone Agent — answer every call, 24/7
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Calls */}
          <div
            className="flex flex-col gap-2 rounded-xl border p-5"
            style={{ background: "var(--bg-card, #ffffff08)", borderColor: "var(--border, rgba(255,255,255,0.1))" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted, #64748b)" }}>
                Total Calls
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#14B8A615" }}>
                <PhoneCall size={15} style={{ color: "#14B8A6" }} />
              </span>
            </div>
            <p className="text-3xl font-bold tabular-nums" style={{ color: "#14B8A6" }}>
              {stats.totalCalls}
            </p>
          </div>

          {/* Bookings Made */}
          <div
            className="flex flex-col gap-2 rounded-xl border p-5"
            style={{ background: "var(--bg-card, #ffffff08)", borderColor: "var(--border, rgba(255,255,255,0.1))" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted, #64748b)" }}>
                Bookings Made
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <CalendarCheck size={15} className="text-emerald-400" />
              </span>
            </div>
            <p className="text-3xl font-bold tabular-nums text-emerald-400">
              {stats.bookingsMade}
            </p>
          </div>

          {/* Missed / Voicemail */}
          <div
            className="flex flex-col gap-2 rounded-xl border p-5"
            style={{ background: "var(--bg-card, #ffffff08)", borderColor: "var(--border, rgba(255,255,255,0.1))" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted, #64748b)" }}>
                Missed / Voicemail
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <VoicemailIcon size={15} className="text-amber-400" />
              </span>
            </div>
            <p
              className={`text-3xl font-bold tabular-nums ${
                stats.missedCalls > 0 ? "text-amber-400" : ""
              }`}
              style={stats.missedCalls === 0 ? { color: "#14B8A6" } : {}}
            >
              {stats.missedCalls}
            </p>
          </div>

          {/* Avg Duration */}
          <div
            className="flex flex-col gap-2 rounded-xl border p-5"
            style={{ background: "var(--bg-card, #ffffff08)", borderColor: "var(--border, rgba(255,255,255,0.1))" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted, #64748b)" }}>
                Avg Duration
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#14B8A615" }}>
                <Clock size={15} style={{ color: "#14B8A6" }} />
              </span>
            </div>
            <p className="text-3xl font-bold tabular-nums" style={{ color: "#14B8A6" }}>
              {formatDuration(stats.avgDuration)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <nav
            className="flex gap-1 border-b"
            style={{ borderColor: "var(--border, rgba(255,255,255,0.1))" }}
            aria-label="Answer dashboard sections"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? ""
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
                style={
                  activeTab === tab.key
                    ? { color: "#14B8A6", borderColor: "#14B8A6" }
                    : {}
                }
                aria-current={activeTab === tab.key ? "page" : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="pt-5">
            {activeTab === "calls" && (
              <RecentCallsTab
                callLogs={callLogs}
                onViewTranscript={setTranscriptLog}
              />
            )}
            {activeTab === "settings" && (
              <SettingsTab onSave={(msg) => addToast(msg, "success")} />
            )}
            {activeTab === "integrations" && <IntegrationsTab />}
          </div>
        </div>
      </div>

      {/* Transcript modal */}
      <TranscriptModal log={transcriptLog} onClose={() => setTranscriptLog(null)} />

      {/* Toast */}
      <Toast messages={toasts} onDismiss={dismissToast} />
    </>
  );
}
