import { Shield, ShieldAlert, ShieldCheck, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockRoles = [
  { id: 1, name: "Super Admin", desc: "Full access to all system features and settings.", users: 2, icon: ShieldAlert, color: "text-red-500" },
  { id: 2, name: "Admin", desc: "Manage users, content, and daily operations.", users: 5, icon: ShieldCheck, color: "text-amber-500" },
  { id: 3, name: "Support Staff", desc: "Can view users and handle tickets.", users: 12, icon: Shield, color: "text-blue-500" },
];

export default function Roles() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground">Define roles and assign permissions to team members.</p>
        </div>
        <Button className="gap-2">
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockRoles.map(role => (
          <div key={role.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-secondary ${role.color}`}>
                  <role.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{role.name}</h3>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{role.desc}</p>
            <div className="pt-4 border-t border-border flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{role.users} Users</span>
              <span className="text-primary cursor-pointer hover:underline">View Users</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
