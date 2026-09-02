import { Link } from "wouter";
import { 
  ChevronRight, 
  ExternalLink, 
  Layers, 
  Receipt, 
  Package, 
  Wrench, 
  Smartphone, 
  Cpu, 
  ShieldCheck, 
  FileText, 
  LogIn, 
  Headphones,
  Sparkles,
  CreditCard,
  Building2
} from "lucide-react";
import posCertLogo from "@/assets/pos-cert-logo.png";

interface PublicFooterProps {
  onOpenDemo?: () => void;
}

export function PublicFooter({ onOpenDemo }: PublicFooterProps) {
  const erpLinks = [
    { title: "Cloud POS Counter", href: "/pos-system", desc: "Fast billing & receipt printing", icon: Receipt },
    { title: "Multi-Branch Inventory", href: "/erp-inventory", desc: "Stock movement & warehouse control", icon: Package },
    { title: "Supplier Ledger Khata", href: "/erp-inventory", desc: "B2B debts & purchasing ledger", icon: Building2 },
    { title: "Business Pricing Plans", href: "/pricing", desc: "Transparent starter to pro tiers", icon: CreditCard },
  ];

  const repairLinks = [
    { title: "Repair Job Ticketing", href: "/repair-shop-software", desc: "Digital tickets & status tracking", icon: Wrench },
    { title: "LCD Combo Compatibility", href: "/technician-tools", desc: "Verified display interchange data", icon: Smartphone },
    { title: "IC Cross-Reference", href: "/technician-tools", desc: "Power, audio & network IC matrix", icon: Cpu },
    { title: "ISP eMMC Pinout Viewer", href: "/technician-tools", desc: "Direct motherboard pinout maps", icon: Layers },
  ];

  const companyLinks = [
    { title: "Account Login", href: "/login", desc: "Access your business portal", icon: LogIn },
    { title: "Privacy Policy", href: "/privacy", desc: "Data protection & security", icon: ShieldCheck },
    { title: "Terms of Service", href: "/terms", desc: "Platform agreement & SLA", icon: FileText },
    { title: "Customer Support", href: "mailto:support@iunlockd.com", desc: "24/7 dedicated support team", icon: Headphones, isExternal: true },
  ];

  return (
    <footer className="border-t border-slate-200 bg-slate-50/80 text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-12 sm:px-8 lg:px-10">
        
        {/* Top Grid */}
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* Brand Col */}
          <div className="lg:col-span-3 space-y-4">
            <Link href="/" className="inline-block">
              <img src={posCertLogo} alt="PosCert - Smart POS for every Business" className="h-10 w-[125px] object-contain object-left" />
            </Link>
            <p className="text-xs leading-relaxed text-slate-600">
              PosCert is the all-in-one Cloud POS & Smart Business ERP platform for retail stores, wholesale businesses, multi-branch chains, and electronics repair centers.
            </p>
            {onOpenDemo && (
              <button
                type="button"
                onClick={onOpenDemo}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Launch Free Web Demo
              </button>
            )}
          </div>

          {/* Section 1: ERP & POS Solutions */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-violet-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
                ERP & POS Solutions
              </h3>
            </div>
            <ul className="space-y-2">
              {erpLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title}>
                    <Link
                      href={item.href}
                      className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 transition-all hover:border-violet-300 hover:bg-violet-50/60 hover:shadow-xs active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100/70 text-violet-700 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-violet-700 truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all ml-1" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Section 2: Specialized Repair Suite */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
                Specialized Repair Suite
              </h3>
            </div>
            <ul className="space-y-2">
              {repairLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title}>
                    <Link
                      href={item.href}
                      className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 transition-all hover:border-blue-300 hover:bg-blue-50/60 hover:shadow-xs active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100/70 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all ml-1" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Section 3: Company & Security */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
                Company & Security
              </h3>
            </div>
            <ul className="space-y-2">
              {companyLinks.map((item) => {
                const Icon = item.icon;
                if (item.isExternal) {
                  return (
                    <li key={item.title}>
                      <a
                        href={item.href}
                        className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 transition-all hover:border-emerald-300 hover:bg-emerald-50/60 hover:shadow-xs active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-emerald-600 ml-1" />
                      </a>
                    </li>
                  );
                }
                return (
                  <li key={item.title}>
                    <Link
                      href={item.href}
                      className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 transition-all hover:border-emerald-300 hover:bg-emerald-50/60 hover:shadow-xs active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all ml-1" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} PosCert Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/privacy" className="hover:text-violet-700">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-violet-700">Terms of Service</Link>
            <span>·</span>
            <Link href="/pricing" className="hover:text-violet-700">Pricing</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
