import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cpu,
  FileText,
  Package,
  PlayCircle,
  Receipt,
  ShoppingCart,
  Store,
  TrendingUp,
  Users,
  Wrench,
  ChevronDown,
  Building2,
  Zap,
  ShieldCheck
} from "lucide-react";
import posCertLogo from "@/assets/pos-cert-logo.png";
import { GuestModal } from "@/components/guest-modal";
import { SeoHead } from "@/components/seo-head";
import { PublicFooter } from "@/components/public-footer";

const featureCards = [
  {
    icon: ShoppingCart,
    label: "Cloud POS Counter",
    title: "Fast point of sale, barcode scanning & thermal receipts.",
    description:
      "Rapid checkout for retail counters. Scan barcodes, print customized invoices, accept mixed payments, and auto-sync stock in real time.",
    link: "/pos-system",
    tone: "violet",
  },
  {
    icon: Package,
    label: "Inventory & ERP",
    title: "Multi-branch stock tracking & supplier purchase khata.",
    description:
      "Manage centralized or isolated multi-store inventory, supplier accounts payable/receivable, purchase stock-in, and automated low-stock reorders.",
    link: "/erp-inventory",
    tone: "emerald",
  },
  {
    icon: TrendingUp,
    label: "Accounting & Reports",
    title: "Real-time financial telemetry, profit/loss & tax insights.",
    description:
      "Complete visibility over daily store cash drawer reconciliation, customer balance ledgers, store expense tracking, and sales trends.",
    link: "/erp-inventory",
    tone: "amber",
  },
  {
    icon: Wrench,
    label: "Repair & Technician Suite",
    title: "Integrated repair ticketing, job tracking & hardware tools.",
    description:
      "Specialized module for device repair centers. Track customer job cards, repair stages, technician parts usage, and access LCD/IC compatibility databases.",
    link: "/repair-shop-software",
    tone: "blue",
  },
];

const faqs = [
  {
    q: "What is PosCert ERP and who is it designed for?",
    a: "PosCert is a cloud-based ERP and Point of Sale (POS) business management platform. It is engineered for retail stores, electronics dealers, wholesale merchants, and multi-branch commercial businesses needing fast billing, stock control, supplier ledgers, and comprehensive accounting. It also includes dedicated companion tools for device repair service centers.",
  },
  {
    q: "Can I manage multiple store branches and warehouses?",
    a: "Yes. PosCert supports enterprise multi-branch isolation. Business owners can monitor stock levels, sales reports, employee access, and inventory transfers across unlimited physical store locations from one centralized dashboard.",
  },
  {
    q: "Does PosCert support thermal receipt printers and barcode scanners?",
    a: "Yes. PosCert is fully compatible with standard 80mm and 58mm thermal receipt printers, USB/Bluetooth barcode scanners, and mobile camera scanners for instant SKU lookup and checkout.",
  },
  {
    q: "How does the Supplier Ledger and Khata system work?",
    a: "Every time you purchase stock from suppliers, PosCert records the invoice number, total purchase cost, paid amount, and outstanding payable balance. You get a complete digital ledger (Khata) for every supplier and customer.",
  },
  {
    q: "Can I try PosCert without creating an account or paying?",
    a: "Yes! PosCert features an instant interactive live demo mode for both General Retail ERP and Phone Repair Workspaces. You can test every feature immediately without entering credit card details or signing up.",
  },
];

export default function Splash() {
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8f9fc] text-slate-950">
      <SeoHead
        title="PosCert ERP | Smart Cloud POS & Business Management System"
        description="PosCert is the all-in-one Cloud POS and Business ERP system. Accelerate retail sales counters, manage multi-branch stock inventory, automate invoicing, track supplier ledgers, and streamline device repair ticketing."
        keywords="PosCert, Cloud POS software, Business ERP system, multi branch inventory software, retail point of sale, supplier ledger khata, store invoice billing, repair shop software, mobile technician compatibility tool"
        canonicalPath="/"
      />

      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] w-full max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-10">
          <Link href="/" aria-label="PosCert home" className="transition-opacity hover:opacity-80">
            <img src={posCertLogo} alt="PosCert ERP" className="h-10 w-auto max-w-[130px] object-contain object-left" />
          </Link>

          <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-6 mr-4 text-xs font-black uppercase tracking-wider text-slate-600">
              <Link href="/pos-system" className="hover:text-violet-600 transition">POS Counter</Link>
              <Link href="/erp-inventory" className="hover:text-violet-600 transition">Inventory & ERP</Link>
              <Link href="/repair-shop-software" className="hover:text-violet-600 transition">Repair Module</Link>
              <Link href="/technician-tools" className="hover:text-violet-600 transition">Hardware Tools</Link>
              <Link href="/pricing" className="hover:text-violet-600 transition">Pricing</Link>
            </div>

            <button
              type="button"
              onClick={() => setShowGuestModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 shadow-xs transition hover:border-violet-300 hover:text-violet-700 sm:px-4"
            >
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              <span>Live Demo</span>
            </button>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-violet-700 active:scale-95"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/80">
        <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-violet-200/45 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute right-[-12rem] top-20 h-[30rem] w-[30rem] rounded-full bg-blue-100/60 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:px-10 lg:pb-28 lg:pt-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-violet-700">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-600" aria-hidden="true" />
              Cloud POS & Smart Business ERP System
            </div>

            <h1 className="mt-7 max-w-2xl text-[2.7rem] font-black leading-[1.05] tracking-[-0.065em] text-slate-950 sm:text-6xl lg:text-[4.2rem]">
              Empower your stores with modern ERP & rapid POS billing.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              PosCert gives retail businesses, multi-branch store chains, and electronics repair shops one unified workspace for sales counters, real-time inventory control, supplier khata ledgers, tax invoices, and specialized device repair tracking.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowGuestModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-700"
              >
                Launch Live Interactive Demo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-extrabold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
              >
                Sign In to Account
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
              {[
                "Multi-Branch Store Sync",
                "Barcode & Thermal Printing",
                "Supplier & Customer Khata",
                "Repair Ticketing & IC Pinouts",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Interactive UI Mockup */}
          <div className="relative mx-auto w-full max-w-[620px]" aria-label="Preview of PosCert ERP Dashboard">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-violet-200/45 blur-3xl" aria-hidden="true" />
            <div className="relative rounded-[1.8rem] border border-slate-200 bg-white p-2 shadow-[0_30px_90px_-35px_rgba(67,56,202,0.45)] sm:p-3">
              <div className="flex overflow-hidden rounded-[1.2rem] border border-slate-200 bg-[#f6f7fb]">
                <aside className="hidden w-[112px] shrink-0 border-r border-slate-200 bg-slate-950 px-3 py-4 sm:block">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500 text-white">
                      <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>
                    <span className="text-[10px] font-black text-white">PosCert</span>
                  </div>
                  <p className="mt-5 px-2 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500">Core ERP</p>
                  <div className="mt-2 space-y-1">
                    {["Dashboard", "POS Counter", "Inventory", "Suppliers"].map((item, index) => (
                      <div
                        key={item}
                        className={`rounded-lg px-2 py-2 text-[9px] font-bold ${index === 0 ? "bg-violet-500/20 text-violet-200" : "text-slate-400"}`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 px-2 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500">Specialized</p>
                  <div className="mt-2 space-y-1">
                    {["Repairs", "Pinouts", "Reports"].map((item) => (
                      <div key={item} className="rounded-lg px-2 py-2 text-[9px] font-bold text-slate-400">
                        {item}
                      </div>
                    ))}
                  </div>
                </aside>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">Branch: Main Retail Store</p>
                      <p className="text-xs font-black text-slate-900 sm:text-sm">Store Performance & Sales</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">Online Sync Active</span>
                    </div>
                  </div>

                  <div className="space-y-3 p-3 sm:p-4">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        ["Today's Sales", "$14,290", "+15.4%", "text-violet-700 bg-violet-50", ShoppingCart],
                        ["Stock Items", "1,840", "9 low stock", "text-emerald-700 bg-emerald-50", Package],
                        ["Active Repairs", "18", "6 due today", "text-blue-700 bg-blue-50", Wrench],
                        ["Khata Due", "$820", "4 customers", "text-amber-700 bg-amber-50", Users],
                      ].map(([label, value, detail, tone, Icon]) => {
                        const StatIcon = Icon as typeof ShoppingCart;
                        return (
                          <div key={label as string} className="rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3">
                            <div className="flex items-center justify-between gap-1">
                              <p className="truncate text-[8px] font-bold uppercase tracking-wide text-slate-400">{label as string}</p>
                              <span className={`flex h-5 w-5 items-center justify-center rounded-md ${tone as string}`}>
                                <StatIcon className="h-3 w-3" aria-hidden="true" />
                              </span>
                            </div>
                            <p className="mt-2 text-base font-black tracking-tight text-slate-950 sm:text-lg">{value as string}</p>
                            <p className="mt-0.5 truncate text-[9px] font-semibold text-slate-400">{detail as string}</p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
                      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-black text-slate-900">Weekly Revenue & Margins</p>
                            <p className="mt-0.5 text-[9px] text-slate-400">Across all active branches</p>
                          </div>
                          <BarChart3 className="h-4 w-4 text-violet-600" />
                        </div>
                        <div className="mt-4 flex h-[74px] items-end gap-2 border-b border-slate-100 px-1">
                          {[52, 68, 60, 86, 75, 95, 82].map((height, index) => (
                            <div key={index} className="flex flex-1 flex-col items-center gap-1">
                              <div
                                className={`w-full rounded-t-md ${index === 5 ? "bg-violet-600" : "bg-violet-200"}`}
                                style={{ height: `${height}%` }}
                              />
                              <span className="text-[8px] font-semibold text-slate-400">
                                {["M", "T", "W", "T", "F", "S", "S"][index]}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-black text-slate-900">Recent POS Orders</p>
                            <p className="mt-0.5 text-[9px] text-slate-400">Real-time billing counter</p>
                          </div>
                          <Receipt className="h-4 w-4 text-violet-600" />
                        </div>
                        <div className="mt-3 space-y-2">
                          {[
                            ["INV-9021", "2x Display + Charging Hub", "$120.00"],
                            ["INV-9020", "Fast Charger 65W", "$35.00"],
                            ["REP-4402", "iPhone 14 Screen Service", "$110.00"],
                          ].map(([inv, desc, amt]) => (
                            <div key={inv} className="flex items-center justify-between text-[9px]">
                              <span className="font-extrabold text-slate-800">{inv} · {desc}</span>
                              <span className="font-black text-slate-950">{amt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core ERP & POS Feature Pillars */}
      <section aria-labelledby="features-title" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-600">Enterprise Grade Architecture</p>
          <h2 id="features-title" className="mt-3 text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
            Everything your business needs from checkout counter to back-office analytics.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            PosCert bridges the gap between high-speed counter transactions, inventory precision, and specialized repair execution.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featureCards.map(({ icon: Icon, label, title, description, link, tone }) => {
            const tones = {
              violet: "bg-violet-50 text-violet-700",
              emerald: "bg-emerald-50 text-emerald-700",
              amber: "bg-amber-50 text-amber-700",
              blue: "bg-blue-50 text-blue-700",
            };
            return (
              <article key={label} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/70">
                <div>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone as keyof typeof tones]}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-6 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">{label}</p>
                  <h3 className="mt-2 text-lg font-black leading-6 tracking-tight text-slate-900">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link href={link} className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-800">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Internal Solution Hub Grid */}
      <section className="border-t border-slate-200/80 bg-white py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-600">Specialized Solutions</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">Explore PosCert by Industry & Workflow</h2>
            <p className="mt-3 text-slate-600 text-sm">Targeted capabilities crafted for maximum speed and zero friction.</p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/pos-system" className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:border-violet-300 hover:bg-white hover:shadow-md">
              <ShoppingCart className="h-6 w-6 text-violet-600" />
              <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-violet-600">Cloud POS Counter →</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600">Fast barcode scanning, 80mm receipt printing, tax calculation, and payment splits.</p>
            </Link>

            <Link href="/erp-inventory" className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:border-emerald-300 hover:bg-white hover:shadow-md">
              <Building2 className="h-6 w-6 text-emerald-600" />
              <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-emerald-600">Multi-Branch ERP & Stock →</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600">Warehouse stock movement, purchase stock-in, and supplier khata credit ledgers.</p>
            </Link>

            <Link href="/repair-shop-software" className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:border-blue-300 hover:bg-white hover:shadow-md">
              <Wrench className="h-6 w-6 text-blue-600" />
              <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-blue-600">Repair Ticketing Desk →</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600">Job sheet creation, live repair status, parts used tracking, and warranty certificates.</p>
            </Link>

            <Link href="/technician-tools" className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:border-amber-300 hover:bg-white hover:shadow-md">
              <Cpu className="h-6 w-6 text-amber-600" />
              <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-amber-600">Technician Hardware Tools →</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600">LCD display compatibility finder, battery cross-reference, and ISP pinout diagrams.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* SEO FAQ Section */}
      <section className="mx-auto w-full max-w-5xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-600">Frequently Asked Questions</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">Everything you need to know about PosCert</h2>
          <p className="mt-3 text-sm text-slate-600">Clear answers on ERP features, POS hardware compatibility, and deployment.</p>
        </div>

        <div className="mt-10 space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={faq.q} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left font-bold text-slate-900 hover:text-violet-600"
                >
                  <span className="text-base">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-violet-600" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-12 text-white shadow-2xl shadow-slate-300/50 sm:px-12 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-300">Modernize your business operations</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Test PosCert live with zero risk.</h2>
            <p className="mt-4 leading-7 text-slate-300">
              Explore our fully functional retail ERP & POS counter or specialized repair desk demo without creating an account.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowGuestModal(true)}
            className="mt-8 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-sm font-extrabold text-violet-700 transition hover:-translate-y-0.5 hover:bg-violet-50 lg:mt-0"
          >
            Launch Interactive Demo
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Site Footer with SEO Backlinks */}
      <PublicFooter onOpenDemo={() => setShowGuestModal(true)} />

      <GuestModal open={showGuestModal} onClose={() => setShowGuestModal(false)} />
    </main>
  );
}
