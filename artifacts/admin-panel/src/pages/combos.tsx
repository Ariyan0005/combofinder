import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGetCombos, useCreateCombo, useUpdateCombo, useDeleteCombo, getGetCombosQueryKey } from "@workspace/api-client-react";
import type { CreateComboInputComboType, Combo } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Search, Filter, Database } from "lucide-react";
import { ComboBadge } from "@/components/combo-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface BrandRow { id: number; name: string; }
interface ModelRow { id: number; brandId: number; name: string; }

function useBrands() {
  return useQuery<BrandRow[]>({
    queryKey: ["combo-brands"],
    queryFn: () => fetch("/api/brands", { credentials: "include" }).then(r => r.json()),
    staleTime: 60_000,
  });
}
function useModelsForBrand(brandId: number | null) {
  return useQuery<ModelRow[]>({
    queryKey: ["combo-models", brandId],
    queryFn: () => fetch(`/api/brands/${brandId}/models`, { credentials: "include" }).then(r => r.json()),
    enabled: !!brandId,
    staleTime: 30_000,
  });
}

const COMBO_TYPES: CreateComboInputComboType[] = ["OEM", "Compatible", "Refurbished"];

/** Add form: pick brand → model → name + type */
function AddComboForm({
  brandId, setBrandId, modelId, setModelId, comboType, setComboType,
}: {
  brandId: number | null; setBrandId: (v: number | null) => void;
  modelId: number | null; setModelId: (v: number | null) => void;
  comboType: CreateComboInputComboType; setComboType: (v: CreateComboInputComboType) => void;
}) {
  const { data: brands = [], isLoading: bLoading } = useBrands();
  const { data: models = [], isLoading: mLoading } = useModelsForBrand(brandId);

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Brand *</Label>
          <Select
            value={brandId ? String(brandId) : undefined}
            onValueChange={v => { setBrandId(Number(v)); setModelId(null); }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={bLoading ? "Loading…" : "Select brand"} />
            </SelectTrigger>
            <SelectContent>
              {brands.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              {brands.length === 0 && !bLoading && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">No brands yet</div>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Model *</Label>
          <Select
            value={modelId ? String(modelId) : undefined}
            onValueChange={v => setModelId(Number(v))}
            disabled={!brandId}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={!brandId ? "Pick brand first" : mLoading ? "Loading…" : "Select model"} />
            </SelectTrigger>
            <SelectContent>
              {models.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
              {brandId && models.length === 0 && !mLoading && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">No models under this brand</div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Combo Name *</Label>
        <Input name="name" required placeholder="e.g. A18, A17k, OEM Original" autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label>Type *</Label>
        <Select value={comboType} onValueChange={v => setComboType(v as CreateComboInputComboType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {COMBO_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/** Edit form: model is read-only, only name + type editable */
function EditComboForm({
  combo, comboType, setComboType,
}: {
  combo: Combo;
  comboType: CreateComboInputComboType;
  setComboType: (v: CreateComboInputComboType) => void;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Brand</Label>
          <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/40 text-sm text-muted-foreground">{combo.brandName}</div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Model</Label>
          <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/40 text-sm text-muted-foreground">{combo.modelName}</div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Combo Name *</Label>
        <Input name="name" required defaultValue={combo.name} key={combo.id} autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label>Type *</Label>
        <Select value={comboType} onValueChange={v => setComboType(v as CreateComboInputComboType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {COMBO_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function Combos() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);

  // create form state
  const [createBrandId, setCreateBrandId] = useState<number | null>(null);
  const [createModelId, setCreateModelId] = useState<number | null>(null);
  const [createType, setCreateType] = useState<CreateComboInputComboType>("Compatible");

  // edit form state
  const [editType, setEditType] = useState<CreateComboInputComboType>("Compatible");

  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: combos = [], isLoading } = useGetCombos();
  const createCombo = useCreateCombo();
  const updateCombo = useUpdateCombo();
  const deleteCombo = useDeleteCombo();

  const filteredCombos = combos.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.modelName.toLowerCase().includes(search.toLowerCase()) ||
      c.brandName.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || c.comboType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!createModelId) return;
    const fd = new FormData(e.currentTarget);
    createCombo.mutate(
      { data: { modelId: createModelId, name: (fd.get("name") as string).trim(), comboType: createType, inStock: true } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetCombosQueryKey() });
          setIsCreateOpen(false);
          setCreateBrandId(null); setCreateModelId(null); setCreateType("Compatible");
          toast({ title: "Combo added" });
        },
        onError: () => toast({ title: "Failed to add combo", variant: "destructive" }),
      }
    );
  };

  const handleUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCombo) return;
    const fd = new FormData(e.currentTarget);
    updateCombo.mutate(
      { id: editingCombo.id, data: { modelId: editingCombo.modelId, name: (fd.get("name") as string).trim(), comboType: editType, inStock: editingCombo.inStock } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetCombosQueryKey() });
          setEditingCombo(null);
          toast({ title: "Combo updated" });
        },
        onError: () => toast({ title: "Failed to update combo", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this combo?")) return;
    deleteCombo.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getGetCombosQueryKey() }); toast({ title: "Combo deleted" }); },
      onError: () => toast({ title: "Failed to delete combo", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compatibility Database</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All display combos — OEM, Compatible, Refurbished.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-9 text-sm">
          <Plus className="h-4 w-4" /> Add Combo
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by brand, model, or combo name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-card"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-44">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 flex-1">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="OEM">OEM</SelectItem>
              <SelectItem value="Compatible">Compatible</SelectItem>
              <SelectItem value="Refurbished">Refurbished</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredCombos.length}</span> of{" "}
          <span className="font-semibold text-foreground">{combos.length}</span> combos
        </p>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Brand</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Model</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Combo</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Type</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Price</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Stock</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="h-11">
                    <div className="h-4 bg-muted animate-pulse rounded w-full max-w-xs" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredCombos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Database className="h-8 w-8 text-muted-foreground opacity-30" />
                    <span className="text-sm text-muted-foreground">No combos found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCombos.map((combo) => (
                <TableRow key={combo.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm text-muted-foreground font-medium">{combo.brandName}</TableCell>
                  <TableCell>
                    <Link href={`/models/${combo.modelId}`}>
                      <span className="text-sm font-medium text-primary hover:underline cursor-pointer">
                        {combo.modelName}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{combo.name}</TableCell>
                  <TableCell><ComboBadge type={combo.comboType} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {combo.priceRange || "—"}
                  </TableCell>
                  <TableCell>
                    {combo.inStock ? (
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        In Stock
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs font-semibold text-destructive">
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                        Out
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => {
                          setEditingCombo(combo);
                          setEditType(combo.comboType as CreateComboInputComboType);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(combo.id)}
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

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={o => { if (!o) { setIsCreateOpen(false); setCreateBrandId(null); setCreateModelId(null); setCreateType("Compatible"); } }}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleCreate}>
            <DialogHeader><DialogTitle>Add New Combo</DialogTitle></DialogHeader>
            <AddComboForm
              brandId={createBrandId} setBrandId={setCreateBrandId}
              modelId={createModelId} setModelId={setCreateModelId}
              comboType={createType} setComboType={setCreateType}
            />
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={!createModelId || createCombo.isPending}>
                {createCombo.isPending ? "Saving..." : "Save Combo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCombo} onOpenChange={o => { if (!o) setEditingCombo(null); }}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleUpdate}>
            <DialogHeader><DialogTitle>Edit Combo</DialogTitle></DialogHeader>
            {editingCombo && (
              <EditComboForm
                combo={editingCombo}
                comboType={editType}
                setComboType={setEditType}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingCombo(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={updateCombo.isPending}>
                {updateCombo.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
