import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Search, Package, Menu, X,
  Users, Unlock, Receipt,
  Settings, LogOut, CreditCard, Smartphone, ShoppingCart, FileText,
  BookMarked, Heart, Users2, Wrench, Store, BarChart2, MessageCircle,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import Sidebar from "./sidebar";
import { OnboardingModal } from "@/components/onboarding-modal";

const WHATSAPP_SUPPORT_URL = "https://wa.me/96897043234?text=Hi%21+I+need+support.+I%27m+contacting+you+from+the+ComboFinder+app.";

const BOTTOM_NAV = [
  { label: "Home",      icon: LayoutDashboard, href: "/"          },
  { label: "Repairs",   icon: Wrench,          href: "/repairs"   },
  { label: "POS",       icon: ShoppingCart,    href: "/pos"       },
  { label: "Inventory", icon: Package,         href: "/inventory" },
  { label: "More",      icon: Menu,            href: "__more__"   },
];

const GENERAL_STORE_BOTTOM_NAV = [
  { label: "Home",      icon: LayoutDashboard, href: "/"          },
  { label: "Stock In",  icon: Package,         href: "/stock-in"  },
  { label: "POS",       icon: ShoppingCart,    href: "/pos"       },
  { label: "Inventory", icon: Package,         href: "/inventory"  },
  { label: "More",      icon: Menu,            href: "__more__"   },
];

const GUEST_NAV = [
  { label: "Home",            icon: LayoutDashboard, href: "/"                },
  { label: "Unlock Services", icon: Unlock,          href: "/unlock-services" },
  { label: "Find Spare Parts", icon: Search,          href: "/find-parts"      },
];

// Grid is 2 columns (left | right), items fill left-to-right row by row.
// Left: Staff & Technician, Customers & Suppliers, Invoices, Ledger, Expense
// Right: Find Spare Parts, Unlock Services, Database, Subscriptions, Settings
const MORE_ITEMS = [
  { label: "Staff & Technician",     icon: Users2,      href: "/staff"           }, // Row 1 Left
  { label: "Find Spare Parts",       icon: Store,       href: "/find-parts"      }, // Row 1 Right
  { label: "Customers & Suppliers",  icon: Users,       href: "/customers"       }, // Row 2 Left
  { label: "Unlock Services",        icon: Unlock,      href: "/unlock-services" }, // Row 2 Right
  { label: "Invoices",               icon: FileText,    href: "/invoices"        }, // Row 3 Left
  { label: "Database",               icon: Search,      href: "/compatibility"   }, // Row 3 Right
  { label: "Ledger",                 icon: BookMarked,  href: "/ledger"          }, // Row 4 Left
  { label: "Subscriptions",          icon: CreditCard,  href: "/subscription"    }, // Row 4 Right
  { label: "Expense",                icon: Receipt,     href: "/expenses"        }, // Row 5 Left
  { label: "Settings",               icon: Settings,    href: "/settings"        }, // Row 5 Right
];

const GENERAL_STORE_MORE_ITEMS = [
  { label: "Staff",                icon: Users2,      href: "/staff"           },
  { label: "Customers & Suppliers", icon: Users,       href: "/customers"       },
  { label: "Invoices",              icon: FileText,    href: "/invoices"        },
  { label: "Sales Report",          icon: BarChart2,   href: "/sales-report"    },
  { label: "Ledger",                icon: BookMarked,  href: "/ledger"          },
  { label: "Expenses",              icon: Receipt,     href: "/expenses"        },
  { label: "Subscription",          icon: CreditCard,  href: "/subscription"    },
  { label: "Settings",              icon: Settings,    href: "/settings"        },
];

export default function MainLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, isGuest, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const isGeneralStore = user?.businessType === "general_store";
  const bottomNav = isGeneralStore ? GENERAL_STORE_BOTTOM_NAV : BOTTOM_NAV;
  const moreItems = isGeneralStore ? GENERAL_STORE_MORE_ITEMS : MORE_ITEMS;
  const staffHidden = new Set(["/expenses", "/reports", "/sales-report", "/settings", "/subscription", "/staff"]);
  const visibleMoreItems = user?.isStaff ? moreItems.filter(item => !staffHidden.has(item.href)) : moreItems;

  useEffect(() => {
    if (moreOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [moreOpen]);

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
          <div className="flex items-center gap-2.5">
            <img
              src="/pos-cert-logo.png"
              alt="PosCert"
              className="w-32 h-11 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/pos-cert-logo.png";
              }}
            />
          </div>
          {/* Donate (Free users only) / Support (Premium users) + Avatar / Login */}
          <div className="flex items-center gap-2">
            {(!user || !user.plan || user.plan.toLowerCase() === "free") && (
              <Link href="/donate">
                <button className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border mr-1"
                  style={{ borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))" }}>
                  <Heart className="w-3 h-3" />
                  Donate
                </button>
              </Link>
            )}
            {user && user.plan && user.plan.toLowerCase() !== "free" && (location === "/" || location === "/settings" || location.startsWith("/settings")) && (
              <a href={WHATSAPP_SUPPORT_URL} target="_blank" rel="noopener noreferrer">
                <button className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white shadow-sm mr-1"
                  style={{ background: "hsl(var(--primary))" }}>
                  <MessageCircle className="w-3.5 h-3.5" />
                  Support
                </button>
              </a>
            )}
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
            {(isGuest ? GUEST_NAV : bottomNav).map((item) => {
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
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
               {visibleMoreItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <button onClick={() => setMoreOpen(false)}
                    className="w-full flex items-center gap-2.5 p-3 rounded-xl border border-border text-left text-xs font-medium hover:border-primary transition-colors min-w-0"
                    style={{ background: "hsl(var(--background))" }}>
                    <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
                    <span className="truncate">{item.label}</span>
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

      {/* First-time setup / onboarding modal */}
      {user && <OnboardingModal />}
    </div>
  );
}
