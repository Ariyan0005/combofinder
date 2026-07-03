import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Search, Wrench, Package, Users,
  BookOpen, BarChart3, Unlock, DollarSign, Settings,
  ChevronUp, X
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

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

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen border-r border-white/5">
      {/* Logo + close button on mobile */}
      <div className="p-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">ComboFinder</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">For Technicians</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-white/40 hover:text-white/80 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                isActive
                  ? "bg-primary text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}>
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* User profile */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            {user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "CF"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || "Technician"}</p>
            <p className="text-xs text-white/40 truncate">{user?.role || "Technician"}</p>
          </div>
          <ChevronUp className="w-4 h-4 text-white/30 shrink-0" />
        </div>
      </div>
    </div>
  );
}
