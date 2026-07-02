import { Search, Filter, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockLogs = [
  { id: 1, user: "Abu Mahara", action: "Updated Settings", resource: "System", ip: "192.168.1.1", time: "2023-10-15 14:32:10" },
  { id: 2, user: "System", action: "Automated Backup", resource: "Database", ip: "127.0.0.1", time: "2023-10-15 00:00:01" },
  { id: 3, user: "Ali Ahmed", action: "Failed Login", resource: "Auth", ip: "45.22.11.90", time: "2023-10-14 22:15:40" },
  { id: 4, user: "Abu Mahara", action: "Deleted User", resource: "Users", ip: "192.168.1.1", time: "2023-10-14 10:05:22" },
];

export default function ActivityLogs() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-sm text-muted-foreground">Audit trail of all administrative and system actions.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4" /> Filters
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left font-mono text-xs">
            <thead className="text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User/Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {mockLogs.map((log) => (
                <tr key={log.id} className="border-b border-border hover:bg-secondary/20">
                  <td className="px-4 py-3 text-muted-foreground">{log.time}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{log.user}</td>
                  <td className="px-4 py-3 text-primary">{log.action}</td>
                  <td className="px-4 py-3 text-muted-foreground">{log.resource}</td>
                  <td className="px-4 py-3 text-muted-foreground">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex justify-between items-center text-sm text-muted-foreground font-sans">
          <span>Showing latest 50 logs</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
