import Link from "next/link";

export const metadata = { title: "Onboarding Checklist — SERVLO Docs" };

export default function OnboardingDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Onboarding Checklist</h1>
      <p className="lead">
        When you first log in, SERVLO shows a personalised onboarding checklist to guide you through
        the most important setup steps.
      </p>

      <h2>Core setup tasks (all industries)</h2>
      <ol>
        <li>
          <strong>Create your account</strong> ✅ — Done automatically when you sign up.
        </li>
        <li>
          <strong>Set up your business</strong> — Add your ABN, address, and contact details in{" "}
          <Link href="/dashboard/owner/settings?tab=profile">Settings → Business Profile</Link>.
          This enables GST, improves your SEO score, and personalises your documents.
        </li>
        <li>
          <strong>Add your first client</strong> — Go to{" "}
          <Link href="/dashboard/owner/clients">Clients</Link> and add at least one client.
        </li>
        <li>
          <strong>Create your first job</strong> — Assign the job to your new client and set a date.
        </li>
        <li>
          <strong>Send your first invoice</strong> — Create an invoice from the job and send it.
        </li>
        <li>
          <strong>Invite a team member</strong> — Add an employee or contractor who will work
          with you.
        </li>
        <li>
          <strong>Customise your brand</strong> — Upload your logo and set your brand colour in{" "}
          <Link href="/dashboard/owner/settings?tab=appearance">Settings → Appearance</Link>.
        </li>
      </ol>

      <h2>Industry-specific tasks</h2>
      <p>Depending on your industry, additional tasks are shown:</p>

      <h3>Trades</h3>
      <ul>
        <li>Add a compliance document (SWMS or JSA)</li>
        <li>Build your pricebook with labour rates and materials</li>
      </ul>

      <h3>Cleaning</h3>
      <ul>
        <li>Schedule your first job in the calendar</li>
        <li>Set up recurring invoices for regular clients</li>
      </ul>

      <h3>Events</h3>
      <ul>
        <li>Send your first quote with event packages</li>
        <li>Add your packages to the pricebook</li>
      </ul>

      <h3>Marketing</h3>
      <ul>
        <li>Set up client communications</li>
        <li>Launch your first GROW campaign</li>
      </ul>

      <h3>Health</h3>
      <ul>
        <li>Upload registrations and insurance documents</li>
        <li>Activate the client portal for bookings</li>
      </ul>

      <h3>Field Services</h3>
      <ul>
        <li>Register your vehicles</li>
        <li>Build your service pricebook</li>
      </ul>

      <h2>Completing the checklist</h2>
      <p>
        SERVLO checks your actual data in real-time — a task is marked done as soon as you complete
        it anywhere in the app. You don&apos;t need to come back to the checklist to tick things off.
      </p>
      <p>
        When all tasks are complete, the checklist shows a celebration screen and hides automatically.
        If you want to hide it early, click <strong>Dismiss checklist</strong> at the bottom.
      </p>

      <h2>Re-showing the checklist</h2>
      <p>
        If you dismissed the checklist but want to see it again, clear the{" "}
        <code>servlo_checklist_dismissed</code> key from your browser&apos;s localStorage, or contact
        support to reset your onboarding status.
      </p>
    </article>
  );
}
