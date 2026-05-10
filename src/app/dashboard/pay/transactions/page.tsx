import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const COLOR = "#22C55E";
const COLOR_LIGHT = "#86EFAC";
const COLOR_BG = "rgb(34 197 94 / 0.12)";
const COLOR_BORDER = "rgb(34 197 94 / 0.3)";

const DEMO_TRANSACTIONS = [
  {
    date: "Today 10:32 AM",
    client: "James Nguyen",
    amount: "$420.00",
    fee: "$6.13",
    net: "$413.87",
    status: "Paid",
  },
  {
    date: "Today 8:15 AM",
    client: "Sarah Mitchell",
    amount: "$1,200.00",
    fee: "$17.05",
    net: "$1,182.95",
    status: "Pending",
  },
  {
    date: "Yesterday 3:44 PM",
    client: "Tom Baker",
    amount: "$85.00",
    fee: "$1.44",
    net: "$83.56",
    status: "Paid",
  },
  {
    date: "Yesterday 9:00 AM",
    client: "Priya Sharma",
    amount: "$2,450.00",
    fee: "$34.55",
    net: "$2,415.45",
    status: "Paid",
  },
  {
    date: "Mon 11:20 AM",
    client: "Ken Williamson",
    amount: "$310.00",
    fee: "$4.59",
    net: "$305.41",
    status: "Refunded",
  },
];

export default async function PayTransactionsPage() {
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
          SERVLO Pay is launching Q4 2026. Transaction data shown is a preview.
        </p>
        <a
          href="mailto:hello@servlo.com.au?subject=SERVLO Pay Early Access"
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white"
          style={{ background: COLOR }}
        >
          Join waitlist
        </a>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Transactions
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Every payment processed through SERVLO Pay.
        </p>
      </div>

      <div
        className="relative overflow-hidden rounded-xl border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* Coming soon overlay */}
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${COLOR} 8%, rgba(0,0,0,0.65))` }}
        >
          <p className="text-base font-bold" style={{ color: COLOR_LIGHT }}>
            Live transactions available at launch — Q4 2026
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Preview below shows what your transaction history will look like
          </p>
        </div>

        <div className="p-5" style={{ filter: "blur(1px)", opacity: 0.5 }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Date", "Client", "Amount", "Fee", "Net", "Status"].map((h) => (
                    <th
                      key={h}
                      className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_TRANSACTIONS.map((tx, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="py-3 pr-4 text-xs" style={{ color: "var(--text-muted)" }}>
                      {tx.date}
                    </td>
                    <td className="py-3 pr-4 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {tx.client}
                    </td>
                    <td className="py-3 pr-4 text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                      {tx.amount}
                    </td>
                    <td className="py-3 pr-4 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {tx.fee}
                    </td>
                    <td className="py-3 pr-4 text-sm font-semibold tabular-nums" style={{ color: COLOR }}>
                      {tx.net}
                    </td>
                    <td className="py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background:
                            tx.status === "Paid"
                              ? "rgb(34 197 94 / 0.15)"
                              : tx.status === "Pending"
                              ? "rgb(234 179 8 / 0.15)"
                              : "rgb(244 63 94 / 0.15)",
                          color:
                            tx.status === "Paid"
                              ? COLOR_LIGHT
                              : tx.status === "Pending"
                              ? "#FDE047"
                              : "#FDA4AF",
                        }}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
