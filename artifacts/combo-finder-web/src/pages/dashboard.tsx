import { useAuth } from "@/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Wrench, Package, Users, AlertTriangle, DollarSign,
  Plus, Search, ShieldCheck, RefreshCw
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function greeting(name?: string) {
  const h = new Date().getHours();
  const t = h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  return `${t}, ${name?.split(" ")[0] ?? "Technician"} 👋`;
}

const STATUS_STYLE: Record<string, string> = {
  Repairing: "bg-blue-100 text-blue-700",
  Waiting:   "bg-amber-100 text-amber-700",
  Ready:     "bg-emerald-100 text-emerald-700",
  Delivered: "bg-slate-100 text-slate-600",
};

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => fetch(`${BASE}/api/stats`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: repairs, isLoading: repairsLoading } = useQuery({
    queryKey: ["repairs-recent"],
    queryFn: () => fetch(`${BASE}/api/repairs`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: lowStock, isLoading: stockLoading } = useQuery({
    queryKey: ["low-stock"],
    queryFn: () => fetch(`${BASE}/api/inventory/low-stock`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: monthly } = useQuery({
    queryKey: ["monthly-stats"],
    queryFn: () => fetch(`${BASE}/api/monthly-stats`, { credentials: "include" }).then(r => r.json()),
  });

  const recentRepairs: any[] = Array.isArray(repairs) ? repairs.slice(0, 5) : [];
  const lowStockItems: any[] = Array.isArray(lowStock) ? lowStock.slice(0, 5) : [];
  const chartData: any[] = Array.isArray(monthly) ? monthly : [];

  // Count repairs by status
  const readyCount = Array.isArray(repairs)
    ? repairs.filter((r: any) => r.status === "Ready").length
    : 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{greeting(user?.name)}</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">Here's what's happening in your shop today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Active Repairs",
            value: statsLoading ? "—" : (stats?.activeRepairs ?? 0),
            sub: "Waiting + in progress",
            icon: Wrench, color: "text-blue-600", bg: "bg-blue-50",
          },
          {
            label: "Pending Delivery",
            value: repairsLoading ? "—" : readyCount,
            sub: "Ready to pick up",
            icon: Package, color: "text-amber-600", bg: "bg-amber-50",
          },
          {
            label: "Customers",
            value: statsLoading ? "—" : (stats?.totalCustomers ?? 0),
            sub: "Total registered",
            icon: Users, color: "text-emerald-600", bg: "bg-emerald-50",
          },
          {
            label: "Low Stock",
            value: statsLoading ? "—" : (stats?.lowStock ?? 0),
            sub: "Items need reorder",
            icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50",
          },
          {
            label: "Compatibility DB",
            value: statsLoading ? "—" : (stats?.totalCombos ?? 0),
            sub: "Compatible parts",
            icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50",
          },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg}`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <div>
              <p className="text-xs font-semibold text-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          {/* Recent Repairs */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Recent Repairs</h2>
              <Link href="/repairs" className="text-xs text-primary font-medium hover:underline">View All →</Link>
            </div>

            {repairsLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : recentRepairs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Wrench className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No repairs yet. <Link href="/repairs" className="text-primary">Add one →</Link></p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">ID</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Customer</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Device</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentRepairs.map((r: any) => (
                      <tr key={r.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">#{r.id}</td>
                        <td className="px-4 py-2.5 font-medium">{r.customerName ?? r.customerPhone ?? "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{r.phoneBrand} {r.phoneModel}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[r.status] ?? "bg-muted text-muted-foreground"}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Monthly chart */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="font-semibold text-foreground mb-4">Monthly Overview</h2>
            {chartData.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                <BarIcon />
                <p className="text-sm mt-2">No monthly data yet</p>
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => [`$${v}`, undefined]} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2.5} dot={false} name="Income" />
                    <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2.5} dot={false} name="Expense" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="font-semibold text-foreground mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "New Repair", icon: Plus, color: "bg-blue-50 text-blue-600", href: "/repairs" },
                { label: "Find Compatibility", icon: Search, color: "bg-emerald-50 text-emerald-600", href: "/compatibility" },
                { label: "Add Inventory", icon: Package, color: "bg-purple-50 text-purple-600", href: "/inventory" },
                { label: "Add Customer", icon: Users, color: "bg-orange-50 text-orange-600", href: "/customers" },
                { label: "Knowledge Base", icon: ShieldCheck, color: "bg-yellow-50 text-yellow-600", href: "/knowledge-base" },
                { label: "Unlock Services", icon: ShieldCheck, color: "bg-red-50 text-red-600", href: "/unlock-services" },
              ].map((a, i) => (
                <Link key={i} href={a.href}>
                  <div className="p-3 border border-border rounded-lg hover:border-primary/30 hover:bg-primary/3 cursor-pointer transition-all flex flex-col gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.color}`}>
                      <a.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-foreground leading-tight">{a.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Low Stock Alert</h2>
              <Link href="/inventory" className="text-xs text-primary font-medium hover:underline">View All →</Link>
            </div>
            {stockLoading ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Loading...</div>
            ) : lowStockItems.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                ✅ All items are well stocked
              </div>
            ) : (
              <div>
                {lowStockItems.map((item: any) => (
                  <div key={item.id} className="px-4 py-3 border-b border-border last:border-0 flex items-center justify-between hover:bg-muted/20">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.partName}</p>
                      <p className="text-xs text-muted-foreground">Min: {item.minStock}</p>
                    </div>
                    <span className="ml-2 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full shrink-0">
                      {item.quantity} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BarIcon() {
  return (
    <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="12" width="4" height="8" rx="1" fill="currentColor" />
      <rect x="10" y="7" width="4" height="13" rx="1" fill="currentColor" />
      <rect x="17" y="4" width="4" height="16" rx="1" fill="currentColor" />
    </svg>
  );
}
