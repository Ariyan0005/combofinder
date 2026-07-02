import { useState, type ElementType } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Wrench, Clock, CheckCircle2, Truck, Edit2, Trash2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = "/api/repairs";

interface Repair {
  id: number;
  customerName: string;
  customerPhone: string;
  phoneBrand: string;
  phoneModel: string;
  imei?: string;
  problem: string;
  status: "Waiting" | "Repairing" | "Ready" | "Delivered";
  engineer?: string;
  partsUsed?: string;
  laborCost?: string;
  partsCost?: string;
  totalCost?: string;
  advancePaid?: string;
  notes?: string;
  warrantyDays?: number;
  isPaid: boolean;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: ElementType; dot: string }> = {
  Waiting:   { label: "Waiting",   color: "bg-amber-100 text-amber-700 border-amber-200",    icon: Clock,         dot: "bg-amber-400" },
  Repairing: { label: "Repairing", color: "bg-blue-100 text-blue-700 border-blue-200",       icon: Wrench,        dot: "bg-blue-500" },
  Ready:     { label: "Ready",     color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2, dot: "bg-emerald-500" },
  Delivered: { label: "Delivered", color: "bg-slate-100 text-slate-600 border-slate-200",    icon: Truck,         dot: "bg-slate-400" },
};

const STATUSES = ["Waiting", "Repairing", "Ready", "Delivered"];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Waiting;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

type RepairFormData = Omit<Repair, "id" | "createdAt" | "isPaid"> & { isPaid: boolean };

function RepairForm({ def, onClose, onSave }: { def?: Repair; onClose: () => void; onSave: (d: Partial<RepairFormData>) => void }) {
  return (
    <div className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Customer Name *</Label><Input name="customerName" defaultValue={def?.customerName} placeholder="Ahmad Al-Balushi" required /></div>
        <div className="space-y-1"><Label className="text-xs">Phone *</Label><Input name="customerPhone" defaultValue={def?.customerPhone} placeholder="+968..." required /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Brand *</Label><Input name="phoneBrand" defaultValue={def?.phoneBrand} placeholder="Samsung" required /></div>
        <div className="space-y-1"><Label className="text-xs">Model *</Label><Input name="phoneModel" defaultValue={def?.phoneModel} placeholder="Galaxy A15" required /></div>
      </div>
      <div className="space-y-1"><Label className="text-xs">Problem *</Label><Textarea name="problem" defaultValue={def?.problem} placeholder="Display cracked, touch not working..." rows={2} required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">IMEI</Label><Input name="imei" defaultValue={def?.imei} placeholder="352..." /></div>
        <div className="space-y-1"><Label className="text-xs">Engineer</Label><Input name="engineer" defaultValue={def?.engineer} placeholder="Abu Mahara" /></div>
      </div>
      <div className="space-y-1"><Label className="text-xs">Parts Used</Label><Input name="partsUsed" defaultValue={def?.partsUsed} placeholder="LCD A17k, Battery BLP727..." /></div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1"><Label className="text-xs">Parts Cost</Label><Input name="partsCost" defaultValue={def?.partsCost} placeholder="5 OMR" /></div>
        <div className="space-y-1"><Label className="text-xs">Labor Cost</Label><Input name="laborCost" defaultValue={def?.laborCost} placeholder="3 OMR" /></div>
        <div className="space-y-1"><Label className="text-xs">Total</Label><Input name="totalCost" defaultValue={def?.totalCost} placeholder="8 OMR" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Advance Paid</Label><Input name="advancePaid" defaultValue={def?.advancePaid} placeholder="0 OMR" /></div>
        <div className="space-y-1"><Label className="text-xs">Warranty (days)</Label><Input name="warrantyDays" type="number" defaultValue={def?.warrantyDays ?? 0} min={0} /></div>
      </div>
      <div className="space-y-1"><Label className="text-xs">Notes</Label><Textarea name="notes" defaultValue={def?.notes} placeholder="Customer dropped water damage..." rows={2} /></div>
    </div>
  );
}

export default function Repairs() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<{ id: number; current: string } | null>(null);
  const createFormRef = useState<HTMLFormElement | null>(null);

  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: repairs = [], isLoading } = useQuery<Repair[]>({
    queryKey: ["repairs", statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      const r = await fetch(`${API}?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      const all: Repair[] = await r.json();
      return statusFilter === "all" ? all : all.filter(r => r.status === statusFilter);
    },
  });

  const createM = useMutation({
    mutationFn: async (data: Partial<RepairFormData>) => {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["repairs"] }); setIsCreateOpen(false); toast({ title: "Repair job created" }); },
    onError: () => toast({ title: "Failed to create repair", variant: "destructive" }),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RepairFormData> }) => {
      const r = await fetch(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["repairs"] }); setEditingRepair(null); setUpdatingStatus(null); toast({ title: "Updated" }); },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const deleteM = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API}/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["repairs"] }); toast({ title: "Deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const getFormData = (form: HTMLFormElement) => ({
    customerName: form.customerName.value.trim(),
    customerPhone: form.customerPhone.value.trim(),
    phoneBrand: form.phoneBrand.value.trim(),
    phoneModel: form.phoneModel.value.trim(),
    imei: form.imei.value.trim() || undefined,
    problem: form.problem.value.trim(),
    engineer: form.engineer.value.trim() || undefined,
    partsUsed: form.partsUsed.value.trim() || undefined,
    partsCost: form.partsCost.value.trim() || undefined,
    laborCost: form.laborCost.value.trim() || undefined,
    totalCost: form.totalCost.value.trim() || undefined,
    advancePaid: form.advancePaid.value.trim() || undefined,
    warrantyDays: Number(form.warrantyDays.value) || 0,
    notes: form.notes.value.trim() || undefined,
  });

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s] = repairs.filter(r => r.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Repair Jobs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track phone repairs from intake to delivery.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-9 text-sm">
          <Plus className="h-4 w-4" /> New Repair
        </Button>
      </div>

      {/* Status pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s];
          const Icon = cfg.icon;
          const count = repairs.filter(r => r.status === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={`text-left p-3 rounded-xl border transition-all ${statusFilter === s ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center ${cfg.color.replace("border", "").split(" ").slice(0, 2).join(" ")}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xl font-bold">{count}</span>
              </div>
              <p className="text-xs font-semibold text-foreground">{s}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search customer, model, IMEI..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-card" />
        </div>
        {statusFilter !== "all" && (
          <Button variant="outline" size="sm" onClick={() => setStatusFilter("all")} className="gap-1 text-xs">
            <Filter className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Customer</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Device</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Problem</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Cost</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Date</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={7} className="h-12"><div className="h-4 bg-muted animate-pulse rounded w-60" /></TableCell></TableRow>
              ))
            ) : repairs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Wrench className="h-8 w-8 text-muted-foreground opacity-25" />
                    <span className="text-sm text-muted-foreground">No repair jobs yet</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              repairs.map(repair => (
                <TableRow key={repair.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{repair.customerName}</p>
                      <p className="text-xs text-muted-foreground">{repair.customerPhone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{repair.phoneBrand} {repair.phoneModel}</p>
                      {repair.imei && <p className="text-xs text-muted-foreground font-mono">{repair.imei}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate hidden md:table-cell" title={repair.problem}>
                    {repair.problem}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => setUpdatingStatus({ id: repair.id, current: repair.status })}>
                      <StatusBadge status={repair.status} />
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {repair.totalCost || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                    {new Date(repair.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingRepair(repair)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Delete this repair job?")) deleteM.mutate(repair.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
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
          <form onSubmit={e => { e.preventDefault(); createM.mutate(getFormData(e.currentTarget)); }}>
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> New Repair Job</DialogTitle></DialogHeader>
            <RepairForm onClose={() => setIsCreateOpen(false)} onSave={() => {}} />
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={createM.isPending}>{createM.isPending ? "Saving..." : "Create Repair"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRepair} onOpenChange={o => !o && setEditingRepair(null)}>
        <DialogContent className="max-w-lg">
          <form onSubmit={e => { e.preventDefault(); if (editingRepair) updateM.mutate({ id: editingRepair.id, data: getFormData(e.currentTarget) }); }}>
            <DialogHeader><DialogTitle>Edit Repair Job</DialogTitle></DialogHeader>
            {editingRepair && <RepairForm def={editingRepair} onClose={() => setEditingRepair(null)} onSave={() => {}} />}
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingRepair(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={updateM.isPending}>{updateM.isPending ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Status Update Dialog */}
      <Dialog open={!!updatingStatus} onOpenChange={o => !o && setUpdatingStatus(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Update Status</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {STATUSES.map(s => {
              const cfg = STATUS_CONFIG[s];
              const Icon = cfg.icon;
              return (
                <button key={s} onClick={() => { if (updatingStatus) updateM.mutate({ id: updatingStatus.id, data: { status: s as any } }); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all hover:border-primary/50 ${updatingStatus?.current === s ? "border-primary bg-primary/5" : "border-border"}`}>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{s}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
