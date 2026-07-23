import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeft, Edit2, Trash2, Cpu, Search } from "lucide-react";

interface IspModel {
  id: number;
  brandId: number;
  brandName: string;
  name: string;
  imageUrl?: string | null;
  releaseYear?: number | null;
  createdAt: string;
}

interface BrandInfo {
  id: number;
  name: string;
}

export default function IspModels() {
  const { id } = useParams<{ id: string }>();
  const brandId = Number(id);
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<IspModel | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const { data: brand } = useQuery<BrandInfo>({
    queryKey: ["isp-brand", brandId],
    queryFn: () => fetch(`/api/brands/${brandId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!brandId,
  });

  const { data: models = [], isLoading } = useQuery<IspModel[]>({
    queryKey: ["isp-models", brandId],
    queryFn: () =>
      fetch(`/api/brands/${brandId}/models`, { credentials: "include" }).then(r => r.json()),
    enabled: !!brandId,
  });

  const filtered = models.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: ["isp-models", brandId] });

  const createMut = useMutation({
    mutationFn: (data: any) =>
      fetch("/api/models", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => { invalidate(); setIsCreateOpen(false); toast({ title: "Model added" }); },
    onError: () => toast({ title: "Failed to add model", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      fetch(`/api/models/${id}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => { invalidate(); setEditing(null); toast({ title: "Model updated" }); },
    onError: () => toast({ title: "Failed to update model", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/models/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => { invalidate(); toast({ title: "Model deleted" }); },
    onError: () => toast({ title: "Failed to delete model", variant: "destructive" }),
  });

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMut.mutate({
      brandId,
      name: fd.get("name"),
      imageUrl: (fd.get("imageUrl") as string) || null,
    });
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const fd = new FormData(e.currentTarget);
    updateMut.mutate({
      id: editing.id,
      data: {
        name: fd.get("name"),
        imageUrl: (fd.get("imageUrl") as string) || null,
      },
    });
  }

  async function handleBulkAdd() {
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    let ok = 0;
    for (const line of lines) {
      try {
        await fetch("/api/models", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandId, name: line }),
        });
        ok++;
      } catch {}
    }
    invalidate();
    setBulkOpen(false);
    setBulkText("");
    toast({ title: `${ok} of ${lines.length} models added` });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/isp-brands">
          <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{brand?.name ?? "Brand"} — Models</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Device models for ISP pinout diagrams</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>Bulk Add</Button>
          <Button size="sm" className="gap-1.5" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add Model
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search models…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9 bg-card"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
        <span className="font-semibold text-foreground">{models.length}</span> models
      </p>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Model Name</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Added</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3} className="h-12">
                    <div className="h-4 bg-muted animate-pulse rounded w-40" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Cpu className="h-8 w-8 text-muted-foreground opacity-30" />
                    <span className="text-sm text-muted-foreground">No models yet</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(m => (
                <TableRow key={m.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {m.imageUrl ? (
                          <img src={m.imageUrl} alt={m.name} className="w-5 h-5 object-contain rounded" />
                        ) : (
                          <Cpu className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <span>{m.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(m)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { if (confirm("Delete this model?")) deleteMut.mutate(m.id); }}
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
      <Dialog open={isCreateOpen} onOpenChange={o => !o && setIsCreateOpen(false)}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleCreate}>
            <DialogHeader><DialogTitle>Add Model</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>Model Name *</Label>
                <Input name="name" required autoFocus placeholder="e.g. Galaxy A05s" />
              </div>
              <div className="space-y-1.5">
                <Label>Image URL <span className="text-muted-foreground">(optional)</span></Label>
                <Input name="imageUrl" type="url" placeholder="https://..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={createMut.isPending}>
                {createMut.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleUpdate}>
            <DialogHeader><DialogTitle>Edit Model</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>Model Name *</Label>
                <Input name="name" required defaultValue={editing?.name} autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Image URL <span className="text-muted-foreground">(optional)</span></Label>
                <Input name="imageUrl" type="url" defaultValue={editing?.imageUrl ?? ""} placeholder="https://..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={updateMut.isPending}>
                {updateMut.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkOpen} onOpenChange={o => !o && setBulkOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Bulk Add Models</DialogTitle></DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">One model name per line.</p>
            <Textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={"Galaxy A05s\nGalaxy S24 Ultra\niPhone 14 Pro"}
              rows={8}
              className="text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleBulkAdd} disabled={!bulkText.trim() || createMut.isPending}>
              Add Models
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
