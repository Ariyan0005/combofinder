import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Search, Settings2, Layers, X, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SingleModelPicker, useBrands, useModelsForBrand } from "@/components/brand-model-picker";

const API = "/api";

/* ── Types ─────────────────────────────────────────────────── */
interface Category { id: number; name: string; partCount: number; createdAt: string; }
interface Part {
  id: number; categoryId: number; categoryName: string;
  modelId: number; modelName: string; brandId: number; brandName: string;
  partName: string; description: string | null; createdAt: string;
}

/* ── API helpers ────────────────────────────────────────────── */
const fetchCategories = (): Promise<Category[]> =>
  fetch(`${API}/part-categories`, { credentials: "include" }).then(r => r.json());

const fetchParts = async (categoryId?: number): Promise<Part[]> => {
  const url = categoryId ? `${API}/parts?categoryId=${categoryId}` : `${API}/parts`;
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) return [];
  const data = await r.json();
  return Array.isArray(data) ? data : [];
};

/* ── Category CHIP colors (cycles) ─────────────────────────── */
const CHIP_PALETTES = [
  "bg-violet-500/10 text-violet-400 border-violet-500/20",
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
export default function Parts() {
  const qc = useQueryClient();
  const { toast } = useToast();

  /* selected category filter */
  const [activeCatId, setActiveCatId] = useState<number | null>(null);

  /* search */
  const [search, setSearch] = useState("");

  /* dialogs */
  const [isAddPartOpen, setIsAddPartOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);

  /* add-part form state */
  const [addCatId, setAddCatId] = useState<number | null>(null);
  const [addBrandName, setAddBrandName] = useState("");
  const [addModelName, setAddModelName] = useState("");
  const { data: brandList = [] } = useBrands();
  const addBrand = brandList.find(b => b.name === addBrandName) ?? null;
  const addBrandId = addBrand?.id ?? null;
  const { data: addModels = [] } = useModelsForBrand(addBrandId);

  /* manage-categories form state */
  const [newCatName, setNewCatName] = useState("");
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState("");

  /* ── Queries ────────────────────────────────────────────── */
  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ["part-categories"],
    queryFn: fetchCategories,
  });

  const { data: parts = [], isLoading: partsLoading } = useQuery({
    queryKey: ["parts", activeCatId],
    queryFn: () => fetchParts(activeCatId ?? undefined),
  });

  /* ── Filtered parts (client search) ─────────────────────── */
  const list = Array.isArray(parts) ? parts : [];
  const filtered = list.filter(p =>
    !search ||
    p.partName.toLowerCase().includes(search.toLowerCase()) ||
    p.modelName.toLowerCase().includes(search.toLowerCase()) ||
    p.brandName.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Part mutations ──────────────────────────────────────── */
  const createPart = useMutation({
    mutationFn: (body: object) =>
      fetch(`${API}/parts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "include" }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parts"] });
      qc.invalidateQueries({ queryKey: ["part-categories"] });
      setIsAddPartOpen(false); setAddCatId(null); setAddBrandName(""); setAddModelName("");
      toast({ title: "Part added" });
    },
    onError: () => toast({ title: "Failed to add part", variant: "destructive" }),
  });

  const updatePart = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) =>
      fetch(`${API}/parts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "include" }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parts"] });
      setEditingPart(null);
      toast({ title: "Part updated" });
    },
    onError: () => toast({ title: "Failed to update part", variant: "destructive" }),
  });

  const deletePart = useMutation({
    mutationFn: (id: number) =>
      fetch(`${API}/parts/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parts"] });
      qc.invalidateQueries({ queryKey: ["part-categories"] });
      toast({ title: "Part deleted" });
    },
    onError: () => toast({ title: "Failed to delete part", variant: "destructive" }),
  });

  /* ── Category mutations ──────────────────────────────────── */
  const createCat = useMutation({
    mutationFn: (name: string) =>
      fetch(`${API}/part-categories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }), credentials: "include" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["part-categories"] }); setNewCatName(""); toast({ title: "Category created" }); },
    onError: () => toast({ title: "Failed to create category", variant: "destructive" }),
  });

  const updateCat = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      fetch(`${API}/part-categories/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }), credentials: "include" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["part-categories"] }); setEditCat(null); toast({ title: "Category updated" }); },
    onError: () => toast({ title: "Failed to update category", variant: "destructive" }),
  });

  const deleteCat = useMutation({
    mutationFn: (id: number) =>
      fetch(`${API}/part-categories/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["part-categories"] });
      qc.invalidateQueries({ queryKey: ["parts"] });
      if (activeCatId === id) setActiveCatId(null);
      toast({ title: "Category deleted" });
    },
    onError: () => toast({ title: "Failed to delete category", variant: "destructive" }),
  });

  /* ── Handlers ────────────────────────────────────────────── */
  const handleAddPart = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sel = addModels.find(m => m.name === addModelName);
    const modelId = sel?.id ?? null;
    if (!addCatId || !modelId) return;
    const fd = new FormData(e.currentTarget);
    createPart.mutate({
      categoryId: addCatId,
      modelId,
      partName: (fd.get("partName") as string).trim(),
      description: (fd.get("description") as string).trim() || null,
    });
  };

  const handleUpdatePart = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPart) return;
    const fd = new FormData(e.currentTarget);
    updatePart.mutate({
      id: editingPart.id,
      body: {
        categoryId: editingPart.categoryId,
        modelId: editingPart.modelId,
        partName: (fd.get("partName") as string).trim(),
        description: (fd.get("description") as string).trim() || null,
      },
    });
  };

  /* ── Render ──────────────────────────────────────────────── */
  const activeCat = categories.find(c => c.id === activeCatId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parts Compatibility</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCat ? `${activeCat.name} — ${activeCat.partCount} compatible entries` : "Select a category to filter, or view all parts."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => setIsManageCatsOpen(true)}>
            <Settings2 className="h-3.5 w-3.5" /> Manage Categories
          </Button>
          <Button size="sm" className="gap-1.5 h-9" onClick={() => { setIsAddPartOpen(true); setAddCatId(activeCatId); setAddBrandName(""); setAddModelName(""); }}>
            <Plus className="h-4 w-4" /> Add Compatible
          </Button>
        </div>
      </div>

      {/* ── Category Cards ──────────────────────────────── */}
      {catsLoading ? (
        <div className="flex gap-3 flex-wrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 w-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-8 text-center">
          <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground mb-3">No categories yet. Create one to start adding parts.</p>
          <Button size="sm" variant="outline" onClick={() => setIsManageCatsOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Create First Category
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {/* All */}
          <button
            onClick={() => setActiveCatId(null)}
            className={`flex flex-col items-start px-4 py-2.5 rounded-xl border text-left transition-all ${
              activeCatId === null
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "bg-card border-border hover:border-primary/40 hover:bg-muted/40"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">All</span>
            <span className="text-lg font-bold leading-tight">{list.length || categories.reduce((s, c) => s + c.partCount, 0)}</span>
          </button>

          {categories.map((cat, idx) => {
            const palette = CHIP_PALETTES[idx % CHIP_PALETTES.length];
            const isActive = activeCatId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCatId(isActive ? null : cat.id)}
                className={`flex flex-col items-start px-4 py-2.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                    : `${palette} hover:opacity-90`
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider opacity-70 truncate max-w-[110px]">{cat.name}</span>
                <span className="text-lg font-bold leading-tight">{cat.partCount}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Search ──────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by brand, model, or part name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9 bg-card"
        />
      </div>

      {!partsLoading && (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span> entries
          {activeCatId && <span> in <span className="font-semibold text-foreground">{activeCat?.name}</span></span>}
        </p>
      )}

      {/* ── Table ───────────────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold uppercase tracking-wider">Category</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">Brand</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">Model</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">Part Name</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Notes</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-11">
                    <div className="h-4 bg-muted animate-pulse rounded w-56" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-36 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Wrench className="h-8 w-8 text-muted-foreground opacity-30" />
                    <span className="text-sm text-muted-foreground">
                      {categories.length === 0
                        ? "Create a category first, then add parts."
                        : "No parts found. Click \"Add Compatible\" to get started."}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(p => (
                <TableRow key={p.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                      {p.categoryName}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.brandName}</TableCell>
                  <TableCell className="text-sm font-medium">{p.modelName}</TableCell>
                  <TableCell className="text-sm font-semibold">{p.partName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell max-w-[160px] truncate" title={p.description || ""}>
                    {p.description || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => setEditingPart(p)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { if (confirm("Delete this part entry?")) deletePart.mutate(p.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ══ ADD PART DIALOG ══════════════════════════════════ */}
      <Dialog open={isAddPartOpen} onOpenChange={o => { if (!o) { setIsAddPartOpen(false); setAddCatId(null); setAddBrandName(""); setAddModelName(""); } }}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleAddPart}>
            <DialogHeader><DialogTitle>Add Compatible Entry</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">

              {/* Category */}
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select
                  value={addCatId ? String(addCatId) : undefined}
                  onValueChange={v => setAddCatId(Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    {categories.length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">No categories — create one first.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Brand → Model picker */}
              <div className="space-y-1.5">
                <Label>Brand → Model *</Label>
                <SingleModelPicker
                  brandName={addBrandName}
                  modelName={addModelName}
                  onChange={(b, m) => { setAddBrandName(b); setAddModelName(m); }}
                />
              </div>

              {/* Part name */}
              <div className="space-y-1.5">
                <Label>Part Name *</Label>
                <Input name="partName" required placeholder="e.g. BLP727, A15 OEM Display, 500mAh Battery" autoFocus />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea name="description" placeholder="Capacity, grade, colour, specs…" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddPartOpen(false)}>Cancel</Button>
              <Button
                type="submit" size="sm"
                disabled={!addCatId || !addModelName || createPart.isPending}
              >
                {createPart.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══ EDIT PART DIALOG ═════════════════════════════════ */}
      <Dialog open={!!editingPart} onOpenChange={o => { if (!o) setEditingPart(null); }}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleUpdatePart}>
            <DialogHeader><DialogTitle>Edit Part Entry</DialogTitle></DialogHeader>
            {editingPart && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/40 text-sm text-muted-foreground">{editingPart.categoryName}</div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Model</Label>
                    <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/40 text-sm text-muted-foreground">{editingPart.brandName} — {editingPart.modelName}</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Part Name *</Label>
                  <Input name="partName" required defaultValue={editingPart.partName} key={editingPart.id} autoFocus />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Textarea name="description" defaultValue={editingPart.description || ""} rows={2} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingPart(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={updatePart.isPending}>
                {updatePart.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══ MANAGE CATEGORIES DIALOG ═════════════════════════ */}
      <Dialog open={isManageCatsOpen} onOpenChange={setIsManageCatsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Manage Part Categories</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">

            {/* Add new category */}
            <div className="flex gap-2">
              <Input
                placeholder="New category name…"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (newCatName.trim()) createCat.mutate(newCatName.trim()); } }}
                className="flex-1 h-9"
              />
              <Button
                size="sm" className="h-9 px-3"
                disabled={!newCatName.trim() || createCat.isPending}
                onClick={() => { if (newCatName.trim()) createCat.mutate(newCatName.trim()); }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Category list */}
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {catsLoading ? (
                <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
              ) : categories.length === 0 ? (
                <div className="h-16 flex items-center justify-center text-sm text-muted-foreground">No categories yet.</div>
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
                        <span className="text-xs text-muted-foreground mr-1">{cat.partCount} parts</span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditCat(cat); setEditCatName(cat.name); }}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => { if (confirm(`Delete "${cat.name}"? This will also delete all ${cat.partCount} parts in it.`)) deleteCat.mutate(cat.id); }}
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
