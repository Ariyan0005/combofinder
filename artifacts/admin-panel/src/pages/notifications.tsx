import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ActivityLog {
  id: number;
  actor: string;
  actorType: string;
  action: string;
  entity?: string;
  details?: string;
  createdAt: string;
}

// Notifications are derived from recent activity logs
export default function Notifications() {
  const { toast } = useToast();

  const { data: logs = [], isLoading, refetch } = useQuery<ActivityLog[]>({
    queryKey: ["admin-notifications"],
    queryFn: () => fetch("/api/activity-logs?limit=30", { credentials: "include" }).then(r => r.json()),
    refetchInterval: 60000,
  });

  const getIcon = (actorType: string) => {
    if (actorType === "System") return "🔧";
    if (actorType === "User") return "👤";
    return "🛡️";
  };

  const getColor = (action: string) => {
    if (action.toLowerCase().includes("delete") || action.toLowerCase().includes("fail")) return "bg-red-500 text-white";
    if (action.toLowerCase().includes("create") || action.toLowerCase().includes("register")) return "bg-emerald-500 text-white";
    if (action.toLowerCase().includes("update") || action.toLowerCase().includes("approve")) return "bg-blue-500 text-white";
    return "bg-primary text-white";
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Notifications</h1>
          <p className="text-sm text-muted-foreground">Recent system activities and events.</p>
        </div>
        <Button variant="outline" className="gap-2 text-xs h-9" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading notifications...</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Bell className="h-8 w-8 opacity-30" />
            <p>No notifications yet.</p>
          </div>
        ) : (
          logs.map((log, i) => (
            <div
              key={log.id}
              className={`p-4 border-b border-border flex items-start justify-between gap-4 transition-colors hover:bg-secondary/10 ${i === 0 ? "bg-primary/5" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${getColor(log.action)}`}>
                  {getIcon(log.actorType)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    <span className="text-primary">{log.actor}</span>
                    {" — "}
                    {log.action}
                    {log.entity ? ` (${log.entity})` : ""}
                  </p>
                  {log.details && (
                    <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(log.createdAt)}</p>
                </div>
              </div>
              {i === 0 && <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
