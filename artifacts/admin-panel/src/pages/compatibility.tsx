import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Settings2, Layers, X, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrands, useModelsForBrand } from "@/components/brand-model-picker";

const API = "/api";

/* ── Types ─────────────────────────────────────────────────── */
interface Category { id: number; name: string; linkCount: number; createdAt: string; }
interface Link {
  id: number;
  categoryId: number; categoryName: string;
  modelId: number; modelName: string; brandId: number; brandName: string;
  compatibleModelId: number; compatibleModelName: string; compatibleBrandId: number; compatibleBrandName: string;
  createdAt: string;
}
interface GroupedRow {
  modelId: number; modelName: string; brandId: number; brandName: string;
  links: Link[];
}

/* ── API helpers ────────────────────────────────────────────── */
const fetchCategories = (): Promise<Category[]> =>
  fetch(`${API}/compatibility-categories`, { credentials: "include" }).then(r => r.json());

const fetchLinks = (categoryId: number): Promise<Link[]> =>
  fetch(`${API}/compatibility?categoryId=${categoryId}`, { credentials: "include" }).then(r => r.json());

/** Id-based Brand -> Model picker (single selection, returns ids). */
function IdModelPicker({
  brandId, modelId, onChange, excludeModelId,
}: {
  brandId: number | null; modelId: number | null;
  onChange: (brandId: number | null, modelId: number | null) => void;
  excludeModelId?: number | null;
}) {
  const { data: brands = [], isLoading: bLoading } = useBrands();
  const { data: models = [], isLoading: mLoading } = useModelsForBrand(brandId);
  const filteredModels = excludeModelId ? models.filter(m => m.id !== excludeModelId) : models;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Brand *</Label>
        <Select value={brandId ? String(brandId) : undefined} onValueChange={v => onChange(Number(v), null)}>
          <SelectTrigger className="h-9"><SelectValue placeholder={bLoading ? "Loading…" : "Select brand"} /></SelectTrigger>
          <SelectContent>
            {brands.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Model *</Label>
        <Select value={modelId ? String(modelId) : undefined} onValueChange={v => onChange(brandId, Number(v))} disabled={!brandId}>
          <SelectTrigger className="h-9"><SelectValue placeholder={!brandId ? "Pick brand first" : mLoading ? "Loading…" : "Select model"} /></SelectTrigger>
          <SelectContent>
            {filteredModels.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
            {brandId && filteredModels.length === 0 && !mLoading && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">No models under this brand</div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

const CHIP_PALETTES = [
  "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  "bg-pink-500/10 text-pink-400 border-pink-500/20",
];

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function Compatibility() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [activeCatId, setActiveCatId] = useState<number | null>(null);
  const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState("");

  // "Add base model" dialog: pick base model + one or more compatible models
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [baseBrandId, setBaseBrandId] = useState<number | null>(null);
  const [baseModelId, setBaseModelId] = useState<number | null>(null);
  const [pendingCompat, setPendingCompat] = useState<{ brandId: number; modelId: number; brandName: string; modelName: string }[]>([]);
  const [pickBrandId, setPickBrandId] = useState<number | null>(null);
  const [pickModelId, setPickModelId] = useState<number | null>(null);

  // "Add more compatible models" dialog, opened from an existing row
  const [addToRow, setAddToRow] = useState<GroupedRow | null>(null);
  const [rowPickBrandId, setRowPickBrandId] = useState<number | null>(null);
  const [rowPickModelId, setRowPickModelId] = useState<number | null>(null);

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ["compatibility-categories"],
    queryFn: fetchCategories,
  });

  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ["compatibility-links", activeCatId],
    queryFn: () => fetchLinks(activeCatId as number),
    enabled: activeCatId !== null,
  });

  // Group flat links by base model so each base model is one row with chips.
  const grouped: GroupedRow[] = [];
  for (const l of links) {
    let row = grouped.find(g => g.modelId === l.modelId);
    if (!row) {
      row = { modelId: l.modelId, modelName: l.modelName, brandId: l.brandId, brandName: l.brandName, links: [] };
      grouped.push(row);
    }
    row.links.push(l);
  }
  grouped.sort((a, b) => a.modelName.localeCompare(b.modelName));

  const createLink = useMutation({
    mutationFn: (body: { categoryId: number; modelId: number; compatibleModelId: number }) =>
      fetch(`${API}/compatibility`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "include" })
        .then(r => { if (!r.ok) throw new Error("failed"); return r.json(); }),
  });

  const deleteLink = useMutation({
    mutationFn: (id: number) => fetch(`${API}/compatibility/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compatibility-links"] });
      qc.invalidateQueries({ queryKey: ["compatibility-categories"] });
      toast({ title: "Removed" });
    },
    onError: () => toast({ title: "Failed to remove", variant: "destructive" }),
  });

  const createCat = useMutation({
    mutationFn: (name: string) =>
      fetch(`${API}/compatibility-categories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }), credentials: "include" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["compatibility-categories"] }); setNewCatName(""); toast({ title: "Category created" }); },
    onError: () => toast({ title: "Failed to create category", variant: "destructive" }),
  });

  const updateCat = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      fetch(`${API}/compatibility-categories/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }), credentials: "include" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["compatibility-categories"] }); setEditCat(null); toast({ title: "Category updated" }); },
    onError: () => toast({ title: "Failed to update category", variant: "destructive" }),
  });

  const deleteCat = useMutation({
    mutationFn: (id: number) => fetch(`${API}/compatibility-categories/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["compatibility-categories"] });
      if (activeCatId === id) setActiveCatId(null);
      toast({ title: "Category deleted" });
    },
    onError: () => toast({ title: "Failed to delete category", variant: "destructive" }),
  });

  function resetAddDialog() {
    setIsAddOpen(false);
    setBaseBrandId(null); setBaseModelId(null);
    setPendingCompat([]);
    setPickBrandId(null); setPickModelId(null);
  }

  function addPendingCompat() {
    if (!pickBrandId || !pickModelId) return;
    if (pickModelId === baseModelId) { toast({ title: "A model cannot be compatible with itself", variant: "destructive" }); return; }
    if (pendingCompat.some(p => p.modelId === pickModelId)) return;
    const brand = pickBrandId, model = pickModelId;
    const brandsCache = qc.getQueryData<{ id: number; name: string }[]>(["picker-brands"]) || [];
    const modelsCache = qc.getQueryData<{ id: number; name: string }[]>(["picker-models", brand]) || [];
    const brandName = brandsCache.find(b => b.id === brand)?.name || "";
    const modelName = modelsCache.find(m => m.id === model)?.name || "";
    setPendingCompat(prev => [...prev, { brandId: brand, modelId: model, brandName, modelName }]);
    setPickBrandId(null); setPickModelId(null);
  }

  async function handleSaveAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeCatId || !baseModelId || pendingCompat.length === 0) return;
    try {
      await Promise.all(
        pendingCompat.map(p =>
          createLink.mutateAsync({ categoryId: activeCatId, modelId: baseModelId, compatibleModelId: p.modelId })
        )
      );
      qc.invalidateQueries({ queryKey: ["compatibility-links"] });
      qc.invalidateQueries({ queryKey: ["compatibility-categories"] });
      toast({ title: "Compatibility links added" });
      resetAddDialog();
    } catch {
      toast({ title: "Some links failed to save (duplicates are skipped)", variant: "destructive" });
    }
  }

  async function handleAddToRow() {
    if (!activeCatId || !addToRow || !rowPickModelId) return;
    if (rowPickModelId === addToRow.modelId) { toast({ title: "A model cannot be compatible with itself", variant: "destructive" }); return; }
    try {
      await createLink.mutateAsync({ categoryId: activeCatId, modelId: addToRow.modelId, compatibleModelId: rowPickModelId });
      qc.invalidateQueries({ queryKey: ["compatibility-links"] });
      toast({ title: "Added" });
      setAddToRow(null); setRowPickBrandId(null); setRowPickModelId(null);
    } catch {
      toast({ title: "That link already exists", variant: "destructive" });
    }
  }

  const activeCat = categories.find(c => c.id === activeCatId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compatibility Database</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCat ? `${activeCat.name} — which models share compatible parts.` : "Select a part type to view or add compatibility entries."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => setIsManageCatsOpen(true)}>
            <Settings2 className="h-3.5 w-3.5" /> Manage Part Types
          </Button>
          <Button
            size="sm" className="gap-1.5 h-9"
            disabled={!activeCatId}
            onClick={() => { setIsAddOpen(true); }}
          >
            <Plus className="h-4 w-4" /> Add Base Model
          </Button>
        </div>
      </div>

      {/* ── Category Cards (must pick one before any data loads) ── */}
      {catsLoading ? (
        <div className="flex gap-3 flex-wrap">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 w-32 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-8 text-center">
          <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground mb-3">No part types yet. Create one to start adding compatibility entries.</p>
          <Button size="sm" variant="outline" onClick={() => setIsManageCatsOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Create First Part Type
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat, idx) => {
            const palette = CHIP_PALETTES[idx % CHIP_PALETTES.length];
            const isActive = activeCatId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCatId(isActive ? null : cat.id)}
                className={`flex flex-col items-start px-4 py-2.5 rounded-xl border text-left transition-all ${
                  isActive ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" : `${palette} hover:opacity-90`
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider opacity-70 truncate max-w-[110px]">{cat.name}</span>
                <span className="text-lg font-bold leading-tight">{cat.linkCount}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────── */}
      {activeCatId === null ? (
        <div className="border border-dashed border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
          Pick a part type above to see its compatibility entries.
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Brand</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Model</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider">Compatible Models</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linksLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={4} className="h-11"><div className="h-4 bg-muted animate-pulse rounded w-56" /></TableCell></TableRow>
                ))
              ) : grouped.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-36 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Database className="h-8 w-8 text-muted-foreground opacity-30" />
                      <span className="text-sm text-muted-foreground">No entries yet. Click "Add Base Model" to get started.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                grouped.map(row => (
                  <TableRow key={row.modelId} className="group hover:bg-muted/30 transition-colors align-top">
                    <TableCell className="text-sm text-muted-foreground">{row.brandName}</TableCell>
                    <TableCell className="text-sm font-semibold">{row.modelName}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {row.links.map(l => (
                          <span key={l.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                            {l.compatibleBrandName} {l.compatibleModelName}
                            <button
                              type="button"
                              onClick={() => { if (confirm(`Remove "${l.compatibleModelName}" from this compatibility group?`)) deleteLink.mutate(l.id); }}
                              className="hover:opacity-70"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        title="Add another compatible model"
                        onClick={() => { setAddToRow(row); setRowPickBrandId(null); setRowPickModelId(null); }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ══ ADD BASE MODEL DIALOG ══════════════════════════════ */}
      <Dialog open={isAddOpen} onOpenChange={o => { if (!o) resetAddDialog(); }}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSaveAdd}>
            <DialogHeader><DialogTitle>Add Compatibility Group — {activeCat?.name}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>Base Brand → Model *</Label>
                <IdModelPicker
                  brandId={baseBrandId} modelId={baseModelId}
                  onChange={(b, m) => { setBaseBrandId(b); setBaseModelId(m); setPendingCompat([]); }}
                />
              </div>

              <div className="space-y-1.5 border-t border-border pt-3">
                <Label>Compatible Model(s) *</Label>
                <div className="flex flex-wrap gap-1.5 min-h-[1.75rem]">
                  {pendingCompat.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-1">No compatible models added yet.</p>
                  ) : (
                    pendingCompat.map(p => (
                      <span key={p.modelId} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                        {p.brandName} {p.modelName}
                        <button type="button" onClick={() => setPendingCompat(prev => prev.filter(x => x.modelId !== p.modelId))} className="hover:opacity-70">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <IdModelPicker
                      brandId={pickBrandId} modelId={pickModelId}
                      onChange={(b, m) => { setPickBrandId(b); setPickModelId(m); }}
                      excludeModelId={baseModelId}
                    />
                  </div>
                  <Button type="button" size="sm" variant="outline" disabled={!pickModelId} onClick={addPendingCompat}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={resetAddDialog}>Cancel</Button>
              <Button type="submit" size="sm" disabled={!baseModelId || pendingCompat.length === 0 || createLink.isPending}>
                {createLink.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══ ADD TO EXISTING ROW DIALOG ══════════════════════════ */}
      <Dialog open={!!addToRow} onOpenChange={o => { if (!o) setAddToRow(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Compatible Model — {addToRow?.brandName} {addToRow?.modelName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <IdModelPicker
              brandId={rowPickBrandId} modelId={rowPickModelId}
              onChange={(b, m) => { setRowPickBrandId(b); setRowPickModelId(m); }}
              excludeModelId={addToRow?.modelId ?? null}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setAddToRow(null)}>Cancel</Button>
            <Button type="button" size="sm" disabled={!rowPickModelId || createLink.isPending} onClick={handleAddToRow}>
              {createLink.isPending ? "Saving…" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ MANAGE PART TYPES DIALOG ═════════════════════════ */}
      <Dialog open={isManageCatsOpen} onOpenChange={setIsManageCatsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Manage Part Types</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input
                placeholder="New part type name… (e.g. Display, Battery)"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (newCatName.trim()) createCat.mutate(newCatName.trim()); } }}
                className="flex-1 h-9"
              />
              <Button size="sm" className="h-9 px-3" disabled={!newCatName.trim() || createCat.isPending} onClick={() => { if (newCatName.trim()) createCat.mutate(newCatName.trim()); }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {catsLoading ? (
                <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
              ) : categories.length === 0 ? (
                <div className="h-16 flex items-center justify-center text-sm text-muted-foreground">No part types yet.</div>
              ) : (
                categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-2 group px-2 py-1.5 rounded-lg hover:bg-muted/40">
                    {editCat?.id === cat.id ? (
                      <>
                        <Input
                          value={editCatName}
                          onChange={e => setEditCatName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") { e.preventDefault(); if (editCatName.trim()) updateCat.mutate({ id: cat.id, name: editCatName.trim() }); }
                            if (e.key === "Escape") setEditCat(null);
                          }}
                          className="flex-1 h-8 text-sm"
                          autoFocus
                        />
                        <Button size="icon" className="h-7 w-7" disabled={!editCatName.trim() || updateCat.isPending} onClick={() => { if (editCatName.trim()) updateCat.mutate({ id: cat.id, name: editCatName.trim() }); }}>
                          <Plus className="h-3.5 w-3.5 rotate-45" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditCat(null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium">{cat.name}</span>
                        <span className="text-xs text-muted-foreground mr-1">{cat.linkCount} entries</span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditCat(cat); setEditCatName(cat.name); }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => { if (confirm(`Delete "${cat.name}"? This will also delete all ${cat.linkCount} compatibility entries in it.`)) deleteCat.mutate(cat.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsManageCatsOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
