import Link from "next/link";

export const metadata = { title: "Jobs & Scheduling · SERVLO Docs" };

export default function JobsDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Jobs & Scheduling</h1>
      <p className="lead">
        Jobs are the core unit of work in SERVLO. Every invoice, quote, timesheet, and photo is
        linked to a job.
      </p>

      <h2>Creating a job</h2>
      <p>
        Go to <Link href="/dashboard/owner/jobs">Jobs</Link> and click <strong>New Job</strong>.
        Required fields: job title and client. Optional but recommended: scheduled date, address,
        assigned employee, and estimated hours.
      </p>

      <h2>Job statuses</h2>
      <ul>
        <li><strong>Pending</strong>: created but not yet scheduled</li>
        <li><strong>Scheduled</strong>: has a date; appears on the schedule view</li>
        <li><strong>In Progress</strong>: actively being worked</li>
        <li><strong>Completed</strong>: work done; ready to invoice</li>
        <li><strong>Cancelled</strong>: job will not proceed</li>
      </ul>

      <h2>Week view & drag-to-reschedule</h2>
      <p>
        Switch to the <Link href="/dashboard/schedule?view=week">Week view</Link> to see all jobs
        laid out across Monday to Sunday. Drag a job card to a different day to reschedule it. SERVLO
        updates the scheduled date instantly.
      </p>

      <h2>Job history</h2>
      <p>
        Every status change, assignment, note, and invoice creation is automatically recorded in the
        job&apos;s timeline. Open a job and click <strong>History</strong> to view the full audit trail.
        You can also add manual notes from the history panel.
      </p>

      <h2>Before & after photos</h2>
      <p>
        On the job detail <strong>Photos</strong> tab, upload before/after photos. SERVLO stores them
        securely in your business storage. You can draw annotations on photos using the built-in
        annotation tool, useful for marking defects or areas of work.
      </p>

      <h2>Client sign-off</h2>
      <p>
        On the <strong>Sign-off</strong> tab, collect a digital signature from your client at the
        job site. The signature is stored permanently against the job record for dispute resolution.
      </p>

      <h2>Geofenced clock-in</h2>
      <p>
        If a job has a site address, the Sign-off tab shows a <strong>Clock In / Clock Out</strong>{" "}
        button that uses the device&apos;s GPS to verify the team member is at the site. Clock-in records
        are stored as timesheets linked to the job.
      </p>

      <h2>Recurring jobs</h2>
      <p>
        On the <strong>Recurring</strong> tab, set a job to repeat weekly, fortnightly, or monthly.
        SERVLO auto-creates the next job when the current one is completed.
      </p>

      <h2>Job costing</h2>
      <p>
        On the <strong>Costing</strong> tab, record revenue, materials cost, and labour hours.
        SERVLO calculates your profit margin and flags low-margin or loss-making jobs on the dashboard.
      </p>
    </article>
  );
}
