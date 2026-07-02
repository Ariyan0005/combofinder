import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockNotifications = [
  { id: 1, title: "New user registered: Gsm Rahat", time: "2 mins ago", read: false },
  { id: 2, title: "Subscription renewed: TechFix Store", time: "1 hour ago", read: false },
  { id: 3, title: "Database backup completed successfully", time: "5 hours ago", read: true },
  { id: 4, title: "Server CPU usage above 80%", time: "1 day ago", read: true },
];

export default function Notifications() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Notifications</h1>
          <p className="text-sm text-muted-foreground">Alerts, updates, and system events.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 text-xs h-8">
            <Check className="h-3.5 w-3.5" /> Mark all as read
          </Button>
          <Button variant="outline" className="gap-2 text-xs h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20">
            <Trash2 className="h-3.5 w-3.5" /> Clear all
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {mockNotifications.map((n) => (
          <div key={n.id} className={`p-4 border-b border-border flex items-start justify-between gap-4 transition-colors ${n.read ? 'opacity-70' : 'bg-primary/5'}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 p-2 rounded-full ${n.read ? 'bg-secondary text-muted-foreground' : 'bg-primary text-white'}`}>
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <p className={`text-sm ${n.read ? 'font-medium text-foreground' : 'font-bold text-white'}`}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
              </div>
            </div>
            {!n.read && (
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
