import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Contact | SERVLO",
  description: "Get in touch with SERVLO — Adelaide-based, Australian-owned trade business software.",
};

type ContactPageProps = {
  searchParams?: Promise<{
    success?: string;
  }>;
};

async function submitContact(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!name || !email || !message) redirect("/contact");

  await sendEmail(
    "hello@servlo.com.au",
    `New SERVLO contact enquiry from ${name}`,
    `
      <div style="font-family:Arial,sans-serif;">
        <h2>New Contact Enquiry</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br/>")}</p>
      </div>
    `
  );
  redirect("/contact?success=true");
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const sp = (await searchParams) ?? {};
  const success = sp.success === "true";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-200 [font-family:Montserrat,ui-sans-serif,system-ui,-apple-system,Segoe_UI,Roboto,sans-serif]">
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Contact SERVLO</h1>
        <p className="mt-3 text-base text-neutral-400">
          We&apos;re based in Adelaide, South Australia. Send us a question and we&rsquo;ll get back to you within 24 hours.
        </p>
        <p className="mt-2 text-sm text-neutral-400">
          Email directly:{" "}
          <a
            className="font-bold text-white underline underline-offset-4 hover:text-neutral-300"
            href="mailto:hello@servlo.com.au"
          >
            hello@servlo.com.au
          </a>
        </p>

        {success ? (
          <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Thanks — we&apos;ve got your message and will reply soon.
          </div>
        ) : null}

        <form action={submitContact} className="mt-8 space-y-4 rounded-2xl border border-neutral-800 bg-[#111111] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-neutral-400">
              Your name
            </label>
            <input
              id="name"
              name="name"
              required
              autoComplete="name"
              className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 text-sm text-white placeholder-neutral-500 transition focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Brodie McDonald"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-400">
              Your email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="h-11 w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 text-sm text-white placeholder-neutral-500 transition focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="you@business.com.au"
            />
          </div>
          <div>
            <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-neutral-400">
              How can we help?
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className="w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder-neutral-500 transition focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Quick question, demo request, anything..."
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            Send message
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-neutral-500">
          SERVLO — operated by Brodie McDonald, ABN 88 688 301 684
        </p>
      </main>
    </div>
  );
}
