import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Smartphone, Layers, Search, LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Brands", href: "/brands", icon: Layers },
    { name: "Combos", href: "/combos", icon: Smartphone },
    { name: "Search", href: "/search", icon: Search },
  ];
  return (
    <div className="flex min-h-screen w-full bg-background font-sans text-foreground">
      <aside className="w-64 border-r border-border bg-sidebar flex-shrink-0 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/">
            <div className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight cursor-pointer hover:opacity-80 transition-opacity">
              <Smartphone className="h-6 w-6" />
              <span>ComboFinder</span>
            </div>
          </Link>
        </div>
        <div className="p-4 flex-1">
          <nav className="flex flex-col gap-1.5">
            {navigation.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.name} href={item.href}>
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium cursor-pointer ${isActive ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-border">
          <button onClick={() => logout()} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center px-4 border-b border-border bg-card md:hidden">
          <Link href="/">
            <div className="flex items-center gap-2 font-bold text-lg text-primary cursor-pointer hover:opacity-80 transition-opacity">
              <Smartphone className="h-5 w-5" />
              <span>ComboFinder</span>
            </div>
          </Link>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl w-full">{children}</div>
        </div>
      </main>
    </div>
  );
}
