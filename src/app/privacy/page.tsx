export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 bg-[#f8fafc] px-4 py-12 text-[#1e3a5f]">
      <h1 className="text-3xl font-bold text-[#1e3a5f]">Privacy Policy</h1>
      <p className="text-sm text-[#64748b]">Last updated: May 2026</p>
      <section className="space-y-3 rounded-xl border bg-white p-4 text-sm leading-6 text-[#64748b] shadow-sm">
        <p>
          SERVLO collects business and account information required to provide scheduling, invoicing,
          quoting, and client management services for trade businesses.
        </p>
        <p>
          We use this data to operate and improve the product, provide support, and meet legal obligations.
          We do not sell personal information.
        </p>
        <p>
          For support or privacy requests, contact <a className="text-[#1e3a5f] underline" href="mailto:hello@servlo.com.au">hello@servlo.com.au</a>.
        </p>
      </section>
    </main>
  );
}

