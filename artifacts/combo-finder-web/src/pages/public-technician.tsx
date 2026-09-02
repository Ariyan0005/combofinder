import { Link } from "wouter";
import { Cpu, Search, Database, Smartphone, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { SeoHead } from "@/components/seo-head";
import { PublicFooter } from "@/components/public-footer";
import posCertLogo from "@/assets/pos-cert-logo.png";
import { useState } from "react";
import { GuestModal } from "@/components/guest-modal";

export default function PublicTechnician() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <main className="min-h-screen bg-[#f8f9fc] text-slate-950">
      <SeoHead
        title="Mobile Technician Hardware Tools | LCD Compatibility & ISP Pinout Database"
        description="Search compatible smartphone display combos, battery interchangeability, power IC cross-references, and ISP eMMC pinout diagrams in PosCert's technician suite."
        keywords="Smartphone combo compatibility tool, mobile LCD display compatibility database, IC cross reference lookup, ISP eMMC pinout diagrams, battery interchangeability finder, mobile technician tools"
        canonicalPath="/technician-tools"
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/" aria-label="PosCert home" className="transition-opacity hover:opacity-80">
            <img src={posCertLogo} alt="PosCert" className="h-10 w-[120px] object-contain object-left" />
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/" className="text-sm font-bold text-slate-600 hover:text-amber-700 hidden sm:inline-block">Overview</Link>
            <Link href="/pos-system" className="text-sm font-bold text-slate-600 hover:text-amber-700 hidden sm:inline-block">POS Counter</Link>
            <Link href="/repair-shop-software" className="text-sm font-bold text-slate-600 hover:text-amber-700 hidden sm:inline-block">Repair POS</Link>
            <button
              type="button"
              onClick={() => setShowDemo(true)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 hover:border-amber-300 hover:text-amber-700"
            >
              Test Demo
            </button>
            <Link href="/login" className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-extrabold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700">
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700">
            <Cpu className="h-4 w-4" />
            Specialized Hardware Reference Database
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            LCD Combo Compatibility & Pinout Lookup.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            PosCert includes specialized technician companion tools for smartphone engineers. Instantly look up cross-model LCD display compatibility, battery replacements, power IC matching, and high-resolution ISP pinouts.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => setShowDemo(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-amber-600/20 hover:bg-amber-700"
            >
              Try Compatibility Lookup Demo
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-extrabold text-slate-700 hover:border-amber-300 hover:text-amber-700"
            >
              Create Free Account
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Search,
              title: "LCD Combo Compatibility Finder",
              desc: "Search any phone model (Samsung, Xiaomi, Vivo, Oppo, Realme, Infinix, Tecno) and find all interchangeable screen models instantly.",
            },
            {
              icon: Smartphone,
              title: "Battery Interchangeability Directory",
              desc: "Cross-reference battery codes and dimensions across multiple smartphone brands to service customers even when exact models are out of stock.",
            },
            {
              icon: Cpu,
              title: "Power & Audio IC Lookup",
              desc: "Identify matching PMIC, charging IC, and backlight driver chips across circuit boards for rapid motherboard repair.",
            },
            {
              icon: Zap,
              title: "High-Res ISP & eMMC Pinout Viewer",
              desc: "Clear visual diagrams for CLK, CMD, DAT0, VCC, and VCCQ test points to flash and recover dead boot devices safely.",
            },
            {
              icon: Database,
              title: "Regularly Updated Hardware Specs",
              desc: "Continuous catalog updates with new model releases, frame dimensions, connector pins, and technician repair guides.",
            },
            {
              icon: ShieldCheck,
              title: "Seamless POS & Inventory Linking",
              desc: "One click links compatibility search results to your store's live parts inventory, showing current shelf stock and selling price.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
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
