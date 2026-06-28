import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Search, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Part { id: number; icNumber: string; partName: string; partType: string; compatibleModels: string[]; description: string | null; createdAt: string; }
const API_BASE = "/api";
async function fetchParts(): Promise<Part[]> { const res = await fetch(`${API_BASE}/parts`); if (!res.ok) throw new Error("Failed"); return res.json(); }
async function createPart(data: Omit<Part, "id"|"createdAt">): Promise<Part> { const res = await fetch(`${API_BASE}/parts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); if (!res.ok) throw new Error("Failed"); return res.json(); }
async function updatePart(id: number, data: Partial<Omit<Part, "id"|"createdAt">>): Promise<Part> { const res = await fetch(`${API_BASE}/parts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); if (!res.ok) throw new Error("Failed"); return res.json(); }
async function deletePart(id: number): Promise<void> { const res = await fetch(`${API_BASE}/parts/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); }

function toPayload(form: HTMLFormElement) {
  const fd = new FormData(form);
  return {
    icNumber: (fd.get("icNumber") as string).trim(),
    partName: (fd.get("partName") as string).trim(),
    partType: (fd.get("partType") as string).trim(),
    compatibleModels: (fd.get("compatibleModels") as string).split(",").map(s => s.trim()).filter(Boolean),
    description: (fd.get("description") as string).trim() || null,
  };
}

export default function Parts() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: parts = [], isLoading } = useQuery({ queryKey: ["parts"], queryFn: fetchParts });
  const filtered = parts.filter(p => p.icNumber.toLowerCase().includes(search.toLowerCase()) || p.partName.toLowerCase().includes(search.toLowerCase()) || p.partType.toLowerCase().includes(search.toLowerCase()));
  const createMut = useMutation({ mutationFn: createPart, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["parts"] }); setIsCreateOpen(false); toast({ title: "Part created successfully" }); }, onError: () => toast({ title: "Failed to create part", variant: "destructive" }) });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: number; data: ReturnType<typeof toPayload> }) => updatePart(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["parts"] }); setEditingPart(null); toast({ title: "Part updated successfully" }); }, onError: () => toast({ title: "Failed to update part", variant: "destructive" }) });
  const deleteMut = useMutation({ mutationFn: deletePart, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["parts"] }); toast({ title: "Part deleted successfully" }); }, onError: () => toast({ title: "Failed to delete part", variant: "destructive" }) });

  const PartForm = ({ def }: { def?: Part }) => (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>IC Number *</Label><Input name="icNumber" required defaultValue={def?.icNumber} placeholder="e.g. U2301" autoFocus /></div>
        <div className="space-y-2"><Label>Part Type *</Label><Input name="partType" required defaultValue={def?.partType} placeholder="e.g. Display IC" /></div>
      </div>
      <div className="space-y-2"><Label>Part Name *</Label><Input name="partName" required defaultValue={def?.partName} placeholder="e.g. Touch Controller IC" /></div>
      <div className="space-y-2"><Label>Compatible Models *</Label><Input name="compatibleModels" required defaultValue={def?.compatibleModels?.join(", ")} placeholder="iPhone 13, iPhone 13 Pro" /><p className="text-xs text-muted-foreground">Comma separated</p></div>
      <div className="space-y-2"><Label>Description</Label><Textarea name="description" defaultValue={def?.description || ""} placeholder="Optional notes..." rows={3} /></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">IC / Parts</h1><p className="text-muted-foreground mt-1">Manage IC numbers and compatible phone parts.</p></div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Part</Button>
      </div>
      <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border border-border">
        <Search className="h-5 w-5 text-muted-foreground ml-2" />
        <Input placeholder="Search by IC number, part name, or type..." value={search} onChange={e => setSearch(e.target.value)} className="border-0 shadow-none focus-visible:ring-0" />
      </div>
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>IC Number</TableHead><TableHead>Part Name</TableHead><TableHead>Type</TableHead><TableHead>Compatible Models</TableHead><TableHead>Added</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground"><div className="flex flex-col items-center gap-2"><Cpu className="h-8 w-8 opacity-30" /><span>No parts found.</span></div></TableCell></TableRow>
            : filtered.map(p => (
              <TableRow key={p.id} className="group">
                <TableCell className="font-mono font-semibold text-primary">{p.icNumber}</TableCell>
                <TableCell className="font-medium">{p.partName}</TableCell>
                <TableCell><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{p.partType}</span></TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={p.compatibleModels.join(", ")}>{p.compatibleModels.join(", ")}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => setEditingPart(p)}><Edit2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { if(confirm("Delete this part?")) deleteMut.mutate(p.id); }}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg"><form onSubmit={e => { e.preventDefault(); createMut.mutate(toPayload(e.currentTarget)); }}><DialogHeader><DialogTitle>Add New Part / IC</DialogTitle></DialogHeader><PartForm /><DialogFooter><Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={createMut.isPending}>Save</Button></DialogFooter></form></DialogContent>
      </Dialog>
      <Dialog open={!!editingPart} onOpenChange={o => !o && setEditingPart(null)}>
        <DialogContent className="max-w-lg"><form onSubmit={e => { e.preventDefault(); if(editingPart) updateMut.mutate({ id: editingPart.id, data: toPayload(e.currentTarget) }); }}><DialogHeader><DialogTitle>Edit Part / IC</DialogTitle></DialogHeader><PartForm def={editingPart ?? undefined} /><DialogFooter><Button type="button" variant="outline" onClick={() => setEditingPart(null)}>Cancel</Button><Button type="submit" disabled={updateMut.isPending}>Save</Button></DialogFooter></form></DialogContent>
      </Dialog>
    </div>
  );
}
