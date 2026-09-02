import { useQuery } from "@tanstack/react-query";
import {
  Users, UserCheck, UserPlus, DollarSign, CreditCard, Activity,
  Calendar, Download, Smartphone, Layers, Wrench, FileText,
  Video, Megaphone, Server, Database, HardDrive, RefreshCw,
  CheckCircle, AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";


const PLAN_COLORS: Record<string, string> = {
  Free: "#94a3b8",
  Pro: "#3b82f6",
  Business: "#a855f7",
  Lifetime: "#eab308",
};

function StatCard({
  label, value, icon: Icon, iconColor, isLoading,
}: {
  label: string; value: string | number; icon: any; iconColor: string; isLoading: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${iconColor}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      {isLoading
        ? <Skeleton className="h-9 w-24" />
        : <div className="text-3xl font-bold tracking-tight text-foreground">{value ?? 0}</div>
      }
    </div>
  );
}

export default function Dashboard() {
  // Real API calls
  const { data: globalStats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-global-stats"],
    queryFn: () => fetch(`/api/stats`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ["admin-user-stats"],
    queryFn: () => fetch(`/api/users/stats`, { credentials: "include" }).then(r => r.json()),
    // returns: { total, active, pending, byPlan: { Free, Pro, Business, Lifetime } }
  });

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: () => fetch(`/api/subscriptions/revenue`, { credentials: "include" }).then(r => r.json()),
    // returns: { total, byPlan }
  });

  const { data: recentUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: () => fetch(`/api/users`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: recentSubs, isLoading: subsLoading } = useQuery({
    queryKey: ["admin-recent-subs"],
    queryFn: () => fetch(`/api/subscriptions`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: activityLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["admin-activity-logs"],
    queryFn: () => fetch(`/api/activity-logs`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: monthlyTx } = useQuery({
    queryKey: ["admin-monthly-tx"],
    queryFn: () => fetch(`/api/transactions/monthly`, { credentials: "include" }).then(r => r.json()),
  });

  // Build donut chart data from real byPlan
  const byPlan = userStats?.byPlan ?? {};
  const totalForPie = Object.values(byPlan).reduce((a: any, b: any) => a + b, 0) as number;
  const pieData = Object.entries(byPlan)
    .filter(([, v]) => (v as number) > 0)
    .map(([name, value]) => ({
      name,
      value: value as number,
      pct: totalForPie > 0 ? (((value as number) / totalForPie) * 100).toFixed(1) : "0",
      color: PLAN_COLORS[name] ?? "#64748b",
    }));

  const revenueChartData: any[] = Array.isArray(monthlyTx) ? monthlyTx : [];
  const users: any[] = Array.isArray(recentUsers) ? recentUsers.slice(0, 5) : [];
  const subs: any[] = Array.isArray(recentSubs) ? recentSubs.slice(0, 4) : [];
  const logs: any[] = Array.isArray(activityLogs) ? activityLogs.slice(0, 5) : [];

  const now = new Date();
  const dateRange = `${now.toLocaleString("default", { month: "short" })} 1 – ${now.toLocaleString("default", { month: "short", day: "numeric" })}, ${now.getFullYear()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Dashboard / Overview of your platform</div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-lg text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{dateRange}</span>
          </div>
          <Button className="gap-2" variant="secondary" size="sm">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Stats Grid — real data */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Users" value={userStats?.total ?? 0} icon={Users} iconColor="from-violet-500 to-violet-700" isLoading={userStatsLoading} />
        <StatCard label="Active Users" value={userStats?.active ?? 0} icon={UserCheck} iconColor="from-emerald-400 to-emerald-600" isLoading={userStatsLoading} />
        <StatCard label="Pending Approval" value={userStats?.pending ?? 0} icon={UserPlus} iconColor="from-violet-500 to-violet-700" isLoading={userStatsLoading} />
        <StatCard label="Total Revenue" value={`$${(revenue?.total ?? 0).toLocaleString()}`} icon={DollarSign} iconColor="from-amber-400 to-amber-600" isLoading={revenueLoading} />
        <StatCard label="Subscriptions" value={Array.isArray(recentSubs) ? recentSubs.length : 0} icon={CreditCard} iconColor="from-pink-500 to-pink-700" isLoading={subsLoading} />
        <StatCard label="Compatibility DB" value={globalStats?.totalCombos ?? 0} icon={Activity} iconColor="from-indigo-500 to-indigo-700" isLoading={statsLoading} />
      </div>

      {/* 3-column section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* LEFT: Revenue chart + Recent Users + Quick Actions */}
        <div className="xl:col-span-5 space-y-5">
          {/* Revenue Chart */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4">Revenue Overview</h2>
            {revenueChartData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <DollarSign className="w-8 h-8 opacity-20" />
                <p>No transaction data yet</p>
              </div>
            ) : (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip contentStyle={{ backgroundColor: "#111C2E", borderColor: "#1E2A3A", color: "#f8fafc" }} />
                    <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recent Users */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Recent Users</h2>
              <Link href="/users"><span className="text-xs text-primary cursor-pointer hover:underline">View All →</span></Link>
            </div>
            {usersLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No users yet</p>
            ) : (
              <div className="space-y-3">
                {users.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">
                        {u.username?.charAt(0)?.toUpperCase() ?? "U"}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{u.username}</div>
                        <div className="text-xs text-muted-foreground">{u.accountType}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      u.subscriptionPlan === "Pro" ? "bg-violet-500/10 text-violet-400" :
                      u.subscriptionPlan === "Business" ? "bg-purple-500/10 text-purple-400" :
                      u.subscriptionPlan === "Lifetime" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-slate-500/10 text-slate-400"
                    }`}>
                      {u.subscriptionPlan ?? "Free"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Add User", icon: UserPlus, color: "text-violet-400", href: "/users" },
                { label: "Add Brand", icon: Layers, color: "text-purple-400", href: "/brands" },
                { label: "Add Model", icon: Smartphone, color: "text-emerald-400", href: "/brands" },
                { label: "Add Part", icon: Wrench, color: "text-amber-400", href: "/parts" },
                { label: "Add Issue", icon: FileText, color: "text-red-400", href: "/issues-fixes" },
                { label: "Add Document", icon: FileText, color: "text-sky-400", href: "/documents" },
                { label: "Upload Video", icon: Video, color: "text-orange-400", href: "/videos" },
                { label: "Announce", icon: Megaphone, color: "text-pink-400", href: "/announcements" },
              ].map((a) => (
                <Link key={a.href + a.label} href={a.href}>
                  <button className="w-full h-auto py-3 px-2 flex flex-col gap-1.5 items-center justify-center rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                    <a.icon className={`h-5 w-5 ${a.color}`} />
                    <span className="text-[11px] text-muted-foreground">{a.label}</span>
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: Users by Plan + Recent Subs */}
        <div className="xl:col-span-4 space-y-5">
          {/* Users by Plan donut */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4">Users By Plan</h2>
            {userStatsLoading ? (
              <Skeleton className="h-44 w-44 rounded-full mx-auto" />
            ) : pieData.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <Users className="w-8 h-8 opacity-20" />
                <p>No users yet</p>
              </div>
            ) : (
              <>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: any, name: any) => [`${v} users`, name]}
                        contentStyle={{ backgroundColor: "#111C2E", borderColor: "#1E2A3A", color: "#f8fafc" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-semibold">{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Recent Subscriptions */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Recent Subscriptions</h2>
              <Link href="/subscriptions"><span className="text-xs text-primary cursor-pointer hover:underline">View All →</span></Link>
            </div>
            {subsLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : subs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No subscriptions yet</p>
            ) : (
              <div className="space-y-3">
                {subs.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{s.userId}</p>
                      <p className="text-xs text-muted-foreground">{s.plan}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${parseFloat(s.amount ?? "0").toFixed(2)}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        s.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {s.status ?? "Active"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: System Health + Recent Activities */}
        <div className="xl:col-span-3 space-y-5">
          {/* System Health */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4">System Health</h2>
            <div className="space-y-3">
              {[
                { label: "Server Status", status: "Online", ok: true, icon: Server },
                { label: "Database", status: "Healthy", ok: true, icon: Database },
                { label: "API Status", status: "Operational", ok: true, icon: Activity },
                { label: "Backup", status: "Up to date", ok: true, icon: HardDrive },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.ok
                      ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                      : <AlertCircle className="w-4 h-4 text-red-500" />
                    }
                    <span className={`text-xs font-medium ${item.ok ? "text-emerald-500" : "text-red-500"}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <Link href="/activity-logs">
                <span className="text-xs text-primary hover:underline cursor-pointer">View System Logs →</span>
              </Link>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Recent Activities</h2>
              <Link href="/activity-logs"><span className="text-xs text-primary cursor-pointer hover:underline">View All →</span></Link>
            </div>
            {logsLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-muted-foreground text-sm gap-2">
                <RefreshCw className="w-6 h-6 opacity-30" />
                <p>No activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {(log.actor ?? "S").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground leading-snug">
                        <span className="text-primary">{log.actor}</span> — {log.action}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                      </p>
                    </div>
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
