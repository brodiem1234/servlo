import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const COLOR = "#14B8A6";
const COLOR_LIGHT = "#5EEAD4";
const COLOR_BG = "rgb(20 184 166 / 0.12)";
const COLOR_BORDER = "rgb(20 184 166 / 0.3)";

export default async function AnswerSettingsPage() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <section className="space-y-6">
      {/* Launch banner */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-5 py-4"
        style={{ background: COLOR_BG, border: `1px solid ${COLOR_BORDER}` }}
      >
        <p className="text-sm font-semibold" style={{ color: COLOR_LIGHT }}>
          SERVLO Answer is launching Q3 2026. Settings will be configurable at launch.
        </p>
        <a
          href="mailto:hello@servlo.com.au?subject=SERVLO Answer Early Access"
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: COLOR }}
        >
          Join waitlist
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          AI Settings
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Configure how your AI agent answers calls and represents your business.
        </p>
      </div>

      {/* Settings form — greyed out with overlay */}
      <div className="relative">
        {/* Overlay */}
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${COLOR} 8%, rgba(0,0,0,0.6))` }}
        >
          <div className="text-center">
            <p className="text-base font-bold" style={{ color: COLOR_LIGHT }}>
              Available when Answer launches Q3 2026
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Your settings will be pre-filled from your business profile
            </p>
          </div>
        </div>

        <div
          className="space-y-6 rounded-xl border p-6"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
            opacity: 0.4,
            filter: "blur(0.5px)",
            pointerEvents: "none",
          }}
        >
          {/* Business hours */}
          <div>
            <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Business Hours
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Monday – Friday
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    defaultValue="08:00"
                    disabled
                    className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
                    style={{
                      background: "var(--bg-secondary)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>to</span>
                  <input
                    type="time"
                    defaultValue="17:00"
                    disabled
                    className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
                    style={{
                      background: "var(--bg-secondary)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Saturday
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    defaultValue="08:00"
                    disabled
                    className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
                    style={{
                      background: "var(--bg-secondary)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>to</span>
                  <input
                    type="time"
                    defaultValue="12:00"
                    disabled
                    className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
                    style={{
                      background: "var(--bg-secondary)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Custom greeting */}
          <div>
            <label className="mb-1 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Custom Greeting
            </label>
            <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
              What your AI agent says when it picks up a call.
            </p>
            <textarea
              rows={3}
              disabled
              defaultValue="G'day, thanks for calling [Business Name]. This is your AI assistant — I can help you book a job or answer questions. How can I help today?"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
                resize: "none",
              }}
            />
          </div>

          {/* Escalation rules */}
          <div>
            <label className="mb-1 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Escalation Rules
            </label>
            <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
              When should the AI transfer to you directly?
            </p>
            <select
              disabled
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <option>Emergency or urgent requests only</option>
              <option>Any call mentioning price negotiation</option>
              <option>Calls longer than 3 minutes</option>
              <option>Always transfer after initial greeting</option>
            </select>
          </div>

          {/* Voicemail fallback */}
          <div>
            <label className="mb-1 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Voicemail Fallback
            </label>
            <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
              What happens when a call can&apos;t be handled or is outside hours?
            </p>
            <select
              disabled
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <option>AI takes message and sends you an SMS</option>
              <option>Standard voicemail box</option>
              <option>AI schedules a callback time</option>
            </select>
          </div>

          <button
            disabled
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white opacity-50"
            style={{ background: COLOR }}
          >
            Save settings
          </button>
        </div>
      </div>
    </section>
  );
}
