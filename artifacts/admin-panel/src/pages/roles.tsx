import { ShieldCheck, Info } from "lucide-react";

export default function Roles() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
        <p className="text-sm text-muted-foreground">Define roles and assign permissions to team members.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-10 flex flex-col items-center text-center gap-4 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Role Management Coming Soon</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Granular role and permission management is currently under development. Soon you'll be able to create custom roles and assign specific system access boundaries to technicians and staff.
        </p>
        <div className="flex items-center gap-2 bg-secondary text-secondary-foreground text-xs px-4 py-2 rounded-lg border border-border mt-2">
          <Info className="h-4 w-4 shrink-0" />
          All registered staff currently default to standard technician access.
        </div>
      </div>
    </div>
  );
}
