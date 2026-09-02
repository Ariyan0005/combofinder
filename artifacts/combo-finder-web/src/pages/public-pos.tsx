import { Link } from "wouter";
import { ShoppingCart, Zap, Barcode, Receipt, CreditCard, Layers, ArrowRight, CheckCircle2, Store } from "lucide-react";
import { SeoHead } from "@/components/seo-head";
import { PublicFooter } from "@/components/public-footer";
import posCertLogo from "@/assets/pos-cert-logo.png";
import { useState } from "react";
import { GuestModal } from "@/components/guest-modal";

export default function PublicPos() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <main className="min-h-screen bg-[#f8f9fc] text-slate-950">
      <SeoHead
        title="Cloud POS Software | Fast Retail Counter & Point of Sale System"
        description="PosCert Cloud POS delivers lightning-fast barcode checkout, thermal receipt printing, tax invoicing, payment tracking, and multi-branch sales synchronization."
        keywords="Cloud POS software, retail point of sale, retail billing counter, barcode scanning POS, thermal receipt printing, store invoice generator, shop counter POS"
        canonicalPath="/pos-system"
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" aria-label="PosCert home" className="transition-opacity hover:opacity-80">
            <img src={posCertLogo} alt="PosCert" className="h-10 w-[120px] object-contain object-left" />
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/" className="text-sm font-bold text-slate-600 hover:text-violet-700 hidden sm:inline-block">Overview</Link>
            <Link href="/erp-inventory" className="text-sm font-bold text-slate-600 hover:text-violet-700 hidden sm:inline-block">Inventory & ERP</Link>
            <Link href="/pricing" className="text-sm font-bold text-slate-600 hover:text-violet-700 hidden sm:inline-block">Pricing</Link>
            <button
              type="button"
              onClick={() => setShowDemo(true)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 hover:border-violet-300 hover:text-violet-700"
            >
              Test Demo
            </button>
            <Link href="/login" className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-extrabold text-white shadow-md shadow-violet-600/20 hover:bg-violet-700">
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-xs font-bold text-violet-700">
            <ShoppingCart className="h-4 w-4" />
            Cloud Point of Sale Software
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Lightning-Fast Counter Sales & Thermal Invoicing.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Engineered for high-volume retail stores, supermarkets, mobile outlets, and hardware shops. Scan barcodes, accept mixed payments, print customized thermal receipts, and synchronize store sales in real time.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => setShowDemo(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-violet-600/20 hover:bg-violet-700"
            >
              Launch Live POS Demo
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-extrabold text-slate-700 hover:border-violet-300 hover:text-violet-700"
            >
              Start Free Trial
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Barcode,
              title: "Barcode Scanner & SKU Quick-Add",
              desc: "Instant camera and hardware USB barcode reader support. Scan product tags or search instantly by name and category.",
            },
            {
              icon: Receipt,
              title: "Thermal Receipt & 80mm/58mm Printing",
              desc: "Generate clean branded receipts with custom business headers, tax IDs, QR codes, and discount breakdowns in seconds.",
            },
            {
              icon: CreditCard,
              title: "Split & Multiple Payment Methods",
              desc: "Accept Cash, Card, Mobile Banking (bKash, Nagad, MFS), and customer balance credits seamlessly on a single sale.",
            },
            {
              icon: Zap,
              title: "Speed Checkout Mode",
              desc: "Keyboard shortcuts and touch-optimized grid enable cashiers to complete customer checkouts in under 3 seconds.",
            },
            {
              icon: Layers,
              title: "Live Stock Auto-Deduction",
              desc: "Every completed sale instantly updates branch inventory quantities, preventing out-of-stock overselling.",
            },
            {
              icon: Store,
              title: "Offline-Resilient POS Terminal",
              desc: "Keep processing counter transactions smoothly even during internet micro-outages with local cache auto-recovery.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <item.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* POS Value Proposition Section */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-violet-600">Enterprise Counter Architecture</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Built to eliminate cash register bottlenecks.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                PosCert’s POS interface gives cashiers full control over item discounts, quick customer profile lookup, return handling, and daily drawer reconciliation.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Customer Due & Ledger Credit Tracking directly on the POS screen",
                  "Support for batch, serial number, and warranty tracking",
                  "Automated daily sales shift and cash-drawer closing reports",
                  "Customizable tax rates (VAT/GST) and discount coupons",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-violet-400">Ready to modernize your billing?</p>
              <h3 className="mt-2 text-2xl font-bold">Experience PosCert POS in real-time.</h3>
              <p className="mt-3 text-sm text-slate-300">
                No credit card, installation, or sign-up required to test our interactive checkout counter.
              </p>
              <button
                type="button"
                onClick={() => setShowDemo(true)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg hover:bg-violet-700"
              >
                Open POS Demo Terminal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter onOpenDemo={() => setShowDemo(true)} />

      <GuestModal open={showDemo} onClose={() => setShowDemo(false)} />
    </main>
  );
}
