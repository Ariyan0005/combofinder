import { useQuery } from "@tanstack/react-query";
import { Layers, Smartphone, Database, Activity, Search, ExternalLink, Wrench, Users, Package, AlertTriangle, Plus, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { ElementType } from "react";

interface Stats {
  totalBrands: number;
  totalModels: number;
  totalCombos: number;
  totalCustomers: number;
  activeRepairs: number;
  lowStock: number;
}

function StatCard({ label, value, sub, icon: Icon, accent, isLoading }: {
  label: string; value?: number; sub: string; icon: ElementType; accent: string; isLoading: boolean;
}) {
  return (
    <div className={`bg-card border-t-2 ${accent} border-l border-r border-b border-border rounded-xl p-4 flex flex-col gap-2 hover:shadow-sm transition-all`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      {isLoading ? <Skeleton className="h-8 w-20" /> : (
        <div className="text-3xl font-bold tracking-tight text-foreground">{value?.toLocaleString() ?? "—"}</div>
      )}
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

const quickActions = [
  { label: "New Repair Job", href: "/repairs", icon: Wrench, desc: "Log incoming phone for repair" },
  { label: "Add Customer", href: "/customers", icon: Users, desc: "Register a new customer" },
  { label: "Add Stock", href: "/inventory", icon: Package, desc: "Update inventory levels" },
  { label: "Manage Brands", href: "/brands", icon: Layers, desc: "Add or edit phone brands" },
  { label: "All Combos", href: "/combos", icon: Database, desc: "Browse compatible combos" },
  { label: "Search DB", href: "/search", icon: Search, desc: "Find models instantly" },
];

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const r = await fetch("/api/stats");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <Activity className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load statistics</h2>
        <p className="text-muted-foreground mb-4">The database might be unavailable.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Technician workspace overview.</p>
        </div>
        <a href="https://combofinder.iunlockd.com" target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm" className="gap-2 text-xs h-8">
            <ExternalLink className="h-3.5 w-3.5" /> View Site
          </Button>
        </a>
      </div>

      {/* Low stock alert */}
      {!isLoading && (stats?.lowStock ?? 0) > 0 && (
        <Link href="/inventory">
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5 cursor-pointer hover:border-amber-300 transition-colors">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">{stats?.lowStock} item{(stats?.lowStock ?? 0) > 1 ? "s" : ""} running low on stock</p>
              <p className="text-xs text-amber-600 mt-0.5">Click to view inventory →</p>
            </div>
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        <StatCard label="Active Repairs" value={stats?.activeRepairs} sub="Waiting + in progress" icon={Wrench} accent="border-t-amber-400" isLoading={isLoading} />
        <StatCard label="Customers" value={stats?.totalCustomers} sub="Registered" icon={Users} accent="border-t-blue-400" isLoading={isLoading} />
        <StatCard label="Brands" value={stats?.totalBrands} sub="Manufacturers" icon={Layers} accent="border-t-primary" isLoading={isLoading} />
        <StatCard label="Models" value={stats?.totalModels} sub="Device variants" icon={Smartphone} accent="border-t-indigo-400" isLoading={isLoading} />
        <StatCard label="Combos" value={stats?.totalCombos} sub="Compatible displays" icon={Database} accent="border-t-violet-400" isLoading={isLoading} />
        <StatCard label="Low Stock" value={stats?.lowStock} sub="Items to reorder" icon={AlertTriangle} accent="border-t-red-400" isLoading={isLoading} />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <div className="group flex items-center gap-3.5 bg-card border border-border rounded-xl p-3.5 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                  <action.icon className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary transition-colors" style={{ width: "1.1rem", height: "1.1rem" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{action.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{action.desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Info note */}
      <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Smartphone className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Mobile Technician Platform</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Manage repair jobs, customers, inventory, and phone compatibility from one place. Add new modules as your shop grows.
          </p>
        </div>
      </div>
    </div>
  );
}
