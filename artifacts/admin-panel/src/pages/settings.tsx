import { useState } from "react";
import { Save, Key, UserPlus, Users, Eye, EyeOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  accountType: string;
  subscriptionPlan: string;
  isActive: boolean;
}

const inputCls = "w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none";

// ---------- Change Admin Password ----------
function ChangePasswordSection() {
  const { toast } = useToast();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { toast({ title: "New passwords do not match", variant: "destructive" }); return; }
    if (next.length < 6) { toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: cur, newPassword: next }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      toast({ title: "Password changed successfully" });
      setCur(""); setNext(""); setConfirm("");
    } catch (err: any) {
      toast({ title: err.message ?? "Failed to change password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Key className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold">Change Admin Password</h2>
      </div>
      <form onSubmit={handle} className="space-y-4 max-w-sm">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Current Password</label>
          <div className="relative">
            <input type={showCur ? "text" : "password"} value={cur} onChange={e => setCur(e.target.value)}
              className={inputCls + " pr-10"} placeholder="Enter current password" required />
            <button type="button" onClick={() => setShowCur(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">New Password</label>
          <div className="relative">
            <input type={showNext ? "text" : "password"} value={next} onChange={e => setNext(e.target.value)}
              className={inputCls + " pr-10"} placeholder="Min. 6 characters" required />
            <button type="button" onClick={() => setShowNext(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Confirm New Password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            className={inputCls} placeholder="Repeat new password" required />
        </div>
        <Button type="submit" disabled={loading} className="gap-2">
          <Key className="h-4 w-4" /> {loading ? "Saving…" : "Update Password"}
        </Button>
      </form>
    </div>
  );
}

// ---------- Add New User ----------
function AddUserSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState("Free");
  const [role, setRole] = useState("Free Technician");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() || null, password, accountType: role, subscriptionPlan: plan, isActive: true, isApproved: true }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      toast({ title: `User "${name}" created successfully` });
      setName(""); setEmail(""); setPhone(""); setPassword(""); setPlan("Free"); setRole("Free Technician");
      qc.invalidateQueries({ queryKey: ["settings-users"] });
    } catch (err: any) {
      toast({ title: err.message ?? "Failed to create user", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold">Add New User</h2>
      </div>
      <form onSubmit={handle} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name <span className="text-destructive">*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Full name" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="user@example.com" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Phone</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password <span className="text-destructive">*</span></label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                className={inputCls + " pr-10"} placeholder="Min. 6 characters" required />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Account Type</label>
            <select value={role} onChange={e => setRole(e.target.value)} className={inputCls}>
              <option>Free Technician</option>
              <option>Pro Technician</option>
              <option>Business</option>
              <option>Shop Owner</option>
              <option>Admin</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Plan</label>
            <select value={plan} onChange={e => setPlan(e.target.value)} className={inputCls}>
              <option>Free</option>
              <option>Pro</option>
              <option>Business</option>
              <option>Lifetime</option>
            </select>
          </div>
        </div>
        <Button type="submit" disabled={loading} className="gap-2">
          <UserPlus className="h-4 w-4" /> {loading ? "Creating…" : "Create User"}
        </Button>
      </form>
    </div>
  );
}

// ---------- Manage Users ----------
function ManageUsersSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editRole, setEditRole] = useState("");
  const [newPass, setNewPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["settings-users", search],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (search) p.set("q", search);
      const r = await fetch(`/api/users?${p}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  function openEdit(u: User) {
    setEditUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPlan(u.subscriptionPlan);
    setEditRole(u.accountType);
    setNewPass("");
  }

  const updateM = useMutation({
    mutationFn: async () => {
      if (!editUser) return;
      const body: Record<string, any> = { name: editName.trim(), email: editEmail.trim().toLowerCase(), accountType: editRole, subscriptionPlan: editPlan };
      if (newPass) {
        if (newPass.length < 6) throw new Error("New password must be at least 6 characters");
        body.password = newPass;
      }
      const r = await fetch(`/api/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      return data;
    },
    onSuccess: () => {
      toast({ title: "User updated successfully" });
      setEditUser(null);
      qc.invalidateQueries({ queryKey: ["settings-users"] });
    },
    onError: (err: any) => toast({ title: err.message ?? "Failed to update", variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async (u: User) => {
      const r = await fetch(`/api/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings-users"] }); toast({ title: "User status updated" }); },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold">Manage Users</h2>
      </div>

      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        className={inputCls + " mb-4"} placeholder="Search by name or email…" />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users found.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {filtered.map(u => (
            <div key={u.id} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border bg-background">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email} · {u.subscriptionPlan}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive.mutate(u)}
                  title={u.isActive ? "Deactivate" : "Activate"}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${u.isActive ? "bg-green-500/15 text-green-400 hover:bg-green-500/25" : "bg-red-500/15 text-red-400 hover:bg-red-500/25"}`}>
                  {u.isActive ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => openEdit(u)}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <Key className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) setEditUser(null); }}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">Edit User — {editUser.name}</h3>
              <button onClick={() => setEditUser(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Account Type</label>
                  <select value={editRole} onChange={e => setEditRole(e.target.value)} className={inputCls}>
                    <option>Free Technician</option>
                    <option>Pro Technician</option>
                    <option>Business</option>
                    <option>Shop Owner</option>
                    <option>Admin</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Plan</label>
                  <select value={editPlan} onChange={e => setEditPlan(e.target.value)} className={inputCls}>
                    <option>Free</option>
                    <option>Pro</option>
                    <option>Business</option>
                    <option>Lifetime</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">New Password <span className="text-muted-foreground font-normal">(leave blank to keep current)</span></label>
                <div className="relative">
                  <input type={showNewPass ? "text" : "password"} value={newPass} onChange={e => setNewPass(e.target.value)}
                    className={inputCls + " pr-10"} placeholder="Min. 6 characters" />
                  <button type="button" onClick={() => setShowNewPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button onClick={() => updateM.mutate()} disabled={updateM.isPending} className="gap-2">
                <Save className="h-4 w-4" /> {updateM.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Main Settings Page ----------
export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-sm text-muted-foreground">Configure global application preferences.</p>
      </div>

      <ChangePasswordSection />
      <AddUserSection />
      <ManageUsersSection />
    </div>
  );
}
