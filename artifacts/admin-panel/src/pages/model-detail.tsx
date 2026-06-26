import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { 
  useGetModel, 
  useCreateCombo, 
  useUpdateCombo, 
  useDeleteCombo,
  getGetModelQueryKey,
  Combo,
  CreateComboInputComboType
} from "@workspace/api-client-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, ArrowLeft, Search, Trash , Pencil } from "lucide-react";
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
  const filteredCombos = combos.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.comboType.toLowerCase().includes(search.toLowerCase()));

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

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const comboType = formData.get("comboType") as CreateComboInputComboType;

    createCombo.mutate(
      { data: { modelId, name, comboType, inStock: true } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetModelQueryKey(modelId) });
          setIsCreateOpen(false);
          toast({ title: "Combo created successfully" });
        },
        onError: () => toast({ title: "Failed to create combo", variant: "destructive" })
      }
    );
  };

  const handleBulkAdd = async () => {
    const names = bulkNames.split("\n").map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    let success = 0;
    for (const name of names) {
      await new Promise<void>((resolve) => {
        createCombo.mutate(
          { data: { modelId, name, comboType: bulkType, inStock: true } },
          { onSuccess: () => { success++; resolve(); }, onError: () => resolve() }
        );
      });
    }
    queryClient.invalidateQueries({ queryKey: getGetModelQueryKey(modelId) });
    setIsBulkAddOpen(false);
    setBulkNames("");
    toast({ title: `${success} of ${names.length} combos added` });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCombo) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const comboType = formData.get("comboType") as CreateComboInputComboType;

    updateCombo.mutate(
      { id: editingCombo.id, data: { modelId, name, comboType, inStock: true } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetModelQueryKey(modelId) });
          setEditingCombo(null);
          toast({ title: "Combo updated successfully" });
        },
        onError: () => toast({ title: "Failed to update combo", variant: "destructive" })
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this combo?")) return;
    deleteCombo.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetModelQueryKey(modelId) });
          toast({ title: "Combo deleted successfully" });
        },
        onError: () => toast({ title: "Failed to delete combo", variant: "destructive" })
      }
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} combo(s)?`)) return;
    for (const id of selectedIds) {
      await new Promise<void>((resolve) => {
        deleteCombo.mutate({ id }, { onSuccess: () => resolve(), onError: () => resolve() });
      });
    }
    queryClient.invalidateQueries({ queryKey: getGetModelQueryKey(modelId) });
    setSelectedIds([]);
    toast({ title: `${selectedIds.length} combo(s) deleted` });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCombos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCombos.map(c => c.id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        {model && (
          <Link href={`/brands/${model.brandId}/models`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            {modelLoading ? "Loading..." : `${model?.brandName} ${model?.name} Combos`}
          </h1>
          <p className="text-muted-foreground mt-1">Manage display parts and compatibility.</p>
        </div>
        <div className="ml-auto"><Button onClick={() => setIsCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Combo</Button></div>
      </div>

      <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border border-border">
        <Search className="h-5 w-5 text-muted-foreground ml-2" />
        <Input 
          placeholder="Search combos..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="flex gap-2"><Button variant="outline" onClick={() => setIsBulkAddOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Bulk Add</Button>{selectedIds.length > 0 && (<Button variant="destructive" onClick={handleBulkDelete} className="gap-2"><Trash className="h-4 w-4 text-red-500" /> Delete ({selectedIds.length})</Button>)}</div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={filteredCombos.length > 0 && selectedIds.length === filteredCombos.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Combo Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modelLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">Loading combos...</TableCell>
              </TableRow>
            ) : filteredCombos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No combos found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCombos.map((combo) => (
                <TableRow key={combo.id} className="group">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(combo.id)}
                      onCheckedChange={() => toggleSelect(combo.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{combo.name}</TableCell>
                  <TableCell><ComboBadge type={combo.comboType} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 ">
                      <Button variant="ghost" size="icon" onClick={() => setEditingCombo(combo)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(combo.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
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
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Add New Combo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Combo Name</Label>
                <Input id="name" name="name" required autoFocus placeholder="e.g. A18, A17k" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comboType">Type</Label>
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
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createCombo.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Add Combos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label>Combo Names (one per line)</Label>
              <Textarea
                rows={8}
                placeholder={"A18\nA17k\nA38\nA57"}
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkAddOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkAdd} disabled={createCombo.isPending}>
              Add All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCombo} onOpenChange={(open) => { if (!open) setEditingCombo(null); }}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Combo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Combo Name</Label>
                <Input id="edit-name" name="name" required autoFocus defaultValue={editingCombo?.name ?? ""} key={editingCombo?.id} />
              </div>
              <div className="space-y-2">
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
              <Button type="button" variant="outline" onClick={() => setEditingCombo(null)}>Cancel</Button>
              <Button type="submit" disabled={updateCombo.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}