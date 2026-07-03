import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Package, X, AlertCircle } from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";


const PART_TYPES = ["All", "Display", "Battery", "IC", "Connector", "Camera", "Speaker", "Other"];

type Item = {
  id: number;
  name: string;
  partType?: string;
  quality?: string;
  quantity?: number;
  qty?: number;
  minStock?: number;
  sellingPrice?: number;
  purchasePrice?: number;
};

function ItemForm({ onClose, existing }: { onClose: () => void; existing?: Item }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    partType: existing?.partType ?? "Display",
    quality: existing?.quality ?? "Original",
    quantity: String(existing?.quantity ?? existing?.qty ?? ""),
    minStock: String(existing?.minStock ?? "5"),
    purchasePrice: String(existing?.purchasePrice ?? ""),
    sellingPrice: String(existing?.sellingPrice ?? ""),
  });
  const [error, setError] = useState("");

  const mut = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const url = existing ? `/api/inventory/${existing.id}` : `/api/inventory`;
      const res = await fetch(url, {
        method: existing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, quantity: Number(data.quantity), minStock: Number(data.minStock) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); onClose(); },
    onError: (err: any) => setError(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name) { setError("Item name is required"); return; }
    mut.mutate(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-base">{existing ? "Edit Item" : "Add Item"}</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: "hsl(var(--muted-foreground))" }} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Item Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. iPhone 13 Pro Display" required
              className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Part Type</label>
              <select value={form.partType} onChange={e => setForm(p => ({ ...p, partType: e.target.value }))}
                className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}>
                {["Display", "Battery", "IC", "Connector", "Camera", "Speaker", "Other"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Quality</label>
              <select value={form.quality} onChange={e => setForm(p => ({ ...p, quality: e.target.value }))}
                className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}>
                {["Original", "OEM", "Copy", "Refurbished"].map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Quantity", key: "quantity", placeholder: "0" },
              { label: "Min Stock Alert", key: "minStock", placeholder: "5" },
              { label: "Purchase Price", key: "purchasePrice", placeholder: "0" },
              { label: "Selling Price", key: "sellingPrice", placeholder: "0" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</label>
                <input type="number" min="0" value={(form as any)[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }} />
              </div>
            ))}
          </div>
          {error && <p className="text-xs text-center" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
          <button type="submit" disabled={mut.isPending}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 mt-1"
            style={{ background: "hsl(var(--primary))" }}>
            {mut.isPending ? "Saving…" : existing ? "Save Changes" : "Add Item"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [activeType, setActiveType] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Item | undefined>();
  const qc = useQueryClient();

  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: ["inventory"],
    queryFn: () => fetch(`/api/inventory`, { credentials: "include" }).then(r => r.json()),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/inventory/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });

  const list = Array.isArray(items) ? items : [];
  const filtered = list.filter(item => {
    const matchType = activeType === "All" || item.partType === activeType;
    const q = searchQ.toLowerCase();
    const matchSearch = !q || item.name.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const lowStockItems = list.filter(i => (i.quantity ?? i.qty ?? 0) <= (i.minStock ?? 5));

  return (
    <ProtectedPage>
      <div className="space-y-4">
        <div className="flex items-center justify-between pt-1">
          <h1 className="text-xl font-extrabold">Inventory</h1>
          <button onClick={() => { setEditItem(undefined); setShowForm(true); }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white"
            style={{ background: "hsl(var(--primary))" }}>
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {lowStockItems.length > 0 && (
          <div className="flex items-center gap-3 p-3.5 rounded-2xl"
            style={{ background: "hsl(0 84% 60% / 0.08)", border: "1px solid hsl(0 84% 60% / 0.2)" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--destructive))" }} />
            <p className="text-xs font-semibold" style={{ color: "hsl(var(--destructive))" }}>
              {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""} running low on stock
            </p>
          </div>
        )}

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search inventory…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm outline-none"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} />
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {PART_TYPES.map(t => (
            <button key={t} onClick={() => setActiveType(t)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
              style={t === activeType
                ? { background: "hsl(var(--primary))", color: "#fff" }
                : { background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
            <p className="font-semibold">No items found</p>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              {list.length === 0 ? "Add your first inventory item" : "Try a different filter"}
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {filtered.map(item => {
              const qty = item.quantity ?? item.qty ?? 0;
              const min = item.minStock ?? 5;
              const isLow = qty <= min;
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(var(--muted))" }}>
                    <Package className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setEditItem(item); setShowForm(true); }}>
                    <p className="text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {item.quality ?? "–"} · {item.partType ?? "–"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Stock: {qty}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={isLow
                        ? { background: "#FFF7E6", color: "#D97706" }
                        : { background: "#ECFDF5", color: "#059669" }}>
                      {isLow ? "Low Stock" : "In Stock"}
                    </span>
                    <button onClick={() => { if (confirm("Delete this item?")) deleteMut.mutate(item.id); }}
                      className="text-[10px] font-medium" style={{ color: "hsl(var(--destructive))" }}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showForm && <ItemForm onClose={() => setShowForm(false)} existing={editItem} />}
    </ProtectedPage>
  );
}
