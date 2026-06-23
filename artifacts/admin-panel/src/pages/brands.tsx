import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  useGetBrands, 
  useCreateBrand, 
  useUpdateBrand, 
  useDeleteBrand,
  getGetBrandsQueryKey,
  Brand
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
import { Plus, Edit2, Trash2, Smartphone, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Brands() {
  const [search, setSearch] = useState("");
  const { data: brands = [], isLoading } = useGetBrands();
  
  const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const logoUrl = formData.get("logoUrl") as string;

    createBrand.mutate(
      { data: { name, logoUrl } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBrandsQueryKey() });
          setIsCreateOpen(false);
          toast({ title: "Brand created successfully" });
        },
        onError: () => toast({ title: "Failed to create brand", variant: "destructive" })
      }
    );
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBrand) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const logoUrl = formData.get("logoUrl") as string;

    updateBrand.mutate(
      { id: editingBrand.id, data: { name, logoUrl } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBrandsQueryKey() });
          setEditingBrand(null);
          toast({ title: "Brand updated successfully" });
        },
        onError: () => toast({ title: "Failed to update brand", variant: "destructive" })
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;
    deleteBrand.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBrandsQueryKey() });
          toast({ title: "Brand deleted successfully" });
        },
        onError: () => toast({ title: "Failed to delete brand", variant: "destructive" })
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground mt-1">Manage phone manufacturers and brands.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Brand
        </Button>
      </div>

      <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border border-border">
        <Search className="h-5 w-5 text-muted-foreground ml-2" />
        <Input 
          placeholder="Search brands..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand Name</TableHead>
              <TableHead>Models</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">Loading brands...</TableCell>
              </TableRow>
            ) : filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No brands found.
                </TableCell>
              </TableRow>
            ) : (
              filteredBrands.map((brand) => (
                <TableRow key={brand.id} className="group">
                  <TableCell className="font-medium">
                    <Link href={`/brands/${brand.id}/models`} className="hover:underline flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                        {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.name} className="w-6 h-6 object-contain" /> : <Smartphone className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      {brand.name}
                    </Link>
                  </TableCell>
                  <TableCell>{brand.modelCount}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(brand.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => setEditingBrand(brand)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(brand.id)}>
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
              <DialogTitle>Add New Brand</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Brand Name</Label>
                <Input id="name" name="name" required autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                <Input id="logoUrl" name="logoUrl" type="url" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createBrand.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingBrand} onOpenChange={(open) => !open && setEditingBrand(null)}>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Brand</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Brand Name</Label>
                <Input id="edit-name" name="name" defaultValue={editingBrand?.name} required autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-logoUrl">Logo URL (Optional)</Label>
                <Input id="edit-logoUrl" name="logoUrl" type="url" defaultValue={editingBrand?.logoUrl || ""} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingBrand(null)}>Cancel</Button>
              <Button type="submit" disabled={updateBrand.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
