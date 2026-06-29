import { useGetStats } from "@workspace/api-client-react";
import { Layers, Smartphone, Database, Activity, Search, ExternalLink, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of the phone parts database.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover-elevate transition-all border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalBrands.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Registered manufacturers</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all border-l-4 border-l-chart-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Models</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalModels.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Device variations</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate transition-all border-l-4 border-l-chart-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Combos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalCombos.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Compatible display parts</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <p className="text-sm font-semibold mb-3">Quick Actions</p>
        <div className="flex gap-3 flex-wrap">
          <Link href="/brands">
            <Button className="gap-2"><Layers className="h-4 w-4"/> Manage Brands</Button>
          </Link>
          <Link href="/combos">
            <Button variant="secondary" className="gap-2"><Database className="h-4 w-4"/> View All Combos</Button>
          </Link>
          <Link href="/parts">
            <Button variant="secondary" className="gap-2"><Wrench className="h-4 w-4"/> Manage Parts</Button>
          </Link>
          <Link href="/search">
            <Button variant="outline" className="gap-2"><Search className="h-4 w-4"/> Search Database</Button>
          </Link>
          <a href="https://combofinder.iunlockd.com" target="_blank" rel="noreferrer">
            <Button variant="outline" className="gap-2"><ExternalLink className="h-4 w-4"/> View Site</Button>
          </a>
        </div>
      </div>
    </div>
  );
}
