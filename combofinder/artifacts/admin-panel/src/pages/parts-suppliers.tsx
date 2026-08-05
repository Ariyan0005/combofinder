import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, CheckCircle, XCircle, Star, Store,
  MapPin, Globe, MessageCircle, X, Save,
} from "lucide-react";

interface PartsSupplier {
  id: number;
  name: string;
  country: string;
  city: string;
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
  name: "", country: "", city: "", whatsapp: "", partTypes: "",
  website: "", isVerified: false, isActive: true, sortOrder: 0,
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
  initial, onSave, onClose, saving,
}: {
  initial: Omit<PartsSupplier, "id" | "avgRating" | "reviewCount">;
  onSave: (data: typeof initial) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof EMPTY, v: any) => setForm(f => ({ ...f, [k]: v }));

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

        <div className="space-y-3">
          {[
            { key: "name", label: "Store / Shop Name", placeholder: "e.g. Dhaka Mobile Parts Hub" },
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
          <button onClick={() => onSave(form)} disabled={saving || !form.name || !form.country || !form.city}
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
  const [formTarget, setFormTarget] = useState<(Omit<PartsSupplier, "avgRating" | "reviewCount"> & { id?: number }) | null>(null);

  const { data: suppliers = [], isLoading } = useQuery<PartsSupplier[]>({
    queryKey: ["admin-parts-suppliers"],
    queryFn: () => fetch("/api/parts-suppliers/admin", { credentials: "include" })
      .then(r => r.json()),
  });

  const createMut = useMutation({
    mutationFn: (data: any) =>
      fetch("/api/parts-suppliers/admin", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-parts-suppliers"] }); setFormTarget(null); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: any) =>
      fetch(`/api/parts-suppliers/admin/${id}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-parts-suppliers"] }); setFormTarget(null); },
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
          onClick={() => setFormTarget({ ...EMPTY })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: "hsl(var(--primary))" }}
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-2xl text-center">
          <Store className="w-12 h-12 mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm font-semibold">No suppliers yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Add Supplier" to create the first listing.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Store Name", "Location", "Part Types", "Rating", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s, idx) => (
                <tr key={s.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  style={{ background: idx % 2 === 0 ? undefined : "hsl(var(--muted) / 0.3)" }}>
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "hsl(var(--primary) / 0.1)" }}>
                        <Store className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{s.name}</p>
                        {s.whatsapp && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />{s.whatsapp}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {s.city}, {s.country}
                    </div>
                    {s.website && (
                      <a href={s.website} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] flex items-center gap-1 mt-0.5"
                        style={{ color: "hsl(var(--primary))" }}>
                        <Globe className="w-3 h-3" />Website
                      </a>
                    )}
                  </td>

                  {/* Part types */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(s.partTypes ?? "").split(",").filter(Boolean).map(p => (
                        <span key={p} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>
                          {p.trim()}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3">
                    <StarDisplay value={Number(s.avgRating ?? 0)} />
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {Number(s.avgRating ?? 0).toFixed(1)} ({s.reviewCount} reviews)
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                      <br />
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.isVerified ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                        {s.isVerified ? <><CheckCircle className="w-3 h-3" />Verified</> : "Unverified"}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => verifyMut.mutate({ id: s.id, isVerified: !s.isVerified })}
                        title={s.isVerified ? "Remove verification" : "Mark as verified"}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        style={{ color: s.isVerified ? "#3B82F6" : "hsl(var(--muted-foreground))" }}
                      >
                        {s.isVerified ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setFormTarget({ ...s })}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this supplier?")) deleteMut.mutate(s.id); }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {formTarget !== null && (
        <SupplierForm
          initial={formTarget as any}
          onSave={handleSave}
          onClose={() => setFormTarget(null)}
          saving={saving}
        />
      )}
    </div>
  );
}
