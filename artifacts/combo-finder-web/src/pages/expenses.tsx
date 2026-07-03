import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Receipt, X } from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";

const BASE = () => import.meta.env.BASE_URL.replace(/\/$/, "");

type Expense = {
  id: number;
  category?: string;
  amount?: number;
  description?: string;
  date?: string;
  createdAt: string;
};

const CATEGORIES = ["Parts Procurement", "Utilities", "Tools", "Rent", "Salary", "Marketing", "Other"];

function ExpenseForm({ onClose, existing }: { onClose: () => void; existing?: Expense }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    category: existing?.category ?? "Other",
    amount: String(existing?.amount ?? ""),
    description: existing?.description ?? "",
    date: existing?.date ?? new Date().toISOString().split("T")[0],
  });
  const [error, setError] = useState("");

  const mut = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const url = existing ? `${BASE()}/api/expenses/${existing.id}` : `${BASE()}/api/expenses`;
      const res = await fetch(url, {
        method: existing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, amount: Number(data.amount) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); onClose(); },
    onError: (err: any) => setError(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.amount || isNaN(Number(form.amount))) { setError("Valid amount required"); return; }
    mut.mutate(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-base">{existing ? "Edit Expense" : "Add Expense"}</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: "hsl(var(--muted-foreground))" }} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Amount</label>
            <input type="number" min="0" step="0.01" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              placeholder="0.00" required
              className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Description</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="What was this expense for?"
              className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }} />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Date</label>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }} />
          </div>
          {error && <p className="text-xs text-center" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
          <button type="submit" disabled={mut.isPending}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 mt-1"
            style={{ background: "hsl(var(--primary))" }}>
            {mut.isPending ? "Saving…" : existing ? "Save Changes" : "Add Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Expenses() {
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | undefined>();
  const [searchQ, setSearchQ] = useState("");
  const qc = useQueryClient();

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: () => fetch(`${BASE()}/api/expenses`, { credentials: "include" }).then(r => r.json()),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      fetch(`${BASE()}/api/expenses/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const list = Array.isArray(expenses) ? expenses : [];
  const filtered = list.filter(e => {
    const q = searchQ.toLowerCase();
    return !q || (e.category ?? "").toLowerCase().includes(q) || (e.description ?? "").toLowerCase().includes(q);
  });
  const totalAmount = list.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  return (
    <ProtectedPage>
      <div className="space-y-4">
        <div className="flex items-center justify-between pt-1">
          <h1 className="text-xl font-extrabold">Expenses</h1>
          <button onClick={() => { setEditExpense(undefined); setShowForm(true); }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white"
            style={{ background: "hsl(var(--primary))" }}>
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Total */}
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--primary) / 0.1)" }}>
            <Receipt className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Total Expenses</p>
            <p className="text-2xl font-extrabold mt-0.5">{totalAmount.toLocaleString()}</p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search expenses…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm outline-none"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
            <p className="font-semibold">No expenses recorded</p>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              {list.length === 0 ? "Start tracking your expenses" : "No results for your search"}
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {filtered.map(e => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setEditExpense(e); setShowForm(true); }}>
                  <p className="text-sm font-semibold">{e.category ?? "Expense"}</p>
                  {e.description && (
                    <p className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{e.description}</p>
                  )}
                  <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {e.date ?? new Date(e.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-sm font-extrabold">{(e.amount ?? 0).toLocaleString()}</span>
                  <button onClick={() => { if (confirm("Delete this expense?")) deleteMut.mutate(e.id); }}
                    className="text-[10px] font-medium" style={{ color: "hsl(var(--destructive))" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showForm && <ExpenseForm onClose={() => setShowForm(false)} existing={editExpense} />}
    </ProtectedPage>
  );
}
