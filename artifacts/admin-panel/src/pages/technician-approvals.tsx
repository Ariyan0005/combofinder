import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  shopName?: string;
  accountType: string;
  country?: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function TechnicianApprovals() {
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["admin-pending-users"],
    queryFn: async () => {
      const r = await fetch("/api/users", { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      const all: User[] = await r.json();
      // Filter users pending approval (not yet approved, not Free Technician/Admin)
      return all.filter(u => !u.isApproved && u.accountType !== "Admin");
    },
  });

  const approveM = useMutation({
    mutationFn: async ({ id, approve }: { id: number; approve: boolean }) => {
      const r = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: approve, isActive: approve }),
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: (_, { approve }) => {
      qc.invalidateQueries({ queryKey: ["admin-pending-users"] });
      qc.invalidateQueries({ queryKey: ["admin-user-stats"] });
      toast({ title: approve ? "User approved ✓" : "User rejected" });
    },
    onError: () => toast({ title: "Action failed", variant: "destructive" }),
  });

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.shopName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Technician Approvals</h1>
          <p className="text-sm text-muted-foreground">Review and approve new Pro Technician and Shop Owner accounts.</p>
        </div>
        <div className="text-sm text-muted-foreground bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg">
          {isLoading ? "..." : `${filtered.length} pending`}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, shop..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Account Type</th>
                <th className="px-4 py-3">Shop / Phone</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Applied On</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={6} className="px-4 py-3"><div className="h-4 bg-secondary animate-pulse rounded" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500/40" />
                    No pending approvals.
                  </td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr key={user.id} className="border-b border-border hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-400">
                        {user.accountType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      <div>{user.shopName ?? "—"}</div>
                      <div>{user.phone ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{user.country ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline" size="sm"
                          className="text-red-500 border-red-500/20 hover:bg-red-500/10"
                          disabled={approveM.isPending}
                          onClick={() => approveM.mutate({ id: user.id, approve: false })}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          className="text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10"
                          disabled={approveM.isPending}
                          onClick={() => approveM.mutate({ id: user.id, approve: true })}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
