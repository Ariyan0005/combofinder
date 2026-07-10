import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Search, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiModelPicker } from "@/components/brand-model-picker";

const PART_TYPES = [
  "Battery",
  "Display Compatible",
  "Display OEM",
  "Charging Sub Board",
  "IC Compatible",
  "Cover Glass",
  "Back Cover",
  "Frame / Housing",
  "Flex Cable",
  "Speaker",
  "Mic / Receiver",
  "Camera",
  "Other",
];

interface Part {
  id: number;
  partName: string;
  partType: string;
  compatibleModels: string;
  description: string | null;
  createdAt: string;
}

const API_BASE = "/api";

async function fetchParts(): Promise<Part[]> {
  const r = await fetch(`${API_BASE}/parts`);
  if (!r.ok) throw new Error("Failed to fetch parts");
  return r.json();
}
async function createPart(d: Omit<Part, "id" | "createdAt">): Promise<Part> {
  const r = await fetch(`${API_BASE}/parts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d), credentials: "include" });
  if (!r.ok) throw new Error("Failed to create part");
  return r.json();
}
async function updatePart(id: number, d: Partial<Omit<Part, "id" | "createdAt">>): Promise<Part> {
  const r = await fetch(`${API_BASE}/parts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d), credentials: "include" });
  if (!r.ok) throw new Error("Failed to update part");
  return r.json();
}
async function deletePart(id: number): Promise<void> {
  const r = await fetch(`${API_BASE}/parts/${id}`, { method: "DELETE", credentials: "include" });
  if (!r.ok) throw new Error("Failed to delete part");
}

const TYPE_COLORS: Record<string, string> = {
  "Battery": "bg-emerald-500/10 text-emerald-400",
  "Display Compatible": "bg-blue-500/10 text-blue-400",
  "Display OEM": "bg-sky-500/10 text-sky-400",
  "Charging Sub Board": "bg-violet-500/10 text-violet-400",
  "IC Compatible": "bg-purple-500/10 text-purple-400",
  "Cover Glass": "bg-cyan-500/10 text-cyan-400",
  "Back Cover": "bg-teal-500/10 text-teal-400",
  "Frame / Housing": "bg-orange-500/10 text-orange-400",
  "Flex Cable": "bg-yellow-500/10 text-yellow-600",
  "Speaker": "bg-pink-500/10 text-pink-400",
  "Mic / Receiver": "bg-rose-500/10 text-rose-400",
  "Camera": "bg-indigo-500/10 text-indigo-400",
  "Other": "bg-slate-500/10 text-slate-400",
};

function PartForm({
  def, pt, onPt, models, onModels,
}: {
  def?: Part; pt: string; onPt: (v: string) => void;
  models: string[]; onModels: (v: string[]) => void;
}) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-1.5">
        <Label>Part Type *</Label>
        <Select value={pt} onValueChange={onPt}>
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            {PART_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Part Name *</Label>
        <Input name="partName" required defaultValue={def?.partName} placeholder="e.g. BLP727, Samsung A15 OEM Display" autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label>Compatible Models *</Label>
        <MultiModelPicker selected={models} onChange={onModels} />
        <p className="text-xs text-muted-foreground">Select from Brands &amp; Models — ensures exact match in search.</p>
      </div>
      <div className="space-y-1.5">
        <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
        <Textarea name="description" defaultValue={def?.description || ""} placeholder="Capacity, specs, colour, grade..." rows={3} />
      </div>
    </div>
  );
}

export default function Parts() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [createPartType, setCreatePartType] = useState("");
  const [editPartType, setEditPartType] = useState("");
  const [createModels, setCreateModels] = useState<string[]>([]);
  const [editModels, setEditModels] = useState<string[]>([]);

  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: parts = [], isLoading } = useQuery({ queryKey: ["parts"], queryFn: fetchParts });

  const filtered = parts.filter(p =>
    (!search || p.partName.toLowerCase().includes(search.toLowerCase()) || p.compatibleModels.toLowerCase().includes(search.toLowerCase())) &&
    (typeFilter === "all" || p.partType === typeFilter)
  );

  const cm = useMutation({
    mutationFn: createPart,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parts"] }); setIsCreateOpen(false); setCreatePartType(""); setCreateModels([]); toast({ title: "Part created" }); },
    onError: () => toast({ title: "Failed to create part", variant: "destructive" }),
  });
  const um = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updatePart>[1] }) => updatePart(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parts"] }); setEditingPart(null); setEditModels([]); toast({ title: "Part updated" }); },
    onError: () => toast({ title: "Failed to update part", variant: "destructive" }),
  });
  const dm = useMutation({
    mutationFn: deletePart,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parts"] }); toast({ title: "Part deleted" }); },
    onError: () => toast({ title: "Failed to delete part", variant: "destructive" }),
  });

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    cm.mutate({ partName: (fd.get("partName") as string).trim(), partType: createPartType, compatibleModels: createModels.join(", "), description: (fd.get("description") as string).trim() || null });
  };
  const handleUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPart) return;
    const fd = new FormData(e.currentTarget);
    um.mutate({ id: editingPart.id, data: { partName: (fd.get("partName") as string).trim(), partType: editPartType, compatibleModels: editModels.join(", "), description: (fd.get("description") as string).trim() || null } });
  };

  // group by type for stats strip
  const typeCounts = PART_TYPES.reduce<Record<string, number>>((acc, t) => {
    acc[t] = parts.filter(p => p.partType === t).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Spare Parts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Battery, Display, IC Compatible, Sub Board & more.</p>
        </div>
        <Button onClick={() => { setCreatePartType(""); setCreateModels([]); setIsCreateOpen(true); }} className="gap-2 h-9 text-sm">
          <Plus className="h-4 w-4" /> Add Part
        </Button>
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTypeFilter("all")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${typeFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
        >
          All ({parts.length})
        </button>
        {PART_TYPES.filter(t => typeCounts[t] > 0).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${typeFilter === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
          >
            {t} ({typeCounts[t]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by part name or model..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-card" />
      </div>

      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
          <span className="font-semibold text-foreground">{parts.length}</span> parts
        </p>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Part Name</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Type</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Compatible Models</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Added</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5} className="h-11"><div className="h-4 bg-muted animate-pulse rounded w-52" /></TableCell></TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Wrench className="h-8 w-8 text-muted-foreground opacity-30" />
                    <span className="text-sm text-muted-foreground">No parts found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(p => (
                <TableRow key={p.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-sm">{p.partName}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[p.partType] || TYPE_COLORS["Other"]}`}>
                      {p.partType}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate hidden md:table-cell" title={p.compatibleModels}>
                    {p.compatibleModels}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditPartType(p.partType); setEditModels(p.compatibleModels ? p.compatibleModels.split(",").map(s => s.trim()).filter(Boolean) : []); setEditingPart(p); }}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Delete this part?")) dm.mutate(p.id); }}>
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
        <DialogContent className="max-w-lg">
          <form onSubmit={handleCreate}>
            <DialogHeader><DialogTitle>Add New Part</DialogTitle></DialogHeader>
            <PartForm pt={createPartType} onPt={setCreatePartType} models={createModels} onModels={setCreateModels} />
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={!createPartType || createModels.length === 0 || cm.isPending}>{cm.isPending ? "Saving..." : "Save Part"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingPart} onOpenChange={o => !o && setEditingPart(null)}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleUpdate}>
            <DialogHeader><DialogTitle>Edit Part</DialogTitle></DialogHeader>
            <PartForm def={editingPart ?? undefined} pt={editPartType} onPt={setEditPartType} models={editModels} onModels={setEditModels} />
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingPart(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={!editPartType || editModels.length === 0 || um.isPending}>{um.isPending ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
