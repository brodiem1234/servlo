export default function ContractorsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Contractors</h1>
      <p className="max-w-2xl text-[var(--text-secondary)]">
        Track subcontractors and external crews linked to your jobs. Full contractor workflows are coming soon — use{" "}
        <strong className="text-[var(--text-primary)]">Employees</strong> for your in-house team in the meantime.
      </p>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-sm text-[var(--text-secondary)]">
        Tip: You can still note subcontractor details on individual jobs or in client notes until dedicated contractor records ship.
      </div>
    </section>
  );
}
