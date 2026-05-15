import { SiteHeader } from "@/components/site-header";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-200">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <article className="prose prose-invert max-w-none prose-headings:text-white prose-headings:font-bold prose-h1:text-3xl prose-h1:mb-2 prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-p:text-neutral-300 prose-p:leading-relaxed prose-a:text-white prose-a:font-bold prose-a:underline hover:prose-a:text-neutral-300 prose-strong:text-white">
          {children}
        </article>

        <footer className="mt-16 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
          <p>
            SERVLO is operated by Brodie McDonald, ABN 88 688 301 684. Questions about
            these documents? Email{" "}
            <a href="mailto:hello@servlo.com.au" className="font-bold underline hover:text-neutral-300">hello@servlo.com.au</a>.
          </p>
        </footer>
      </main>
    </div>
  );
}
