import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Wrench, Users, Package } from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";

const BASE = () => import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Reports() {
  const { data: stats } = useQuery<any>({
    queryKey: ["stats"],
    queryFn: () => fetch(`${BASE()}/api/stats`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: monthlyData } = useQuery<any[]>({
    queryKey: ["monthly-stats"],
    queryFn: () => fetch(`${BASE()}/api/monthly-stats`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: repairs } = useQuery<any[]>({
    queryKey: ["repairs"],
    queryFn: () => fetch(`${BASE()}/api/repairs`, { credentials: "include" }).then(r => r.json()),
  });

  const chartData = Array.isArray(monthlyData) ? monthlyData : [];
  const repairList = Array.isArray(repairs) ? repairs : [];

  const statusBreakdown = ["Waiting", "Repairing", "Ready", "Delivered"].map(s => ({
    name: s,
    count: repairList.filter(r => r.status === s).length,
  }));

  const STATUS_COLOR_MAP: Record<string, string> = {
    Waiting: "#F59E0B", Repairing: "hsl(252,100%,64%)", Ready: "#10B981", Delivered: "#6B7280",
  };

  return (
    <ProtectedPage>
      <div className="space-y-5">
        <h1 className="text-xl font-extrabold pt-1">Reports</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Repairs", value: repairList.length, icon: Wrench, color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.1)" },
            { label: "Customers", value: stats?.totalCustomers ?? 0, icon: Users, color: "#8B5CF6", bg: "#F5F3FF" },
            { label: "Low Stock", value: stats?.lowStock ?? 0, icon: Package, color: "#EF4444", bg: "#FEF2F2" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-card rounded-2xl border border-border p-3 text-center">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-xl font-extrabold">{value}</p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Status breakdown */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h2 className="font-bold text-sm mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>REPAIRS BY STATUS</h2>
          {repairList.length === 0 ? (
            <p className="text-center text-sm py-6" style={{ color: "hsl(var(--muted-foreground))" }}>No repair data yet</p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map(({ name, count }) => (
                <div key={name} className="flex items-center gap-3">
                  <p className="text-xs font-semibold w-20 flex-shrink-0">{name}</p>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: repairList.length ? `${(count / repairList.length) * 100}%` : "0%",
                        background: STATUS_COLOR_MAP[name] ?? "#9CA3AF",
                      }} />
                  </div>
                  <span className="text-xs font-bold w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly chart */}
        {chartData.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <h2 className="font-bold text-sm mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>MONTHLY OVERVIEW</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="repairs" fill="hsl(252,100%,64%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}
