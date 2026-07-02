import { Plus, Search, FileKey } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnlockServices() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">Unlock Services</h1>
            <span className="text-[10px] uppercase tracking-wider font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-sm">New</span>
          </div>
          <p className="text-sm text-muted-foreground">Manage IMEI, iCloud, and carrier unlocking services.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Service
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center h-[40vh] bg-card border border-border rounded-xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <FileKey className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No unlock services configured</h2>
        <p className="text-muted-foreground mb-6 max-w-md">Connect API providers to automate network and iCloud unlocking services for your customers.</p>
        <Button>Configure Providers</Button>
      </div>
    </div>
  );
}
