import { SeoHead } from "@/components/seo-head";

export default function Terms() {
  return (
    <div className="min-h-screen px-5 py-10 max-w-3xl mx-auto"
      style={{ color: "hsl(var(--foreground))", background: "hsl(var(--background))" }}>
      <SeoHead
        title="Terms of Service | PosCert ERP & Cloud POS"
        description="Review the terms and conditions for using PosCert Cloud POS, Business ERP, Inventory Management, and Repair Solutions."
        canonicalPath="/terms"
      />

      <div className="mb-8 border-b pb-6" style={{ borderColor: "hsl(var(--border))" }}>
        <h1 className="text-3xl font-black mb-2 tracking-tight">Terms of Service</h1>
        <p className="text-sm font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
          PosCert ERP · https://poscert.com · Last updated: September 2026
        </p>
      </div>

      <div className="space-y-8 text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>

        <section>
          <h2 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>1. Acceptance of Terms</h2>
          <p>
            By accessing, creating an account, or utilizing PosCert (the "Platform" or "Service"), you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>2. Description of Service</h2>
          <p className="mb-3">
            PosCert is an all-in-one <strong>Cloud ERP (Enterprise Resource Planning) and Point of Sale (POS)</strong> business management platform designed for retail stores, multi-branch commercial enterprises, electronics dealers, and workshop businesses.
          </p>
          <p className="mb-2">Core functional capabilities include:</p>
          <ul className="list-disc pl-5 space-y-1.5 mb-3">
            <li><strong>Point of Sale (POS):</strong> Rapid counter checkout, barcode scanning, thermal receipt & tax invoice generation, and custom discounts.</li>
            <li><strong>Inventory & Stock Management:</strong> Real-time multi-branch stock tracking, stock-in/stock-out logging, category categorization, and low-stock alerts.</li>
            <li><strong>Financial Accounting & Supplier Ledgers:</strong> Comprehensive customer ledgers, supplier purchase tracking, payables/receivables khata, and expense analysis.</li>
            <li><strong>Multi-Branch & Role-Based Access:</strong> Isolated branch switching, owner/manager/staff permissions, and organizational telemetry.</li>
          </ul>
          <p>
            In addition to core ERP and POS functionality, PosCert offers specialized modules for device repair job ticketing, customer repair status lookup, and hardware/IC compatibility reference databases for technical service centers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>3. User Accounts & Security</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You must provide accurate, current, and complete business information during registration.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials and all activities occurring under your account.</li>
            <li>Multi-user staff access must be assigned according to legitimate employment roles (Owner, Manager, Staff/Cashier).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>4. Service Plans & Commercial Subscriptions</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Starter / Demo Plan:</strong> Provides full core POS and ERP workflow evaluation with local or trial cloud storage.</li>
            <li><strong>Pro & Business Plans:</strong> Provides real-time encrypted cloud synchronization, multi-branch architecture, unlimited items, and priority support.</li>
            <li>Subscription charges are billed in advance on a recurring monthly or annual schedule as specified on our pricing page.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>5. Business Data Ownership & Privacy</h2>
          <p>
            You retain 100% ownership of your business data, including inventory catalogs, sales invoices, customer lists, and financial records. PosCert will never sell or monetize your proprietary business transactions.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>6. Acceptable Use & Conduct</h2>
          <p className="mb-2">You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Use the Service for fraudulent sales, unlawful transactions, or violating tax regulations.</li>
            <li>Interfere with or disrupt the security, integrity, or performance of the cloud infrastructure.</li>
            <li>Attempt to reverse engineer, scrape, or redistribute proprietary software components without authorization.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>7. Limitation of Liability</h2>
          <p>
            PosCert provides high-availability cloud infrastructure. To the maximum extent permitted by applicable law, PosCert is provided "as is" and shall not be liable for indirect, incidental, or consequential damages resulting from store operational disruptions or third-party service outages.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2" style={{ color: "hsl(var(--foreground))" }}>8. Contact & Inquiries</h2>
          <p>
            For enterprise inquiries, licensing terms, or customer support, reach out to our team at:{" "}
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
