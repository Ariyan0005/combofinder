import { useState } from "react";
import { Link } from "wouter";
import {
  Users, ShoppingCart, BarChart2, Receipt, CreditCard,
  Package, MessageCircle, Battery, Cpu
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_SUPPORT_URL = "https://wa.me/96897043234?text=Hi%21+I+need+support.+I%27m+contacting+you+from+the+PosCert+app.";

// Mobile LCD icon matching site
function MobileLcdIcon({ className, style }: { className?: string; style?: Record<string, string | number> }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <rect x="7" y="4" width="10" height="13" rx="1"/>
      <circle cx="12" cy="19.5" r="0.7" fill="currentColor" stroke="none"/>
    </svg>
  );
}

const CF_TOOLS = [
  { label: "Display\nCompatibility", iconType: "display" as const, href: "/compatibility?category=display", color: "#6248FF", bg: "#EEF2FF", desc: "Screen swap guide" },
  { label: "Battery\nCompatibility", iconType: "battery" as const, href: "/compatibility?category=battery", color: "#10B981", bg: "#ECFDF5", desc: "Safe replacements" },
  { label: "ISP & Pinout",           iconType: "cpu"     as const, href: "/isp-pinout",                    color: "#F59E0B", bg: "#FFF7E6", desc: "Model-wise diagrams", badge: "NEW" },
];

function CfToolIcon({ type, color, size = 24 }: { type: "display" | "battery" | "cpu"; color: string; size?: number }) {
  if (type === "display") return <MobileLcdIcon style={{ width: size, height: size, color }} />;
  if (type === "battery") return <Battery style={{ width: size, height: size, color }} />;
  return <Cpu style={{ width: size, height: size, color }} />;
}

interface GuestDemoDashboardProps {
  mode?: "mobile_repair" | "general_store";
}

export function GuestDemoDashboard({ mode = "mobile_repair" }: GuestDemoDashboardProps) {
  const { toast } = useToast();
  const [activeSlide, setActiveSlide] = useState(0);
  const [showTechTools, setShowTechTools] = useState(true);

  const showDemoNotice = (featureName: string) => {
    toast({
      title: "Demo Mode",
      description: `${featureName} is disabled in demo. Please Login or Create Account to use full ERP features.`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Title & Support */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">
            {mode === "general_store" ? "General Store" : "Mobile Repair Tech"}
          </h1>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <a
          href={WHATSAPP_SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
          style={{ background: "hsl(252, 100%, 64%)" }}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Support</span>
        </a>
      </div>

      {/* Revenue Purple Gradient Carousel Card */}
      <div
        className="rounded-3xl p-5 text-white shadow-lg relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(252, 95%, 62%) 0%, hsl(265, 90%, 55%) 100%)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/80 font-medium tracking-wide">Today's Revenue</p>
            <p className="text-3xl font-extrabold mt-1 tracking-tight">$ 0</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/80 font-medium tracking-wide">This Month</p>
            <p className="text-lg font-bold mt-1 tracking-tight">$ 0</p>
          </div>
        </div>

        {/* Carousel indicator dots */}
        <div className="flex justify-center items-center gap-1.5 mt-8">
          <span
            onClick={() => setActiveSlide(0)}
            className={`w-2.5 h-1.5 rounded-full transition-all cursor-pointer ${
              activeSlide === 0 ? "w-5 bg-white" : "bg-white/40"
            }`}
          />
          <span
            onClick={() => setActiveSlide(1)}
            className={`w-2.5 h-1.5 rounded-full transition-all cursor-pointer ${
              activeSlide === 1 ? "w-5 bg-white" : "bg-white/40"
            }`}
          />
        </div>
      </div>

      {/* Quick Actions Title */}
      <div>
        <h2 className="font-bold text-sm mb-3 text-foreground">Quick Actions</h2>
        {/* 6 Grid Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Party's */}
          <button
            type="button"
            onClick={() => showDemoNotice("Customer / Party's")}
            className="w-full flex flex-col items-center gap-2 p-3.5 rounded-2xl border border-border bg-card hover:border-primary/40 transition active:scale-95 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-foreground">Party's</span>
          </button>

          {/* POS */}
          <button
            type="button"
            onClick={() => showDemoNotice("POS Billing")}
            className="w-full flex flex-col items-center gap-2 p-3.5 rounded-2xl border border-border bg-card hover:border-primary/40 transition active:scale-95 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-foreground">POS</span>
          </button>

          {/* Sales Report */}
          <button
            type="button"
            onClick={() => showDemoNotice("Sales Report")}
            className="w-full flex flex-col items-center gap-2 p-3.5 rounded-2xl border border-border bg-card hover:border-primary/40 transition active:scale-95 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-foreground">Sales Report</span>
          </button>

          {/* Invoices */}
          <button
            type="button"
            onClick={() => showDemoNotice("Invoices & Billing")}
            className="w-full flex flex-col items-center gap-2 p-3.5 rounded-2xl border border-border bg-card hover:border-primary/40 transition active:scale-95 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-foreground">Invoices</span>
          </button>

          {/* Expenses */}
          <button
            type="button"
            onClick={() => showDemoNotice("Expenses Management")}
            className="w-full flex flex-col items-center gap-2 p-3.5 rounded-2xl border border-border bg-card hover:border-primary/40 transition active:scale-95 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-foreground">Expenses</span>
          </button>

          {/* Ledger */}
          <button
            type="button"
            onClick={() => showDemoNotice("Ledger & Statements")}
            className="w-full flex flex-col items-center gap-2 p-3.5 rounded-2xl border border-border bg-card hover:border-primary/40 transition active:scale-95 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-foreground">Ledger</span>
          </button>
        </div>
      </div>

      {/* Technician Tool Section */}
      {mode === "mobile_repair" && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm">Technician Tool</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                showTechTools
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-muted text-muted-foreground border border-border"
              }`}>
                {showTechTools ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTechTools((v) => !v)}
                role="switch"
                aria-checked={showTechTools}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                  showTechTools ? "bg-primary" : "bg-muted-foreground/30"
                }`}
                title={showTechTools ? "Deactivate on home" : "Activate on home"}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    showTechTools ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {showTechTools ? (
            <div className="grid grid-cols-3 gap-2.5">
              {CF_TOOLS.map(({ label, iconType, href, color, bg, desc, badge }) => (
                <Link key={href + label} href={href}>
                  <div className="relative flex flex-col items-center gap-2 p-3 rounded-2xl border cursor-pointer hover:border-primary/40 transition"
                    style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
                    {badge && (
                      <span className="absolute -top-1.5 -right-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full text-white"
                        style={{ background: "#EF4444" }}>{badge}</span>
                    )}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
                      <CfToolIcon type={iconType} color={color} size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold leading-tight whitespace-pre-line">{label}</p>
                      <p className="text-[9px] mt-0.5 leading-tight" style={{ color: "hsl(var(--muted-foreground))" }}>{desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">
                Technician tools are inactive on homepage. Toggle switch to activate.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
