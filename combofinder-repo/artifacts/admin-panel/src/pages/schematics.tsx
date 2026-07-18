import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Edit2, Trash2, FolderOpen, Download, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = "/api/schematics";

interface Schematic {
  id: number;
  title: string;
  deviceBrand?: string;
  deviceModel?: string;
  schematicType: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize?: string;
  tags?: string;
  createdAt: string;
}

export default function Schematics() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSchem, setEditingSchem] = useState<Schematic | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: schematics = [], isLoading } = useQuery<Schematic[]>({
    queryKey: ["schematics", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      const r = await fetch(`${API}?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const createM = useMutation({
    mutationFn: async (data: Partial<Schematic>) => {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["schematics"] }); setIsCreateOpen(false); toast({ title: "Schematic added" }); },
    onError: () => toast({ title: "Failed to add schematic", variant: "destructive" }),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Schematic> }) => {
      const r = await fetch(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["schematics"] }); setEditingSchem(null); toast({ title: "Schematic updated" }); },
    onError: () => toast({ title: "Failed to update schematic", variant: "destructive" }),
  });

  const deleteM = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API}/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["schematics"] }); toast({ title: "Schematic deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const getFormData = (form: HTMLFormElement) => ({
    title: (form.elements.namedItem("title") as HTMLInputElement).value.trim(),
    deviceBrand: (form.elements.namedItem("deviceBrand") as HTMLInputElement).value.trim() || undefined,
    deviceModel: (form.elements.namedItem("deviceModel") as HTMLInputElement).value.trim() || undefined,
    schematicType: (form.elements.namedItem("schematicType") as HTMLSelectElement).value,
    fileUrl: (form.elements.namedItem("fileUrl") as HTMLInputElement).value.trim(),
    thumbnailUrl: (form.elements.namedItem("thumbnailUrl") as HTMLInputElement).value.trim() || undefined,
    fileSize: (form.elements.namedItem("fileSize") as HTMLInputElement).value.trim() || undefined,
    tags: (form.elements.namedItem("tags") as HTMLInputElement).value.trim() || undefined,
  });

  function SchematicForm({ def }: { def?: Schematic }) {
    return (
      <div className="space-y-4 py-2">
        <div className="space-y-1"><Label className="text-xs">Title *</Label><Input name="title" defaultValue={def?.title} required autoFocus placeholder="e.g. iPhone 14 Pro Max Board View" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Type *</Label>
            <select name="schematicType" defaultValue={def?.schematicType || "Motherboard"} className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="Motherboard">Motherboard</option>
              <option value="Display">Display</option>
              <option value="Battery">Battery</option>
              <option value="Charging">Charging</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-1"><Label className="text-xs">File Size</Label><Input name="fileSize" defaultValue={def?.fileSize} placeholder="e.g. 14.2 MB" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Device Brand</Label><Input name="deviceBrand" defaultValue={def?.deviceBrand} placeholder="Apple" /></div>
          <div className="space-y-1"><Label className="text-xs">Device Model</Label><Input name="deviceModel" defaultValue={def?.deviceModel} placeholder="iPhone 14 Pro Max" /></div>
        </div>
        <div className="space-y-1"><Label className="text-xs">File URL *</Label><Input name="fileUrl" defaultValue={def?.fileUrl} placeholder="https://..." required /></div>
        <div className="space-y-1"><Label className="text-xs">Thumbnail URL</Label><Input name="thumbnailUrl" defaultValue={def?.thumbnailUrl} placeholder="https://..." /></div>
        <div className="space-y-1"><Label className="text-xs">Tags</Label><Input name="tags" defaultValue={def?.tags} placeholder="comma, separated, tags" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schematics & Board Views</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage downloadable technical diagrams for devices.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-9 text-sm">
          <Plus className="h-4 w-4" /> Upload Schematic
        </Button>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search schematics..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-card" />
      </div>

      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{schematics.length}</span> files available
        </p>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">File Name</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Type</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Device</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Size</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5} className="h-11"><div className="h-4 bg-muted animate-pulse rounded w-52" /></TableCell></TableRow>
              ))
            ) : schematics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FolderOpen className="h-8 w-8 text-muted-foreground opacity-25" />
                    <span className="text-sm text-muted-foreground">No schematics found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              schematics.map(s => (
                <TableRow key={s.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0 overflow-hidden">
                        {s.thumbnailUrl ? <img src={s.thumbnailUrl} alt="" className="w-full h-full object-cover" /> : <FolderOpen className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{s.title}</p>
                        {s.tags && <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Tag className="h-2.5 w-2.5" />{s.tags}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{s.schematicType}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                    {s.deviceBrand ? `${s.deviceBrand} ${s.deviceModel || ""}` : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{s.fileSize || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <a href={s.fileUrl} target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5" /></a>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingSchem(s)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Delete schematic?")) deleteM.mutate(s.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
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
            <DialogHeader><DialogTitle>Add Schematic</DialogTitle></DialogHeader>
            <SchematicForm />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={createM.isPending}>{createM.isPending ? "Saving..." : "Add Schematic"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingSchem} onOpenChange={o => !o && setEditingSchem(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={e => { e.preventDefault(); if (editingSchem) updateM.mutate({ id: editingSchem.id, data: getFormData(e.currentTarget) }); }}>
            <DialogHeader><DialogTitle>Edit Schematic</DialogTitle></DialogHeader>
            {editingSchem && <SchematicForm def={editingSchem} key={editingSchem.id} />}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingSchem(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={updateM.isPending}>{updateM.isPending ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
