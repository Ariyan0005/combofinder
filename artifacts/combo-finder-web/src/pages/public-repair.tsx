import { Link } from "wouter";
import { Wrench, CheckCircle2, FileText, Smartphone, Clock, Shield, ArrowRight, Store } from "lucide-react";
import { SeoHead } from "@/components/seo-head";
import { PublicFooter } from "@/components/public-footer";
import posCertLogo from "@/assets/pos-cert-logo.png";
import { useState } from "react";
import { GuestModal } from "@/components/guest-modal";

export default function PublicRepair() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <main className="min-h-screen bg-[#f8f9fc] text-slate-950">
      <SeoHead
        title="Repair Shop Management Software | Phone & Electronics Ticketing POS"
        description="Comprehensive repair shop POS and ticketing system by PosCert. Manage phone repair jobs, technician assignments, customer status SMS/tokens, parts used, and warranty invoices."
        keywords="Repair shop POS software, phone repair ticketing, electronics repair management, repair shop billing software, technician job sheet, mobile repair management system"
        canonicalPath="/repair-shop-software"
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" aria-label="PosCert home" className="transition-opacity hover:opacity-80">
            <img src={posCertLogo} alt="PosCert" className="h-10 w-[120px] object-contain object-left" />
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/" className="text-sm font-bold text-slate-600 hover:text-blue-700 hidden sm:inline-block">Overview</Link>
            <Link href="/pos-system" className="text-sm font-bold text-slate-600 hover:text-blue-700 hidden sm:inline-block">POS Counter</Link>
            <Link href="/technician-tools" className="text-sm font-bold text-slate-600 hover:text-blue-700 hidden sm:inline-block">Hardware Tools</Link>
            <button
              type="button"
              onClick={() => setShowDemo(true)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700"
            >
              Test Demo
            </button>
            <Link href="/login" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-extrabold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700">
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700">
            <Wrench className="h-4 w-4" />
            Specialized Repair Management Module
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Streamlined Repair Job Ticketing & Service Workflow.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Designed specifically for smartphone repair centers, laptop technicians, and electronics workshops. Replace sticky notes with organized digital job cards, customer intake diagnostics, technician parts tracking, and automated completion invoices.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => setShowDemo(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700"
            >
              Launch Repair Desk Demo
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-extrabold text-slate-700 hover:border-blue-300 hover:text-blue-700"
            >
              Start Free Repair Trial
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: FileText,
              title: "Digital Job Cards & Token Receipts",
              desc: "Generate professional repair tickets with device condition checklist, serial/IMEI records, passcode security notes, and customer signature consent.",
            },
            {
              icon: Clock,
              title: "Live Repair Status Tracking",
              desc: "Move tickets through clear operational phases: Pending Inspection, Awaiting Parts, In Progress, Testing, and Ready for Pickup.",
            },
            {
              icon: Smartphone,
              title: "Parts & Inventory Integration",
              desc: "Assign LCD displays, batteries, flex cables, and ICs directly from your store inventory to the repair ticket, automatically updating stock and cost margins.",
            },
            {
              icon: Shield,
              title: "Warranty & Repair Guarantee Invoices",
              desc: "Print warranty certificates with customized repair terms (e.g. 30-day screen guarantee) directly on thermal or A4 customer invoices.",
            },
            {
              icon: Store,
              title: "Technician Commission & Performance",
              desc: "Assign jobs to specific technicians and track repairs completed, service revenue, and commission payouts seamlessly.",
            },
            {
              icon: CheckCircle2,
              title: "Customer History & Repair Archive",
              desc: "Instant search of past repairs by phone number, device model, or customer name to resolve repeat issues without disputes.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <item.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <PublicFooter onOpenDemo={() => setShowDemo(true)} />

      <GuestModal open={showDemo} onClose={() => setShowDemo(false)} />
    </main>
  );
}
