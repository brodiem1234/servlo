import Link from "next/link";

export const metadata = { title: "Client Management — SERVLO Docs" };

export default function ClientsDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Client Management</h1>
      <p className="lead">
        Store and manage all your client records in one place — with notes, properties, and a
        self-service portal for each client.
      </p>

      <h2>Adding clients</h2>
      <p>
        Go to <Link href="/dashboard/owner/clients">Clients</Link> and click{" "}
        <strong>Add Client</strong>. You can also import clients from a CSV file using the{" "}
        <strong>Import</strong> button.
      </p>
      <p>Key fields:</p>
      <ul>
        <li>Full name and company name</li>
        <li>Email (for invoices and notifications)</li>
        <li>Phone</li>
        <li>Address (pre-fills jobs created for this client)</li>
        <li>Client type: Residential / Commercial / Government</li>
      </ul>

      <h2>Client notes</h2>
      <p>
        Add internal notes to any client record — things like site access instructions, preferences,
        or relationship history. Notes are private to your business (not visible to the client).
      </p>

      <h2>Client properties</h2>
      <p>
        For clients with multiple sites (e.g. a property manager with 20 properties), add each
        property as a separate entry under the client. Each property has its own address, notes,
        and job history.
      </p>

      <h2>Client portal link</h2>
      <p>
        Each client has a unique{" "}
        <Link href="/docs/client-portal">client portal link</Link>. Share it via email or SMS so
        they can view their jobs, quotes, and invoices without needing an account.
      </p>

      <h2>Churn risk alerts</h2>
      <p>
        SERVLO monitors client engagement and flags clients who might be at risk of leaving —
        based on time since last job, job frequency, and activity patterns. High-risk and
        medium-risk clients appear on the{" "}
        <strong>Churn Risk</strong> widget on the owner dashboard.
      </p>

      <h2>Inactive status</h2>
      <p>
        Mark a client as <strong>Inactive</strong> if they&apos;re no longer active. Inactive clients
        are excluded from the Active Clients count on the dashboard but remain searchable for
        historical records.
      </p>
    </article>
  );
}
