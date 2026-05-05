import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";

type ContactPageProps = {
  searchParams?: {
    success?: string;
  };
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

export default function ContactPage({ searchParams }: ContactPageProps) {
  return (
    <main className="mx-auto max-w-3xl space-y-6 bg-[#f8fafc] px-4 py-12 text-[#1e3a5f]">
      <h1 className="text-3xl font-bold text-[#1e3a5f]">Contact SERVLO</h1>
      <p className="text-sm text-[#64748b]">
        Questions? We&apos;re based in Adelaide, South Australia.
      </p>
      <p className="text-sm">
        Email: <a className="text-[#1e3a5f] underline" href="mailto:hello@servlo.com.au">hello@servlo.com.au</a>
      </p>
      {searchParams?.success === "true" ? (
        <p className="rounded bg-green-50 px-3 py-2 text-sm text-[#22c55e]">Thanks - we&apos;ll get back to you shortly.</p>
      ) : null}
      <form action={submitContact} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <input name="name" required placeholder="Your name" className="h-10 w-full rounded border px-3 text-sm" />
        <input name="email" type="email" required placeholder="Your email" className="h-10 w-full rounded border px-3 text-sm" />
        <textarea name="message" required placeholder="How can we help?" className="min-h-28 w-full rounded border px-3 py-2 text-sm" />
        <button type="submit" className="rounded bg-[#0db8c8] px-4 py-2 text-sm text-white hover:bg-[#0a9dab]">Send Message</button>
      </form>
    </main>
  );
}

