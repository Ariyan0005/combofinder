import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, UserCheck, Edit, Trash2, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  accountType: string;
  subscriptionPlan: string;
  country?: string;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
}

const PLAN_COLORS: Record<string, string> = {
  Free: "bg-gray-500/10 text-gray-400",
  Pro: "bg-violet-500/10 text-violet-400",
  Business: "bg-purple-500/10 text-purple-400",
  Lifetime: "bg-yellow-500/10 text-yellow-400",
};

export default function Users() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["admin-users", search, planFilter],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (search) p.set("q", search);
      if (planFilter) p.set("plan", planFilter);
      const r = await fetch(`/api/users?${p}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const deleteM = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/users/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast({ title: "User deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const updateM = useMutation({
    mutationFn: async (data: Partial<User> & { id: number }) => {
      const { id, ...body } = data;
      const r = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); setEditUser(null); toast({ title: "User updated" }); },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users Management</h1>
          <p className="text-sm text-muted-foreground">Manage platform users, technicians and admins.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {isLoading ? "Loading..." : `${users.length} users found`}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Plans</option>
          <option value="Free">Free</option>
          <option value="Pro">Pro</option>
          <option value="Business">Business</option>
          <option value="Lifetime">Lifetime</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-4 bg-secondary animate-pulse rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[user.subscriptionPlan] ?? "bg-gray-500/10 text-gray-400"}`}>
                        {user.subscriptionPlan ?? "Free"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{user.accountType}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${user.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{user.country ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => setEditUser(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => {
                            if (confirm(`Delete ${user.name}?`)) deleteM.mutate(user.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
          <span>Total: {users.length} users</span>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={o => !o && setEditUser(null)}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Name</label>
                <input
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  value={editUser.name}
                  onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Email</label>
                <input
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  value={editUser.email}
                  onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Plan</label>
                <select
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  value={editUser.subscriptionPlan}
                  onChange={e => setEditUser({ ...editUser, subscriptionPlan: e.target.value })}
                >
                  {["Free", "Pro", "Business", "Lifetime"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Account Type</label>
                <select
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  value={editUser.accountType}
                  onChange={e => setEditUser({ ...editUser, accountType: e.target.value })}
                >
                  {["Free Technician", "Pro Technician", "Shop Owner", "Admin"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editUser.isActive}
                  onChange={e => setEditUser({ ...editUser, isActive: e.target.checked })}
                  className="accent-primary"
                />
                <label htmlFor="isActive" className="text-sm">Active</label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button
              onClick={() => editUser && updateM.mutate(editUser)}
              disabled={updateM.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" /> {updateM.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
