import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Smartphone, Layers, Search, LogOut, Cpu, Menu, X, ChevronRight, Wrench, Users, Package } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, group: "overview" },
  { name: "Repairs", href: "/repairs", icon: Wrench, group: "workshop" },
  { name: "Customers", href: "/customers", icon: Users, group: "workshop" },
  { name: "Inventory", href: "/inventory", icon: Package, group: "workshop" },
  { name: "Brands", href: "/brands", icon: Layers, group: "catalog" },
  { name: "Combos", href: "/combos", icon: Smartphone, group: "catalog" },
  { name: "Parts", href: "/parts", icon: Cpu, group: "catalog" },
  { name: "Search", href: "/search", icon: Search, group: "catalog" },
];

const GROUPS = [
  { key: "overview", label: "Overview" },
  { key: "workshop", label: "Workshop" },
  { key: "catalog", label: "Catalog" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <div className="flex min-h-screen w-full bg-background font-sans text-foreground">
      {/* Desktop Sidebar */}
      <aside className="w-64 flex-shrink-0 flex-col hidden md:flex" style={{ background: "hsl(var(--sidebar))", borderRight: "1px solid hsl(var(--sidebar-border))" }}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5" style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}>
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer group">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(217 91% 60%)" }}>
                <Smartphone className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight">ComboFinder</span>
                <div className="text-[10px] font-medium" style={{ color: "hsl(215 25% 55%)" }}>Admin Panel</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 px-3 overflow-y-auto">
          <nav className="flex flex-col gap-4">
            {GROUPS.map((group) => {
              const items = navigation.filter(n => n.group === group.key);
              return (
                <div key={group.key}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1 px-3" style={{ color: "hsl(215 25% 40%)" }}>{group.label}</p>
                  <div className="flex flex-col gap-0.5">
                    {items.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link key={item.name} href={item.href}>
                          <div
                            className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm font-medium cursor-pointer group ${active ? "nav-active" : ""}`}
                            style={!active ? { color: "hsl(215 25% 65%)" } : {}}
                            onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = "hsl(var(--sidebar-accent))"; (e.currentTarget as HTMLDivElement).style.color = "hsl(210 40% 98%)"; } }}
                            onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = ""; (e.currentTarget as HTMLDivElement).style.color = "hsl(215 25% 65%)"; } }}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="h-4 w-4 flex-shrink-0" />
                              {item.name}
                            </div>
                            {active && <ChevronRight className="h-3 w-3 opacity-60" />}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-3" style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ color: "hsl(215 25% 55%)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "hsl(0 62% 30% / 0.15)";
              (e.currentTarget as HTMLButtonElement).style.color = "hsl(0 84% 65%)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "";
              (e.currentTarget as HTMLButtonElement).style.color = "hsl(215 25% 55%)";
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-14 flex items-center justify-between px-4 bg-card border-b border-border md:hidden sticky top-0 z-40">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(217 91% 60%)" }}>
                <Smartphone className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-foreground">ComboFinder</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-14 left-0 right-0 z-50 bg-card border-b border-border shadow-lg">
            <nav className="p-3 flex flex-col gap-1">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
              <button
                onClick={() => { setMobileMenuOpen(false); logout(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mt-1"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </nav>
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="mx-auto max-w-6xl w-full">{children}</div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex md:hidden">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.name} href={item.href} className="flex-1">
                <div
                  className={`flex flex-col items-center justify-center py-2.5 gap-1 transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {active && (
                    <div className="absolute top-0 w-6 h-0.5 rounded-full bg-primary" />
                  )}
                  <item.icon className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`} />
                  <span className="text-[9px] font-semibold">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
