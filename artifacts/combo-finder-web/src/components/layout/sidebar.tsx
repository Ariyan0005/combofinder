import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Search, Wrench, Package, Users,
  BookOpen, BarChart2, Unlock, Receipt, Settings,
  LogOut, CreditCard, ChevronRight, Smartphone,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Compatibility Finder", icon: Search, href: "/compatibility" },
  { label: "Repairs", icon: Wrench, href: "/repairs" },
  { label: "Inventory", icon: Package, href: "/inventory" },
  { label: "Customers", icon: Users, href: "/customers" },
  { label: "Knowledge Base", icon: BookOpen, href: "/knowledge-base" },
  { label: "Reports", icon: BarChart2, href: "/reports" },
  { label: "Unlock Services", icon: Unlock, href: "/unlock-services" },
  { label: "Expenses", icon: Receipt, href: "/expenses" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar({ onClose }: { onClose: () => void }) {
  const [location] = useLocation();
  const { user, isGuest, logout } = useAuth();

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  async function handleLogout() {
    onClose();
    await logout();
  }

  return (
    <aside className="w-64 flex flex-col h-screen sticky top-0"
      style={{ background: "hsl(var(--sidebar))", color: "hsl(var(--sidebar-foreground))" }}>

      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(var(--primary))" }}>
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">ComboFinder</p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>All-in-One for Technicians</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div onClick={onClose}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all group"
                style={active
                  ? { background: "hsl(var(--primary))", color: "#fff" }
                  : { color: "rgba(255,255,255,0.55)" }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)";
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.background = "";
                }}>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </div>
                {active && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
              </div>
            </Link>
          );
        })}

        {/* Subscription link */}
        <Link href="/subscription">
          <div onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-all mt-1"
            style={{ color: "rgba(255,255,255,0.55)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ""; }}>
            <CreditCard className="w-4 h-4 flex-shrink-0" />
            Subscription
          </div>
        </Link>
      </nav>

      {/* User footer */}
      <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "hsl(var(--primary))" }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                {user.plan ?? user.role}
              </p>
            </div>
          </div>
        )}
        {isGuest && (
          <div className="px-3 py-2 mb-2 rounded-xl text-xs" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)" }}>
            Guest Mode
          </div>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: "rgba(255,100,100,0.8)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,100,100,0.1)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}>
          <LogOut className="w-4 h-4" />
          {isGuest ? "Exit Guest Mode" : "Logout"}
        </button>
      </div>
    </aside>
  );
}
