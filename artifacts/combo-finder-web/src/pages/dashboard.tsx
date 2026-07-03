import { useQuery } from "@tanstack/react-query";
import { Wrench, Users, Package, CheckCircle, Bell, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import { ProtectedPage } from "@/components/protected-page";

const BASE = () => import.meta.env.BASE_URL.replace(/\/$/, "");

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

const STATUS_COLOR: Record<string, string> = {
  Waiting: "#F59E0B",
  Repairing: "hsl(var(--primary))",
  Ready: "#10B981",
  Delivered: "#6B7280",
};

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery<{
    totalCustomers?: number;
    activeRepairs?: number;
    lowStock?: number;
  }>({
    queryKey: ["stats"],
    queryFn: () => fetch(`${BASE()}/api/stats`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: repairs } = useQuery<any[]>({
    queryKey: ["repairs", "recent"],
    queryFn: () => fetch(`${BASE()}/api/repairs`, { credentials: "include" }).then(r => r.json()),
  });

  const recentRepairs = Array.isArray(repairs) ? repairs.slice(0, 5) : [];
  const totalRepairs = Array.isArray(repairs) ? repairs.length : 0;
  const deliveredToday = Array.isArray(repairs)
    ? repairs.filter(r => r.status === "Delivered" &&
        new Date(r.updatedAt ?? r.createdAt).toDateString() === new Date().toDateString()).length
    : 0;

  return (
    <ProtectedPage>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{greeting()},</p>
            <h1 className="text-xl font-extrabold mt-0.5">{user?.name ?? "Technician"} 👋</h1>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Here's what's happening today.</p>
          </div>
          <button className="w-9 h-9 rounded-full border flex items-center justify-center"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
            <Bell className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        </div>

        {/* Stat cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Repairs", value: totalRepairs, icon: Wrench, color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.1)" },
            { label: "Active Repairs", value: stats?.activeRepairs ?? 0, icon: Wrench, color: "#F59E0B", bg: "#FFF7E6" },
            { label: "Delivered Today", value: deliveredToday, icon: CheckCircle, color: "#10B981", bg: "#ECFDF5" },
            { label: "Customers", value: stats?.totalCustomers ?? 0, icon: Users, color: "#8B5CF6", bg: "#F5F3FF" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-card rounded-2xl p-4 border border-border flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
                <p className="text-2xl font-extrabold mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Low stock alert */}
        {(stats?.lowStock ?? 0) > 0 && (
          <Link href="/inventory">
            <div className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer"
              style={{ background: "hsl(0 84% 60% / 0.08)", border: "1px solid hsl(0 84% 60% / 0.2)" }}>
              <Package className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(var(--destructive))" }} />
              <p className="text-sm font-semibold flex-1" style={{ color: "hsl(var(--destructive))" }}>
                {stats?.lowStock} item{(stats?.lowStock ?? 0) > 1 ? "s" : ""} running low on stock
              </p>
              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--destructive))" }} />
            </div>
          </Link>
        )}

        {/* Recent repairs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base">Recent Repairs</h2>
            <Link href="/repairs">
              <span className="text-sm font-semibold" style={{ color: "hsl(var(--primary))" }}>View All</span>
            </Link>
          </div>

          {recentRepairs.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center">
              <Wrench className="w-8 h-8 mx-auto mb-2" style={{ color: "hsl(var(--muted-foreground))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>No repairs yet</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
              {recentRepairs.map((r) => (
                <Link key={r.id} href="/repairs">
                  <div className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "hsl(var(--muted))" }}>
                      <Wrench className="w-5 h-5" style={{ color: "hsl(var(--muted-foreground))" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{[r.phoneBrand, r.phoneModel].filter(Boolean).join(" ") || "Device"}</p>
                      <p className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {r.problem ?? "–"}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{
                        background: `${STATUS_COLOR[r.status] ?? "#9CA3AF"}20`,
                        color: STATUS_COLOR[r.status] ?? "#9CA3AF",
                      }}>
                      {r.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}
