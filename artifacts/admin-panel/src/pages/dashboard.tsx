import type { ElementType } from "react";
import { useGetStats } from "@workspace/api-client-react";
import { Layers, Smartphone, Database, Activity, Search, ExternalLink, Wrench, TrendingUp, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  colorClass,
  isLoading,
}: {
  label: string;
  value?: number;
  sub: string;
  icon: ElementType;
  colorClass: string;
  isLoading: boolean;
}) {
  return (
    <div className={`bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover-elevate transition-all ${colorClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-primary" style={{ width: "1.1rem", height: "1.1rem" }} />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-9 w-24" />
      ) : (
        <div className="text-3xl font-bold tracking-tight text-foreground">
          {value?.toLocaleString() ?? "—"}
        </div>
      )}
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <TrendingUp className="h-3 w-3 text-green-500" />
        {sub}
      </p>
    </div>
  );
}

const quickActions = [
  { label: "Manage Brands", href: "/brands", icon: Layers, variant: "default" as const, desc: "Add or edit phone brands" },
  { label: "All Combos", href: "/combos", icon: Database, variant: "secondary" as const, desc: "Browse compatible combos" },
  { label: "Manage Parts", href: "/parts", icon: Wrench, variant: "secondary" as const, desc: "Batteries, ICs & boards" },
  { label: "Search DB", href: "/search", icon: Search, variant: "outline" as const, desc: "Find models instantly" },
];

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useGetStats();

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Phone parts compatibility database overview.</p>
        </div>
        <a href="https://combofinder.iunlockd.com" target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <ExternalLink className="h-3.5 w-3.5" />
            View Live Site
          </Button>
        </a>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard
          label="Total Brands"
          value={stats?.totalBrands}
          sub="Registered manufacturers"
          icon={Layers}
          colorClass="stat-card-blue"
          isLoading={isLoading}
        />
        <StatCard
          label="Total Models"
          value={stats?.totalModels}
          sub="Device variations"
          icon={Smartphone}
          colorClass="stat-card-green"
          isLoading={isLoading}
        />
        <StatCard
          label="Total Combos"
          value={stats?.totalCombos}
          sub="Compatible display parts"
          icon={Database}
          colorClass="stat-card-purple"
          isLoading={isLoading}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <div className="group flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{action.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{action.desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Smartphone className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Mobile Technician Database</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage phone models, compatible display combos, spare parts (batteries, ICs, charging boards) all in one place. Search across the database to find compatible parts instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
