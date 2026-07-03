import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, CreditCard, Download, DollarSign, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Subscription {
  id: number;
  userId?: number;
  plan: string;
  price: string;
  currency: string;
  status: string;
  billingCycle: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

const PLAN_COLORS: Record<string, string> = {
  Free: "bg-gray-500/10 text-gray-400",
  Pro: "bg-blue-500/10 text-blue-400",
  Business: "bg-purple-500/10 text-purple-400",
  Lifetime: "bg-yellow-500/10 text-yellow-400",
};

export default function Subscriptions() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ plan: "Pro", price: "", currency: "USD", status: "Paid", billingCycle: "Monthly", startDate: "", endDate: "", paymentMethod: "", notes: "" });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: subs = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ["admin-subs", planFilter],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (planFilter) p.set("plan", planFilter);
      const r = await fetch(`/api/subscriptions?${p}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const { data: revenue } = useQuery<{ total: string; byPlan: Record<string, number> }>({
    queryKey: ["admin-revenue"],
    queryFn: () => fetch("/api/subscriptions/revenue", { credentials: "include" }).then(r => r.json()),
  });

  const addM = useMutation({
    mutationFn: async (data: typeof form) => {
      const r = await fetch("/api/subscriptions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), credentials: "include",
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-subs"] }); qc.invalidateQueries({ queryKey: ["admin-revenue"] }); setShowAdd(false); toast({ title: "Subscription added" }); },
    onError: () => toast({ title: "Failed to add", variant: "destructive" }),
  });

  const deleteM = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/subscriptions/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-subs"] }); qc.invalidateQueries({ queryKey: ["admin-revenue"] }); toast({ title: "Deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const filtered = subs.filter(s =>
    !search || s.plan.toLowerCase().includes(search.toLowerCase()) || (s.paymentMethod ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = subs.filter(s => s.status === "Paid").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Manage user subscriptions, billing, and plans.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> Add Subscription
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
            <div className="text-2xl font-bold">${revenue?.total ?? "0.00"}</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Active Subscriptions</div>
            <div className="text-2xl font-bold">{activeCount}</div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search subscriptions..."
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
            {["Free", "Pro", "Business", "Lifetime"].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Billing</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={7} className="px-4 py-3"><div className="h-4 bg-secondary animate-pulse rounded" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No subscriptions found.</td></tr>
              ) : (
                filtered.map(sub => (
                  <tr key={sub.id} className="border-b border-border hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[sub.plan] ?? "bg-gray-500/10 text-gray-400"}`}>{sub.plan}</span>
                    </td>
                    <td className="px-4 py-3 font-bold">{sub.currency} {sub.price}</td>
                    <td className="px-4 py-3 text-muted-foreground">{sub.billingCycle}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sub.status === "Paid" ? "bg-emerald-500/10 text-emerald-500" : sub.status === "Pending" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{sub.startDate ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{sub.endDate ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => { if (confirm("Delete this subscription?")) deleteM.mutate(sub.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border text-sm text-muted-foreground">
          Total: {filtered.length} subscriptions
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader><DialogTitle>Add Subscription</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { label: "Plan", key: "plan", type: "select", options: ["Free", "Pro", "Business", "Lifetime"] },
              { label: "Price", key: "price", type: "text", placeholder: "9.99" },
              { label: "Currency", key: "currency", type: "select", options: ["USD", "EUR", "GBP"] },
              { label: "Status", key: "status", type: "select", options: ["Paid", "Pending", "Cancelled"] },
              { label: "Billing Cycle", key: "billingCycle", type: "select", options: ["Monthly", "Yearly", "Lifetime"] },
              { label: "Start Date", key: "startDate", type: "date" },
              { label: "End Date", key: "endDate", type: "date" },
              { label: "Payment Method", key: "paymentMethod", type: "text", placeholder: "PayPal, Card, etc." },
            ].map(({ label, key, type, options, placeholder }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs text-muted-foreground">{label}</label>
                {type === "select" ? (
                  <select
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  >
                    {options!.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={type}
                    placeholder={placeholder}
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addM.mutate(form)} disabled={addM.isPending || !form.price}>
              {addM.isPending ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
