import Link from "next/link";

export const metadata = { title: "Team & Timesheets — SERVLO Docs" };

export default function TeamDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Team & Timesheets</h1>
      <p className="lead">
        Manage employees and contractors, track hours, and monitor team performance.
      </p>

      <h2>Adding a team member</h2>
      <p>
        Go to <Link href="/dashboard/owner/team">Team</Link> and click{" "}
        <strong>Invite Team Member</strong>. Enter their name and email. They&apos;ll receive an
        invitation to create their SERVLO account with the employee role.
      </p>
      <p>
        Once accepted, you can assign jobs to them from the job detail page. They&apos;ll see their
        assigned jobs on their employee dashboard.
      </p>

      <h2>Employee vs. Contractor</h2>
      <p>
        Set a team member&apos;s type when you add them. Contractors are tracked separately from
        employees for payroll purposes. Both can be assigned to jobs and clock in/out.
      </p>

      <h2>Timesheets</h2>
      <p>
        Timesheets record clock-in and clock-out times. They can be created in two ways:
      </p>
      <ul>
        <li>
          <strong>Manual</strong> — go to the Timesheets tab on the Team page and add a timesheet
          record directly.
        </li>
        <li>
          <strong>Geofenced clock-in</strong> — on the{" "}
          <Link href="/docs/jobs">job detail Sign-off tab</Link>, employees can clock in when they
          arrive at the job site. GPS verifies they&apos;re within range.
        </li>
      </ul>

      <h2>Team Performance</h2>
      <p>
        The <strong>Performance</strong> tab shows each team member&apos;s statistics for the
        selected period (7, 30, or 90 days):
      </p>
      <ul>
        <li>Total hours worked</li>
        <li>Jobs completed</li>
        <li>Utilisation rate (hours worked vs. available hours)</li>
      </ul>
      <p>
        A utilisation rate below 60% may indicate scheduling gaps; above 90% may indicate
        risk of burnout.
      </p>

      <h2>Leave management</h2>
      <p>
        Team members can submit leave requests from the Performance tab. You&apos;ll see a
        pending badge on the Leave sub-tab. Approve or decline requests — the decision is
        recorded and the employee is notified.
      </p>

      <h2>Payroll export</h2>
      <p>
        Export timesheet data as CSV for use in your payroll software (Xero, MYOB, etc.).
        Go to the Timesheets tab and click <strong>Export CSV</strong>.
      </p>
    </article>
  );
}
