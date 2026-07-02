import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Search, Bell, Menu } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function MainLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-muted-foreground hover:text-foreground">
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden md:block w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search anything... ⌘K" 
                className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full border border-card" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 md:hidden">
              {user?.name.split(' ').map(n => n[0]).join('') || 'AM'}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}