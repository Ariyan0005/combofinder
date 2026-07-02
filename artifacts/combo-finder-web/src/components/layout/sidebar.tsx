import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, Search, Wrench, Package, Users, 
  BookOpen, BarChart3, Unlock, DollarSign, Settings,
  ChevronUp
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/compatibility", label: "Compatibility Finder", icon: Search },
    { href: "/repairs", label: "Repairs", icon: Wrench },
    { href: "/inventory", label: "Inventory", icon: Package },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/unlock-services", label: "Unlock Services", icon: Unlock },
    { href: "/expenses", label: "Expenses", icon: DollarSign },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0 hidden md:flex border-r border-sidebar/20">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
          <Wrench className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg leading-tight">ComboFinder</h1>
          <p className="text-[10px] text-white/50 uppercase tracking-wider">All-in-One for Technicians</p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-primary text-white' : 'hover:bg-white/5 text-sidebar-foreground/80 hover:text-white'}`}>
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {user?.name.split(' ').map(n => n[0]).join('') || 'AM'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.name}</p>
            <p className="text-xs text-white/50 truncate">{user?.role}</p>
          </div>
          <ChevronUp className="w-4 h-4 text-white/50 shrink-0" />
        </div>
      </div>
    </div>
  );
}