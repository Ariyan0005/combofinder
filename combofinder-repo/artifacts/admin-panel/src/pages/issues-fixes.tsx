import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Edit2, Trash2, Wrench, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = "/api/issues-fixes";

interface IssueFix {
  id: number;
  title: string;
  deviceBrand?: string;
  deviceModel?: string;
  problemType: string;
  symptom: string;
  solution: string;
  difficulty: string;
  tags?: string;
  views: number;
  createdAt: string;
}

export default function IssuesFixes() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<IssueFix | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: issues = [], isLoading } = useQuery<IssueFix[]>({
    queryKey: ["issues", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      const r = await fetch(`${API}?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const createM = useMutation({
    mutationFn: async (data: Partial<IssueFix>) => {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["issues"] }); setIsCreateOpen(false); toast({ title: "Issue logged" }); },
    onError: () => toast({ title: "Failed to log issue", variant: "destructive" }),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<IssueFix> }) => {
      const r = await fetch(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["issues"] }); setEditingIssue(null); toast({ title: "Issue updated" }); },
    onError: () => toast({ title: "Failed to update issue", variant: "destructive" }),
  });

  const deleteM = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API}/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["issues"] }); toast({ title: "Issue deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const getFormData = (form: HTMLFormElement) => ({
    title: (form.elements.namedItem("title") as HTMLInputElement).value.trim(),
    deviceBrand: (form.elements.namedItem("deviceBrand") as HTMLInputElement).value.trim() || undefined,
    deviceModel: (form.elements.namedItem("deviceModel") as HTMLInputElement).value.trim() || undefined,
    problemType: (form.elements.namedItem("problemType") as HTMLSelectElement).value,
    difficulty: (form.elements.namedItem("difficulty") as HTMLSelectElement).value,
    symptom: (form.elements.namedItem("symptom") as HTMLTextAreaElement).value.trim(),
    solution: (form.elements.namedItem("solution") as HTMLTextAreaElement).value.trim(),
    tags: (form.elements.namedItem("tags") as HTMLInputElement).value.trim() || undefined,
  });

  function IssueForm({ def }: { def?: IssueFix }) {
    return (
      <div className="space-y-4 py-2">
        <div className="space-y-1"><Label className="text-xs">Title *</Label><Input name="title" defaultValue={def?.title} required autoFocus placeholder="e.g. Blank Screen after drop" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Device Brand</Label><Input name="deviceBrand" defaultValue={def?.deviceBrand} placeholder="Apple" /></div>
          <div className="space-y-1"><Label className="text-xs">Device Model</Label><Input name="deviceModel" defaultValue={def?.deviceModel} placeholder="iPhone 13 Pro" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Problem Type *</Label>
            <select name="problemType" defaultValue={def?.problemType || "Display"} className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="Display">Display</option>
              <option value="Battery">Battery</option>
              <option value="Charging">Charging</option>
              <option value="Software">Software</option>
              <option value="Hardware">Hardware</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Difficulty *</Label>
            <select name="difficulty" defaultValue={def?.difficulty || "Medium"} className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
        </div>
        <div className="space-y-1"><Label className="text-xs">Symptoms *</Label><Textarea name="symptom" defaultValue={def?.symptom} required rows={2} /></div>
        <div className="space-y-1"><Label className="text-xs">Solution *</Label><Textarea name="solution" defaultValue={def?.solution} required rows={3} /></div>
        <div className="space-y-1"><Label className="text-xs">Tags</Label><Input name="tags" defaultValue={def?.tags} placeholder="comma, separated, tags" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Issues & Fixes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Knowledge base for common hardware and software issues.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-9 text-sm">
          <Plus className="h-4 w-4" /> Add Solution
        </Button>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search knowledge base..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-card" />
      </div>

      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{issues.length}</span> documented issues
        </p>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Issue</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Type & Diff.</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Device</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden lg:table-cell">Metrics</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5} className="h-11"><div className="h-4 bg-muted animate-pulse rounded w-52" /></TableCell></TableRow>
              ))
            ) : issues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Wrench className="h-8 w-8 text-muted-foreground opacity-25" />
                    <span className="text-sm text-muted-foreground">No issues logged yet</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              issues.map(i => (
                <TableRow key={i.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="font-medium text-sm text-primary group-hover:underline cursor-pointer" onClick={() => setEditingIssue(i)}>{i.title}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{i.symptom}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs hidden sm:table-cell">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="px-2 py-0.5 rounded bg-secondary text-[10px] uppercase font-semibold tracking-wider text-secondary-foreground">{i.problemType}</span>
                      <span className="px-2 py-0.5 rounded border border-border text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">{i.difficulty}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                    {i.deviceBrand ? `${i.deviceBrand} ${i.deviceModel || ""}` : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {i.views}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingIssue(i)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Delete issue?")) deleteM.mutate(i.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl">
          <form onSubmit={e => { e.preventDefault(); createM.mutate(getFormData(e.currentTarget)); }}>
            <DialogHeader><DialogTitle>Add Issue Solution</DialogTitle></DialogHeader>
            <IssueForm />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={createM.isPending}>{createM.isPending ? "Saving..." : "Save Solution"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingIssue} onOpenChange={o => !o && setEditingIssue(null)}>
        <DialogContent className="max-w-xl">
          <form onSubmit={e => { e.preventDefault(); if (editingIssue) updateM.mutate({ id: editingIssue.id, data: getFormData(e.currentTarget) }); }}>
            <DialogHeader><DialogTitle>Edit Issue Solution</DialogTitle></DialogHeader>
            {editingIssue && <IssueForm def={editingIssue} key={editingIssue.id} />}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingIssue(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={updateM.isPending}>{updateM.isPending ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
