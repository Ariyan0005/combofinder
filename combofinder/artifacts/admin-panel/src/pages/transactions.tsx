import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: number;
  type: string;
  amount: string;
  currency?: string;
  description?: string;
  date?: string;
  status?: string;
  createdAt: string;
}

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: "Income", amount: "", currency: "USD", description: "", date: "", status: "Completed" });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: txs = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["admin-transactions", typeFilter],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (typeFilter) p.set("type", typeFilter);
      const r = await fetch(`/api/transactions?${p}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const addM = useMutation({
    mutationFn: async (data: typeof form) => {
      const r = await fetch("/api/transactions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), credentials: "include",
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-transactions"] });
      qc.invalidateQueries({ queryKey: ["admin-monthly-tx"] });
      setShowAdd(false);
      setForm({ type: "Income", amount: "", currency: "USD", description: "", date: "", status: "Completed" });
      toast({ title: "Transaction added" });
    },
    onError: () => toast({ title: "Failed to add", variant: "destructive" }),
  });

  const deleteM = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/transactions/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-transactions"] });
      qc.invalidateQueries({ queryKey: ["admin-monthly-tx"] });
      toast({ title: "Deleted" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const filtered = txs.filter(t =>
    !search || (t.description ?? "").toLowerCase().includes(search.toLowerCase()) || t.type.toLowerCase().includes(search.toLowerCase())
  );

  const totalIncome = txs.filter(t => t.type === "Income").reduce((s, t) => s + parseFloat(t.amount ?? "0"), 0);
  const totalExpense = txs.filter(t => t.type === "Expense").reduce((s, t) => s + parseFloat(t.amount ?? "0"), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">Track all income and expense transactions.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> Add Transaction
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm text-muted-foreground mb-1">Total Income</div>
          <div className="text-2xl font-bold text-emerald-400">${totalIncome.toFixed(2)}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm text-muted-foreground mb-1">Total Expense</div>
          <div className="text-2xl font-bold text-red-400">${totalExpense.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-input border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Types</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={6} className="px-4 py-3"><div className="h-4 bg-secondary animate-pulse rounded" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No transactions found.</td></tr>
              ) : (
                filtered.map(tx => (
                  <tr key={tx.id} className="border-b border-border hover:bg-secondary/20">
                    <td className="px-4 py-3 text-foreground">{tx.description ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tx.type === "Income" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">{tx.currency ?? "USD"} {tx.amount}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{tx.date ?? new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tx.status === "Completed" ? "bg-emerald-500/10 text-emerald-500" : tx.status === "Pending" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"}`}>
                        {tx.status ?? "Completed"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => { if (confirm("Delete this transaction?")) deleteM.mutate(tx.id); }}
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
          {filtered.length} transactions
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {([
              { label: "Type", key: "type", type: "select", options: ["Income", "Expense"] },
              { label: "Amount", key: "amount", type: "text", placeholder: "0.00" },
              { label: "Currency", key: "currency", type: "select", options: ["USD", "EUR", "GBP"] },
              { label: "Description", key: "description", type: "text", placeholder: "Description..." },
              { label: "Date", key: "date", type: "date" },
              { label: "Status", key: "status", type: "select", options: ["Completed", "Pending", "Failed"] },
            ] as const).map(({ label, key, type, options, placeholder }: any) => (
              <div key={key} className="space-y-1">
                <label className="text-xs text-muted-foreground">{label}</label>
                {type === "select" ? (
                  <select
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  >
                    {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
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
            <Button onClick={() => addM.mutate(form)} disabled={addM.isPending || !form.amount}>
              {addM.isPending ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
