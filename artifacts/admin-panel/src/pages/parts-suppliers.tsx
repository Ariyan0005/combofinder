import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, CheckCircle, XCircle, Star, Store,
  MapPin, Globe, MessageCircle, Phone, X, Save,
} from "lucide-react";

interface PartsSupplier {
  id: number;
  name: string;
  country: string;
  city: string;
  phone?: string | null;
  address?: string | null;
  whatsapp?: string | null;
  partTypes?: string | null;
  website?: string | null;
  isVerified: boolean;
  isActive: boolean;
  avgRating: string;
  reviewCount: number;
  sortOrder: number;
}

const EMPTY: Omit<PartsSupplier, "id" | "avgRating" | "reviewCount"> = {
  name: "", country: "Bangladesh", city: "Dhaka", whatsapp: "", partTypes: "",
  website: "", isVerified: true, isActive: true, sortOrder: 0,
};

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className="w-3 h-3"
          fill={i <= Math.round(value) ? "#F59E0B" : "none"}
          stroke={i <= Math.round(value) ? "#F59E0B" : "#9CA3AF"}
          strokeWidth={1.5} />
      ))}
    </div>
  );
}

function SupplierForm({
  initial, onSave, onClose, saving, error,
}: {
  initial: Omit<PartsSupplier, "id" | "avgRating" | "reviewCount">;
  onSave: (data: typeof initial) => void;
  onClose: () => void;
  saving: boolean;
  error?: string | null;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof EMPTY, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">
            {(initial as any).id ? "Edit Supplier" : "Add Supplier"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {[
            { key: "name", label: "Store / Shop Name *", placeholder: "e.g. Dhaka Mobile Parts Hub" },
            { key: "country", label: "Country", placeholder: "e.g. Bangladesh" },
            { key: "city", label: "City / Area", placeholder: "e.g. Dhaka, Elephant Road" },
            { key: "whatsapp", label: "WhatsApp Number", placeholder: "+880 1XXX-XXXXXX" },
            { key: "partTypes", label: "Part Types (comma-separated)", placeholder: "LCD, Battery, IC, Flex Cable" },
            { key: "website", label: "Website (optional)", placeholder: "https://example.com" },
            { key: "sortOrder", label: "Sort Order (lower = higher in list)", placeholder: "0" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">{label}</label>
              <input
                type={key === "sortOrder" ? "number" : "text"}
                value={(form as any)[key] ?? ""}
                onChange={e => set(key as keyof typeof EMPTY, key === "sortOrder" ? Number(e.target.value) : e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          ))}

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={e => set("isActive", e.target.checked)} />
              <span className="text-sm font-medium">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isVerified}
                onChange={e => set("isVerified", e.target.checked)} />
              <span className="text-sm font-medium">Verified</span>
            </label>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={saving || !form.name.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "hsl(var(--primary))" }}>
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PartsSuppliersPage() {
  const qc = useQueryClient();
  const [formTarget, setFormTarget] = useState<(Omit<PartsSupplier, "id" | "avgRating" | "reviewCount"> & { id?: number }) | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: rawSuppliers, isLoading } = useQuery<any>({
    queryKey: ["admin-parts-suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/parts-suppliers/admin", { credentials: "include" });
      const json = await res.json().catch(() => null);
      if (Array.isArray(json)) return json;
      const fallback = await fetch("/api/parts-suppliers?all=true", { credentials: "include" });
      const fbJson = await fallback.json().catch(() => []);
      return Array.isArray(fbJson) ? fbJson : [];
    },
  });
  const suppliers: PartsSupplier[] = Array.isArray(rawSuppliers) ? rawSuppliers : [];

  const createMut = useMutation({
    mutationFn: async (data: any) => {
      setErrorMsg(null);
      const res = await fetch("/api/parts-suppliers/admin", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to create supplier");
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-parts-suppliers"] });
      qc.invalidateQueries({ queryKey: ["parts-suppliers"] });
      setFormTarget(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to create supplier");
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      setErrorMsg(null);
      const res = await fetch(`/api/parts-suppliers/admin/${id}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to update supplier");
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-parts-suppliers"] });
      qc.invalidateQueries({ queryKey: ["parts-suppliers"] });
      setFormTarget(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to update supplier");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/parts-suppliers/admin/${id}`, { method: "DELETE", credentials: "include" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-parts-suppliers"] }),
  });

  const verifyMut = useMutation({
    mutationFn: ({ id, isVerified }: { id: number; isVerified: boolean }) =>
      fetch(`/api/parts-suppliers/admin/${id}/verify`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified }),
      }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-parts-suppliers"] }),
  });

  function handleSave(data: any) {
    if (formTarget?.id) updateMut.mutate({ id: formTarget.id, ...data });
    else createMut.mutate(data);
  }

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parts Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage mobile parts wholesaler listings shown in the Find Parts directory.
          </p>
        </div>
        <button
          onClick={() => { setErrorMsg(null); setFormTarget({ ...EMPTY }); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "hsl(var(--primary))" }}
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* Suppliers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl text-center">
          <Store className="w-12 h-12 mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm font-semibold">No suppliers yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Add Supplier" to create the first listing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {suppliers.map((s) => {
            const parts = (s.partTypes ?? "").split(",").map(p => p.trim()).filter(Boolean);
            const rating = Number(s.avgRating ?? 0);
            return (
              <article key={s.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg">
                <div className="border-b border-border/70 bg-gradient-to-br from-primary/10 via-card to-card px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/15 text-primary shadow-sm">
                        <Store className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-bold tracking-tight text-foreground">{s.name}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            s.isActive ? "bg-emerald-500/12 text-emerald-700" : "bg-destructive/10 text-destructive"
                          }`}>{s.isActive ? "Active" : "Inactive"}</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 font-bold text-amber-700">
                            <Star className="h-3 w-3" fill="currentColor" />
                            {rating > 0 ? rating.toFixed(1) : "New"}
                          </span>
                          <span>{s.reviewCount || 0} reviews</span>
                          {s.isVerified && <span className="inline-flex items-center gap-1 font-semibold text-primary"><CheckCircle className="h-3 w-3" /> Verified</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Contact</p>
                      <div className="space-y-1.5 text-xs">
                        {s.phone && <a href={`tel:${s.phone}`} className="flex items-center gap-2 font-semibold text-foreground hover:text-primary"><Phone className="h-3.5 w-3.5 text-primary" />{s.phone}</a>}
                        {s.whatsapp && <span className="flex items-center gap-2 font-medium text-foreground"><MessageCircle className="h-3.5 w-3.5 text-emerald-600" />{s.whatsapp}</span>}
                        {!s.phone && !s.whatsapp && <span className="text-muted-foreground">No contact added</span>}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Location</p>
                      <div className="space-y-1.5 text-xs">
                        <p className="flex items-start gap-2 font-semibold leading-relaxed text-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{[s.address, s.city, s.country].filter(Boolean).join(", ") || "Location not added"}</p>
                        {s.website ? <a href={s.website.startsWith("http") ? s.website : `https://${s.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-semibold text-primary hover:underline"><Globe className="h-3.5 w-3.5" />Visit website</a> : <span className="text-muted-foreground">No website added</span>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Parts supplied</p>
                      <span className="text-[10px] font-semibold text-muted-foreground">{parts.length} categories</span>
                    </div>
                    {parts.length > 0 ? <div className="flex flex-wrap gap-1.5">{parts.map(p => <span key={p} className="rounded-lg border border-primary/20 bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary">{p}</span>)}</div> : <p className="text-xs text-muted-foreground">No parts listed</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
                    <button onClick={() => verifyMut.mutate({ id: s.id, isVerified: !s.isVerified })} disabled={verifyMut.isPending} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-primary/8 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/15 disabled:opacity-50">
                      {s.isVerified ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      {s.isVerified ? "Unverify" : "Verify"}
                    </button>
                    <button onClick={() => setFormTarget({ ...s })} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => { if (confirm("Delete this supplier?")) deleteMut.mutate(s.id); }} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-destructive/20 px-3 py-2 text-xs font-bold text-destructive transition-colors hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {formTarget !== null && (
        <SupplierForm
          initial={formTarget as any}
          onSave={handleSave}
          onClose={() => { setFormTarget(null); setErrorMsg(null); }}
          saving={saving}
          error={errorMsg}
        />
      )}
    </div>
  );
}
