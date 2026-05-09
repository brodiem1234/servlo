"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

type SmsMessage = {
  id: string;
  message: string;
  direction: "inbound" | "outbound";
  sent_at: string | null;
  status: string;
  is_stub?: boolean;
};

type ThreadResponse = {
  messages: SmsMessage[];
  stub?: boolean;
};

type SendResponse = {
  success: boolean;
  stub?: boolean;
  message_id?: string;
  error?: string;
};

type Props = {
  clientId: string;
  clientName: string;
  clientPhone?: string | null;
};

export function SmsThread({ clientId, clientName, clientPhone }: Props) {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [stub, setStub] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/sms/thread/${clientId}`);
      if (!res.ok) return;
      const data: ThreadResponse = await res.json();
      setMessages(data.messages ?? []);
      if (data.stub) setStub(true);
    } catch {
      // swallow
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !clientPhone) return;
    setSending(true);
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_number: clientPhone,
          message: draft.trim(),
          client_id: clientId,
        }),
      });
      const data: SendResponse = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error ?? "Failed to send SMS");
        return;
      }
      if (data.stub) setStub(true);
      // Optimistically append the sent message
      setMessages((prev) => [
        ...prev,
        {
          id: data.message_id ?? crypto.randomUUID(),
          message: draft.trim(),
          direction: "outbound",
          sent_at: new Date().toISOString(),
          status: "sent",
          is_stub: data.stub,
        },
      ]);
      setDraft("");
    } catch {
      showToast("Network error sending SMS");
    } finally {
      setSending(false);
    }
  };

  if (!clientPhone) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div>
          <p className="text-3xl mb-3">📵</p>
          <p className="text-sm font-medium text-[var(--text-primary)]">No phone number on file</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Add a mobile number to {clientName}&apos;s profile to enable SMS.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {stub && (
        <div className="mx-4 mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
          SMS integration not yet configured. Install Twilio to enable real SMS.
          Messages shown here are stubs and were not delivered.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">
            No messages yet. Send the first SMS to {clientName}.
          </p>
        ) : (
          messages.map((msg) => {
            const isOut = msg.direction === "outbound";
            return (
              <div
                key={msg.id}
                className={`flex ${isOut ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[72%] px-3.5 py-2 text-sm leading-snug break-words ${
                    isOut
                      ? "bg-[var(--accent-color)] text-white rounded-tl-xl rounded-bl-xl rounded-tr-sm"
                      : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-tr-xl rounded-br-xl rounded-tl-sm"
                  }`}
                >
                  <p>{msg.message}</p>
                  <p
                    className={`mt-0.5 text-[10px] ${isOut ? "text-white/60 text-right" : "text-[var(--text-muted)]"}`}
                  >
                    {msg.sent_at
                      ? new Date(msg.sent_at).toLocaleTimeString("en-AU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                    {msg.is_stub ? " · stub" : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex items-end gap-2 border-t border-[var(--border)] p-3"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={`Message ${clientName}…`}
          rows={2}
          className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-color)] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
          aria-label="Send SMS"
        >
          {sending ? (
            <span className="text-xs">…</span>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </form>

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
