export default function SchedulePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Schedule</h1>
      <p className="max-w-2xl text-[var(--text-secondary)]">
        A dedicated crew calendar and dispatch view is on the way. For now, use{" "}
        <strong className="text-[var(--text-primary)]">Jobs</strong> with list or calendar view to plan work.
      </p>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center">
        <p className="text-lg font-semibold text-[var(--text-primary)]">Coming soon</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Drag-and-drop scheduling across teams and subcontractors.</p>
      </div>
    </section>
  );
}
