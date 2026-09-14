import { SeoHead } from "@/components/seo-head";

export default function Privacy() {
  return (
    <div className="min-h-screen px-5 py-10 max-w-3xl mx-auto"
      style={{ color: "hsl(var(--foreground))", background: "hsl(var(--background))" }}>
      <SeoHead
        title="Privacy Policy | PosCert ERP & Cloud POS"
        description="Learn how PosCert protects your business data, store sales records, inventory telemetry, and customer information."
        canonicalPath="/privacy"
      />

      <div className="mb-8 border-b pb-6" style={{ borderColor: "hsl(var(--border))" }}>
        <h1 className="text-3xl font-black mb-2 tracking-tight">Privacy Policy</h1>
        <p className="text-sm font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
          PosCert ERP · https://poscert.com · Last updated: September 2026
        </p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>

        <section>
          <h2 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>1. Overview & Commitment</h2>
          <p>
            PosCert is an enterprise-grade Cloud ERP and Point of Sale (POS) solution for retail, wholesale, and repair businesses. We maintain the highest standards of data security, confidentiality, and operational privacy for your business records.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>2. Data We Collect and Manage</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong style={{ color: "hsl(var(--foreground))" }}>Account Identification:</strong> Business name, owner email, phone number, and physical branch locations.</li>
            <li><strong style={{ color: "hsl(var(--foreground))" }}>Store Operations & Inventory:</strong> Product catalogs, SKU/barcode references, purchase stock-in logs, supplier ledgers, and pricing configurations.</li>
            <li><strong style={{ color: "hsl(var(--foreground))" }}>Sales & Transactions:</strong> Point of sale counter orders, generated invoices, customer contact profiles, tax data, and payment logs.</li>
            <li><strong style={{ color: "hsl(var(--foreground))" }}>Service & Repair Tickets:</strong> Device serials, diagnostic notes, technician assignments, and job repair statuses.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>3. Data Storage & Multi-Branch Security</h2>
          <p className="mb-2">
            PosCert ensures high-speed, isolated data partitioning:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Trial / Demo Storage:</strong> Sandbox sessions operate safely without storing permanent enterprise secrets.</li>
            <li><strong>Cloud Synchronized Database:</strong> Production customer data is stored in enterprise PostgreSQL databases protected by TLS encryption in transit and AES-256 encryption at rest.</li>
            <li><strong>Branch Isolation:</strong> Strict database filtering guarantees employees and staff access only designated store branches.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>4. How We Use Business Data</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To deliver real-time POS processing, stock-level calculations, and automated financial reports.</li>
            <li>To enable seamless multi-device synchronization across store terminals, tablets, and manager dashboards.</li>
            <li>We <strong>never sell, monetize, or disclose</strong> your store's sales numbers, customer contact lists, or supplier invoices to third parties or advertisers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>5. Data Export & Account Deletion</h2>
          <p>
            Store owners have full sovereignty over their commercial records. You may export CSV/PDF invoices, sales summaries, and inventory reports anytime. If you choose to close your account, all associated store records are permanently purged in accordance with data retention standards.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>6. Contact Us</h2>
          <p>
            For privacy inquiries or compliance questions, please contact our data team at:{" "}
            <a href="mailto:support@iunlockd.com" className="font-semibold underline underline-offset-4"
              style={{ color: "hsl(var(--primary))" }}>support@iunlockd.com</a>
          </p>
        </section>

      </div>

      <div className="mt-12 pt-6 border-t text-xs text-center font-medium"
        style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
        © {new Date().getFullYear()} PosCert ERP & Cloud POS · All rights reserved.
      </div>
    </div>
  );
}
