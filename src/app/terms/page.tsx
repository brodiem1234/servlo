export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 bg-[#f8fafc] px-4 py-12 text-[#1e3a5f]">
      <h1 className="text-3xl font-bold text-[#1e3a5f]">Terms of Service</h1>
      <p className="text-sm text-[#64748b]">Last updated: May 2026</p>
      <section className="space-y-3 rounded-xl border bg-white p-4 text-sm leading-6 text-[#64748b] shadow-sm">
        <p>
          By using SERVLO, you agree to use the platform lawfully and protect your account credentials.
          You are responsible for business data entered into your workspace.
        </p>
        <p>
          Subscription billing terms, cancellations, and trial limits are shown in-app and may be updated with notice.
        </p>
        <p>
          For contractual or support enquiries, contact{" "}
          <a className="text-[#1e3a5f] underline" href="mailto:hello@servlo.com.au">hello@servlo.com.au</a>.
        </p>
      </section>
    </main>
  );
}

