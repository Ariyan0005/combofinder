import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Edit2, Trash2, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = "/api/repair-categories";

interface RepairCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  laborCostDefault?: number;
  estimatedTime?: string;
  createdAt: string;
}

export default function RepairCategories() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<RepairCategory | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery<RepairCategory[]>({
    queryKey: ["repair-categories", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      const r = await fetch(`${API}?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const createM = useMutation({
    mutationFn: async (data: Partial<RepairCategory>) => {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["repair-categories"] }); setIsCreateOpen(false); toast({ title: "Category added" }); },
    onError: () => toast({ title: "Failed to add category", variant: "destructive" }),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RepairCategory> }) => {
      const r = await fetch(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["repair-categories"] }); setEditingCat(null); toast({ title: "Category updated" }); },
    onError: () => toast({ title: "Failed to update category", variant: "destructive" }),
  });

  const deleteM = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API}/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["repair-categories"] }); toast({ title: "Category deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const getFormData = (form: HTMLFormElement) => ({
    name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
    description: (form.elements.namedItem("description") as HTMLTextAreaElement).value.trim() || undefined,
    icon: (form.elements.namedItem("icon") as HTMLInputElement).value.trim() || undefined,
    color: (form.elements.namedItem("color") as HTMLInputElement).value.trim() || undefined,
    laborCostDefault: (form.elements.namedItem("laborCostDefault") as HTMLInputElement).value ? Number((form.elements.namedItem("laborCostDefault") as HTMLInputElement).value) : undefined,
    estimatedTime: (form.elements.namedItem("estimatedTime") as HTMLInputElement).value.trim() || undefined,
  });

  function CategoryForm({ def }: { def?: RepairCategory }) {
    return (
      <div className="space-y-4 py-2">
        <div className="space-y-1"><Label className="text-xs">Category Name *</Label><Input name="name" defaultValue={def?.name} required autoFocus /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Icon Name</Label><Input name="icon" defaultValue={def?.icon} placeholder="e.g. Wrench" /></div>
          <div className="space-y-1"><Label className="text-xs">Color Hex</Label><Input name="color" defaultValue={def?.color} placeholder="#0080DB" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Default Labor Cost</Label><Input name="laborCostDefault" type="number" defaultValue={def?.laborCostDefault} placeholder="e.g. 50" /></div>
          <div className="space-y-1"><Label className="text-xs">Estimated Time</Label><Input name="estimatedTime" defaultValue={def?.estimatedTime} placeholder="e.g. 1h 30m" /></div>
        </div>
        <div className="space-y-1"><Label className="text-xs">Description</Label><Textarea name="description" defaultValue={def?.description} rows={2} /></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Repair Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage categories for repair jobs.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-9 text-sm">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-card" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Category</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Description</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Est. Time</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Labor Cost</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5} className="h-11"><div className="h-4 bg-muted animate-pulse rounded w-52" /></TableCell></TableRow>
              ))
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <ClipboardList className="h-8 w-8 text-muted-foreground opacity-25" />
                    <span className="text-sm text-muted-foreground">No categories found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              categories.map(c => (
                <TableRow key={c.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0" style={{ backgroundColor: c.color ? `${c.color}20` : undefined, color: c.color || undefined }}>
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{c.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden sm:table-cell max-w-[200px] truncate">
                    {c.description || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                    {c.estimatedTime || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                    {c.laborCostDefault !== undefined ? `$${c.laborCostDefault}` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingCat(c)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Delete category?")) deleteM.mutate(c.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={e => { e.preventDefault(); createM.mutate(getFormData(e.currentTarget)); }}>
            <DialogHeader><DialogTitle>Add Repair Category</DialogTitle></DialogHeader>
            <CategoryForm />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={createM.isPending}>{createM.isPending ? "Saving..." : "Add Category"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCat} onOpenChange={o => !o && setEditingCat(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={e => { e.preventDefault(); if (editingCat) updateM.mutate({ id: editingCat.id, data: getFormData(e.currentTarget) }); }}>
            <DialogHeader><DialogTitle>Edit Repair Category</DialogTitle></DialogHeader>
            {editingCat && <CategoryForm def={editingCat} key={editingCat.id} />}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingCat(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={updateM.isPending}>{updateM.isPending ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
