import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { 
  useGetBrandModels, 
  useCreateModel, 
  useUpdateModel, 
  useDeleteModel,
  useGetBrand,
  getGetBrandModelsQueryKey,
  Model
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
import { Plus, Edit2, Trash2, ArrowLeft, Search, Layers, Trash , Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function BrandModels() {
  const params = useParams();
  const brandId = Number(params.id);
  const [search, setSearch] = useState("");
  
  const { data: brand, isLoading: brandLoading } = useGetBrand(brandId, { query: { enabled: !!brandId } });
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

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    createModel.mutate(
      { data: { brandId, name } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBrandModelsQueryKey(brandId) });
          setIsCreateOpen(false);
          toast({ title: "Model created successfully" });
        },
        onError: () => toast({ title: "Failed to create model", variant: "destructive" })
      }
    );
  };

  const handleBulkAdd = async () => {
    const names = bulkNames.split("\n").map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;
    let success = 0;
    for (const name of names) {
      await new Promise<void>((resolve) => {
        createModel.mutate(
          { data: { brandId, name } },
          { onSuccess: () => { success++; resolve(); }, onError: () => resolve() }
        );
      });
    }
    queryClient.invalidateQueries({ queryKey: getGetBrandModelsQueryKey(brandId) });
    setIsBulkAddOpen(false);
    setBulkNames("");
    toast({ title: `${success} of ${names.length} models added` });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingModel) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    updateModel.mutate(
      { id: editingModel.id, data: { brandId, name } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBrandModelsQueryKey(brandId) });
          setEditingModel(null);
          toast({ title: "Model updated successfully" });
        },
        onError: () => toast({ title: "Failed to update model", variant: "destructive" })
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this model?")) return;
    deleteModel.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBrandModelsQueryKey(brandId) });
          toast({ title: "Model deleted successfully" });
        },
        onError: () => toast({ title: "Failed to delete model", variant: "destructive" })
      }
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} model(s)?`)) return;
    for (const id of selectedIds) {
      await new Promise<void>((resolve) => {
        deleteModel.mutate({ id }, { onSuccess: () => resolve(), onError: () => resolve() });
      });
    }
    queryClient.invalidateQueries({ queryKey: getGetBrandModelsQueryKey(brandId) });
    setSelectedIds([]);
    toast({ title: `${selectedIds.length} model(s) deleted` });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredModels.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredModels.map(m => m.id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/brands">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            {brandLoading ? "Loading..." : brand?.name} Models
          </h1>
          <p className="text-muted-foreground mt-1">Manage device models for this brand.</p>
        </div>
        <div className="ml-auto"><Button onClick={() => setIsCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add</Button></div>
      </div>

      <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border border-border">
        <Search className="h-5 w-5 text-muted-foreground ml-2" />
        <Input 
          placeholder="Search models..." 
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
                  checked={filteredModels.length > 0 && selectedIds.length === filteredModels.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Model Name</TableHead>
              <TableHead>Combos</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modelsLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">Loading models...</TableCell>
              </TableRow>
            ) : filteredModels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No models found.
                </TableCell>
              </TableRow>
            ) : (
              filteredModels.map((model) => (
                <TableRow key={model.id} className="group">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(model.id)}
                      onCheckedChange={() => toggleSelect(model.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/models/${model.id}`} className="hover:underline flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                         <Layers className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {model.name}
                    </Link>
                  </TableCell>
                  <TableCell>{model.comboCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => setEditingModel(model)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(model.id)}>
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
              <DialogTitle>Add New Model</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Model Name</Label>
                <Input id="name" name="name" required autoFocus placeholder="e.g. Oppo A17" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createModel.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Add Models</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Model Names (one per line)</Label>
              <Textarea
                rows={8}
                placeholder={"Oppo A17\nOppo A18\nOppo A38"}
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkAddOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkAdd} disabled={createModel.isPending}>
              Add All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      
      
    </div>
  );
}
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            {brandLoading ? "Loading..." : brand?.name} Models
          </h1>
          <p className="text-muted-foreground mt-1">Manage device models for this brand.</p>
        </div>
        <div className="ml-auto"><Button onClick={() => setIsCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add</Button></div>
      </div>

      <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border border-border">
        <Search className="h-5 w-5 text-muted-foreground ml-2" />
        <Input 
          placeholder="Search models..." 
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
                  checked={filteredModels.length > 0 && selectedIds.length === filteredModels.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Model Name</TableHead>
              <TableHead>Combos</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modelsLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">Loading models...</TableCell>
              </TableRow>
            ) : filteredModels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No models found.
                </TableCell>
              </TableRow>
            ) : (
              filteredModels.map((model) => (
                <TableRow key={model.id} className="group">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(model.id)}
                      onCheckedChange={() => toggleSelect(model.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/models/${model.id}`} className="hover:underline flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                         <Layers className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {model.name}
                    </Link>
                  </TableCell>
                  <TableCell>{model.comboCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => setEditingModel(model)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(model.id)}>
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
              <DialogTitle>Add New Model</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Model Name</Label>
                <Input id="name" name="name" required autoFocus placeholder="e.g. Oppo A17" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createModel.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Add Models</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Model Names (one per line)</Label>
              <Textarea
                rows={8}
                placeholder={"Oppo A17\nOppo A18\nOppo A38"}
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkAddOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkAdd} disabled={createModel.isPending}>
              Add All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      
      
      
    </div>
  );
}
