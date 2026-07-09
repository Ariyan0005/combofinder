import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Edit2, Trash2, Factory, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = "/api/suppliers";

interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  country?: string;
  website?: string;
  partTypes?: string;
  notes?: string;
  isActive?: boolean;
  rating?: number;
  createdAt: string;
}

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSup, setEditingSup] = useState<Supplier | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["suppliers", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      const r = await fetch(`${API}?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const createM = useMutation({
    mutationFn: async (data: Partial<Supplier>) => {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); setIsCreateOpen(false); toast({ title: "Supplier added" }); },
    onError: () => toast({ title: "Failed to add supplier", variant: "destructive" }),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Supplier> }) => {
      const r = await fetch(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); setEditingSup(null); toast({ title: "Supplier updated" }); },
    onError: () => toast({ title: "Failed to update supplier", variant: "destructive" }),
  });

  const deleteM = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API}/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast({ title: "Supplier deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const getFormData = (form: HTMLFormElement) => ({
    name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
    contactPerson: (form.elements.namedItem("contactPerson") as HTMLInputElement).value.trim() || undefined,
    phone: (form.elements.namedItem("phone") as HTMLInputElement).value.trim() || undefined,
    email: (form.elements.namedItem("email") as HTMLInputElement).value.trim() || undefined,
    whatsapp: (form.elements.namedItem("whatsapp") as HTMLInputElement).value.trim() || undefined,
    country: (form.elements.namedItem("country") as HTMLInputElement).value.trim() || undefined,
    partTypes: (form.elements.namedItem("partTypes") as HTMLInputElement).value.trim() || undefined,
    notes: (form.elements.namedItem("notes") as HTMLTextAreaElement).value.trim() || undefined,
  });

  function SupplierForm({ def }: { def?: Supplier }) {
    return (
      <div className="space-y-4 py-2">
        <div className="space-y-1"><Label className="text-xs">Company Name *</Label><Input name="name" defaultValue={def?.name} required autoFocus /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Contact Person</Label><Input name="contactPerson" defaultValue={def?.contactPerson} /></div>
          <div className="space-y-1"><Label className="text-xs">Country</Label><Input name="country" defaultValue={def?.country} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Phone</Label><Input name="phone" defaultValue={def?.phone} /></div>
          <div className="space-y-1"><Label className="text-xs">Email</Label><Input name="email" type="email" defaultValue={def?.email} /></div>
        </div>
        <div className="space-y-1"><Label className="text-xs">WhatsApp</Label><Input name="whatsapp" defaultValue={def?.whatsapp} /></div>
        <div className="space-y-1"><Label className="text-xs">Parts Supplied</Label><Input name="partTypes" defaultValue={def?.partTypes} placeholder="e.g. Screens, Batteries" /></div>
        <div className="space-y-1"><Label className="text-xs">Notes</Label><Textarea name="notes" defaultValue={def?.notes} rows={2} /></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your parts and inventory suppliers.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-9 text-sm">
          <Plus className="h-4 w-4" /> Add Supplier
        </Button>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-card" />
      </div>

      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{suppliers.length}</span> active suppliers
        </p>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Supplier</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Contact</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Parts</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={4} className="h-11"><div className="h-4 bg-muted animate-pulse rounded w-52" /></TableCell></TableRow>
              ))
            ) : suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Factory className="h-8 w-8 text-muted-foreground opacity-25" />
                    <span className="text-sm text-muted-foreground">No suppliers found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map(s => (
                <TableRow key={s.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        {s.country && <p className="text-[10px] text-muted-foreground">{s.country}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                    <div className="flex flex-col gap-0.5">
                      {s.contactPerson && <span className="font-medium text-foreground">{s.contactPerson}</span>}
                      {s.phone && <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{s.phone}</span>}
                      {s.email && <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" />{s.email}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-[150px] truncate">
                    {s.partTypes || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingSup(s)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Delete supplier?")) deleteM.mutate(s.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
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
            <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
            <SupplierForm />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={createM.isPending}>{createM.isPending ? "Saving..." : "Add Supplier"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingSup} onOpenChange={o => !o && setEditingSup(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={e => { e.preventDefault(); if (editingSup) updateM.mutate({ id: editingSup.id, data: getFormData(e.currentTarget) }); }}>
            <DialogHeader><DialogTitle>Edit Supplier</DialogTitle></DialogHeader>
            {editingSup && <SupplierForm def={editingSup} key={editingSup.id} />}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingSup(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={updateM.isPending}>{updateM.isPending ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
