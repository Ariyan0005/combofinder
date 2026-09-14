import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { 
  useGetBrandModels, useCreateModel, useUpdateModel, useDeleteModel,
  useGetBrand, getGetBrandModelsQueryKey, Model
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, ArrowLeft, Search, Smartphone, Trash, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORY_MODULES } from "@/lib/category-modules";

export default function BrandModels() {
  const params = useParams();
  const brandId = Number(params.id);
  const [search, setSearch] = useState("");
  
  const { data: brand, isLoading: brandLoading } = useGetBrand(brandId, { query: { enabled: !!brandId } });
  const { data: categories = [] } = useQuery<{ id: number; slug: string }[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const r = await fetch("/api/categories", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load categories");
      return r.json();
    },
  });
  const brandCategory = categories.find((c) => c.id === brand?.categoryId);
  const module = brandCategory ? CATEGORY_MODULES.find((m) => m.slug === brandCategory.slug) : undefined;
  const backHref = module?.href ?? "/brands";
  const backLabel = module?.brandsLabel ?? "Brands";
  const { data: models = [], isLoading: modelsLoading } = useGetBrandModels(brandId, { query: { enabled: !!brandId } });
  const filteredModels = models.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkNames, setBulkNames] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createModel = useCreateModel();
  const updateModel = useUpdateModel();
  const deleteModel = useDeleteModel();

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createModel.mutate(
      { data: { brandId, name: fd.get("name") as string } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBrandModelsQueryKey(brandId) });
          setIsCreateOpen(false);
          toast({ title: "Model created" });
        },
        onError: () => toast({ title: "Failed to create model", variant: "destructive" })
      }
    );
  };

  const handleBulkAdd = async () => {
    const names = bulkNames.split("\n").map(n => n.trim()).filter(Boolean);
    if (!names.length) return;
    let success = 0;
    for (const name of names) {
      await new Promise<void>((resolve) => {
        createModel.mutate({ data: { brandId, name } }, { onSuccess: () => { success++; resolve(); }, onError: () => resolve() });
      });
    }
    queryClient.invalidateQueries({ queryKey: getGetBrandModelsQueryKey(brandId) });
    setIsBulkAddOpen(false);
    setBulkNames("");
    toast({ title: `${success} of ${names.length} models added` });
  };

  const handleUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingModel) return;
    const fd = new FormData(e.currentTarget);
    updateModel.mutate(
      { id: editingModel.id, data: { brandId, name: fd.get("name") as string } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBrandModelsQueryKey(brandId) });
          setEditingModel(null);
          toast({ title: "Model updated" });
        },
        onError: () => toast({ title: "Failed to update model", variant: "destructive" })
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this model?")) return;
    deleteModel.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBrandModelsQueryKey(brandId) });
        toast({ title: "Model deleted" });
      },
      onError: () => toast({ title: "Failed to delete model", variant: "destructive" })
    });
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length || !confirm(`Delete ${selectedIds.length} model(s)?`)) return;
    for (const id of selectedIds) {
      await new Promise<void>((resolve) => {
        deleteModel.mutate({ id }, { onSuccess: () => resolve(), onError: () => resolve() });
      });
    }
    queryClient.invalidateQueries({ queryKey: getGetBrandModelsQueryKey(brandId) });
    setSelectedIds([]);
    toast({ title: `${selectedIds.length} model(s) deleted` });
  };

  const toggleSelect = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === filteredModels.length ? [] : filteredModels.map(m => m.id));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href={backHref}>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href={backHref}><span className="hover:text-foreground cursor-pointer">{backLabel}</span></Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{brandLoading ? "..." : brand?.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {brandLoading ? "Loading..." : brand?.name} Models
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage device models for this brand.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-9 text-sm shrink-0">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {/* Search + actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-card"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsBulkAddOpen(true)} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Bulk Add
          </Button>
          {selectedIds.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-1.5 text-xs">
              <Trash className="h-3.5 w-3.5" /> Delete ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      {!modelsLoading && (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredModels.length}</span> of{" "}
          <span className="font-semibold text-foreground">{models.length}</span> models
        </p>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10">
                <Checkbox
                  checked={filteredModels.length > 0 && selectedIds.length === filteredModels.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Model Name</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Combos</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modelsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4} className="h-12">
                    <div className="h-4 bg-muted animate-pulse rounded w-48" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredModels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Smartphone className="h-8 w-8 text-muted-foreground opacity-30" />
                    <span className="text-sm text-muted-foreground">No models found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredModels.map((model) => (
                <TableRow key={model.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(model.id)}
                      onCheckedChange={() => toggleSelect(model.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/models/${model.id}`}>
                      <div className="flex items-center gap-2.5 cursor-pointer group/link">
                        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Smartphone className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="group-hover/link:text-primary transition-colors text-sm">{model.name}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                      {model.comboCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingModel(model)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(model.id)}>
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
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleCreate}>
            <DialogHeader><DialogTitle>Add New Model</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Model Name *</Label>
                <Input id="name" name="name" required autoFocus placeholder="e.g. Galaxy A15" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={createModel.isPending}>{createModel.isPending ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Add Models</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Model Names <span className="text-muted-foreground">(one per line)</span></Label>
              <Textarea rows={8} placeholder={"Galaxy A15\nGalaxy A25\nGalaxy A35"} value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsBulkAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleBulkAdd} disabled={createModel.isPending}>Add All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingModel} onOpenChange={(open) => { if (!open) setEditingModel(null); }}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleUpdate}>
            <DialogHeader><DialogTitle>Edit Model</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Model Name *</Label>
                <Input id="edit-name" name="name" required autoFocus defaultValue={editingModel?.name ?? ""} key={editingModel?.id} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingModel(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={updateModel.isPending}>{updateModel.isPending ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
