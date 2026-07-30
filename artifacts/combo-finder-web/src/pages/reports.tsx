import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Wrench, Clock, CheckCircle, Truck } from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";
import { useAuth } from "@/context/auth-context";
import { localRepairs } from "@/lib/local-store";

const STATUS_COLOR_MAP: Record<string, string> = {
  Repairing: "hsl(252,100%,64%)",
  Ready:     "#10B981",
  Delivered: "#6B7280",
  Cancelled: "#EF4444",
};

export default function Reports() {
  const { user } = useAuth();
  const isFreePlan = user?.plan === "Free" || !user?.plan;

  const { data: repairs = [] } = useQuery<any[]>({
    queryKey: ["repairs"],
    queryFn: () => {
      if (isFreePlan && user?.id) return Promise.resolve(localRepairs.getAll(user.id));
      return fetch(`/api/repairs`, { credentials: "include" }).then(r => r.json());
    },
  });

  const repairList = Array.isArray(repairs) ? repairs : [];

  // Status counts
  const repairing = repairList.filter(r => r.status === "Repairing").length;
  const ready     = repairList.filter(r => r.status === "Ready").length;
  const delivered = repairList.filter(r => r.status === "Delivered").length;

  // Status breakdown for bar chart (horizontal progress bars)
  const STATUSES = ["Repairing", "Ready", "Delivered", "Cancelled"];
  const statusBreakdown = STATUSES.map(s => ({
    name: s,
    count: repairList.filter(r => r.status === s).length,
  }));

  // Build monthly repair counts from the repairs array
  const monthlyMap: Record<string, { label: string; repairs: number }> = {};
  repairList.forEach(r => {
    const d = new Date(r.createdAt);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    if (!monthlyMap[key]) monthlyMap[key] = { label, repairs: 0 };
    monthlyMap[key].repairs += 1;
  });
  const chartData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  const PRIMARY = "hsl(var(--primary))";
  const MUTED   = "hsl(var(--muted-foreground))";
  const BORDER  = "hsl(var(--border))";

  const SUMMARY_CARDS = [
    { label: "Total",     value: repairList.length, icon: Wrench,       color: PRIMARY,    bg: "hsl(var(--primary) / 0.1)" },
    { label: "Repairing", value: repairing,          icon: Clock,        color: "hsl(252,100%,64%)", bg: "#EEF2FF" },
    { label: "Ready",     value: ready,              icon: CheckCircle,  color: "#10B981",  bg: "#ECFDF5" },
    { label: "Delivered", value: delivered,           icon: Truck,        color: "#6B7280",  bg: "#F3F4F6" },
  ];

  return (
    <ProtectedPage>
      <div className="space-y-5 pb-6">
        <h1 className="text-xl font-extrabold pt-1">Repair Report</h1>

        {/* Summary cards — one row */}
        <div className="grid grid-cols-4 gap-2">
          {SUMMARY_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-card rounded-2xl border border-border p-2.5 text-center flex flex-col items-center gap-1.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <p className="text-lg font-extrabold leading-none">{value}</p>
              <p className="text-[9px] font-semibold leading-tight" style={{ color: MUTED }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Status breakdown */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h2 className="font-bold text-xs uppercase tracking-widest mb-4" style={{ color: MUTED }}>Repairs By Status</h2>
          {repairList.length === 0 ? (
            <p className="text-center text-sm py-4" style={{ color: MUTED }}>No repair data yet</p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map(({ name, count }) => (
                <div key={name} className="flex items-center gap-3">
                  <p className="text-xs font-semibold w-20 flex-shrink-0">{name}</p>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: repairList.length ? `${(count / repairList.length) * 100}%` : "0%",
                        background: STATUS_COLOR_MAP[name] ?? "#9CA3AF",
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold w-5 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly overview */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h2 className="font-bold text-xs uppercase tracking-widest mb-4" style={{ color: MUTED }}>Monthly Overview</h2>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Wrench className="w-8 h-8 opacity-20" style={{ color: MUTED }} />
              <p className="text-sm" style={{ color: MUTED }}>No repair data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: MUTED }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: MUTED }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12, border: `1px solid ${BORDER}` }}
                  cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                  formatter={(v: number) => [v, "Repairs"]}
                />
                <Bar dataKey="repairs" fill="hsl(252,100%,64%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}
