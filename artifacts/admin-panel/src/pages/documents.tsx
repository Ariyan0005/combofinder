import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, FileText, Edit2, Trash2, Download, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = "/api/documents";

interface Document {
  id: number;
  title: string;
  category: string;
  deviceBrand?: string;
  deviceModel?: string;
  fileUrl: string;
  fileSize?: string;
  description?: string;
  tags?: string;
  createdAt: string;
}

export default function Documents() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["documents", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      const r = await fetch(`${API}?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const createM = useMutation({
    mutationFn: async (data: Partial<Document>) => {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); setIsCreateOpen(false); toast({ title: "Document added" }); },
    onError: () => toast({ title: "Failed to add document", variant: "destructive" }),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Document> }) => {
      const r = await fetch(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); setEditingDoc(null); toast({ title: "Document updated" }); },
    onError: () => toast({ title: "Failed to update document", variant: "destructive" }),
  });

  const deleteM = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API}/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); toast({ title: "Document deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const getFormData = (form: HTMLFormElement) => ({
    title: (form.elements.namedItem("title") as HTMLInputElement).value.trim(),
    category: (form.elements.namedItem("category") as HTMLSelectElement).value,
    deviceBrand: (form.elements.namedItem("deviceBrand") as HTMLInputElement).value.trim() || undefined,
    deviceModel: (form.elements.namedItem("deviceModel") as HTMLInputElement).value.trim() || undefined,
    fileUrl: (form.elements.namedItem("fileUrl") as HTMLInputElement).value.trim(),
    fileSize: (form.elements.namedItem("fileSize") as HTMLInputElement).value.trim() || undefined,
    description: (form.elements.namedItem("description") as HTMLTextAreaElement).value.trim() || undefined,
    tags: (form.elements.namedItem("tags") as HTMLInputElement).value.trim() || undefined,
  });

  function DocumentForm({ def }: { def?: Document }) {
    return (
      <div className="space-y-4 py-2">
        <div className="space-y-1"><Label className="text-xs">Title *</Label><Input name="title" defaultValue={def?.title} required autoFocus /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Category *</Label>
            <select name="category" defaultValue={def?.category || "General"} className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="General">General</option>
              <option value="Repair Guide">Repair Guide</option>
              <option value="Manual">Manual</option>
              <option value="Technical">Technical</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-1"><Label className="text-xs">File Size</Label><Input name="fileSize" defaultValue={def?.fileSize} placeholder="e.g. 2.4 MB" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Device Brand</Label><Input name="deviceBrand" defaultValue={def?.deviceBrand} placeholder="Apple" /></div>
          <div className="space-y-1"><Label className="text-xs">Device Model</Label><Input name="deviceModel" defaultValue={def?.deviceModel} placeholder="iPhone 13 Pro" /></div>
        </div>
        <div className="space-y-1"><Label className="text-xs">File URL *</Label><Input name="fileUrl" defaultValue={def?.fileUrl} placeholder="https://..." required /></div>
        <div className="space-y-1"><Label className="text-xs">Tags</Label><Input name="tags" defaultValue={def?.tags} placeholder="comma, separated, tags" /></div>
        <div className="space-y-1"><Label className="text-xs">Description</Label><Textarea name="description" defaultValue={def?.description} rows={2} /></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Important manuals, guidelines, and policies.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-9 text-sm">
          <Plus className="h-4 w-4" /> Upload Document
        </Button>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-card" />
      </div>

      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{documents.length}</span> documents
        </p>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Document</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Category</TableHead>
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
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-muted-foreground opacity-25" />
                    <span className="text-sm text-muted-foreground">No documents found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documents.map(d => (
                <TableRow key={d.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{d.title}</p>
                        {d.tags && <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Tag className="h-2.5 w-2.5" />{d.tags}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{d.category}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                    {d.deviceBrand ? `${d.deviceBrand} ${d.deviceModel || ""}` : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{d.fileSize || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <a href={d.fileUrl} target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5" /></a>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingDoc(d)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Delete document?")) deleteM.mutate(d.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
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
            <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
            <DocumentForm />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={createM.isPending}>{createM.isPending ? "Saving..." : "Add Document"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingDoc} onOpenChange={o => !o && setEditingDoc(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={e => { e.preventDefault(); if (editingDoc) updateM.mutate({ id: editingDoc.id, data: getFormData(e.currentTarget) }); }}>
            <DialogHeader><DialogTitle>Edit Document</DialogTitle></DialogHeader>
            {editingDoc && <DocumentForm def={editingDoc} key={editingDoc.id} />}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingDoc(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={updateM.isPending}>{updateM.isPending ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
