import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Search, Grid2x2, Home, Smartphone } from "lucide-react";

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const navLinks = [
    { href: "/", label: "Search", icon: Search },
    { href: "/brands", label: "Brands", icon: Grid2x2 },
  ];

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/95 backdrop-blur-md shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold">ComboFinder</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive(href)
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 pb-24 sm:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex sm:hidden border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-1px_12px_rgba(0,0,0,0.08)]">
        {[
          { href: "/", label: "Search", icon: Home },
          { href: "/brands", label: "Brands", icon: Grid2x2 },
        ].map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className="flex-1">
              <div className={`relative flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                )}
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-semibold">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
