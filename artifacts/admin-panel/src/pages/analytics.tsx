import { useQuery } from "@tanstack/react-query";
import { Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";

const PLAN_COLORS: Record<string, string> = {
  Free: "#94a3b8",
  Pro: "#3b82f6",
  Business: "#a855f7",
  Lifetime: "#eab308",
};

export default function Analytics() {
  const { data: userStats, isLoading: userLoading } = useQuery<{ total: number; active: number; pending: number; byPlan: Record<string, number> }>({
    queryKey: ["admin-user-stats"],
    queryFn: () => fetch("/api/users/stats", { credentials: "include" }).then(r => r.json()),
  });

  const { data: revenue, isLoading: revLoading } = useQuery<{ total: string; byPlan: Record<string, number> }>({
    queryKey: ["admin-revenue"],
    queryFn: () => fetch("/api/subscriptions/revenue", { credentials: "include" }).then(r => r.json()),
  });

  const { data: monthlyTx, isLoading: txLoading } = useQuery<{ month: string; income: number; expense: number }[]>({
    queryKey: ["admin-monthly-tx"],
    queryFn: () => fetch("/api/transactions/monthly", { credentials: "include" }).then(r => r.json()),
  });

  const { data: globalStats } = useQuery<{ totalBrands: number; totalModels: number; totalCombos: number; totalCustomers: number; activeRepairs: number }>({
    queryKey: ["admin-global-stats"],
    queryFn: () => fetch("/api/stats", { credentials: "include" }).then(r => r.json()),
  });

  // Build pie data from real byPlan
  const byPlan = userStats?.byPlan ?? {};
  const pieData = Object.entries(byPlan)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, color: PLAN_COLORS[name] ?? "#64748b" }));

  // Revenue by plan bar data
  const revByPlan = revenue?.byPlan ?? {};
  const revPlanData = Object.entries(revByPlan).map(([name, value]) => ({ name, revenue: value }));

  const monthlyData = Array.isArray(monthlyTx) ? monthlyTx.slice(-12).map(d => ({
    ...d,
    month: d.month.slice(0, 7),
  })) : [];

  const isLoading = userLoading || revLoading || txLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Platform metrics and growth overview.</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: userStats?.total ?? 0 },
          { label: "Active Users", value: userStats?.active ?? 0 },
          { label: "Total Revenue", value: `$${revenue?.total ?? "0.00"}` },
          { label: "Total Combos", value: globalStats?.totalCombos ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">{label}</div>
            {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{value}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income/Expense */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4">Monthly Income vs Expense</h2>
          {txLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : monthlyData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No transaction data yet.</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: "#111C2E", borderColor: "#1E2A3A", color: "#f8fafc" }} />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" name="Income" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" name="Expense" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* User Plan Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4">Users by Plan</h2>
          {userLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No user data yet.</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#111C2E", borderColor: "#1E2A3A", color: "#f8fafc" }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Revenue by Plan */}
        <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2">
          <h2 className="text-base font-semibold mb-4">Revenue by Plan</h2>
          {revLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : revPlanData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No revenue data yet.</div>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revPlanData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip cursor={{ fill: "#1E2A3A" }} contentStyle={{ backgroundColor: "#111C2E", borderColor: "#1E2A3A", color: "#f8fafc" }} />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {revPlanData.map((entry, i) => <Cell key={i} fill={PLAN_COLORS[entry.name] ?? "#3b82f6"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
