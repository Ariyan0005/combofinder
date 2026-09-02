import { Link } from "wouter";
import { Package, BarChart3, Building2, TrendingUp, Users, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { SeoHead } from "@/components/seo-head";
import { PublicFooter } from "@/components/public-footer";
import posCertLogo from "@/assets/pos-cert-logo.png";
import { useState } from "react";
import { GuestModal } from "@/components/guest-modal";

export default function PublicErp() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <main className="min-h-screen bg-[#f8f9fc] text-slate-950">
      <SeoHead
        title="Multi-Branch ERP & Inventory Software | PosCert Business Suite"
        description="Empower your growing enterprise with PosCert ERP. Real-time multi-location inventory, supplier purchase khata, expense control, and role-based staff authorization."
        keywords="Multi branch ERP software, business inventory management, supplier ledger software, purchase stock in, expense tracking software, retail ERP system, stock control software"
        canonicalPath="/erp-inventory"
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" aria-label="PosCert home" className="transition-opacity hover:opacity-80">
            <img src={posCertLogo} alt="PosCert" className="h-10 w-[120px] object-contain object-left" />
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/" className="text-sm font-bold text-slate-600 hover:text-emerald-700 hidden sm:inline-block">Overview</Link>
            <Link href="/pos-system" className="text-sm font-bold text-slate-600 hover:text-emerald-700 hidden sm:inline-block">POS Counter</Link>
            <Link href="/pricing" className="text-sm font-bold text-slate-600 hover:text-emerald-700 hidden sm:inline-block">Pricing</Link>
            <button
              type="button"
              onClick={() => setShowDemo(true)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
            >
              Test Demo
            </button>
            <Link href="/login" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700">
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
            <Building2 className="h-4 w-4" />
            Cloud Business ERP & Inventory Suite
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Multi-Branch Inventory & Financial Control in Real Time.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Stop losing stock and revenue across different store locations. PosCert gives business owners a unified control tower for purchase orders, supplier ledgers, warehouse transfers, expense tracking, and role-based staff permissions.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => setShowDemo(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-emerald-600/20 hover:bg-emerald-700"
            >
              Explore ERP Demo Workspace
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-extrabold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
            >
              Start Free Business Trial
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Building2,
              title: "Branch Isolation & Centralized Dashboard",
              desc: "Switch between branches instantly. View branch-specific revenue, inventory levels, and staff sales alongside global company reports.",
            },
            {
              icon: Package,
              title: "Smart Stock-In & Supplier Ledger (Khata)",
              desc: "Record supplier purchases with purchase prices, invoice numbers, paid amounts, and running balance ledgers for accurate accounts payable.",
            },
            {
              icon: TrendingUp,
              title: "Comprehensive Expense & Financial Analysis",
              desc: "Log rent, electricity, salaries, and operational costs. View automated net profit/loss, gross margins, and daily cash flow statements.",
            },
            {
              icon: Users,
              title: "Role-Based Staff Access (Owner/Manager/Staff)",
              desc: "Protect sensitive financial reports and stock cost prices with strict granular permissions for cashiers, technicians, and managers.",
            },
            {
              icon: BarChart3,
              title: "Automated Low Stock & Replenishment Alerts",
              desc: "Prevent lost sales with automated notifications when items dip below reorder thresholds, with one-click reordering.",
            },
            {
              icon: ShieldCheck,
              title: "Audit Trails & Inventory Activity Logs",
              desc: "Every stock adjustment, sale, manual override, and price change is securely timestamped with staff identity for 100% accountability.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <item.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Deep Value Section */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">Enterprise Inventory Science</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Scale your retail network with confidence.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                PosCert’s ERP engine provides complete transparency into your commercial operations, enabling data-backed purchasing and branch growth.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Live stock valuation based on real purchase costs and margins",
                  "Cross-branch inventory lookup so staff can fulfill customer demand immediately",
                  "Comprehensive supplier database with purchase history and credit ledgers",
                  "Exportable financial audits and tax reports in Excel, PDF, and CSV formats",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Try before you subscribe</p>
              <h3 className="mt-2 text-2xl font-bold">Inspect the Multi-Branch ERP Dashboard.</h3>
              <p className="mt-3 text-sm text-slate-300">
                Switch between branches, create test stock-in entries, and generate profit & loss summaries in our live sandbox.
              </p>
              <button
                type="button"
                onClick={() => setShowDemo(true)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg hover:bg-emerald-700"
              >
                Open General Store ERP Demo
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
