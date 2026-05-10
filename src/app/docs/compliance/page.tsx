import Link from "next/link";

export const metadata = { title: "Compliance Documents — SERVLO Docs" };

export default function ComplianceDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Compliance Documents</h1>
      <p className="lead">
        Keep your business compliant with SWMS, JSAs, incident reports, and licences — all in one place.
      </p>

      <h2>What is the Compliance module?</h2>
      <p>
        SERVLO&apos;s Compliance module helps service businesses manage the documents required by
        Australian work health and safety (WHS) laws, particularly for trade and field services:
      </p>
      <ul>
        <li><strong>SWMS</strong> — Safe Work Method Statements</li>
        <li><strong>JSA</strong> — Job Safety Analysis forms</li>
        <li><strong>Records</strong> — Licences, registrations, insurances</li>
        <li><strong>Incidents</strong> — Incident and near-miss reports</li>
        <li><strong>Environmental</strong> — Waste disposal records, chemical registers</li>
      </ul>

      <h2>Document templates</h2>
      <p>
        Go to <Link href="/dashboard/owner/compliance">Compliance</Link> and switch to the{" "}
        <strong>Templates</strong> tab to browse 24 pre-built compliance document templates.
        Filter by category (SWMS, JSA, Record, etc.) and state (NSW, VIC, QLD, etc.) to find
        relevant templates for your work.
      </p>
      <p>
        Click <strong>Use Template</strong> to pre-fill a new document from the template.
      </p>

      <h2>Expiry alerts</h2>
      <p>
        Set an expiry date on any compliance document (e.g. insurance renewal, licence expiry).
        SERVLO will:
      </p>
      <ul>
        <li>Show an <span className="text-amber-700 font-semibold">orange warning</span> banner for documents expiring within 30 days</li>
        <li>Show a <span className="text-red-700 font-semibold">red alert</span> banner for expired documents</li>
      </ul>
      <p>
        These alerts appear at the top of the Compliance page and in the owner task list.
      </p>

      <h2>Attaching documents to jobs</h2>
      <p>
        When creating or editing a job, select relevant compliance documents (e.g. the SWMS for
        that type of work). The documents are linked to the job record for audit purposes.
      </p>

      <h2>Compliance for high-risk work</h2>
      <p>
        Australian WHS law requires a SWMS for all <em>high-risk construction work</em> (as defined
        by Safe Work Australia). SERVLO&apos;s template library covers the most common high-risk
        categories including working at heights, confined spaces, and electrical work.
      </p>
      <p>
        <strong>Note:</strong> SERVLO provides templates as a starting point. Always have your
        SWMS reviewed by a qualified WHS professional before commencing high-risk work.
      </p>
    </article>
  );
}
