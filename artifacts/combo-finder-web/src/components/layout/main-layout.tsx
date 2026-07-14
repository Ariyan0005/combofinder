import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Search, Plus, Package, Menu, X,
  Users, BookOpen, BarChart2, Unlock, Receipt,
  Settings, LogOut, CreditCard, Smartphone, ShoppingCart, FileText,
  BookMarked, Heart,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import Sidebar from "./sidebar";

const BOTTOM_NAV = [
  { label: "Home", icon: LayoutDashboard, href: "/" },
  { label: "Search", icon: Search, href: "/compatibility" },
  { label: "fab", icon: Plus, href: "/repairs" },
  { label: "Inventory", icon: Package, href: "/inventory" },
  { label: "More", icon: Menu, href: "__more__" },
];

const MORE_ITEMS = [
  // ── Daily use ──
  { label: "Customers",      icon: Users,        href: "/customers" },
  { label: "Point of Sale",  icon: ShoppingCart, href: "/pos" },
  { label: "Invoices",       icon: FileText,     href: "/invoices" },
  { label: "Ledger / Credit",icon: BookMarked,   href: "/ledger" },
  { label: "Expenses",       icon: Receipt,      href: "/expenses" },
  // ── Analysis ──
  { label: "Reports",        icon: BarChart2,    href: "/reports" },
  // ── Tools / Reference ──
  { label: "Knowledge Base", icon: BookOpen,     href: "/knowledge-base" },
  { label: "Unlock Services",icon: Unlock,       href: "/unlock-services" },
  // ── Account ──
  { label: "Subscription",   icon: CreditCard,   href: "/subscription" },
  { label: "Settings",       icon: Settings,     href: "/settings" },
];

export default function MainLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, isGuest, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  async function handleLogout() {
    setMoreOpen(false);
    await logout();
  }

  return (
    <div className="flex min-h-screen w-full" style={{ background: "hsl(var(--background))" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar onClose={() => {}} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--primary))" }}>
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base">ComboFinder</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/donate">
              <button className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border"
                style={{ borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))" }}>
                <Heart className="w-3 h-3" />
                Donate
              </button>
            </Link>
            {user && (
              <Link href="/settings">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer"
                  style={{ background: "hsl(var(--primary))" }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </Link>
            )}
            {isGuest && (
              <Link href="/login">
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: "hsl(var(--primary))", color: "#fff" }}>
                  Login
                </button>
              </Link>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 pb-24 md:pb-6">
          <div className="mx-auto max-w-4xl w-full">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border">
          <div className="flex items-end">
            {BOTTOM_NAV.map((item) => {
              if (item.href === "__more__") {
                return (
                  <button key="more"
                    onClick={() => setMoreOpen(true)}
                    className="flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-colors"
                    style={{ color: moreOpen ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-[9px] font-semibold">{item.label}</span>
                  </button>
                );
              }
              if (item.label === "fab") {
                return (
                  <button key="fab"
                    onClick={() => navigate("/repairs")}
                    className="flex-1 flex flex-col items-center justify-center -mt-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                      style={{ background: "hsl(var(--primary))" }}>
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                  </button>
                );
              }
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <div className="flex flex-col items-center justify-center py-2 gap-1 transition-colors"
                    style={{ color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                    {active && (
                      <div className="absolute top-0 w-6 h-0.5 rounded-full"
                        style={{ background: "hsl(var(--primary))" }} />
                    )}
                    <item.icon className={`w-5 h-5 ${active ? "scale-110" : ""} transition-transform`} />
                    <span className="text-[9px] font-semibold">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* "More" bottom sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div className="relative bg-card rounded-t-2xl p-5 pt-4 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="w-10 h-1 rounded-full mx-auto mb-4"
              style={{ background: "hsl(var(--border))" }} />
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-base">More</span>
              <button onClick={() => setMoreOpen(false)} className="p-1 rounded-lg"
                style={{ background: "hsl(var(--muted))" }}>
                <X className="w-5 h-5" style={{ color: "hsl(var(--muted-foreground))" }} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {MORE_ITEMS.map((item) => (
                <Link key={item.href} href={item.href}>
                  <button onClick={() => setMoreOpen(false)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border text-left text-sm font-medium hover:border-primary transition-colors"
                    style={{ background: "hsl(var(--background))" }}>
                    <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
                    {item.label}
                  </button>
                </Link>
              ))}
            </div>
            {(user || isGuest) && (
              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                style={{ color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.08)" }}>
                <LogOut className="w-4 h-4" />
                {isGuest ? "Exit Guest Mode" : "Logout"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
