import Link from "next/link";
import Image from "next/image";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-200">
      <header className="border-b border-neutral-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/servlo-master-white.svg"
              alt="SERVLO"
              width={120}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>
          <nav className="flex items-center gap-5 text-sm text-neutral-400">
            <Link href="/legal/terms" className="hover:text-white">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/legal/refund" className="hover:text-white">Refunds</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <article className="prose prose-invert max-w-none prose-headings:text-white prose-headings:font-bold prose-h1:text-3xl prose-h1:mb-2 prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-p:text-neutral-300 prose-p:leading-relaxed prose-a:text-white prose-a:underline hover:prose-a:text-neutral-300 prose-strong:text-white">
          {children}
        </article>

        <footer className="mt-16 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
          <p>
            SERVLO is operated by [BUSINESS NAME], ABN [ABN]. Questions about these
            documents? Email <a href="mailto:[CONTACT_EMAIL]" className="underline hover:text-neutral-300">[CONTACT_EMAIL]</a>.
          </p>
        </footer>
      </main>
    </div>
  );
}
