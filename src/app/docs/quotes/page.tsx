import Link from "next/link";

export const metadata = { title: "Quotes — SERVLO Docs" };

export default function QuotesDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Quotes</h1>
      <p className="lead">
        Send professional quotes that clients can accept or decline online — with digital signature support.
      </p>

      <h2>Creating a quote</h2>
      <p>
        Go to <Link href="/dashboard/owner/quotes">Quotes</Link> and click{" "}
        <strong>New Quote</strong>. Assign a client, add line items (or import from your Pricebook),
        set an expiry date, and click <strong>Save</strong>.
      </p>

      <h2>Sharing a quote</h2>
      <p>
        Click the <strong>🔗 Share</strong> button on any quote to generate a unique public link.
        The link is copied to your clipboard. Send it to your client via email or SMS — they can
        view the full quote, accept it, and sign digitally without logging in.
      </p>

      <h2>Client acceptance & digital signature</h2>
      <p>
        When a client opens the shared link, they see a formatted quote with all line items and
        totals. They can:
      </p>
      <ul>
        <li>Draw their signature on the acceptance pad</li>
        <li>Enter their name</li>
        <li>Click <strong>Accept Quote</strong></li>
      </ul>
      <p>
        The signature, client name, acceptance timestamp, and IP address are recorded against the
        quote for your records.
      </p>

      <h2>Quote versioning</h2>
      <p>
        Each time you edit a sent quote, SERVLO increments the version number. This preserves the
        history of changes for audit purposes.
      </p>

      <h2>Quote expiry</h2>
      <p>
        Set an expiry date on your quote. Clients cannot accept an expired quote — they&apos;ll see an
        expiry notice on the public link and be prompted to contact you for a revised quote.
      </p>

      <h2>Convert to invoice</h2>
      <p>
        Once a quote is accepted, click <strong>Convert to Invoice</strong> to create an invoice
        pre-filled with all the quote&apos;s line items and client details. No re-entry required.
      </p>

      <h2>Client Portal quotes</h2>
      <p>
        If the client has a <Link href="/docs/client-portal">client portal link</Link>, they&apos;ll see
        all their pending quotes with a <strong>View &amp; Sign Quote</strong> button that links
        directly to the shared quote page.
      </p>
    </article>
  );
}
