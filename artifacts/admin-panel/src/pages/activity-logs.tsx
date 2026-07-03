import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ScrollText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityLog {
  id: number;
  actor: string;
  actorType: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export default function ActivityLogs() {
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(50);

  const { data: logs = [], isLoading, refetch } = useQuery<ActivityLog[]>({
    queryKey: ["admin-activity-logs", limit],
    queryFn: () => fetch(`/api/activity-logs?limit=${limit}`, { credentials: "include" }).then(r => r.json()),
    refetchInterval: 30000,
  });

  const filtered = logs.filter(l =>
    !search ||
    l.actor.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.entity ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const ACTOR_COLORS: Record<string, string> = {
    Admin: "text-primary",
    System: "text-amber-400",
    User: "text-emerald-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-sm text-muted-foreground">Audit trail of all administrative and system actions.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs by actor, action..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value={50}>Last 50</option>
          <option value={100}>Last 100</option>
          <option value={200}>Last 200</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading logs...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-2">
              <ScrollText className="h-8 w-8 opacity-30" />
              <p>{logs.length === 0 ? "No activity logs yet." : "No logs match your search."}</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left font-mono text-xs">
              <thead className="text-muted-foreground uppercase bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id} className="border-b border-border hover:bg-secondary/20">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${ACTOR_COLORS[log.actorType] ?? "text-foreground"}`}>{log.actor}</span>
                    </td>
                    <td className="px-4 py-3 text-primary">{log.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.entity ? `${log.entity}${log.entityId ? ` #${log.entityId}` : ""}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{log.ipAddress ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-4 border-t border-border flex justify-between items-center text-sm text-muted-foreground font-sans">
          <span>Showing {filtered.length} of {logs.length} logs</span>
          {logs.length >= limit && (
            <Button variant="outline" size="sm" onClick={() => setLimit(l => l + 50)}>
              Load More
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
