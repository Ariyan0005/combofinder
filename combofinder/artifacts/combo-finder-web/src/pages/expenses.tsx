import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Receipt, X, Pencil, Trash2, Share2 } from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";
import { useAuth } from "@/context/auth-context";
import { localExpenses } from "@/lib/local-store";

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
  const { user } = useAuth();
  const isPro = user?.plan === "Pro";
  const qc = useQueryClient();
  const [form, setForm] = useState({
    category: existing?.category ?? "Other",
    amount: String(existing?.amount ?? ""),
    description: existing?.description ?? "",
    date: existing?.date ?? new Date().toISOString().split("T")[0],
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.amount || isNaN(Number(form.amount))) { setError("Valid amount required"); return; }
    setSaving(true);
    setError("");
    try {
      if (!isPro && user?.id) {
        if (existing) {
          localExpenses.update(user.id, existing.id, {
            category: form.category,
            amount: Number(form.amount),
            description: form.description,
            date: form.date,
          });
        } else {
          localExpenses.create(user.id, {
            category: form.category,
            amount: Number(form.amount),
            description: form.description,
            date: form.date,
          });
        }
        qc.invalidateQueries({ queryKey: ["expenses"] });
        onClose();
      } else {
        const url = existing ? `/api/expenses/${existing.id}` : `/api/expenses`;
        const res = await fetch(url, {
          method: existing ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, amount: Number(form.amount) }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
        qc.invalidateQueries({ queryKey: ["expenses"] });
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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
          <button type="submit" disabled={saving}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 mt-1"
            style={{ background: "hsl(var(--primary))" }}>
            {saving ? "Saving…" : existing ? "Save Changes" : "Add Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}

function escHtml(s: string | null | undefined): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default function Expenses() {
  const { user } = useAuth();
  const isPro = user?.plan === "Pro";
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | undefined>();
  const [searchQ, setSearchQ] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const qc = useQueryClient();

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["expenses", isPro, user?.id],
    queryFn: () => {
      if (!isPro && user?.id) return Promise.resolve(localExpenses.getAll(user.id) as Expense[]);
      return fetch(`/api/expenses`, { credentials: "include" }).then(r => r.json());
    },
    enabled: !!user?.id,
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      if (!isPro && user?.id) {
        localExpenses.delete(user.id, id);
        return {};
      }
      return fetch(`/api/expenses/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });

  const list = Array.isArray(expenses) ? expenses : [];
  const filtered = list.filter(e => {
    const q = searchQ.toLowerCase();
    const matchQ = !q || (e.category ?? "").toLowerCase().includes(q) || (e.description ?? "").toLowerCase().includes(q);
    const d = e.date ?? e.createdAt?.split("T")[0];
    const matchFrom = !fromDate || (d && d >= fromDate);
    const matchTo = !toDate || (d && d <= toDate);
    return matchQ && matchFrom && matchTo;
  });
  const totalAmount = filtered.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  function handleExportPdf() {
    const rows = filtered.map(e => {
      const d = e.date ?? new Date(e.createdAt).toISOString().split("T")[0];
      return `<tr><td>${escHtml(d)}</td><td>${escHtml(e.category)}</td><td>${escHtml(e.description)}</td><td style="text-align:right">${(e.amount ?? 0).toFixed(2)}</td></tr>`;
    }).join("");
    const rangeLabel = fromDate || toDate ? `${fromDate || "…"} to ${toDate || "…"}` : "All time";
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Expenses Report</title>
<style>
  body { font-family: Arial, sans-serif; margin:0; padding:24px; color:#111; }
  h1 { font-size:20px; margin:0 0 4px; }
  .sub { font-size:12px; color:#6b7280; margin-bottom:16px; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th, td { padding:8px 6px; border-bottom:1px solid #e5e7eb; text-align:left; }
  th { color:#9ca3af; text-transform:uppercase; font-size:10px; letter-spacing:.05em; }
  tfoot td { font-weight:800; border-top:2px solid #111; border-bottom:none; }
  @media print { button { display:none; } }
</style></head>
<body>
<h1>🧾 Expenses Report</h1>
<div class="sub">${escHtml(rangeLabel)} · Generated ${new Date().toLocaleDateString()}</div>
<table>
  <thead><tr><th>Date</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr><td colspan="3">Total</td><td style="text-align:right">${totalAmount.toFixed(2)}</td></tr></tfoot>
</table>
<script>window.onload=()=>{window.print();}<\/script>
</body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  }

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
            <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
              Total Expenses{(fromDate || toDate) ? " (filtered)" : ""}
              {!isPro && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}>Local</span>}
            </p>
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

        {/* Date range + PDF export */}
        <div className="flex items-center gap-2">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border text-xs outline-none"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} />
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border text-xs outline-none"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} />
          <button onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold flex-shrink-0"
            style={{ borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))", background: "hsl(var(--primary) / 0.08)" }}>
            <Share2 className="w-3.5 h-3.5" /> PDF
          </button>
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{e.category ?? "Expense"}</p>
                  {e.description && (
                    <p className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{e.description}</p>
                  )}
                  <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {e.date ?? new Date(e.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-sm font-extrabold">{(e.amount ?? 0).toLocaleString()}</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { setEditExpense(e); setShowForm(true); }}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border"
                      style={{ borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))", background: "hsl(var(--primary) / 0.08)" }}>
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => { if (confirm("Delete this expense?")) deleteMut.mutate(e.id); }}
                      className="p-1.5 rounded-lg border"
                      style={{ borderColor: "hsl(var(--destructive) / 0.3)", color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.06)" }}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
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
