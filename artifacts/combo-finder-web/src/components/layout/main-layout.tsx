import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Search, Package, Menu, X,
  Users, Unlock, Receipt,
  Settings, LogOut, CreditCard, Smartphone, ShoppingCart, FileText,
  BookMarked, Heart, Users2, Wrench, Store,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import Sidebar from "./sidebar";

const BOTTOM_NAV = [
  { label: "Home",      icon: LayoutDashboard, href: "/"          },
  { label: "Repairs",   icon: Wrench,          href: "/repairs"   },
  { label: "POS",       icon: ShoppingCart,    href: "/pos"       },
  { label: "Inventory", icon: Package,         href: "/inventory" },
  { label: "More",      icon: Menu,            href: "__more__"   },
];

const GUEST_NAV = [
  { label: "Home",            icon: LayoutDashboard, href: "/"                },
  { label: "Unlock Services", icon: Unlock,          href: "/unlock-services" },
  { label: "Find Parts",      icon: Search,          href: "/find-parts"      },
];

// Grid is 2 columns (left | right), items fill left-to-right row by row.
// Left col  = tools & settings   Right col = daily operations (people & money)
const MORE_ITEMS = [
  { label: "Unlock Services",   icon: Unlock,      href: "/unlock-services" }, // L1
  { label: "Staff & Technician",icon: Users2,      href: "/staff"           }, // R1
  { label: "Database",          icon: Search,      href: "/compatibility"   }, // L2
  { label: "Customers",         icon: Users,       href: "/customers"       }, // R2
  { label: "Subscriptions",     icon: CreditCard,  href: "/subscription"    }, // L3
  { label: "Invoices",          icon: FileText,    href: "/invoices"        }, // R3
  { label: "Find Parts",        icon: Store,       href: "/find-parts"      }, // L4
  { label: "Ledgers",           icon: BookMarked,  href: "/ledger"          }, // R4
  { label: "Settings",          icon: Settings,    href: "/settings"        }, // L5
  { label: "Expense",           icon: Receipt,     href: "/expenses"        }, // R5
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
          {/* Donate + Avatar / Login — always shown */}
          <div className="flex items-center gap-3">
            <Link href="/donate">
              <button className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border mr-2"
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
          <div className="flex items-center">
            {(isGuest ? GUEST_NAV : BOTTOM_NAV).map((item) => {
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

              /* ── POS: pill/capsule — icon + label inside the circle, stays in nav ── */
              if (item.href === "/pos") {
                return (
                  <Link key={item.href} href={item.href} className="flex-1 flex justify-center">
                    <div className="flex flex-col items-center justify-center py-2">
                      <div className="rounded-full flex items-center gap-1.5 px-4 py-2 active:scale-95 transition-transform"
                        style={{
                          background: "hsl(var(--primary))",
                          boxShadow: "0 2px 10px hsl(var(--primary) / 0.45)",
                        }}>
                        <ShoppingCart className="w-4 h-4 text-white" />
                        <span className="text-[11px] font-bold text-white tracking-wide">POS</span>
                      </div>
                    </div>
                  </Link>
                );
              }

              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <div className="flex flex-col items-center justify-center py-2 gap-1 transition-colors relative"
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
            {/* Exit Guest Mode button — only shown for guests */}
            {isGuest && (
              <button
                onClick={handleLogout}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-colors"
                style={{ color: "hsl(var(--destructive))" }}>
                <LogOut className="w-5 h-5" />
                <span className="text-[9px] font-semibold">Exit</span>
              </button>
            )}
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
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border text-left text-xs font-medium hover:border-primary transition-colors whitespace-nowrap"
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
