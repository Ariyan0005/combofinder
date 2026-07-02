import { HardDrive, Download, RotateCcw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockBackups = [
  { id: 1, name: "Auto-Backup-Daily", size: "2.4 GB", date: "2023-10-15 00:00", type: "Automated" },
  { id: 2, name: "Manual-Pre-Update", size: "2.3 GB", date: "2023-10-14 15:30", type: "Manual" },
];

export default function BackupRestore() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Backup & Restore</h1>
          <p className="text-sm text-muted-foreground">Manage database and asset backups.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Create Manual Backup
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 text-center max-w-3xl mx-auto flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <HardDrive className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold mb-1">System is fully protected</h2>
        <p className="text-sm text-muted-foreground mb-4">Automated daily backups are enabled and stored securely.</p>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-8">Configure Schedule</Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden mt-6">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Recent Backups</h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
            <tr>
              <th className="px-4 py-3">Backup Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockBackups.map((bkp) => (
              <tr key={bkp.id} className="border-b border-border hover:bg-secondary/20">
                <td className="px-4 py-3 font-semibold text-foreground">{bkp.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{bkp.type}</td>
                <td className="px-4 py-3 text-muted-foreground">{bkp.size}</td>
                <td className="px-4 py-3 text-muted-foreground">{bkp.date}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" title="Download">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-600" title="Restore">
                      <RotateCcw className="h-4 w-4" />
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
