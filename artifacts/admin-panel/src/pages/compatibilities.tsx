import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Search, Database } from "lucide-react";
import { ComboBadge } from "@/components/combo-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type CompatType = "OEM" | "Compatible" | "Refurbished";

interface BrandRow { id: number; name: string; }
interface ModelRow { id: number; brandId: number; name: string; }
interface Compat {
  id: number; modelId: number; modelName: string; brandName: string;
  name: string; comboType: CompatType; qualityGrade?: string | null; notes?: string | null;
}

function useBrands() {
  return useQuery<BrandRow[]>({
    queryKey: ["compat-brands"],
    queryFn: () => fetch("/api/brands", { credentials: "include" }).then(r => r.json()),
    staleTime: 60_000,
  });
}
function useModelsForBrand(brandId: number | null) {
  return useQuery<ModelRow[]>({
    queryKey: ["compat-models", brandId],
    queryFn: () => fetch(`/api/brands/${brandId}/models`, { credentials: "include" }).then(r => r.json()),
    enabled: !!brandId,
    staleTime: 30_000,
  });
}
function useCompatibilities(categoryId: number | null) {
  return useQuery<Compat[]>({
    queryKey: ["compatibilities", categoryId],
    queryFn: async () => {
      const r = await fetch(`/api/compatibilities${categoryId ? `?category_id=${categoryId}` : ""}`, { credentials: "include" });
      if (!r.ok) return [] as Compat[];
      const data = await r.json();
      return Array.isArray(data) ? (data as Compat[]) : [];
    },
    staleTime: 30_000,
  });
}
function useCategories() {
  return useQuery<any[]>({
    queryKey: ["admin-categories"],
    queryFn: () => fetch("/api/categories", { credentials: "include" }).then(r => r.json()),
    staleTime: 60_000,
  });
}

const COMPAT_TYPES: CompatType[] = ["OEM", "Compatible", "Refurbished"];

export default function Compatibilities() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: categories = [], isLoading: cLoading } = useCategories();
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const { data: compatibilities = [], isLoading } = useCompatibilities(filterCategory === "all" ? null : Number(filterCategory));
  const list = Array.isArray(compatibilities) ? compatibilities : [];

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCompat, setEditingCompat] = useState<Compat | null>(null);

  // Add form state
  const [createBrandId, setCreateBrandId] = useState<number | null>(null);
  const [createModelId, setCreateModelId] = useState<number | null>(null);
  const [createType, setCreateType] = useState<CompatType>("Compatible");

  // Edit form state
  const [editType, setEditType] = useState<CompatType>("Compatible");

  const { data: brands = [], isLoading: bLoading } = useBrands();
  const { data: createModels = [], isLoading: mLoading } = useModelsForBrand(createBrandId);

  const filtered = list.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.brandName.toLowerCase().includes(search.toLowerCase()) ||
      c.modelName.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || c.comboType === filterType;
    return matchSearch && matchType;
  });

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!createModelId) return;
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/compatibilities", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: createModelId, name: fd.get("name"), comboType: createType }),
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["compatibilities"] });
      setIsCreateOpen(false); setCreateBrandId(null); setCreateModelId(null); setCreateType("Compatible");
      toast({ title: "Compatibility entry added" });
    } else { toast({ title: "Failed to add", variant: "destructive" }); }
  }

  async function handleUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingCompat) return;
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/compatibilities/${editingCompat.id}`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: editingCompat.modelId, name: fd.get("name"), comboType: editType }),
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["compatibilities"] });
      setEditingCompat(null);
      toast({ title: "Updated" });
    } else { toast({ title: "Failed to update", variant: "destructive" }); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this compatibility entry?")) return;
    const res = await fetch(`/api/compatibilities/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["compatibilities"] });
      toast({ title: "Deleted" });
    } else { toast({ title: "Failed to delete", variant: "destructive" }); }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compatibility Database</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {list.length} total {list.length === 1 ? "entry" : "entries"} · manage display combos across models
          </p>
        </div>
        <Button size="sm" className="gap-1.5 h-9" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Add Entry
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9 bg-card" placeholder="Search brand, model, name…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-9 w-40 bg-card"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {COMPAT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-9 w-44 bg-card"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "entry" : "entries"}
          {filterType !== "all" && <span> · <span className="font-semibold text-foreground">{filterType}</span></span>}
        </p>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Brand</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Model</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Name</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Type</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="h-11">
                    <div className="h-4 bg-muted animate-pulse rounded w-full max-w-xs" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Database className="h-8 w-8 text-muted-foreground opacity-30" />
                    <span className="text-sm text-muted-foreground">No entries found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm text-muted-foreground font-medium">{c.brandName}</TableCell>
                  <TableCell>
                    <Link href={`/models/${c.modelId}`}>
                      <span className="text-sm font-medium text-primary hover:underline cursor-pointer">{c.modelName}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{c.name}</TableCell>
                  <TableCell><ComboBadge type={c.comboType} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { setEditingCompat(c); setEditType(c.comboType); }}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(c.id)}>
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

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={o => { if (!o) { setIsCreateOpen(false); setCreateBrandId(null); setCreateModelId(null); setCreateType("Compatible"); } }}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleCreate}>
            <DialogHeader><DialogTitle>Add Compatibility Entry</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Brand *</Label>
                  <Select value={createBrandId ? String(createBrandId) : undefined}
                    onValueChange={v => { setCreateBrandId(Number(v)); setCreateModelId(null); }}>
                    <SelectTrigger className="h-9"><SelectValue placeholder={bLoading ? "Loading…" : "Select brand"} /></SelectTrigger>
                    <SelectContent>
                      {brands.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Model *</Label>
                  <Select value={createModelId ? String(createModelId) : undefined}
                    onValueChange={v => setCreateModelId(Number(v))} disabled={!createBrandId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder={!createBrandId ? "Pick brand first" : mLoading ? "Loading…" : "Select model"} /></SelectTrigger>
                    <SelectContent>
                      {createModels.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input name="name" required placeholder="e.g. A18, A17k, OEM Original" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={createType} onValueChange={v => setCreateType(v as CompatType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMPAT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="h-9 gap-1.5" disabled={!createModelId}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCompat} onOpenChange={o => { if (!o) setEditingCompat(null); }}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleUpdate}>
            <DialogHeader><DialogTitle>Edit Entry</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-sm text-muted-foreground">
                {editingCompat?.brandName} › {editingCompat?.modelName}
              </div>
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input name="name" required defaultValue={editingCompat?.name ?? ""} key={editingCompat?.id} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={editType} onValueChange={v => setEditType(v as CompatType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMPAT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setEditingCompat(null)}>Cancel</Button>
              <Button type="submit" size="sm" className="h-9 gap-1.5">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
