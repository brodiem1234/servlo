import Link from "next/link";

export const metadata = { title: "Pricebook · SERVLO Docs" };

export default function PricebookDocPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <h1>Pricebook</h1>
      <p className="lead">
        Save your standard rates, products, and services for fast invoice and quote creation.
      </p>

      <h2>What is the Pricebook?</h2>
      <p>
        The Pricebook is a catalogue of everything you charge for. It can contain:
      </p>
      <ul>
        <li><strong>Services</strong>: labour, callouts, hourly rates, fixed-price services</li>
        <li><strong>Products</strong>: materials, parts, consumables you supply</li>
      </ul>
      <p>
        When creating an invoice or quote, click <strong>Import from Pricebook</strong> to add
        pre-priced items in seconds.
      </p>

      <h2>Adding items</h2>
      <p>
        Go to <Link href="/dashboard/owner/pricebook">Pricebook</Link> and click{" "}
        <strong>Add Item</strong>. Fill in:
      </p>
      <ul>
        <li>Name (required)</li>
        <li>Type: Service or Product</li>
        <li>Unit price (ex-GST)</li>
        <li>Unit (e.g. each, hour, m², litre)</li>
        <li>SKU (optional, for internal reference)</li>
        <li>Category (for grouping similar items)</li>
        <li>GST applicable (yes/no)</li>
      </ul>

      <h2>Bulk import via CSV</h2>
      <p>
        If you have existing rates in a spreadsheet, click <strong>Import CSV</strong>. Download
        the sample CSV to see the required column format, then upload your file. SERVLO imports
        up to 500 items at a time.
      </p>
      <p>Required CSV columns: <code>name</code>, <code>unit_price</code></p>
      <p>Optional: <code>type</code>, <code>sku</code>, <code>category</code>, <code>unit</code>, <code>gst_applicable</code></p>

      <h2>Materials reorder alerts</h2>
      <p>
        For product items, set a <strong>reorder threshold</strong> (minimum stock quantity). When
        your stock level drops below this threshold, the{" "}
        <strong>Materials Reorder</strong> widget on the dashboard will flag the item for reorder.
      </p>

      <h2>Categories</h2>
      <p>
        Use categories to organise your pricebook (e.g. Labour, Materials, Hire, Other). Categories
        appear as filter chips on the pricebook page and group items in the import picker on invoices
        and quotes.
      </p>
    </article>
  );
}
