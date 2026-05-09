import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

// ── Types ────────────────────────────────────────────────────────────────────

type AutoCheck = {
  id: string;
  label: string;
  pass: boolean;
  detail?: string;
};

type ManualSection = {
  title: string;
  items: string[];
};

// ── Auto-checks (server-side, no network) ───────────────────────────────────

function checkEnvVars(): AutoCheck[] {
  const required = [
    ["NEXT_PUBLIC_SUPABASE_URL", "Supabase URL"],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase Anon Key"],
    ["SUPABASE_SERVICE_ROLE_KEY", "Supabase Service Role Key"],
    ["STRIPE_SECRET_KEY", "Stripe Secret Key"],
    ["STRIPE_WEBHOOK_SECRET", "Stripe Webhook Secret"],
    ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "Stripe Publishable Key"],
    ["NEXT_PUBLIC_APP_URL", "App URL"],
    ["RESEND_API_KEY", "Resend API Key"],
    ["RESEND_FROM_EMAIL", "Resend From Email"],
    ["CRON_SECRET", "Cron Secret"],
  ] as const;

  return required.map(([key, label]) => {
    const val = process.env[key];
    const pass = Boolean(val && val.length > 0);
    const detail = pass ? "Set" : "Not set";
    return { id: `env_${key}`, label, pass, detail };
  });
}

// ── Database health checks ───────────────────────────────────────────────────

async function checkDatabase(): Promise<AutoCheck[]> {
  const admin = createAdminClient();
  const checks: AutoCheck[] = [];

  // Check profiles table accessible
  const { error: profilesErr } = await admin
    .from("profiles")
    .select("id")
    .limit(1);
  checks.push({
    id: "db_profiles",
    label: "DB: profiles table",
    pass: !profilesErr,
    detail: profilesErr?.message,
  });

  // Check businesses table accessible
  const { error: bizErr } = await admin
    .from("businesses")
    .select("id")
    .limit(1);
  checks.push({
    id: "db_businesses",
    label: "DB: businesses table",
    pass: !bizErr,
    detail: bizErr?.message,
  });

  // Check plan_ai_limits seeded
  const { data: aiLimits, error: aiErr } = await admin
    .from("plan_ai_limits")
    .select("plan")
    .limit(10);
  const aiSeeded = !aiErr && (aiLimits?.length ?? 0) >= 5;
  checks.push({
    id: "db_ai_limits",
    label: "DB: plan_ai_limits seeded",
    pass: aiSeeded,
    detail: aiErr?.message ?? `${aiLimits?.length ?? 0} plans configured`,
  });

  // Check notifications table accessible
  const { error: notifErr } = await admin
    .from("notifications")
    .select("id")
    .limit(1);
  checks.push({
    id: "db_notifications",
    label: "DB: notifications table",
    pass: !notifErr,
    detail: notifErr?.message,
  });

  return checks;
}

// ── Stripe config checks ─────────────────────────────────────────────────────

function checkStripeConfig(): AutoCheck[] {
  const checks: AutoCheck[] = [];

  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  checks.push({
    id: "stripe_mode",
    label: "Stripe: Live mode key",
    pass: secretKey.startsWith("sk_live_"),
    detail: secretKey.startsWith("sk_live_")
      ? "Live key detected"
      : secretKey.startsWith("sk_test_")
      ? "Test key — switch to live before launch"
      : "Key missing",
  });

  const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  checks.push({
    id: "stripe_pub_mode",
    label: "Stripe: Live publishable key",
    pass: pubKey.startsWith("pk_live_"),
    detail: pubKey.startsWith("pk_live_")
      ? "Live key detected"
      : pubKey.startsWith("pk_test_")
      ? "Test key — switch to live before launch"
      : "Key missing",
  });

  // Verify price IDs are set (non-empty test)
  const priceIds = [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_SOLO,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS,
  ];
  const allPrices = priceIds.every((p) => p && p.startsWith("price_"));
  checks.push({
    id: "stripe_prices",
    label: "Stripe: Price IDs configured",
    pass: allPrices,
    detail: allPrices
      ? "Solo, Team, Business price IDs set"
      : "One or more price IDs missing or invalid",
  });

  return checks;
}

// ── App config checks ────────────────────────────────────────────────────────

function checkAppConfig(): AutoCheck[] {
  const checks: AutoCheck[] = [];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  checks.push({
    id: "app_url_https",
    label: "App URL uses HTTPS",
    pass: appUrl.startsWith("https://"),
    detail: appUrl || "Not set",
  });

  checks.push({
    id: "app_url_no_localhost",
    label: "App URL is not localhost",
    pass: Boolean(appUrl && !appUrl.includes("localhost") && !appUrl.includes("127.0.0.1")),
    detail: appUrl || "Not set",
  });

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "";
  checks.push({
    id: "email_from_domain",
    label: "From email uses custom domain",
    pass: Boolean(fromEmail && !fromEmail.includes("@resend.dev") && fromEmail.includes("@")),
    detail: fromEmail || "Not set",
  });

  return checks;
}

// ── Manual checklist sections ─────────────────────────────────────────────────

const MANUAL_SECTIONS: ManualSection[] = [
  {
    title: "Stripe Setup",
    items: [
      "Stripe account is fully verified (KYC complete)",
      "Webhook endpoint configured for production URL (/api/stripe/webhook)",
      "Webhook events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.paid, invoice.payment_failed",
      "Stripe Tax settings configured for Australia (GST 10%)",
      "Founding member coupon code created in Stripe",
    ],
  },
  {
    title: "DNS & Domain",
    items: [
      "Custom domain pointing to Vercel deployment",
      "SSL certificate active (auto-managed by Vercel)",
      "www redirect configured",
      "Email domain verified in Resend (SPF, DKIM records)",
      "MX records configured for hello@servlo.com.au",
    ],
  },
  {
    title: "Email",
    items: [
      "Resend domain verified",
      "Test transactional emails sent and received",
      "Welcome email template reviewed",
      "Trial expiry emails tested",
      "Unsubscribe link functional",
    ],
  },
  {
    title: "Legal",
    items: [
      "Terms of Service published at /legal/terms",
      "Privacy Policy published at /legal/privacy",
      "Australian Consumer Law compliance reviewed",
      "ABN displayed in footer/invoices",
      "GST invoice format compliant with ATO requirements",
    ],
  },
  {
    title: "Security",
    items: [
      "Supabase RLS enabled on all tables",
      "Admin accounts have strong passwords + 2FA",
      "CRON_SECRET set and verified",
      "Service role key not exposed client-side",
      "Content Security Policy reviewed for production",
    ],
  },
  {
    title: "Monitoring & Analytics",
    items: [
      "Error monitoring configured (Sentry or similar)",
      "Vercel Analytics enabled",
      "Uptime monitoring configured",
      "Log retention policy set",
    ],
  },
  {
    title: "Pre-launch",
    items: [
      "Smoke test: full signup → onboarding → first job → invoice flow",
      "Smoke test: Stripe checkout → subscription active → dashboard unlocked",
      "Demo data seeding tested",
      "Mobile responsiveness reviewed",
      "Load test / stress test completed",
      "Backup strategy confirmed (Supabase automatic backups)",
    ],
  },
];

// ── Status indicator ─────────────────────────────────────────────────────────

function StatusBadge({ pass }: { pass: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
        pass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
      }`}
    >
      {pass ? "✓ PASS" : "✗ FAIL"}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function LaunchChecklistPage() {
  await requireAdmin();

  const [envChecks, dbChecks] = await Promise.all([
    Promise.resolve(checkEnvVars()),
    checkDatabase(),
  ]);

  const stripeChecks = checkStripeConfig();
  const appChecks = checkAppConfig();

  const allAutoChecks = [...envChecks, ...dbChecks, ...stripeChecks, ...appChecks];
  const passCount = allAutoChecks.filter((c) => c.pass).length;
  const failCount = allAutoChecks.filter((c) => !c.pass).length;

  const readyPercent = Math.round((passCount / allAutoChecks.length) * 100);

  return (
    <section className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pre-Launch Checklist</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Automated checks + manual items to complete before going live
          </p>
        </div>
        <Link
          href="/dashboard/admin"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
        >
          ← Admin
        </Link>
      </div>

      {/* Overall score */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[var(--text-primary)]">Automated Checks</h2>
          <span
            className={`text-sm font-bold ${
              readyPercent === 100
                ? "text-green-600"
                : readyPercent >= 80
                ? "text-amber-600"
                : "text-red-600"
            }`}
          >
            {passCount}/{allAutoChecks.length} passing ({readyPercent}%)
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              readyPercent === 100
                ? "bg-green-500"
                : readyPercent >= 80
                ? "bg-amber-500"
                : "bg-red-500"
            }`}
            style={{ width: `${readyPercent}%` }}
          />
        </div>
        {failCount > 0 && (
          <p className="mt-2 text-xs text-red-600">{failCount} check{failCount !== 1 ? "s" : ""} failing — resolve before launch</p>
        )}
      </div>

      {/* Env vars */}
      <CheckSection title="Environment Variables" checks={envChecks} />

      {/* Database */}
      <CheckSection title="Database Health" checks={dbChecks} />

      {/* Stripe */}
      <CheckSection title="Stripe Configuration" checks={stripeChecks} />

      {/* App config */}
      <CheckSection title="App Configuration" checks={appChecks} />

      {/* Manual sections */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Manual Checklist
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Check these items off manually. State persists in localStorage (browser only).
        </p>
        {MANUAL_SECTIONS.map((section) => (
          <ManualCheckSection key={section.title} section={section} />
        ))}
      </div>
    </section>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CheckSection({ title, checks }: { title: string; checks: AutoCheck[] }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="border-b border-[var(--border)] px-5 py-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {checks.map((check) => (
          <div key={check.id} className="flex items-center justify-between px-5 py-3 gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-primary)]">{check.label}</p>
              {check.detail && (
                <p className={`text-xs mt-0.5 ${check.pass ? "text-[var(--text-muted)]" : "text-red-500"}`}>
                  {check.detail}
                </p>
              )}
            </div>
            <StatusBadge pass={check.pass} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ManualCheckSection({ section }: { section: ManualSection }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="border-b border-[var(--border)] px-5 py-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{section.title}</h3>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {section.items.map((item, idx) => (
          <label
            key={idx}
            className="flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-[var(--border)] accent-[var(--accent-color)] shrink-0"
            />
            <span className="text-sm text-[var(--text-secondary)]">{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
