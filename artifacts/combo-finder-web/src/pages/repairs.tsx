import { useState, useEffect, useRef, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X, Wrench, UserPlus, Package, Trash2, ChevronDown, Check } from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";

const STATUSES = ["All", "Repairing", "Waiting", "Ready", "Delivered"];
const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  Waiting:   { text: "#F59E0B", bg: "#FFF7E6" },
  Repairing: { text: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.1)" },
  Ready:     { text: "#10B981", bg: "#ECFDF5" },
  Delivered: { text: "#6B7280", bg: "#F3F4F6" },
};

const PRIMARY = "hsl(var(--primary))";
const MUTED   = "hsl(var(--muted-foreground))";
const BORDER  = "hsl(var(--border))";
const BG      = "hsl(var(--background))";
const CARD    = "hsl(var(--card))";

type Repair = {
  id: number;
  customerName: string;
  customerPhone?: string;
  phoneBrand: string;
  phoneModel: string;
  problem: string;
  status: string;
  partsUsed?: string;
  totalCost?: string;
  laborCost?: string;
  partsCost?: string;
  advancePaid?: string;
  isPaid?: boolean;
  notes?: string;
  engineer?: string;
  createdAt: string;
  updatedAt: string;
};

type Customer = {
  id: number;
  name: string;
  phone?: string;
  whatsapp?: string;
};

type InventoryItem = {
  id: number;
  partName: string;
  quantity: number;
  sellingPrice?: string | number;
};

type PartEntry = { inventoryId: number; name: string; qty: number; unitPrice: string };

// ─── Inline customer search + add ────────────────────────────────────────────
function CustomerSearchField({
  value, phone, onChange,
}: { value: string; phone: string; onChange: (name: string, phone: string, id?: number) => void }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const qc = useQueryClient();
  const ref = useRef<HTMLDivElement>(null);

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers", "search", query],
    queryFn: () => fetch(`/api/customers?q=${encodeURIComponent(query)}`, { credentials: "include" }).then(r => r.json()),
    enabled: query.length > 0,
  });

  const addMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/customers", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<Customer>;
    },
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      onChange(c.name, c.phone ?? "", c.id);
      setQuery(c.name);
      setShowAdd(false);
      setOpen(false);
    },
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = Array.isArray(customers) ? customers.slice(0, 6) : [];

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); onChange(e.target.value, phone); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search or type customer name"
            className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
            style={{ borderColor: BORDER, background: BG }}
            
            onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
          />
        </div>
        <button type="button" onClick={() => { setShowAdd(true); setOpen(false); }}
          className="px-3 py-2 rounded-xl border flex items-center gap-1 text-xs font-semibold flex-shrink-0"
          style={{ borderColor: PRIMARY, color: PRIMARY, background: `${PRIMARY}10` }}>
          <UserPlus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {/* Dropdown */}
      {open && query.length > 0 && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-lg z-20 overflow-hidden"
          style={{ background: CARD, borderColor: BORDER }}>
          {filtered.map(c => (
            <button key={c.id} type="button"
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/30 transition-colors"
              onMouseDown={() => { onChange(c.name, c.phone ?? ""); setQuery(c.name); setOpen(false); }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: PRIMARY }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{c.name}</p>
                {c.phone && <p className="text-xs" style={{ color: MUTED }}>{c.phone}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add customer inline mini-form */}
      {showAdd && (
        <div className="mt-2 p-4 rounded-xl border" style={{ background: "hsl(var(--muted) / 0.5)", borderColor: BORDER }}>
          <p className="text-xs font-bold mb-2">New Customer</p>
          <div className="flex flex-col gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Customer name *" autoFocus
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: BORDER, background: BG }} />
            <input value={newPhone} onChange={e => setNewPhone(e.target.value)}
              placeholder="Phone number" type="tel"
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: BORDER, background: BG }} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAdd(false)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold border"
                style={{ borderColor: BORDER, color: MUTED }}>Cancel</button>
              <button type="button" disabled={!newName.trim() || addMut.isPending}
                onClick={() => addMut.mutate()}
                className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: PRIMARY }}>
                {addMut.isPending ? "Saving…" : "Save & Use"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Parts selector (from inventory) ─────────────────────────────────────────
function PartsSelector({ parts, onChange }: { parts: PartEntry[]; onChange: (p: PartEntry[]) => void }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: items = [] } = useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: () => fetch("/api/inventory", { credentials: "include" }).then(r => r.json()),
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const available = Array.isArray(items) ? items : [];
  const filtered = search.length > 0
    ? available.filter(i => i.partName.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  function addPart(item: InventoryItem) {
    if (parts.find(p => p.inventoryId === item.id)) return; // already added
    onChange([...parts, {
      inventoryId: item.id,
      name: item.partName,
      qty: 1,
      unitPrice: String(item.sellingPrice ?? ""),
    }]);
    setSearch("");
    setOpen(false);
  }

  function removePart(id: number) {
    onChange(parts.filter(p => p.inventoryId !== id));
  }

  function updatePart(id: number, field: "qty" | "unitPrice", val: string) {
    onChange(parts.map(p => p.inventoryId === id ? { ...p, [field]: val } : p));
  }

  return (
    <div>
      <div ref={ref} className="relative">
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm"
          style={{ borderColor: BORDER, background: BG }}>
          <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: MUTED }} />
          <input value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search inventory parts to add…"
            className="flex-1 outline-none bg-transparent text-sm" />
        </div>
        {open && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-lg z-20 overflow-hidden"
            style={{ background: CARD, borderColor: BORDER }}>
            {filtered.map(item => {
              const already = parts.some(p => p.inventoryId === item.id);
              return (
                <button key={item.id} type="button"
                  disabled={already || item.quantity <= 0}
                  onMouseDown={() => addPart(item)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted/30 transition-colors disabled:opacity-40">
                  <Package className="w-4 h-4 flex-shrink-0" style={{ color: PRIMARY }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.partName}</p>
                    <p className="text-xs" style={{ color: MUTED }}>Stock: {item.quantity}</p>
                  </div>
                  {already && <Check className="w-4 h-4" style={{ color: "#10B981" }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Added parts list */}
      {parts.length > 0 && (
        <div className="mt-2 space-y-2">
          {parts.map(part => (
            <div key={part.inventoryId} className="flex items-center gap-2 p-2.5 rounded-xl border"
              style={{ borderColor: BORDER, background: BG }}>
              <Package className="w-4 h-4 flex-shrink-0" style={{ color: MUTED }} />
              <span className="flex-1 text-xs font-semibold truncate">{part.name}</span>
              <input type="number" min="1" value={part.qty}
                onChange={e => updatePart(part.inventoryId, "qty", e.target.value)}
                className="w-12 text-center text-xs px-1 py-1 rounded-lg border outline-none"
                style={{ borderColor: BORDER, background: BG }}
                placeholder="Qty" />
              <input type="text" value={part.unitPrice}
                onChange={e => updatePart(part.inventoryId, "unitPrice", e.target.value)}
                className="w-20 text-right text-xs px-1 py-1 rounded-lg border outline-none"
                style={{ borderColor: BORDER, background: BG }}
                placeholder="Price" />
              <button type="button" onClick={() => removePart(part.inventoryId)}
                className="text-destructive p-1">
                <Trash2 className="w-3.5 h-3.5" style={{ color: "hsl(var(--destructive))" }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Repair form (create / edit) ──────────────────────────────────────────────
function RepairForm({ onClose, existing }: { onClose: () => void; existing?: Repair }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    customerName:  existing?.customerName  ?? "",
    customerPhone: existing?.customerPhone ?? "",
    phoneBrand:    existing?.phoneBrand    ?? "",
    phoneModel:    existing?.phoneModel    ?? "",
    problem:       existing?.problem       ?? "",
    status:        existing?.status        ?? "Waiting",
    engineer:      existing?.engineer      ?? "",
    laborCost:     String(existing?.laborCost  ?? ""),
    advancePaid:   String(existing?.advancePaid ?? ""),
    isPaid:        existing?.isPaid        ?? false,
    notes:         existing?.notes         ?? "",
  });

  // Parse existing partsUsed JSON
  const initialParts: PartEntry[] = (() => {
    try { return existing?.partsUsed ? JSON.parse(existing.partsUsed) : []; } catch { return []; }
  })();
  const [parts, setParts] = useState<PartEntry[]>(initialParts);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const partsCost = parts.reduce((sum, p) => sum + (Number(p.unitPrice) * Number(p.qty) || 0), 0);
  const totalCost = (Number(form.laborCost) || 0) + partsCost;

  const mut = useMutation({
    mutationFn: async () => {
      const url = existing ? `/api/repairs/${existing.id}` : `/api/repairs`;
      const body = {
        ...form,
        partsUsed: JSON.stringify(parts),
        partsCost: String(partsCost),
        totalCost: String(totalCost),
        advancePaid: form.advancePaid || null,
        isPaid: form.isPaid,
      };
      const res = await fetch(url, {
        method: existing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      const saved = await res.json();

      // Deduct parts from inventory (only on new repair creation)
      if (!existing && parts.length > 0) {
        const results = await Promise.allSettled(parts.map(p =>
          fetch("/api/stock-movements", {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inventoryId: p.inventoryId,
              type: "out",
              quantity: Number(p.qty) || 1,
              unitPrice: p.unitPrice || null,
              notes: `Used in repair #${saved.id}`,
            }),
          }).then(r => r.ok ? r.json() : r.json().then(d => { throw new Error(d.error ?? "Failed"); }))
        ));
        qc.invalidateQueries({ queryKey: ["inventory"] });
        const failed = results.filter(r => r.status === "rejected");
        if (failed.length > 0) {
          console.warn(`${failed.length} part(s) could not be deducted from inventory (may be insufficient stock)`);
        }
      }
      return saved;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["repairs"] }); qc.invalidateQueries({ queryKey: ["stats"] }); onClose(); },
    onError: (err: any) => setError(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.customerName.trim()) { setError("Customer name is required"); return; }
    if (!form.phoneBrand.trim() || !form.phoneModel.trim()) { setError("Phone brand and model are required"); return; }
    if (!form.problem.trim()) { setError("Problem description is required"); return; }
    mut.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col"
        style={{ background: CARD, maxHeight: "85vh" }}>
        {/* Sticky header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-4 border-b"
          style={{ background: CARD, borderColor: BORDER, borderRadius: "1.5rem 1.5rem 0 0" }}>
          <h2 className="font-bold text-base">{existing ? "Edit Repair" : "New Repair"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--muted))", color: MUTED }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-4">

            {/* Customer section */}
            <div>
              <label className="text-xs font-bold block mb-1.5 uppercase tracking-wide" style={{ color: MUTED }}>Customer</label>
              <CustomerSearchField
                value={form.customerName}
                phone={form.customerPhone}
                onChange={(name, phone) => setForm(p => ({ ...p, customerName: name, customerPhone: phone }))}
              />
              {form.customerName && (
                <input value={form.customerPhone}
                  onChange={e => set("customerPhone", e.target.value)}
                  placeholder="Customer phone"
                  type="tel"
                  className="w-full mt-2 px-3.5 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: BORDER, background: BG }} />
              )}
            </div>

            {/* Device info */}
            <div>
              <label className="text-xs font-bold block mb-1.5 uppercase tracking-wide" style={{ color: MUTED }}>Device</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "phoneBrand", placeholder: "Brand (e.g. Samsung)" },
                  { key: "phoneModel", placeholder: "Model (e.g. S23)" },
                ].map(({ key, placeholder }) => (
                  <input key={key}
                    value={(form as any)[key]}
                    onChange={e => set(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: BORDER, background: BG }} />
                ))}
              </div>
            </div>

            {/* Problem */}
            <div>
              <label className="text-xs font-bold block mb-1.5 uppercase tracking-wide" style={{ color: MUTED }}>Problem</label>
              <textarea value={form.problem} onChange={e => set("problem", e.target.value)}
                placeholder="Describe the issue…" rows={3}
                className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: BORDER, background: BG }} />
            </div>

            {/* Status + Engineer */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold block mb-1.5 uppercase tracking-wide" style={{ color: MUTED }}>Status</label>
                <select value={form.status} onChange={e => set("status", e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: BORDER, background: BG }}>
                  {["Waiting","Repairing","Ready","Delivered"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1.5 uppercase tracking-wide" style={{ color: MUTED }}>Technician</label>
                <input value={form.engineer} onChange={e => set("engineer", e.target.value)}
                  placeholder="Engineer name"
                  className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: BORDER, background: BG }} />
              </div>
            </div>

            {/* Parts from inventory */}
            <div>
              <label className="text-xs font-bold block mb-1.5 uppercase tracking-wide" style={{ color: MUTED }}>
                Parts Used (from inventory)
              </label>
              <PartsSelector parts={parts} onChange={setParts} />
              {parts.length > 0 && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: MUTED }}>
                  Parts cost: {partsCost.toFixed(2)}
                </p>
              )}
            </div>

            {/* Costs */}
            <div>
              <label className="text-xs font-bold block mb-1.5 uppercase tracking-wide" style={{ color: MUTED }}>Labor Cost</label>
              <input type="text" inputMode="decimal" value={form.laborCost}
                onChange={e => set("laborCost", e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: BORDER, background: BG }} />
              {(Number(form.laborCost) > 0 || partsCost > 0) && (
                <p className="text-xs mt-1.5 font-bold" style={{ color: PRIMARY }}>
                  Total: {totalCost.toFixed(2)}
                </p>
              )}
            </div>

            {/* Billing & Payment */}
            <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: BORDER, background: BG }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: MUTED }}>Billing & Payment</p>

              {/* Total summary row */}
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: MUTED }}>Total Bill</span>
                <span className="text-sm font-black" style={{ color: PRIMARY }}>{totalCost.toFixed(2)}</span>
              </div>

              {/* Advance paid */}
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: MUTED }}>Advance Paid</label>
                <input type="text" inputMode="decimal" value={form.advancePaid}
                  onChange={e => set("advancePaid", e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: BORDER, background: CARD }} />
              </div>

              {/* Due amount */}
              {totalCost > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: MUTED }}>Due Amount</span>
                  <span className="text-sm font-black"
                    style={{ color: (totalCost - (Number(form.advancePaid) || 0)) > 0 ? "#EF4444" : "#10B981" }}>
                    {Math.max(0, totalCost - (Number(form.advancePaid) || 0)).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Payment status toggle */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>Payment Status</p>
                <div className="flex gap-2">
                  {([{ val: false, label: "Due / Credit", color: "#EF4444" }, { val: true, label: "Paid", color: "#10B981" }] as const).map(({ val, label, color }) => (
                    <button key={String(val)} type="button"
                      onClick={() => setForm(p => ({ ...p, isPaid: val }))}
                      className="flex-1 py-2 rounded-xl text-xs font-bold border transition-colors"
                      style={form.isPaid === val
                        ? { background: color, color: "#fff", borderColor: color }
                        : { background: "transparent", color: MUTED, borderColor: BORDER }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold block mb-1.5 uppercase tracking-wide" style={{ color: MUTED }}>Notes</label>
              <input value={form.notes} onChange={e => set("notes", e.target.value)}
                placeholder="Internal notes (optional)"
                className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: BORDER, background: BG }} />
            </div>

            {error && <p className="text-xs text-center" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}

            <div className="flex gap-2 pb-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm border"
                style={{ borderColor: BORDER, color: MUTED }}>
                Cancel
              </button>
              <button type="submit" disabled={mut.isPending}
                className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60"
                style={{ background: PRIMARY }}>
                {mut.isPending ? "Saving…" : existing ? "Save Changes" : "Create Repair"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Repairs() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editRepair, setEditRepair] = useState<Repair | undefined>();
  const qc = useQueryClient();

  const { data: repairs = [], isLoading } = useQuery<Repair[]>({
    queryKey: ["repairs"],
    queryFn: () => fetch("/api/repairs", { credentials: "include" }).then(r => r.json()),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => fetch(`/api/repairs/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["repairs"] }); qc.invalidateQueries({ queryKey: ["stats"] }); },
  });

  const list = Array.isArray(repairs) ? repairs : [];
  const filtered = list.filter(r => {
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    const q = searchQ.toLowerCase();
    const matchSearch = !q ||
      r.customerName?.toLowerCase().includes(q) ||
      r.phoneBrand?.toLowerCase().includes(q) ||
      r.phoneModel?.toLowerCase().includes(q) ||
      r.problem?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <ProtectedPage>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-extrabold">Repairs</h1>
            <p className="text-xs" style={{ color: MUTED }}>{list.length} total</p>
          </div>
          <button onClick={() => { setEditRepair(undefined); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-bold shadow-sm"
            style={{ background: PRIMARY }}>
            <Plus className="w-4 h-4" /> New
          </button>
        </div>

        {/* Search + Customer Add */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border"
            style={{ borderColor: BORDER, background: "hsl(var(--card))" }}>
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: MUTED }} />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Search repairs…"
              className="flex-1 text-sm outline-none bg-transparent" />
          </div>
          <a href="/customers">
            <button className="px-3 py-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold flex-shrink-0"
              style={{ borderColor: PRIMARY, color: PRIMARY, background: `${PRIMARY}10` }}>
              <UserPlus className="w-3.5 h-3.5" />
              Customer
            </button>
          </a>
        </div>

        {/* Status filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors"
              style={statusFilter === s
                ? { background: PRIMARY, color: "#fff", borderColor: PRIMARY }
                : { background: "transparent", color: MUTED, borderColor: BORDER }}>
              {s}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Wrench className="w-10 h-10 mx-auto mb-3" style={{ color: MUTED }} />
            <p className="font-semibold">No repairs found</p>
            <p className="text-sm mt-1" style={{ color: MUTED }}>
              {list.length === 0 ? "Create your first repair job" : "Try a different filter"}
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {filtered.map(r => {
              const sc = STATUS_COLOR[r.status] ?? { text: "#9CA3AF", bg: "#F3F4F6" };
              const partsCount = (() => { try { return r.partsUsed ? JSON.parse(r.partsUsed).length : 0; } catch { return 0; } })();
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: sc.bg }}>
                    <Wrench className="w-4 h-4" style={{ color: sc.text }} />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setEditRepair(r); setShowForm(true); }}>
                    <p className="text-sm font-semibold truncate">{r.phoneBrand} {r.phoneModel}</p>
                    <p className="text-xs truncate" style={{ color: MUTED }}>
                      {r.customerName ? `${r.customerName}${r.customerPhone ? ` · ${r.customerPhone}` : ""} · ` : ""}{r.problem}
                    </p>
                    <p className="text-[10px] mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: MUTED }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                      {partsCount > 0 && <span className="flex items-center gap-0.5"><Package className="w-2.5 h-2.5" /> {partsCount} part{partsCount > 1 ? "s" : ""}</span>}
                      {r.totalCost && Number(r.totalCost) > 0 && <span>· Bill: {Number(r.totalCost).toFixed(2)}</span>}
                      {r.totalCost && Number(r.totalCost) > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full font-bold text-[9px]"
                          style={r.isPaid
                            ? { background: "#ECFDF5", color: "#059669" }
                            : { background: "#FEF3C7", color: "#D97706" }}>
                          {r.isPaid ? "Paid" : "Due"}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: sc.bg, color: sc.text }}>{r.status}</span>
                    <button onClick={() => { if (confirm("Delete this repair?")) deleteMut.mutate(r.id); }}
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

      {showForm && <RepairForm onClose={() => { setShowForm(false); setEditRepair(undefined); }} existing={editRepair} />}
    </ProtectedPage>
  );
}
