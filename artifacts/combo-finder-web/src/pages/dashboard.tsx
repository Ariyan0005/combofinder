import { useQuery } from "@tanstack/react-query";
import {
  Wrench, Users, Package, CheckCircle, Bell, ChevronRight,
  ShoppingCart, BarChart2, ArrowDownToLine, UserPlus, Wallet, Receipt,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { ProtectedPage } from "@/components/protected-page";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

const QUICK_LINKS = [
  { label: "New Repair",  icon: Wrench,          href: "/repairs",    color: "#6366F1", bg: "#EEF2FF" },
  { label: "Customers",   icon: Users,            href: "/customers",  color: "#8B5CF6", bg: "#F5F3FF" },
  { label: "POS",         icon: ShoppingCart,     href: "/pos",        color: "#10B981", bg: "#ECFDF5" },
  { label: "Stock In",    icon: ArrowDownToLine,  href: "/inventory",  color: "#F59E0B", bg: "#FFF7E6" },
  { label: "Sell Report", icon: Receipt,          href: "/invoices",   color: "#0EA5E9", bg: "#F0FDFF" },
  { label: "Expenses",    icon: Wallet,           href: "/expenses",   color: "#EF4444", bg: "#FEF2F2" },
  { label: "Reports",     icon: BarChart2,        href: "/reports",    color: "#3B82F6", bg: "#EFF6FF" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

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

  const totalRepairs = Array.isArray(repairs) ? repairs.length : 0;
  const deliveredToday = Array.isArray(repairs)
    ? repairs.filter(r => r.status === "Delivered" &&
        new Date(r.updatedAt ?? r.createdAt).toDateString() === new Date().toDateString()).length
    : 0;

  return (
    <ProtectedPage>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{greeting()},</p>
            <h1 className="text-xl font-extrabold mt-0.5">{user?.name ?? "Technician"} 👋</h1>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Here's what's happening today.</p>
          </div>
          <button className="w-9 h-9 rounded-full border flex items-center justify-center"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
            <Bell className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        </div>

        {/* Stat cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Repairs",   value: totalRepairs,              icon: Wrench,       color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.1)", href: "/repairs" },
            { label: "Active Repairs",  value: stats?.activeRepairs ?? 0, icon: Wrench,       color: "#F59E0B",             bg: "#FFF7E6",                     href: "/repairs" },
            { label: "Delivered Today", value: deliveredToday,            icon: CheckCircle,  color: "#10B981",             bg: "#ECFDF5",                     href: "/repairs" },
            { label: "Customers",       value: stats?.totalCustomers ?? 0,icon: Users,        color: "#8B5CF6",             bg: "#F5F3FF",                     href: "/customers" },
          ].map(({ label, value, icon: Icon, color, bg, href }) => (
            <Link key={label} href={href}>
              <div className="bg-card rounded-2xl p-4 border border-border flex items-start gap-3 cursor-pointer hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
                  <p className="text-2xl font-extrabold mt-0.5">{value}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Low stock alert — only shows if there are real low-stock items */}
        {(stats?.lowStock ?? 0) > 0 && (
          <Link href="/inventory">
            <div className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer"
              style={{ background: "hsl(0 84% 60% / 0.08)", border: "1px solid hsl(0 84% 60% / 0.2)" }}>
              <Package className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(var(--destructive))" }} />
              <p className="text-sm font-semibold flex-1" style={{ color: "hsl(var(--destructive))" }}>
                {stats?.lowStock} item{(stats?.lowStock ?? 0) > 1 ? "s" : ""} running low on stock
              </p>
              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--destructive))" }} />
            </div>
          </Link>
        )}

        {/* Quick Links */}
        <div>
          <h2 className="font-bold text-base mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {QUICK_LINKS.map(({ label, icon: Icon, href, color, bg }) => (
              <Link key={href + label} href={href}>
                <button className="w-full flex flex-col items-center gap-2 p-3.5 rounded-2xl border border-border bg-card hover:shadow-sm transition-shadow">
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
