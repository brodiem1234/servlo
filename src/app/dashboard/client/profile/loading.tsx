export default function Loading() {
  return (
    <div className="space-y-4 p-4 max-w-2xl mx-auto">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--bg-card)]" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--bg-card)]" />
      ))}
    </div>
  );
}
