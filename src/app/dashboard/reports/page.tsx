export default function ReportsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports</h1>
      <p className="max-w-2xl text-[var(--text-secondary)]">
        Revenue trends, job profitability, and crew utilisation reports will live here — exportable for your accountant.
      </p>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
        <p className="text-lg font-semibold text-[var(--text-primary)]">Coming soon</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">PDF exports and date-range filtering tailored for Australian trades.</p>
      </div>
    </section>
  );
}
