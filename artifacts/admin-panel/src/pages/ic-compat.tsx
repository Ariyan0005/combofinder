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
import { Plus, ArrowLeft, Trash2, Smartphone, Search } from "lucide-react";

interface IcModel {
  id: number; brandId: number; brandName: string;
  icNumber: string; description?: string; package?: string;
}
interface DeviceCompat {
  id: number; icModelId: number; deviceName: string; notes?: string; createdAt: string;
}

export default function IcCompat() {
  const { id } = useParams<{ id: string }>();
  const icModelId = Number(id);
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [singleDevice, setSingleDevice] = useState("");
  const [singleNotes, setSingleNotes] = useState("");

  const { data: icModel } = useQuery<IcModel>({
    queryKey: ["ic-model", icModelId],
    queryFn: () => fetch(`/api/ic-models/${icModelId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!icModelId,
  });

  const { data: devices = [], isLoading } = useQuery<DeviceCompat[]>({
    queryKey: ["ic-compat", icModelId],
    queryFn: () => fetch(`/api/ic-compat?icModelId=${icModelId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!icModelId,
  });

  const filtered = devices.filter(d =>
    d.deviceName.toLowerCase().includes(search.toLowerCase())
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: ["ic-compat", icModelId] });

  const addMut = useMutation({
    mutationFn: () =>
      fetch("/api/ic-compat", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icModelId, deviceName: singleDevice.trim(), notes: singleNotes.trim() || null }),
      }).then(r => r.json()),
    onSuccess: () => { invalidate(); setSingleDevice(""); setSingleNotes(""); setIsAddOpen(false); toast({ title: "Device added" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const bulkMut = useMutation({
    mutationFn: (deviceNames: string[]) =>
      fetch("/api/ic-compat/bulk", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icModelId, deviceNames }),
      }).then(r => r.json()),
    onSuccess: (data) => {
      invalidate(); setIsBulkOpen(false); setBulkText("");
      toast({ title: `${Array.isArray(data) ? data.length : "?"} devices added` });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/ic-compat/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => { invalidate(); toast({ title: "Deleted" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/ic-brands/${icModel?.brandId}/models`}>
          <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate font-mono">
            {icModel ? `${icModel.brandName} ${icModel.icNumber}` : "IC"} — Device Compatibility
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {icModel?.description || "Devices compatible with this IC"}
            {icModel?.package && <span> · {icModel.package}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsBulkOpen(true)}>Bulk Add</Button>
          <Button size="sm" className="gap-1.5" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Device
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search devices…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-card" />
      </div>

      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
        <span className="font-semibold text-foreground">{devices.length}</span> compatible devices
      </p>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Device Name</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Notes</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Added</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={4} className="h-12"><div className="h-4 bg-muted animate-pulse rounded w-48" /></TableCell></TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Smartphone className="h-8 w-8 text-muted-foreground opacity-30" />
                    <span className="text-sm text-muted-foreground">No devices added yet</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(d => (
                <TableRow key={d.id} className="group hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{d.deviceName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{d.notes || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { if (confirm(`Remove "${d.deviceName}"?`)) deleteMut.mutate(d.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Single Add */}
      <Dialog open={isAddOpen} onOpenChange={o => !o && setIsAddOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Compatible Device</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Device Name *</Label>
              <Input value={singleDevice} onChange={e => setSingleDevice(e.target.value)} placeholder="e.g. Samsung Galaxy S21" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={singleNotes} onChange={e => setSingleNotes(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={!singleDevice.trim() || addMut.isPending} onClick={() => addMut.mutate()}>
              {addMut.isPending ? "Adding…" : "Add Device"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add */}
      <Dialog open={isBulkOpen} onOpenChange={o => !o && setIsBulkOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Bulk Add Compatible Devices</DialogTitle></DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">One device name per line.</p>
            <Textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={"Samsung Galaxy S21\nXiaomi Mi 11\nOnePlus 9 Pro"}
              rows={8} className="text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => bulkMut.mutate(bulkText.split("\n").map(l => l.trim()).filter(Boolean))}
              disabled={!bulkText.trim() || bulkMut.isPending}>
              {bulkMut.isPending ? "Adding…" : "Add Devices"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
