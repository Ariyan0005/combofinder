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
import { Plus, ArrowLeft, Edit2, Trash2, Cpu, Search, ChevronRight } from "lucide-react";

interface IcModel {
  id: number; brandId: number; brandName: string;
  icNumber: string; description?: string; package?: string; notes?: string;
  createdAt: string;
}

export default function IcModels() {
  const { id } = useParams<{ id: string }>();
  const brandId = Number(id);
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<IcModel | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const { data: brands = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["ic-brands-list"],
    queryFn: () => fetch("/api/brands", { credentials: "include" }).then(r => r.json()),
  });
  const brand = brands.find(b => b.id === brandId);

  const { data: models = [], isLoading } = useQuery<IcModel[]>({
    queryKey: ["ic-models", brandId],
    queryFn: () => fetch(`/api/ic-models?brandId=${brandId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!brandId,
  });

  const filtered = models.filter(m =>
    m.icNumber.toLowerCase().includes(search.toLowerCase()) ||
    (m.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: ["ic-models", brandId] });

  const createMut = useMutation({
    mutationFn: (data: any) =>
      fetch("/api/ic-models", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { invalidate(); setIsCreateOpen(false); toast({ title: "IC model added" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      fetch(`/api/ic-models/${id}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { invalidate(); setEditing(null); toast({ title: "IC model updated" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/ic-models/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => { invalidate(); toast({ title: "Deleted" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMut.mutate({
      brandId,
      icNumber: fd.get("icNumber"),
      description: fd.get("description"),
      package: fd.get("package"),
      notes: fd.get("notes"),
    });
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const fd = new FormData(e.currentTarget);
    updateMut.mutate({
      id: editing.id,
      data: {
        icNumber: fd.get("icNumber"),
        description: fd.get("description"),
        package: fd.get("package"),
        notes: fd.get("notes"),
      },
    });
  }

  async function handleBulkAdd() {
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    let ok = 0;
    for (const line of lines) {
      const [icNumber, description, pkg] = line.split("|").map(s => s.trim());
      try {
        await fetch("/api/ic-models", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandId, icNumber, description: description || null, package: pkg || null }),
        });
        ok++;
      } catch {}
    }
    invalidate();
    setBulkOpen(false);
    setBulkText("");
    toast({ title: `${ok} of ${lines.length} IC models added` });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/ic-brands">
          <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{brand?.name ?? "IC"} — Models</h1>
          <p className="text-sm text-muted-foreground mt-0.5">IC chip numbers &amp; part IDs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>Bulk Add</Button>
          <Button size="sm" className="gap-1.5" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add IC
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search IC numbers…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-card" />
      </div>

      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
        <span className="font-semibold text-foreground">{models.length}</span> IC models
      </p>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">IC Number</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Description</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Package</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4} className="h-12">
                    <div className="h-4 bg-muted animate-pulse rounded w-40" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Cpu className="h-8 w-8 text-muted-foreground opacity-30" />
                    <span className="text-sm text-muted-foreground">No IC models found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(m => (
                <TableRow key={m.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    <Link href={`/ic-models/${m.id}/compat`}>
                      <div className="flex items-center gap-2 cursor-pointer group/link">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Cpu className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="group-hover/link:text-primary transition-colors font-mono text-sm">{m.icNumber}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell truncate max-w-[200px]">{m.description || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{m.package || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(m)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { if (confirm("Delete this IC model and all its device compatibility?")) deleteMut.mutate(m.id); }}>
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
            <DialogHeader><DialogTitle>Add IC Model</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>IC Number *</Label>
                <Input name="icNumber" required autoFocus placeholder="e.g. PM8150" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input name="description" placeholder="e.g. Power Management IC" />
              </div>
              <div className="space-y-1.5">
                <Label>Package</Label>
                <Input name="package" placeholder="e.g. BGA, QFN" />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input name="notes" placeholder="Optional" />
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
            <DialogHeader><DialogTitle>Edit IC Model</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>IC Number *</Label>
                <Input name="icNumber" required defaultValue={editing?.icNumber} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input name="description" defaultValue={editing?.description ?? ""} placeholder="e.g. Power Management IC" />
              </div>
              <div className="space-y-1.5">
                <Label>Package</Label>
                <Input name="package" defaultValue={editing?.package ?? ""} placeholder="e.g. BGA, QFN" />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input name="notes" defaultValue={editing?.notes ?? ""} placeholder="Optional" />
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
          <DialogHeader><DialogTitle>Bulk Add IC Models</DialogTitle></DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              One per line. Format: <code className="text-xs bg-muted px-1 py-0.5 rounded">ICNumber | Description | Package</code>
            </p>
            <p className="text-xs text-muted-foreground">e.g. <code>PM8150 | Power Management IC | BGA</code></p>
            <Textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={"PM8150 | Power Management IC | BGA\nSM8350 | Snapdragon 888 | BGA\n338S00309"}
              rows={8}
              className="font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleBulkAdd} disabled={!bulkText.trim()}>Add IC Models</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
