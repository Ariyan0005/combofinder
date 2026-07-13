import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Smartphone, Search, Layers, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Category {
  id: number;
  name: string;
  slug: string;
}

const ALL = "all";

export default function Brands() {
  const [search, setSearch] = useState("");
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>(ALL);
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch(`/api/categories`, { credentials: "include" }).then(r => r.json()),
  });
  const { data: brands = [], isLoading } = useGetBrands();
  const activeCategory = categories.find(c => c.slug === activeCategorySlug);
  const filteredBrands = brands
    .filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    .filter(b => activeCategorySlug === ALL || b.categoryId === activeCategory?.id);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const logoUrl = formData.get("logoUrl") as string;
    const categoryIdRaw = formData.get("categoryId") as string;
    createBrand.mutate(
      { data: { name, logoUrl, categoryId: categoryIdRaw ? Number(categoryIdRaw) : undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBrandsQueryKey() });
          setIsCreateOpen(false);
          toast({ title: "Brand created" });
        },
        onError: () => toast({ title: "Failed to create brand", variant: "destructive" })
      }
    );
  };

  const handleUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBrand) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const logoUrl = formData.get("logoUrl") as string;
    const categoryIdRaw = formData.get("categoryId") as string;
    updateBrand.mutate(
      { id: editingBrand.id, data: { name, logoUrl, categoryId: categoryIdRaw ? Number(categoryIdRaw) : undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBrandsQueryKey() });
          setEditingBrand(null);
          toast({ title: "Brand updated" });
        },
        onError: () => toast({ title: "Failed to update brand", variant: "destructive" })
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this brand and all its models?")) return;
    deleteBrand.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBrandsQueryKey() });
          toast({ title: "Brand deleted" });
        },
        onError: () => toast({ title: "Failed to delete brand", variant: "destructive" })
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compatibility Database</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage brands, models, and part compatibility by category.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-9 px-4 text-sm">
          <Plus className="h-4 w-4" /> Add Brand
        </Button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={activeCategorySlug === ALL ? "default" : "outline"}
          onClick={() => setActiveCategorySlug(ALL)}
          className="h-8 text-xs"
        >
          All
        </Button>
        {categories.map((c) => (
          <Button
            key={c.id}
            size="sm"
            variant={activeCategorySlug === c.slug ? "default" : "outline"}
            onClick={() => setActiveCategorySlug(c.slug)}
            className="h-8 text-xs"
          >
            {c.name}
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search brands..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 bg-card"
        />
      </div>

      {/* Summary badge */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredBrands.length}</span> of{" "}
          <span className="font-semibold text-foreground">{brands.length}</span> brands
        </p>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Brand</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Category</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Models</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Added</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="h-12">
                    <div className="h-4 bg-muted animate-pulse rounded w-40" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Layers className="h-8 w-8 text-muted-foreground opacity-30" />
                    <span className="text-sm text-muted-foreground">No brands found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredBrands.map((brand) => (
                <TableRow key={brand.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    <Link href={`/brands/${brand.id}/models`}>
                      <div className="flex items-center gap-3 cursor-pointer group/link">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {brand.logoUrl ? (
                            <img src={brand.logoUrl} alt={brand.name} className="w-5 h-5 object-contain" />
                          ) : (
                            <Smartphone className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <span className="group-hover/link:text-primary transition-colors">{brand.name}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {categories.find(c => c.id === brand.categoryId)?.name ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                      {brand.modelCount} models
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                    {new Date(brand.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setEditingBrand(brand)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(brand.id)}
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
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Add New Brand</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Brand Name *</Label>
                <Input id="name" name="name" required autoFocus placeholder="e.g. Samsung" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="categoryId">Category *</Label>
                <Select name="categoryId" defaultValue={activeCategorySlug !== ALL ? String(activeCategory?.id) : undefined} required>
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Select part type" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="logoUrl">Logo URL <span className="text-muted-foreground">(optional)</span></Label>
                <Input id="logoUrl" name="logoUrl" type="url" placeholder="https://..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={createBrand.isPending}>
                {createBrand.isPending ? "Saving..." : "Save Brand"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingBrand} onOpenChange={(open) => !open && setEditingBrand(null)}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Brand</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Brand Name *</Label>
                <Input id="edit-name" name="name" defaultValue={editingBrand?.name} required autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-categoryId">Category *</Label>
                <Select name="categoryId" defaultValue={editingBrand?.categoryId ? String(editingBrand.categoryId) : undefined} required>
                  <SelectTrigger id="edit-categoryId">
                    <SelectValue placeholder="Select part type" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-logoUrl">Logo URL <span className="text-muted-foreground">(optional)</span></Label>
                <Input id="edit-logoUrl" name="logoUrl" type="url" defaultValue={editingBrand?.logoUrl || ""} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingBrand(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={updateBrand.isPending}>
                {updateBrand.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
