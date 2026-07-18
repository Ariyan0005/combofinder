import { useState, type FormEvent, type ChangeEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { useGetModel } from "@workspace/api-client-react";
import type { Combo } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, ArrowLeft, Search, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ComboBadge } from "@/components/combo-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CompatType = "OEM" | "Compatible" | "Refurbished";
const COMPAT_TYPES: CompatType[] = ["OEM", "Compatible", "Refurbished"];

// getGetModelQueryKey is needed to invalidate — import directly
import { getGetModelQueryKey } from "@workspace/api-client-react";

export default function ModelDetail() {
  const params = useParams();
  const modelId = Number(params.id);
  const [search, setSearch] = useState("");

  const { data: model, isLoading } = useGetModel(modelId, { query: { enabled: !!modelId } });
  const compatibilities = model?.combos || [];
  const filtered = compatibilities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.comboType.toLowerCase().includes(search.toLowerCase())
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingCompat, setEditingCompat] = useState<Combo | null>(null);
  const [createType, setCreateType] = useState<CompatType>("Compatible");
  const [editType, setEditType] = useState<CompatType>("Compatible");
  const [bulkNames, setBulkNames] = useState("");
  const [bulkType, setBulkType] = useState<CompatType>("Compatible");
  const [saving, setSaving] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  async function apiCall(url: string, method: string, body?: object) {
    return fetch(url, {
      method, credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async function apiError(res: Response): Promise<string> {
    try { const j = await res.json(); return j?.error ?? j?.message ?? `HTTP ${res.status}`; }
    catch { return `HTTP ${res.status}`; }
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getGetModelQueryKey(modelId) });
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    const res = await apiCall("/api/compatibilities", "POST", { modelId, name: fd.get("name"), comboType: createType });
    setSaving(false);
    if (res.ok) { invalidate(); setIsCreateOpen(false); toast({ title: "Added" }); }
    else { toast({ title: "Failed", description: await apiError(res), variant: "destructive" }); }
  }

  function parseCsvNames(text: string): string[] {
    // Accepts a plain list or CSV with a header row; takes the first column as the name.
    return text
      .split(/\r?\n/)
      .map(line => line.split(",")[0]?.trim())
      .filter((n): n is string => !!n && n.toLowerCase() !== "name");
  }

  async function submitBulkNames(names: string[]) {
    if (!names.length) return;
    setSaving(true);
    const res = await apiCall("/api/compatibilities/bulk", "POST", { modelId, comboType: bulkType, names });
    setSaving(false);
    if (res.ok) {
      const created = await res.json();
      invalidate(); setIsBulkOpen(false); setBulkNames("");
      toast({ title: `${created.length}/${names.length} entries added` });
    } else {
      toast({ title: "Bulk add failed", description: await apiError(res), variant: "destructive" });
    }
  }

  async function handleBulkAdd() {
    const names = bulkNames.split("\n").map(n => n.trim()).filter(Boolean);
    await submitBulkNames(names);
  }

  async function handleCsvUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    const names = parseCsvNames(text);
    if (!names.length) { toast({ title: "No names found in file", variant: "destructive" }); return; }
    await submitBulkNames(names);
  }

  async function handleUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingCompat) return;
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    const res = await apiCall(`/api/compatibilities/${editingCompat.id}`, "PUT", {
      modelId, name: fd.get("name"), comboType: editType,
    });
    setSaving(false);
    if (res.ok) { invalidate(); setEditingCompat(null); toast({ title: "Updated" }); }
    else { toast({ title: "Update failed", description: await apiError(res), variant: "destructive" }); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this entry?")) return;
    const res = await apiCall(`/api/compatibilities/${id}`, "DELETE");
    if (res.ok) { invalidate(); toast({ title: "Deleted" }); }
    else { toast({ title: "Delete failed", description: await apiError(res), variant: "destructive" }); }
  }

  if (isLoading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href={`/brands/${model?.brandId}/models`}>
          <Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </Link>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">{model?.brandName}</p>
          <h1 className="text-2xl font-bold">{model?.name}</h1>
          <p className="text-sm text-muted-foreground">{compatibilities.length} compatibility entries</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsBulkOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Bulk Add
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Entry
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-8 h-9" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Name</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Type</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Grade</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Notes</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-32 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Database className="h-8 w-8 text-muted-foreground opacity-30" />
                  <span className="text-sm text-muted-foreground">No entries yet</span>
                </div>
              </TableCell></TableRow>
            ) : filtered.map(c => (
              <TableRow key={c.id} className="group hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium text-sm">{c.name}</TableCell>
                <TableCell><ComboBadge type={c.comboType} /></TableCell>
                <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{c.qualityGrade || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground hidden md:table-cell max-w-xs truncate">{c.notes || "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => { setEditingCompat(c); setEditType(c.comboType as CompatType); }}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={o => { if (!o) { setIsCreateOpen(false); setCreateType("Compatible"); } }}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleCreate}>
            <DialogHeader><DialogTitle>Add Entry</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input name="name" required placeholder="e.g. A18, OEM Original" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={createType} onValueChange={v => setCreateType(v as CompatType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{COMPAT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={isBulkOpen} onOpenChange={o => { if (!o) { setIsBulkOpen(false); setBulkNames(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Bulk Add</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={bulkType} onValueChange={v => setBulkType(v as CompatType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COMPAT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Names <span className="text-muted-foreground">(one per line)</span></Label>
              <Textarea rows={7} placeholder={"A18\nA17k\nA38"} value={bulkNames} onChange={e => setBulkNames(e.target.value)} />
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
            </div>
            <div className="space-y-1.5">
              <Label>Upload CSV / Excel (.csv)</Label>
              <Input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} disabled={saving} />
              <p className="text-xs text-muted-foreground">One name per row, optional header row, first column used.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleBulkAdd} disabled={saving}>{saving ? "Adding…" : "Add All"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCompat} onOpenChange={o => { if (!o) setEditingCompat(null); }}>
        <DialogContent className="max-w-sm">
          <form onSubmit={handleUpdate}>
            <DialogHeader><DialogTitle>Edit Entry</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input name="name" required defaultValue={editingCompat?.name ?? ""} key={editingCompat?.id} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={editType} onValueChange={v => setEditType(v as CompatType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{COMPAT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingCompat(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
