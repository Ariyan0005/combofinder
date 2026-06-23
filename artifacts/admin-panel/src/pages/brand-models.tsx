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
import { Plus, Edit2, Trash2, ArrowLeft, Search, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function BrandModels() {
  const params = useParams();
  const brandId = Number(params.id);
  const [search, setSearch] = useState("");
  
  const { data: brand, isLoading: brandLoading } = useGetBrand(brandId, { query: { enabled: !!brandId } });
  const { data: models = [], isLoading: modelsLoading } = useGetBrandModels(brandId, { query: { enabled: !!brandId } });
  
  const filteredModels = models.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createModel = useCreateModel();
  const updateModel = useUpdateModel();
  const deleteModel = useDeleteModel();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const releaseYearStr = formData.get("releaseYear") as string;
    const releaseYear = releaseYearStr ? parseInt(releaseYearStr) : undefined;
    const imageUrl = formData.get("imageUrl") as string;

    createModel.mutate(
      { data: { brandId, name, releaseYear, imageUrl } },
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

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingModel) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const releaseYearStr = formData.get("releaseYear") as string;
    const releaseYear = releaseYearStr ? parseInt(releaseYearStr) : undefined;
    const imageUrl = formData.get("imageUrl") as string;

    updateModel.mutate(
      { id: editingModel.id, data: { brandId, name, releaseYear, imageUrl } },
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
        <div className="ml-auto">
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Model
          </Button>
        </div>
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

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model Name</TableHead>
              <TableHead>Release Year</TableHead>
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
                  <TableCell className="font-medium">
                    <Link href={`/models/${model.id}`} className="hover:underline flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                         <Layers className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {model.name}
                    </Link>
                  </TableCell>
                  <TableCell>{model.releaseYear || "Unknown"}</TableCell>
                  <TableCell>{model.comboCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => setEditingModel(model)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(model.id)}>
                        <Trash2 className="h-4 w-4" />
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
                <Input id="name" name="name" required autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="releaseYear">Release Year</Label>
                <Input id="releaseYear" name="releaseYear" type="number" min="1990" max="2100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <Input id="imageUrl" name="imageUrl" type="url" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createModel.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingModel} onOpenChange={(open) => !open && setEditingModel(null)}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Model</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Model Name</Label>
                <Input id="edit-name" name="name" defaultValue={editingModel?.name} required autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-releaseYear">Release Year</Label>
                <Input id="edit-releaseYear" name="releaseYear" type="number" min="1990" max="2100" defaultValue={editingModel?.releaseYear || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-imageUrl">Image URL (Optional)</Label>
                <Input id="edit-imageUrl" name="imageUrl" type="url" defaultValue={editingModel?.imageUrl || ""} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingModel(null)}>Cancel</Button>
              <Button type="submit" disabled={updateModel.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
