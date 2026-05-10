export default function Loading() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--bg-card)]" />
      ))}
    </div>
  );
}

