import { Plus, Megaphone, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockAnnouncements = [
  { id: 1, title: "System Maintenance Scheduled", target: "All Users", status: "Published", date: "2023-10-15" },
  { id: 2, name: "New Pro Plan Features", target: "Free Users", status: "Draft", date: "2023-10-18" },
];

export default function Announcements() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">Broadcast messages to your users.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Create Announcement
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Target Audience</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockAnnouncements.map((item) => (
              <tr key={item.id} className="border-b border-border hover:bg-secondary/20">
                <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary" /> {item.title || item.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.target}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    item.status === 'Published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{item.date}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
