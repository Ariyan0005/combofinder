import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowLeft, Plus, Tag, ChevronDown, FolderOpen, Edit3, Trash2, X, FolderPlus,
} from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";
import { useAuth } from "@/context/auth-context";

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
  mode, existing, parentCategories, onClose,
}: {
  mode: "category" | "subcategory" | "edit";
  existing?: Category;
  parentCategories: Category[];
  onClose: () => void;
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
      const url = mode === "edit"
        ? `/api/inventory-categories/${existing!.id}`
        : "/api/inventory-categories";
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: desc.trim() || null, parentId: resolvedParentId }),
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
        <div className="px-5 py-5">
          <form onSubmit={e => {
            e.preventDefault();
            if (!name.trim()) { setError("Name required"); return; }
            if (mode === "subcategory" && !parentId) { setError("Select a parent category"); return; }
            mut.mutate();
          }} className="flex flex-col gap-3">
            {mode === "subcategory" && (
              <Field label="Parent Category *">
                <SelectEl value={parentId} onChange={e => setParentId(e.target.value)}>
                  <option value="">— Select parent —</option>
                  {parentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </SelectEl>
              </Field>
            )}
            {mode === "edit" && existing?.parentId && (
              <div className="px-3 py-2 rounded-xl text-xs" style={{ background: "hsl(var(--muted))" }}>
                Sub-category of: <span className="font-semibold">
                  {parentCategories.find(c => c.id === existing.parentId)?.name ?? "—"}
                </span>
              </div>
            )}
            <Field label={mode === "subcategory" ? "Sub-category Name *" : "Category Name *"}>
              <Input value={name} onChange={e => setName(e.target.value)}
                placeholder={mode === "subcategory" ? "e.g. Display" : "e.g. Spare Parts"} autoFocus />
            </Field>
            <Field label="Description">
              <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional" />
            </Field>
            {error && <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
            <button type="submit" disabled={mut.isPending}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 mt-1"
              style={{ background: PRIMARY }}>
              {mut.isPending ? "Saving…"
                : mode === "edit" ? "Save Changes"
                : mode === "subcategory" ? "Add Sub-category"
                : "Add Category"}
            </button>
          </form>
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

  const [formMode, setFormMode] = useState<"category" | "subcategory" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Category | undefined>();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["inv-categories"],
    queryFn: async () => {
      const d = await fetch("/api/inventory-categories", { credentials: "include" }).then(r => r.json());
      return Array.isArray(d) ? d : [];
    },
    enabled: !isGuest && !!user,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/inventory-categories/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inv-categories"] }),
  });

  const parentCats = categories.filter(c => !c.parentId);
  const subOf = (pid: number) => categories.filter(c => c.parentId === pid);

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

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { setEditTarget(undefined); setFormMode("category"); }}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white shadow-sm"
            style={{ background: PRIMARY }}>
            <Tag className="w-4 h-4" /> Add Category
          </button>
          <button onClick={() => { setEditTarget(undefined); setFormMode("subcategory"); }}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
            style={{ background: `hsl(var(--primary) / 0.12)`, color: PRIMARY }}>
            <ChevronDown className="w-4 h-4" /> Add Sub-category
          </button>
        </div>

        {/* Category list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
            ))}
          </div>
        ) : parentCats.length === 0 ? (
          <div className="text-center py-16">
            <FolderPlus className="w-10 h-10 mx-auto mb-3" style={{ color: MUTED }} />
            <p className="font-semibold">No categories yet</p>
            <p className="text-sm mt-1" style={{ color: MUTED }}>Tap "Add Category" to create one</p>
          </div>
        ) : (
          <div className="space-y-2">
            {parentCats.map(parent => (
              <div key={parent.id} className="rounded-2xl overflow-hidden border" style={{ borderColor: BORDER }}>
                {/* Parent row */}
                <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: "hsl(var(--muted))" }}>
                  <FolderOpen className="w-4 h-4 flex-shrink-0" style={{ color: PRIMARY }} />
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
                {subOf(parent.id).map(sub => (
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
        )}
      </div>

      {/* Form modal */}
      {formMode && (
        <CategoryFormModal
          mode={formMode}
          existing={formMode === "edit" ? editTarget : undefined}
          parentCategories={parentCats}
          onClose={() => { setFormMode(null); setEditTarget(undefined); }}
        />
      )}
    </ProtectedPage>
  );
}
