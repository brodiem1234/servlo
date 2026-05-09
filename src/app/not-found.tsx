import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080f1e] px-4 text-center">
      <div className="text-7xl font-black text-[var(--accent-color,#3B82F6)] opacity-20">404</div>
      <h1 className="mt-4 text-2xl font-bold text-white">Page not found</h1>
      <p className="mt-2 text-[#94a3b8]">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link href="/dashboard/owner" className="mt-6 rounded-lg bg-[#3B82F6] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#2563EB]">
        Back to dashboard
      </Link>
    </div>
  );
}
