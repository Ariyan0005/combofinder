import { useQuery } from "@tanstack/react-query";
import {
  Wrench, Users, Package, CheckCircle, Bell, ChevronRight,
  ShoppingCart, BarChart2, Wallet, Receipt, Battery,
  Cpu, CreditCard,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import { ProtectedPage } from "@/components/protected-page";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

// Mobile LCD / Display icon (custom SVG)
function MobileLcdIcon({ className, style }: { className?: string; style?: Record<string, string | number> }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <rect x="7" y="4" width="10" height="13" rx="1"/>
      <circle cx="12" cy="19.5" r="0.7" fill="currentColor" stroke="none"/>
    </svg>
  );
}

// ── Quick Actions ────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { label: "Customers",     icon: Users,        href: "/customers",  color: "#8B5CF6", bg: "#F5F3FF" },
  { label: "POS",           icon: ShoppingCart, href: "/pos",        color: "#10B981", bg: "#ECFDF5" },
  { label: "New Repair",    icon: Wrench,       href: "/repairs",    color: "#6366F1", bg: "#EEF2FF" },
  { label: "Sell Report",   icon: Receipt,      href: "/invoices",   color: "#0EA5E9", bg: "#F0FDFF" },
  { label: "Reports",       icon: BarChart2,    href: "/reports",    color: "#3B82F6", bg: "#EFF6FF" },
  { label: "Ledger/Credit", icon: CreditCard,   href: "/ledger",     color: "#8B5CF6", bg: "#F5F3FF" },
];

// ── ComboFinder Tool cards ────────────────────────────────────────────────────
const CF_TOOLS = [
  {
    label: "Display\nCompatibility",
    iconType: "display" as const,
    href: "/compatibility?type=Display",
    color: "#6248FF",
    bg: "#EEF2FF",
    desc: "Screen swap guide",
  },
  {
    label: "Battery\nCompatibility",
    iconType: "battery" as const,
    href: "/compatibility?type=Battery",
    color: "#10B981",
    bg: "#ECFDF5",
    desc: "Safe replacements",
  },
  {
    label: "ISP & Pinout",
    iconType: "cpu" as const,
    href: "/isp-pinout",
    color: "#F59E0B",
    bg: "#FFF7E6",
    desc: "Model-wise diagrams",
    badge: "NEW",
  },
];

function CfToolIcon({ type, color, size = 24 }: { type: "display" | "battery" | "cpu"; color: string; size?: number }) {
  if (type === "display") {
    return <MobileLcdIcon style={{ width: size, height: size, color }} />;
  }
  if (type === "battery") {
    return <Battery style={{ width: size, height: size, color }} />;
  }
  return <Cpu style={{ width: size, height: size, color }} />;
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery<{
    totalCustomers?: number;
    activeRepairs?: number;
    lowStock?: number;
  }>({
    queryKey: ["stats"],
    queryFn: () => fetch(`/api/stats`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: repairs } = useQuery<any[]>({
    queryKey: ["repairs", "recent"],
    queryFn: () => fetch(`/api/repairs`, { credentials: "include" }).then(r => r.json()),
  });

  const totalRepairs   = Array.isArray(repairs) ? repairs.length : 0;
  const deliveredToday = Array.isArray(repairs)
    ? repairs.filter(r => r.status === "Delivered" &&
        new Date(r.updatedAt ?? r.createdAt).toDateString() === new Date().toDateString()).length
    : 0;

  const STAT_CARDS = [
    { label: "Total Repairs",   value: totalRepairs,               color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.12)", href: "/repairs",   icon: Wrench },
    { label: "Active",          value: stats?.activeRepairs ?? 0,  color: "#F59E0B",             bg: "#FFF7E6",                    href: "/repairs",   icon: Wrench },
    { label: "Delivered",       value: deliveredToday,             color: "#10B981",             bg: "#ECFDF5",                    href: "/repairs",   icon: CheckCircle },
    { label: "Customers",       value: stats?.totalCustomers ?? 0, color: "#8B5CF6",             bg: "#F5F3FF",                    href: "/customers", icon: Users },
  ];

  return (
    <ProtectedPage>
      <div className="space-y-5 pb-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-[11px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
              {greeting()},
            </p>
            <h1 className="text-lg font-extrabold leading-tight mt-0.5">
              {user?.name ?? "Technician"} 👋
            </h1>
          </div>
          <button className="w-9 h-9 rounded-full border flex items-center justify-center"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
            <Bell className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        </div>

        {/* ── Compact stats row ── */}
        <div className="grid grid-cols-4 gap-2">
          {STAT_CARDS.map(({ label, value, color, bg, href, icon: Icon }) => (
            <Link key={label} href={href}>
              <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border cursor-pointer"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: bg }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className="text-lg font-extrabold leading-none">{value}</p>
                <p className="text-[9px] font-semibold text-center leading-tight"
                  style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Low stock alert ── */}
        {(stats?.lowStock ?? 0) > 0 && (
          <Link href="/inventory">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer"
              style={{ background: "hsl(0 84% 60% / 0.08)", border: "1px solid hsl(0 84% 60% / 0.2)" }}>
              <Package className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--destructive))" }} />
              <p className="text-xs font-semibold flex-1" style={{ color: "hsl(var(--destructive))" }}>
                {stats?.lowStock} item{(stats?.lowStock ?? 0) > 1 ? "s" : ""} running low on stock
              </p>
              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--destructive))" }} />
            </div>
          </Link>
        )}

        {/* ── ComboFinder Tools ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm">ComboFinder Tools</h2>
            <Link href="/compatibility">
              <span className="text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>See all →</span>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {CF_TOOLS.map(({ label, iconType, href, color, bg, desc, badge }) => (
              <Link key={href + label} href={href}>
                <div className="relative flex flex-col items-center gap-2 p-3 rounded-2xl border cursor-pointer"
                  style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
                  {badge && (
                    <span className="absolute -top-1.5 -right-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: "#EF4444" }}>
                      {badge}
                    </span>
                  )}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: bg }}>
                    <CfToolIcon type={iconType} color={color} size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold leading-tight whitespace-pre-line">{label}</p>
                    <p className="text-[9px] mt-0.5 leading-tight" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {desc}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="font-bold text-sm mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {QUICK_LINKS.map(({ label, icon: Icon, href, color, bg }) => (
              <Link key={href + label} href={href}>
                <button className="w-full flex flex-col items-center gap-2 p-3.5 rounded-2xl border border-border bg-card">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <span className="text-[11px] font-semibold text-center leading-tight"
                    style={{ color: "hsl(var(--foreground))" }}>{label}</span>
                </button>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </ProtectedPage>
  );
}
