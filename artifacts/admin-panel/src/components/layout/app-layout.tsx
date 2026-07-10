import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, Smartphone, Layers, Search, LogOut, Cpu, 
  Menu, X, ChevronRight, ChevronDown, Wrench, Users, Package, 
  SunMoon, Bell, FileText, Settings, ShieldCheck, Database, 
  Video, FolderOpen, CreditCard, DollarSign, Activity, FileKey, 
  ClipboardList, CheckSquare, Wrench as WrenchIcon, Factory,
  PieChart, Megaphone, Inbox, HardDrive, ScrollText
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

const navigationGroups = [
  {
    key: "overview",
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
    ]
  },
  {
    key: "management",
    label: "Management",
    items: [
      { name: "Users", href: "/users", icon: Users },
      { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
      { name: "Roles & Permissions", href: "/roles", icon: ShieldCheck },
      { name: "Technician Approvals", href: "/technician-approvals", icon: CheckSquare },
    ]
  },
  {
    key: "database",
    label: "Database",
    items: [
      { name: "Brands", href: "/brands", icon: Layers },
      { name: "Models", href: "/brands", icon: Smartphone },
      { name: "Parts Compatibility", href: "/parts", icon: Cpu },
      { name: "Compatibility Database", href: "/combos", icon: Database },
      { name: "Issues & Fixes", href: "/issues-fixes", icon: WrenchIcon },
      { name: "Schematics", href: "/schematics", icon: FolderOpen },
      { name: "ISP & Pinout", href: "/isp-pinout", icon: Cpu, badge: "New" },
      { name: "Documents", href: "/documents", icon: FileText },
      { name: "Videos", href: "/videos", icon: Video },
    ]
  },
  {
    key: "business",
    label: "Business",
    items: [
      { name: "Repair Categories", href: "/repair-categories", icon: ClipboardList },
      { name: "Inventory Categories", href: "/inventory-categories", icon: Package },
      { name: "Suppliers", href: "/suppliers", icon: Factory },
      { name: "Unlock Services", href: "/unlock-services", icon: FileKey, badge: "New" },
    ]
  },
  {
    key: "finance",
    label: "Finance",
    items: [
      { name: "Transactions", href: "/transactions", icon: DollarSign },
      { name: "Payouts", href: "/payouts", icon: CreditCard },
      { name: "Reports & Analytics", href: "/analytics", icon: PieChart },
    ]
  },
  {
    key: "system",
    label: "System",
    items: [
      { name: "Announcements", href: "/announcements", icon: Megaphone },
      { name: "Notifications", href: "/notifications", icon: Inbox },
      { name: "Settings", href: "/settings", icon: Settings },
      { name: "Backup & Restore", href: "/backup-restore", icon: HardDrive },
      { name: "Activity Logs", href: "/activity-logs", icon: ScrollText },
    ]
  }
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    return href === "/" ? location === "/" : location.startsWith(href);
  };

  return (
    <div className="flex min-h-screen w-full bg-background font-sans text-foreground">
      {/* Desktop Sidebar */}
      <aside className="w-64 flex-shrink-0 flex-col hidden md:flex" style={{ background: "hsl(var(--sidebar))", borderRight: "1px solid hsl(var(--sidebar-border))" }}>
        
        {/* Top Header */}
        <div className="h-16 flex items-center justify-between px-5" style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}>
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="flex items-center gap-2.5 cursor-pointer group">
                <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
                  <Smartphone className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white tracking-tight">ComboFinder</span>
                  <span className="text-[10px] font-medium text-muted-foreground">Admin Panel</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
        
        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search anything... Ctrl+K" 
              className="w-full bg-muted border border-border rounded-md pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-2 px-3 overflow-y-auto custom-scrollbar">
          <nav className="flex flex-col gap-4">
            {navigationGroups.map((group) => (
              <div key={group.key}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-3 text-muted-foreground">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link key={item.name} href={item.href}>
                        <div
                          className={`flex items-center justify-between px-3 py-2 rounded-md transition-all text-sm font-medium cursor-pointer group ${
                            active ? "bg-primary/10 text-primary border-l-2 border-primary" : "text-sidebar-foreground border-l-2 border-transparent hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"}`} />
                            <span>{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.badge && (
                              <span className="text-[9px] uppercase tracking-wider font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm">
                                {item.badge}
                              </span>
                            )}
                            {item.hasSub && (
                              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer / User */}
        <div className="p-4 flex items-center justify-between" style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
              AM
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Abu Mahara</span>
              <span className="text-[10px] text-muted-foreground">Super Admin</span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        
        {/* Desktop Topbar */}
        <header className="h-16 hidden md:flex items-center justify-end px-6 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <SunMoon className="h-5 w-5" />
            </button>
            <div className="relative cursor-pointer">
              <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
              <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[9px] font-bold px-1 rounded-full border-2 border-card">
                13
              </span>
            </div>
            <div className="w-px h-6 bg-border mx-2"></div>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => logout()}>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                AM
              </div>
              <div className="flex flex-col hidden lg:flex">
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Abu Mahara</span>
                <span className="text-[10px] text-muted-foreground">Super Admin</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="h-14 flex items-center justify-between px-4 bg-card border-b border-border md:hidden sticky top-0 z-40">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-bold text-foreground">ComboFinder Admin</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Dropdown Menu (Simplified) */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-14 left-0 right-0 z-50 bg-card border-b border-border shadow-lg max-h-[80vh] overflow-y-auto">
            <nav className="p-3 flex flex-col gap-1">
              {navigationGroups.map((group) => (
                <div key={group.key} className="mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1 px-3 text-muted-foreground">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <div
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                          isActive(item.href)
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
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
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
