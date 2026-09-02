import { Link } from "wouter";
import { Check, ArrowRight, ShieldCheck, Zap, HelpCircle } from "lucide-react";
import { SeoHead } from "@/components/seo-head";
import { PublicFooter } from "@/components/public-footer";
import posCertLogo from "@/assets/pos-cert-logo.png";
import { useState } from "react";
import { GuestModal } from "@/components/guest-modal";

export default function PublicPricing() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <main className="min-h-screen bg-[#f8f9fc] text-slate-950">
      <SeoHead
        title="Plans & Pricing | PosCert Cloud POS & Business ERP System"
        description="Affordable, transparent pricing for retail stores, multi-branch shops, and repair businesses. Start with a free trial or upgrade to Pro with real-time cloud backup."
        keywords="PosCert pricing, POS software pricing, cloud ERP pricing, retail management plans, repair shop POS cost, affordable POS system"
        canonicalPath="/pricing"
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" aria-label="PosCert home" className="transition-opacity hover:opacity-80">
            <img src={posCertLogo} alt="PosCert" className="h-10 w-[120px] object-contain object-left" />
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/" className="text-sm font-bold text-slate-600 hover:text-violet-700 hidden sm:inline-block">Overview</Link>
            <Link href="/pos-system" className="text-sm font-bold text-slate-600 hover:text-violet-700 hidden sm:inline-block">POS Counter</Link>
            <Link href="/erp-inventory" className="text-sm font-bold text-slate-600 hover:text-violet-700 hidden sm:inline-block">ERP & Stock</Link>
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

      {/* Hero */}
      <section className="mx-auto w-full max-w-7xl px-5 py-16 text-center sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-xs font-bold text-violet-700">
            <Zap className="h-4 w-4" />
            Simple, Transparent Pricing
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Everything you need to run and grow your business.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            Choose the plan that fits your retail store or repair workshop. Test all features in our instant interactive demo before deciding.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto mt-14 grid max-w-5xl gap-8 lg:grid-cols-3 text-left">
          {/* Free Starter */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Starter Demo</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Free Forever</h2>
              <p className="mt-1 text-sm text-slate-500">Perfect for exploring and small single-counter tests.</p>
              <p className="mt-6 text-4xl font-black text-slate-950">$0 <span className="text-sm font-medium text-slate-500">/month</span></p>
              <ul className="mt-8 space-y-3 text-sm text-slate-600 font-medium">
                {["Single Store Counter POS", "Inventory management & items", "Thermal invoices & receipts", "Basic repair ticketing", "Offline & local storage support"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowDemo(true)}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 hover:border-violet-300 hover:text-violet-700"
            >
              Launch Demo
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Pro Cloud Plan */}
          <div className="relative rounded-3xl border-2 border-violet-600 bg-white p-8 shadow-xl flex flex-col justify-between">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white">
              Most Popular
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-violet-600">Pro Cloud</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Business POS</h2>
              <p className="mt-1 text-sm text-slate-500">For retail shops, mobile stores, and busy counters.</p>
              <p className="mt-6 text-4xl font-black text-slate-950">$15 <span className="text-sm font-medium text-slate-500">/month</span></p>
              <ul className="mt-8 space-y-3 text-sm text-slate-600 font-medium">
                {[
                  "Unlimited Sales & Invoices",
                  "Automated Real-Time Cloud Sync",
                  "Supplier Purchase & Ledger Khata",
                  "Customer CRM & Balance Credits",
                  "Detailed Profit/Loss & Tax Reports",
                  "Hardware Compatibility Database",
                  "Priority Email & WhatsApp Support",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-extrabold text-white shadow-md hover:bg-violet-700"
            >
              Get Started Pro
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Enterprise Multi-Branch */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">Multi-Branch</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Enterprise ERP</h2>
              <p className="mt-1 text-sm text-slate-500">For multi-location chains and large distributor networks.</p>
              <p className="mt-6 text-4xl font-black text-slate-950">$39 <span className="text-sm font-medium text-slate-500">/month</span></p>
              <ul className="mt-8 space-y-3 text-sm text-slate-600 font-medium">
                {[
                  "Everything in Pro Cloud",
                  "Unlimited Store Branches & Warehouses",
                  "Branch Isolation & Central Reporting",
                  "Granular Staff & Cashier Roles",
                  "Warehouse Stock Transfer Workflow",
                  "Custom Barcode Printing Templates",
                  "Dedicated Account Manager",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 hover:border-violet-300 hover:text-violet-700"
            >
              Start Free Enterprise Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter onOpenDemo={() => setShowDemo(true)} />

      <GuestModal open={showDemo} onClose={() => setShowDemo(false)} />
    </main>
  );
}
