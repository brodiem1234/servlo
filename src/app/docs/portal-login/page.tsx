import Link from "next/link";

export const metadata = { title: "Magic Link Login — SERVLO Docs" };

export default function PortalLoginDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Magic Link Login</h1>
      <p className="lead">
        Clients can access their SERVLO dashboard without a password using a secure magic link.
      </p>

      <h2>What is a magic link?</h2>
      <p>
        A magic link is a one-time secure login link sent to the client&apos;s email address. When they
        click it, they are automatically signed in without entering a password.
      </p>
      <p>
        Magic links expire after 1 hour and can only be used once.
      </p>

      <h2>How clients use it</h2>
      <ol>
        <li>
          The client visits{" "}
          <Link href="/portal/login">servlo.app/portal/login</Link>
        </li>
        <li>They enter their email address and click <strong>Send magic link</strong></li>
        <li>They receive an email with a secure link</li>
        <li>They click the link and are logged in to their dashboard</li>
      </ol>

      <h2>What they can see</h2>
      <p>
        The authenticated client dashboard shows all jobs, quotes, and invoices across any SERVLO
        business that has added their email as a client record. This is useful for clients who
        work with multiple businesses using SERVLO.
      </p>

      <h2>Difference from the portal link</h2>
      <p>
        There are two ways for clients to access their information:
      </p>
      <ul>
        <li>
          <strong>Portal link</strong> (<code>/portal/[token]</code>) — no login required;
          shows data for one specific business only. Best for quick access.
        </li>
        <li>
          <strong>Magic link login</strong> (<code>/portal/login</code>) → <code>/dashboard/client</code> —
          requires email verification; shows all businesses. Best for regular clients.
        </li>
      </ul>

      <h2>Security notes</h2>
      <ul>
        <li>Magic links are only sent to existing registered email addresses (no new accounts)</li>
        <li>Each link is single-use and expires after 1 hour</li>
        <li>Sessions last for 7 days before requiring re-authentication</li>
      </ul>
    </article>
  );
}
