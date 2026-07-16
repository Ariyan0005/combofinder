import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowLeft, Plus, Truck, X, Phone, Search, ChevronRight, AlertCircle,
} from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";
import { useAuth } from "@/context/auth-context";

const PRIMARY = "hsl(var(--primary))";
const MUTED = "hsl(var(--muted-foreground))";
const BORDER = "hsl(var(--border))";
const BG = "hsl(var(--background))";
const CARD = "hsl(var(--card))";

type Supplier = {
  id: number;
  name: string;
  phone?: string;
  whatsapp?: string;
  partTypes?: string;
  notes?: string;
  isActive: boolean;
};
type SupplierBalance = {
  supplierId: number;
  totalDue: number;
};

const AVATAR_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#0EA5E9", "#8B5CF6", "#EF4444"];

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
      style={{ borderColor: BORDER, background: BG, ...props.style }} />
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: MUTED }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Supplier Form Modal ──────────────────────────────────────────────────────
function SupplierFormModal({ onClose, existing }: { onClose: () => void; existing?: Supplier }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    name: existing?.name ?? "",
    phone: existing?.phone ?? "",
    whatsapp: existing?.whatsapp ?? "",
    partTypes: existing?.partTypes ?? "",
    notes: existing?.notes ?? "",
  });
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const [error, setError] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      const isEdit = !!existing;
      const url = isEdit ? `/api/suppliers/${existing!.id}` : "/api/suppliers";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.name.trim(),
          phone: f.phone || null,
          whatsapp: f.whatsapp || null,
          partTypes: f.partTypes || null,
          notes: f.notes || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); onClose(); },
    onError: (e: any) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl"
        style={{ background: CARD }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="font-bold text-base">{existing ? "Edit Supplier" : "Add Supplier"}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--muted))", color: MUTED }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5 overflow-y-auto" style={{ maxHeight: "70vh" }}>
          <form onSubmit={e => {
            e.preventDefault();
            if (!f.name.trim()) { setError("Name required"); return; }
            mut.mutate();
          }} className="flex flex-col gap-3">
            <Field label="Supplier Name *">
              <Input value={f.name} onChange={e => set("name", e.target.value)}
                placeholder="e.g. Ali Parts BD" autoFocus />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone">
                <Input value={f.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="+88 01..." type="tel" />
              </Field>
              <Field label="WhatsApp">
                <Input value={f.whatsapp} onChange={e => set("whatsapp", e.target.value)}
                  placeholder="+88 01..." type="tel" />
              </Field>
            </div>
            <Field label="Supplies (part types)">
              <Input value={f.partTypes} onChange={e => set("partTypes", e.target.value)}
                placeholder="Display, Battery, IC…" />
            </Field>
            <Field label="Notes">
              <Input value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Optional" />
            </Field>
            {error && <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
            <button type="submit" disabled={mut.isPending}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 mt-1"
              style={{ background: PRIMARY }}>
              {mut.isPending ? "Saving…" : existing ? "Save Changes" : "Add Supplier"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManageSuppliers() {
  const [, setLocation] = useLocation();
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | undefined>();
  const [searchQ, setSearchQ] = useState("");

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const d = await fetch("/api/suppliers", { credentials: "include" }).then(r => r.json());
      return Array.isArray(d) ? d : [];
    },
    enabled: !isGuest && !!user,
  });

  const { data: balances = [] } = useQuery<SupplierBalance[]>({
    queryKey: ["suppliers-balances"],
    queryFn: async () => {
      const d = await fetch("/api/supplier-purchases/balances", { credentials: "include" }).then(r => r.json());
      return Array.isArray(d) ? d : [];
    },
    enabled: !isGuest && !!user,
  });

  const balanceMap = Object.fromEntries(balances.map(b => [b.supplierId, b.totalDue]));

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/suppliers/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  const filtered = searchQ
    ? suppliers.filter(s =>
        s.name.toLowerCase().includes(searchQ.toLowerCase()) ||
        (s.phone ?? "").includes(searchQ) ||
        (s.partTypes ?? "").toLowerCase().includes(searchQ.toLowerCase())
      )
    : suppliers;

  return (
    <ProtectedPage>
      <div className="space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <button onClick={() => setLocation("/inventory")}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--muted))", color: MUTED }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold">Suppliers</h1>
            <p className="text-xs" style={{ color: MUTED }}>{suppliers.length} suppliers</p>
          </div>
          <button onClick={() => { setEditSupplier(undefined); setShowForm(true); }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0"
            style={{ background: PRIMARY }}>
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search suppliers…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm outline-none"
            style={{ borderColor: BORDER, background: CARD }} />
        </div>

        {/* Add supplier banner (when empty) */}
        {!isLoading && suppliers.length === 0 && (
          <button onClick={() => { setEditSupplier(undefined); setShowForm(true); }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed font-semibold text-sm"
            style={{ borderColor: PRIMARY, color: PRIMARY }}>
            <Plus className="w-4 h-4" /> Add your first supplier
          </button>
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
            ))}
          </div>
        ) : filtered.length === 0 && searchQ ? (
          <div className="text-center py-12">
            <Truck className="w-10 h-10 mx-auto mb-3" style={{ color: MUTED }} />
            <p className="font-semibold">No results</p>
            <p className="text-sm mt-1" style={{ color: MUTED }}>Try a different search</p>
          </div>
        ) : (
          <div className="rounded-2xl border divide-y overflow-hidden" style={{ borderColor: BORDER, background: CARD }}>
            {filtered.map((s, i) => {
              const due = balanceMap[s.id] ?? 0;
              return (
                <div key={s.id} className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                      style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                      {initials(s.name)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{s.name}</p>
                      {s.phone && (
                        <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: MUTED }}>
                          <Phone className="w-3 h-3" /> {s.phone}
                        </p>
                      )}
                      {s.partTypes && (
                        <p className="text-xs truncate mt-0.5" style={{ color: MUTED }}>{s.partTypes}</p>
                      )}
                    </div>
                    {/* Actions — side by side */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => { setEditSupplier(s); setShowForm(true); }}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors"
                        style={{ borderColor: PRIMARY, color: PRIMARY, background: `${PRIMARY}12` }}>
                        Edit
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete "${s.name}"?`)) deleteMut.mutate(s.id); }}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors"
                        style={{ borderColor: "hsl(var(--destructive))", color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.08)" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                  {/* Ledger row */}
                  <button
                    onClick={() => setLocation(`/supplier-ledger/${s.id}`)}
                    className="mt-2 w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: due > 0 ? "#FEF3C7" : "hsl(var(--muted))", color: due > 0 ? "#92400E" : MUTED }}>
                    <span className="flex items-center gap-1.5">
                      {due > 0 && <AlertCircle className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />}
                      {due > 0 ? `Due: ${due.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "View Ledger"}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <SupplierFormModal
          existing={editSupplier}
          onClose={() => { setShowForm(false); setEditSupplier(undefined); }}
        />
      )}
    </ProtectedPage>
  );
}
