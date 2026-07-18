import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowLeft, Plus, Tag, ChevronDown, FolderOpen, Edit3, Trash2, X, FolderPlus, Search,
} from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";
import { useAuth } from "@/context/auth-context";
import { localCategories } from "@/lib/local-store";

const PRIMARY = "hsl(var(--primary))";
const MUTED = "hsl(var(--muted-foreground))";
const BORDER = "hsl(var(--border))";
const BG = "hsl(var(--background))";
const CARD = "hsl(var(--card))";

type Category = { id: number; name: string; description?: string; parentId?: number; };

// ─── Reusable helpers ─────────────────────────────────────────────────────────
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
function SelectEl(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props}
      className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none appearance-none"
      style={{ borderColor: BORDER, background: BG }} />
  );
}

// ─── Category Form Modal ──────────────────────────────────────────────────────
function CategoryFormModal({
  mode, existing, parentCategories, onClose, isFree, userId,
}: {
  mode: "category" | "subcategory" | "edit";
  existing?: Category;
  parentCategories: Category[];
  onClose: () => void;
  isFree: boolean;
  userId?: number;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(existing?.name ?? "");
  const [desc, setDesc] = useState(existing?.description ?? "");
  const [parentId, setParentId] = useState(
    existing?.parentId ? String(existing.parentId) : ""
  );
  const [error, setError] = useState("");

  const resolvedParentId =
    mode === "subcategory" ? (parentId ? Number(parentId) : null)
    : mode === "edit" ? (existing?.parentId ?? null)
    : null;

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        description: desc.trim() || null,
        parentId: resolvedParentId,
      };

      // ── Free plan: local storage ───────────────────────────────────────────
      if (isFree && userId) {
        if (mode === "edit" && existing) {
          return localCategories.update(userId, existing.id, payload);
        } else {
          return localCategories.create(userId, payload);
        }
      }

      // ── Pro plan: server ───────────────────────────────────────────────────
      const url = mode === "edit"
        ? `/api/inventory-categories/${existing!.id}`
        : "/api/inventory-categories";
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inv-categories"] }); onClose(); },
    onError: (e: any) => setError(e.message),
  });

  const title =
    mode === "edit" ? (existing?.parentId ? "Edit Sub-category" : "Edit Category")
    : mode === "subcategory" ? "Add Sub-category"
    : "Add Category";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl"
        style={{ background: CARD }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="font-bold text-base">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--muted))", color: MUTED }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5 flex flex-col gap-3">
          <Field label="Name *">
            <Input value={name} onChange={e => setName(e.target.value)}
              placeholder={mode === "subcategory" ? "e.g. iPhone Displays" : "e.g. Displays"}
              autoFocus />
          </Field>
          <Field label="Description">
            <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional" />
          </Field>
          {mode === "subcategory" && parentCategories.length > 0 && (
            <Field label="Parent Category">
              <SelectEl value={parentId} onChange={e => setParentId(e.target.value)}>
                <option value="">— select parent —</option>
                {parentCategories.map(p => (
                  <option key={p.id} value={String(p.id)}>{p.name}</option>
                ))}
              </SelectEl>
            </Field>
          )}
          {error && <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
          <button
            type="button"
            onClick={() => { if (!name.trim()) { setError("Name required"); return; } mut.mutate(); }}
            disabled={mut.isPending}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 mt-1"
            style={{ background: PRIMARY }}>
            {mut.isPending ? "Saving…" : mode === "edit" ? "Save Changes" : title}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManageCategories() {
  const [, setLocation] = useLocation();
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();

  const isFree = !user || user.plan === "Free";
  const userId = user?.id;

  const [formMode, setFormMode] = useState<"category" | "subcategory" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Category | undefined>();
  const [searchQ, setSearchQ] = useState("");

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["inv-categories"],
    queryFn: async () => {
      // ── Free plan: local storage ─────────────────────────────────────────
      if (isFree && userId) {
        return localCategories.getAll(userId) as Category[];
      }
      // ── Pro plan: server ─────────────────────────────────────────────────
      const d = await fetch("/api/inventory-categories", { credentials: "include" }).then(r => r.json());
      return Array.isArray(d) ? d : [];
    },
    enabled: !isGuest && !!user,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => {
      // ── Free plan: local storage ─────────────────────────────────────────
      if (isFree && userId) {
        localCategories.delete(userId, id);
        return Promise.resolve({ success: true });
      }
      // ── Pro plan: server ─────────────────────────────────────────────────
      return fetch(`/api/inventory-categories/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inv-categories"] }),
  });

  const parentCats = categories.filter(c => !c.parentId);
  const subOf = (pid: number) => categories.filter(c => c.parentId === pid);

  // ── Search filtering ──────────────────────────────────────────────────────
  const q = searchQ.trim().toLowerCase();
  const filteredParents = q === "" ? parentCats : parentCats.filter(parent => {
    const parentMatch = parent.name.toLowerCase().includes(q) ||
      (parent.description ?? "").toLowerCase().includes(q);
    const hasMatchingSub = subOf(parent.id).some(
      s => s.name.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q)
    );
    return parentMatch || hasMatchingSub;
  });
  const filteredSubOf = (pid: number) => {
    const subs = subOf(pid);
    if (q === "") return subs;
    return subs.filter(
      s => s.name.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q)
    );
  };

  function handleDelete(cat: Category) {
    const hasSubs = categories.some(c => c.parentId === cat.id);
    const msg = hasSubs
      ? `"${cat.name}" and all its sub-categories will be deleted. Continue?`
      : `Delete "${cat.name}"?`;
    if (confirm(msg)) deleteMut.mutate(cat.id);
  }

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
            <h1 className="text-xl font-extrabold">Manage Categories</h1>
            <p className="text-xs" style={{ color: MUTED }}>{parentCats.length} categories</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: MUTED }} />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search categories or sub-categories…"
            className="w-full pl-10 pr-10 py-3 rounded-2xl border text-sm outline-none"
            style={{ borderColor: BORDER, background: CARD }}
          />
          {searchQ && (
            <button onClick={() => setSearchQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "hsl(var(--muted))", color: MUTED }}>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => { setEditTarget(undefined); setFormMode("category"); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white"
            style={{ background: PRIMARY }}>
            <FolderPlus className="w-4 h-4" /> Add Category
          </button>
          <button
            onClick={() => { setEditTarget(undefined); setFormMode("subcategory"); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm border"
            style={{ borderColor: PRIMARY, color: PRIMARY }}>
            <Plus className="w-4 h-4" /> Add Sub-category
          </button>
        </div>

        {/* Empty state */}
        {!isLoading && categories.length === 0 && (
          <div className="text-center py-10">
            <FolderOpen className="w-10 h-10 mx-auto mb-3" style={{ color: MUTED }} />
            <p className="font-semibold">No categories yet</p>
            <p className="text-sm mt-1" style={{ color: MUTED }}>Add categories to organise your inventory</p>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
            ))}
          </div>
        )}

        {/* Category list */}
        {!isLoading && filteredParents.map(parent => (
          <div key={parent.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER }}>
            {/* Parent row */}
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: CARD }}>
              <Tag className="w-4 h-4 flex-shrink-0" style={{ color: PRIMARY }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{parent.name}</p>
                {parent.description && (
                  <p className="text-xs truncate" style={{ color: MUTED }}>{parent.description}</p>
                )}
              </div>
              <button onClick={() => { setEditTarget(parent); setFormMode("edit"); }}
                className="p-2 rounded-xl" style={{ color: PRIMARY, background: `hsl(var(--primary) / 0.1)` }}>
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleDelete(parent)}
                className="p-2 rounded-xl"
                style={{ color: "hsl(var(--destructive))", background: "hsl(0 84% 60% / 0.08)" }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Sub-category rows */}
            {filteredSubOf(parent.id).map(sub => (
              <div key={sub.id} className="flex items-center gap-3 px-4 py-3 border-t"
                style={{ borderColor: BORDER, background: CARD }}>
                <span className="text-xs w-4 flex-shrink-0" style={{ color: MUTED }}>↳</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{sub.name}</p>
                  {sub.description && (
                    <p className="text-xs truncate" style={{ color: MUTED }}>{sub.description}</p>
                  )}
                </div>
                <button onClick={() => { setEditTarget(sub); setFormMode("edit"); }}
                  className="p-2 rounded-xl" style={{ color: PRIMARY, background: `hsl(var(--primary) / 0.1)` }}>
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(sub)}
                  className="p-2 rounded-xl"
                  style={{ color: "hsl(var(--destructive))", background: "hsl(0 84% 60% / 0.08)" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Form modal */}
      {formMode && (
        <CategoryFormModal
          mode={formMode}
          existing={formMode === "edit" ? editTarget : undefined}
          parentCategories={parentCats}
          isFree={isFree}
          userId={userId}
          onClose={() => { setFormMode(null); setEditTarget(undefined); }}
        />
      )}
    </ProtectedPage>
  );
}
