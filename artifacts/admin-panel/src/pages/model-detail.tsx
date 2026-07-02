import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { 
  useGetModel, useCreateCombo, useUpdateCombo, useDeleteCombo,
  getGetModelQueryKey, Combo, CreateComboInputComboType
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, ArrowLeft, Search, Trash, ChevronRight, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ComboBadge } from "@/components/combo-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function ModelDetail() {
  const params = useParams();
  const modelId = Number(params.id);
  const [search, setSearch] = useState("");

  const { data: model, isLoading: modelLoading } = useGetModel(modelId, { query: { enabled: !!modelId } });
  const combos = model?.combos || [];
  const filteredCombos = combos.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.comboType.toLowerCase().includes(search.toLowerCase())
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkNames, setBulkNames] = useState("");
  const [bulkType, setBulkType] = useState<CreateComboInputComboType>("Compatible");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createCombo = useCreateCombo();
  const updateCombo = useUpdateCombo();
  const deleteCombo = useDeleteCombo();

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createCombo.mutate(
      { data: { modelId, name: fd.get("name") as string, comboType: fd.get("comboType") as CreateComboInputComboType, inStock: true } },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetModelQueryKey(modelId) }); setIsCreateOpen(false); toast({ title: "Combo created" }); },
        onError: () => toast({ title: "Failed to create combo", variant: "destructive" })
      }
    );
  };

  const handleBulkAdd = async () => {
    const names = bulkNames.split("\n").map(n => n.trim()).filter(Boolean);
    if (!names.length) return;
    let success = 0;
    for (const name of names) {
      await new Promise<void>((resolve) => {
        createCombo.mutate({ data: { modelId, name, comboType: bulkType, inStock: true } }, { onSuccess: () => { success++; resolve(); }, onError: () => resolve() });
      });
    }
    queryClient.invalidateQueries({ queryKey: getGetModelQueryKey(modelId) });
    setIsBulkAddOpen(false);
    setBulkNames("");
    toast({ title: `${success} of ${names.length} combos added` });
  };

  const handleUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCombo) return;
    const fd = new FormData(e.currentTarget);
    updateCombo.mutate(
      { id: editingCombo.id, data: { modelId, name: fd.get("name") as string, comboType: fd.get("comboType") as CreateComboInputComboType, inStock: true } },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetModelQueryKey(modelId) }); setEditingCombo(null); toast({ title: "Combo updated" }); },
        onError: () => toast({ title: "Failed to update combo", variant: "destructive" })
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this combo?")) return;
    deleteCombo.mutate({ id }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetModelQueryKey(modelId) }); toast({ title: "Combo deleted" }); },
      onError: () => toast({ title: "Failed to delete combo", variant: "destructive" })
    });
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length || !confirm(`Delete ${selectedIds.length} combo(s)?`)) return;
    for (const id of selectedIds) {
      await new Promise<void>((resolve) => {
        deleteCombo.mutate({ id }, { onSuccess: () => resolve(), onError: () => resolve() });
      });
    }
    queryClient.invalidateQueries({ queryKey: getGetModelQueryKey(modelId) });
    setSelectedIds([]);
    toast({ title: `${selectedIds.length} combo(s) deleted` });
  };

  const toggleSelect = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === filteredCombos.length ? [] : filteredCombos.map(c => c.id));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start gap-3">
        {model && (
          <Link href={`/brands/${model.brandId}/models`}>
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 mt-0.5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/brands"><span className="hover:text-foreground cursor-pointer">Brands</span></Link>
            <ChevronRight className="h-3 w-3" />
            {model && (
              <Link href={`/brands/${model.brandId}/models`}>
                <span className="hover:text-foreground cursor-pointer">{model.brandName}</span>
              </Link>
            )}
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{modelLoading ? "..." : model?.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {modelLoading ? "Loading..." : `${model?.brandName} ${model?.name}`}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Compatible display combos.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-9 text-sm shrink-0">
          <Plus className="h-4 w-4" /> Add Combo
        </Button>
      </div>

      {/* Search + actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search combos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 bg-card" />
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

      {!modelLoading && (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredCombos.length}</span> of{" "}
          <span className="font-semibold text-foreground">{combos.length}</span> combos
        </p>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10">
                <Checkbox checked={filteredCombos.length > 0 && selectedIds.length === filteredCombos.length} onCheckedChange={toggleSelectAll} />
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Combo Name</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Type</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modelLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={4} className="h-11"><div className="h-4 bg-muted animate-pulse rounded w-40" /></TableCell></TableRow>
              ))
            ) : filteredCombos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Database className="h-8 w-8 text-muted-foreground opacity-30" />
                    <span className="text-sm text-muted-foreground">No combos yet</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCombos.map((combo) => (
                <TableRow key={combo.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell><Checkbox checked={selectedIds.includes(combo.id)} onCheckedChange={() => toggleSelect(combo.id)} /></TableCell>
                  <TableCell className="font-medium text-sm">{combo.name}</TableCell>
                  <TableCell><ComboBadge type={combo.comboType} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingCombo(combo)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(combo.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
            <DialogHeader><DialogTitle>Add New Combo</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Combo Name *</Label>
                <Input id="name" name="name" required autoFocus placeholder="e.g. A18, A17k" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select name="comboType" defaultValue="Compatible">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OEM">OEM</SelectItem>
                    <SelectItem value="Compatible">Compatible</SelectItem>
                    <SelectItem value="Refurbished">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={createCombo.isPending}>{createCombo.isPending ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Add Combos</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={bulkType} onValueChange={(v) => setBulkType(v as CreateComboInputComboType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OEM">OEM</SelectItem>
                  <SelectItem value="Compatible">Compatible</SelectItem>
                  <SelectItem value="Refurbished">Refurbished</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Combo Names <span className="text-muted-foreground">(one per line)</span></Label>
              <Textarea rows={7} placeholder={"A18\nA17k\nA38\nA57"} value={bulkNames} onChange={(e) => setBulkNames(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsBulkAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleBulkAdd} disabled={createCombo.isPending}>Add All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCombo} onOpenChange={(open) => { if (!open) setEditingCombo(null); }}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleUpdate}>
            <DialogHeader><DialogTitle>Edit Combo</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Combo Name *</Label>
                <Input id="edit-name" name="name" required autoFocus defaultValue={editingCombo?.name ?? ""} key={editingCombo?.id} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select name="comboType" defaultValue={editingCombo?.comboType ?? "Compatible"} key={`type-${editingCombo?.id}`}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OEM">OEM</SelectItem>
                    <SelectItem value="Compatible">Compatible</SelectItem>
                    <SelectItem value="Refurbished">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingCombo(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={updateCombo.isPending}>{updateCombo.isPending ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
