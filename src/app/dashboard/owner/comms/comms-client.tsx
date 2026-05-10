"use client";

import React, { useState } from "react";
import { SmsThread } from "@/components/dashboard/sms-thread";

type Thread = {
  id: string;
  subject: string;
  last_message_at: string;
  message_count: number;
  client_id: string | null;
  job_id: string | null;
};

type Client = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone?: string | null;
};

type Message = {
  id: string;
  direction: "inbound" | "outbound";
  from_email: string;
  to_email: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  status: string;
  sent_at: string | null;
  received_at: string | null;
  created_at: string;
};

type Props = {
  threads: Thread[];
  clients: Client[];
  clientMap: Record<string, { full_name: string | null; email: string | null; phone?: string | null }>;
  emailProvider?: string | null;
  emailConnectedAddress?: string | null;
  emailSyncEnabled?: boolean;
};

type CommsTab = "email" | "sms";

export function CommsClient({ threads, clients, clientMap, emailProvider, emailConnectedAddress, emailSyncEnabled }: Props) {
  const [tab, setTab] = useState<CommsTab>("email");
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [composing, setComposing] = useState(false);
  const [newEmail, setNewEmail] = useState({ to: "", subject: "", body: "" });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [localThreads, setLocalThreads] = useState<Thread[]>(threads);
  const [draftingReply, setDraftingReply] = useState(false);
  const replyBodyRef = React.useRef<HTMLTextAreaElement>(null);

  // SMS tab state
  const [smsClientId, setSmsClientId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "conversation">("list");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openThread = async (thread: Thread) => {
    setMobileView("conversation");
    setSelectedThread(thread);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/email/thread/${thread.id}`);
      if (res.ok) {
        const d = await res.json();
        setMessages(d.messages ?? []);
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread && !composing) return;
    setSending(true);
    try {
      const clientInfo = selectedThread?.client_id ? clientMap[selectedThread.client_id] : null;
      const toEmail = composing ? newEmail.to : (clientInfo?.email ?? "");
      const subject = composing ? newEmail.subject : selectedThread?.subject ?? "";
      const bodyText = composing ? newEmail.body : (document.getElementById("reply-body") as HTMLTextAreaElement)?.value ?? "";

      if (!toEmail) {
        showToast("No recipient email address — add one to this client first.");
        return;
      }

      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: composing ? undefined : selectedThread?.id,
          client_id: selectedThread?.client_id,
          to_email: toEmail,
          subject,
          body_html: `<p>${bodyText.replace(/\n/g, "<br>")}</p>`,
          body_text: bodyText,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Send failed");
      }

      const d = await res.json();
      showToast("Email sent");

      if (composing) {
        setComposing(false);
        setNewEmail({ to: "", subject: "", body: "" });
        // Refresh thread list
        if (d.thread_id) {
          const now = new Date().toISOString();
          setLocalThreads((prev) => {
            const existing = prev.find((t) => t.id === d.thread_id);
            if (existing) {
              return prev.map((t) => t.id === d.thread_id ? { ...t, last_message_at: now } : t);
            }
            return [{ id: d.thread_id, subject, last_message_at: now, message_count: 1, client_id: null, job_id: null }, ...prev];
          });
        }
      } else {
        // Reload messages
        if (selectedThread) openThread(selectedThread);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const inputCls = "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]";

  const tabBtnCls = (active: boolean) =>
    `flex-1 py-2 text-xs font-semibold transition-colors ${
      active
        ? "border-b-2 border-[var(--accent-color)] text-[var(--accent-color)]"
        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
    }`;

  return (
    <section className="flex flex-col h-[calc(100vh-120px)] overflow-hidden rounded-xl border border-[var(--border)]">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border)] bg-[var(--bg-card)]">
        <button className={tabBtnCls(tab === "email")} onClick={() => { setTab("email"); setMobileView("list"); }}>
          ✉️ Email
        </button>
        <button className={tabBtnCls(tab === "sms")} onClick={() => { setTab("sms"); setMobileView("list"); }}>
          📱 SMS
        </button>
      </div>

      {tab === "sms" ? (
        /* SMS panel */
        <div className="flex flex-1 overflow-hidden">
          {/* Client list for SMS */}
          <aside className={`flex-col border-r border-[var(--border)] bg-[var(--bg-card)] ${mobileView === "conversation" ? "hidden md:flex md:w-72 md:shrink-0" : "flex flex-1 md:w-72 md:flex-none md:shrink-0"}`}>
            <div className="border-b border-[var(--border)] px-4 py-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Clients</h2>
            </div>
            <ul className="flex-1 overflow-y-auto">
              {clients.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">No clients yet.</li>
              ) : null}
              {clients.map((client) => {
                const isActive = smsClientId === client.id;
                return (
                  <li key={client.id}>
                    <button
                      onClick={() => { setSmsClientId(client.id); setMobileView("conversation"); }}
                      className={`w-full px-4 py-3 text-left hover:bg-[var(--bg-secondary)] ${isActive ? "bg-[var(--bg-secondary)]" : ""}`}
                    >
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {client.full_name ?? "Unnamed client"}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {client.phone ?? <span className="italic">No phone</span>}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* SMS thread panel */}
          <div className={`flex-col overflow-hidden bg-[var(--bg-primary)] ${mobileView === "list" ? "hidden md:flex md:flex-1" : "flex flex-1"}`}>
            {smsClientId ? (() => {
              const client = clients.find((c) => c.id === smsClientId);
              return (
                <>
                  <div className="border-b border-[var(--border)] px-4 py-3 md:px-6">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setMobileView("list"); setSmsClientId(null); }}
                        className="shrink-0 text-sm font-semibold text-[var(--accent-color)] md:hidden"
                      >
                        ← Back
                      </button>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {client?.full_name ?? "Client"}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{client?.phone ?? "No phone"}</p>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <SmsThread
                      clientId={smsClientId}
                      clientName={client?.full_name ?? "Client"}
                      clientPhone={client?.phone}
                    />
                  </div>
                </>
              );
            })() : (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl mb-3">📱</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Select a client to SMS</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Two-way SMS threads per client</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
      /* Email panel — original layout */
      <div className="flex flex-1 flex-col overflow-hidden">
      {/* Email provider banner */}
      {!emailProvider && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)]">Connect your email</p>
            <p className="text-xs text-[var(--text-muted)]">Send from your real email address</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/api/auth/gmail" className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-white/10 transition-colors">
              <span className="text-base">G</span> Gmail
            </a>
            <a href="/api/auth/outlook" className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-white/10 transition-colors">
              <span className="text-base">⊞</span> Outlook
            </a>
          </div>
        </div>
      )}
      {emailProvider && emailSyncEnabled && (
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-card)] px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400"></span>
            <span className="text-xs text-[var(--text-muted)]">
              Sending from <span className="font-medium text-[var(--text-primary)]">{emailConnectedAddress}</span> via {emailProvider === "gmail" ? "Gmail" : "Outlook"}
            </span>
          </div>
          <a href="/dashboard/owner/settings?tab=integrations" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">Manage</a>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
      {/* Thread list */}
      <aside className={`flex-col border-r border-[var(--border)] bg-[var(--bg-card)] ${mobileView === "conversation" ? "hidden md:flex md:w-72 md:shrink-0" : "flex flex-1 md:w-72 md:flex-none md:shrink-0"}`}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Messages</h2>
          <button
            onClick={() => { setComposing(true); setSelectedThread(null); setMobileView("conversation"); }}
            className="rounded bg-[var(--accent-color)] px-2 py-1 text-xs font-medium text-white hover:opacity-90"
          >
            + New
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {localThreads.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">No email threads yet.</li>
          ) : null}
          {localThreads.map((thread) => {
            const client = thread.client_id ? clientMap[thread.client_id] : null;
            const isActive = selectedThread?.id === thread.id;
            return (
              <li key={thread.id}>
                <button
                  onClick={() => openThread(thread)}
                  className={`w-full px-4 py-3 text-left hover:bg-[var(--bg-secondary)] ${isActive ? "bg-[var(--bg-secondary)]" : ""}`}
                >
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {client?.full_name ?? thread.subject}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{thread.subject}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {new Date(thread.last_message_at).toLocaleDateString("en-AU")}
                    {thread.message_count > 0 ? ` · ${thread.message_count} msgs` : ""}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Main panel */}
      <div className={`flex-col bg-[var(--bg-primary)] ${mobileView === "list" ? "hidden md:flex md:flex-1" : "flex flex-1"}`}>
        {composing ? (
          <div className="flex flex-1 flex-col p-4 md:p-6">
            <button
              type="button"
              onClick={() => { setComposing(false); setMobileView("list"); }}
              className="mb-3 text-sm font-semibold text-[var(--accent-color)] md:hidden"
            >
              ← Back
            </button>
            <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">New Message</h3>
            <form onSubmit={sendReply} className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">To</label>
                <select
                  className={inputCls}
                  value={newEmail.to}
                  onChange={(e) => setNewEmail((p) => ({ ...p, to: e.target.value }))}
                  required
                >
                  <option value="">Select client…</option>
                  {clients.filter((c) => c.email).map((c) => (
                    <option key={c.id} value={c.email!}>{c.full_name} ({c.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Subject</label>
                <input
                  className={inputCls}
                  required
                  value={newEmail.subject}
                  onChange={(e) => setNewEmail((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="Subject"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Message</label>
                <textarea
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                  rows={8}
                  required
                  value={newEmail.body}
                  onChange={(e) => setNewEmail((p) => ({ ...p, body: e.target.value }))}
                  placeholder="Write your message…"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={sending} className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
                  {sending ? "Sending…" : "Send"}
                </button>
                <button type="button" onClick={() => setComposing(false)} className="rounded border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : selectedThread ? (
          <div className="flex flex-1 flex-col">
            {/* Thread header */}
            <div className="border-b border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  className="shrink-0 text-sm font-semibold text-[var(--accent-color)] md:hidden"
                >
                  ← Back
                </button>
                <p className="truncate text-base font-semibold text-[var(--text-primary)]">{selectedThread.subject}</p>
              </div>
              {selectedThread.client_id && clientMap[selectedThread.client_id] ? (
                <p className="text-xs text-[var(--text-muted)]">
                  {clientMap[selectedThread.client_id].full_name} · {clientMap[selectedThread.client_id].email}
                </p>
              ) : null}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {loadingMessages ? (
                <p className="text-sm text-[var(--text-muted)]">Loading…</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No messages yet.</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`max-w-lg rounded-xl p-4 ${msg.direction === "outbound" ? "ml-auto bg-[var(--accent-color)] text-white" : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)]"}`}>
                    <p className="mb-1 text-xs font-medium opacity-75">
                      {msg.direction === "outbound" ? "You" : msg.from_email}
                      {" · "}
                      {new Date(msg.sent_at ?? msg.received_at ?? msg.created_at).toLocaleString("en-AU")}
                    </p>
                    {msg.body_html ? (
                      <div
                        className="text-sm prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: msg.body_html }}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.body_text}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Reply box */}
            <form onSubmit={sendReply} className="border-t border-[var(--border)] p-3 space-y-2">
              <textarea
                id="reply-body"
                ref={replyBodyRef}
                className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                rows={3}
                placeholder="Type your reply…"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {sending ? "…" : "Send"}
                </button>
                <button
                  type="button"
                  disabled={draftingReply}
                  onClick={async () => {
                    const lastInbound = [...messages].reverse().find((m) => m.direction === "inbound");
                    if (!lastInbound) { showToast("No inbound message to reply to"); return; }
                    setDraftingReply(true);
                    try {
                      const res = await fetch("/api/ai/draft-reply", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ client_message: lastInbound.body_text ?? lastInbound.body_html ?? "", format: "email" }),
                      });
                      if (res.ok) {
                        const d = await res.json() as { reply?: string };
                        if (replyBodyRef.current && d.reply) replyBodyRef.current.value = d.reply;
                      }
                    } finally {
                      setDraftingReply(false);
                    }
                  }}
                  className="rounded border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] flex items-center gap-1.5 disabled:opacity-50"
                >
                  {draftingReply ? "Drafting…" : <><span aria-hidden>✨</span> AI Draft</>}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-4xl mb-3">✉️</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">Select a thread to read</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">or compose a new message</p>
            </div>
          </div>
        )}
      </div>
      </div>
      </div>
      )}

      {toast ? (
        <div className="fixed bottom-6 right-6 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </section>
  );
}
