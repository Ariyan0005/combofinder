import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Package, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = "/api/inventory";
const PURCHASE_API = "/api/supplier-purchases";
const PART_TYPES = ["LCD / Display", "Battery", "Charging Sub Board", "IC Compatible", "Camera", "FPC Connector", "Frame", "Other"];
const QUALITIES = ["Original", "Compatible", "Refurbished"];
const PAYMENT_STATUSES = [
  { value: "paid", label: "সম্পূর্ণ পরিশোধ" },
  { value: "partial", label: "আংশিক পরিশোধ" },
  { value: "credit", label: "সম্পূর্ণ বাকি (Credit)" },
];

interface Supplier {
  id: number;
  name: string;
}

interface InventoryItem {
  id: number;
  partName: string;
  partType: string;
  brand?: string;
  model?: string;
  quality?: string;
  quantity: number;
  minStock: number;
  purchasePrice?: string;
  sellingPrice?: string;
  supplierId?: number;
  supplier?: string;
  shelfLocation?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const QUALITY_COLORS: Record<string, string> = {
  "Original": "bg-emerald-100 text-emerald-700",
  "Compatible": "bg-blue-100 text-blue-700",
  "Refurbished": "bg-amber-100 text-amber-700",
};

function ItemForm({ def, partType, onPartType, quality, onQuality, suppliers, isCreate }: {
  def?: InventoryItem;
  partType: string;
  onPartType: (v: string) => void;
  quality: string;
  onQuality: (v: string) => void;
  suppliers: Supplier[];
  isCreate?: boolean;
}) {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(def?.supplierId ? String(def.supplierId) : "none");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  const showPaymentFields = isCreate && selectedSupplierId && selectedSupplierId !== "none";

  return (
    <div className="space-y-3 py-2 max-h-[65vh] overflow-y-auto pr-1">
      <div className="space-y-1">
        <Label className="text-xs">Part Type *</Label>
        <Select value={partType} onValueChange={onPartType}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>{PART_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1"><Label className="text-xs">Part Name *</Label><Input name="partName" defaultValue={def?.partName} placeholder="e.g. LCD A17k, BLP727 Battery" required autoFocus /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Brand</Label><Input name="brand" defaultValue={def?.brand} placeholder="Samsung" /></div>
        <div className="space-y-1"><Label className="text-xs">Model</Label><Input name="model" defaultValue={def?.model} placeholder="A15, A25..." /></div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Quality</Label>
        <Select value={quality} onValueChange={onQuality}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>{QUALITIES.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Quantity *</Label><Input name="quantity" type="number" min={0} defaultValue={def?.quantity ?? 0} required /></div>
        <div className="space-y-1"><Label className="text-xs">Min Stock Alert</Label><Input name="minStock" type="number" min={0} defaultValue={def?.minStock ?? 2} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Purchase Price</Label><Input name="purchasePrice" defaultValue={def?.purchasePrice} placeholder="5 OMR" /></div>
        <div className="space-y-1"><Label className="text-xs">Selling Price</Label><Input name="sellingPrice" defaultValue={def?.sellingPrice} placeholder="8 OMR" /></div>
      </div>

      {/* Supplier selection — dropdown when creating */}
      <div className="space-y-1">
        <Label className="text-xs">Supplier</Label>
        {isCreate ? (
          <>
            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId} name="supplierId">
              <SelectTrigger className="h-9"><SelectValue placeholder="— No supplier —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— No supplier —</SelectItem>
                {suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* Hidden input to carry supplierId value in form */}
            <input type="hidden" name="supplierId" value={selectedSupplierId === "none" ? "" : selectedSupplierId} />
          </>
        ) : (
          <Input name="supplier" defaultValue={def?.supplier} placeholder="Al-Ameen Parts" />
        )}
      </div>

      {/* Payment tracking — only when creating with a supplier */}
      {showPaymentFields && (
        <div className="space-y-3 p-3 rounded-lg border border-blue-200 bg-blue-50/50">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">💰 পেমেন্ট ট্র্যাকিং</p>
          <div className="space-y-1">
            <Label className="text-xs">পেমেন্ট স্ট্যাটাস</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <input type="hidden" name="paymentStatus" value={paymentStatus} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">মোট মূল্য (Total Amount)</Label>
            <Input
              name="totalAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={totalAmount}
              onChange={e => {
                setTotalAmount(e.target.value);
                if (paymentStatus === "paid") setPaidAmount(e.target.value);
                if (paymentStatus === "credit") setPaidAmount("0");
              }}
            />
          </div>
          {paymentStatus === "partial" && (
            <div className="space-y-1">
              <Label className="text-xs">এখন কত দিলেন (Paid Now)</Label>
              <Input
                name="paidAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)}
              />
              {totalAmount && paidAmount && Number(paidAmount) < Number(totalAmount) && (
                <p className="text-xs text-amber-700 font-medium">
                  বাকি থাকবে: {(Number(totalAmount) - Number(paidAmount)).toFixed(2)}
                </p>
              )}
            </div>
          )}
          {paymentStatus === "paid" && (
            <input type="hidden" name="paidAmount" value={totalAmount} />
          )}
          {paymentStatus === "credit" && (
            <input type="hidden" name="paidAmount" value="0" />
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">Shelf Location</Label><Input name="shelfLocation" defaultValue={def?.shelfLocation} placeholder="A3, Drawer 2..." /></div>
      </div>
      <div className="space-y-1"><Label className="text-xs">Notes</Label><Textarea name="notes" defaultValue={def?.notes} rows={2} placeholder="Any extra info..." /></div>
    </div>
  );
}

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showLowStock, setShowLowStock] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [createPartType, setCreatePartType] = useState("");
  const [createQuality, setCreateQuality] = useState("Compatible");
  const [editPartType, setEditPartType] = useState("");
  const [editQuality, setEditQuality] = useState("Compatible");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["inventory", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      const r = await fetch(`${API}?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const r = await fetch("/api/suppliers", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const filtered = items.filter(item => {
    const matchesType = typeFilter === "all" || item.partType === typeFilter;
    const matchesLow = !showLowStock || item.quantity <= item.minStock;
    return matchesType && matchesLow;
  });

  const lowStockCount = items.filter(i => i.quantity <= i.minStock).length;

  const createM = useMutation({
    mutationFn: async (data: Partial<InventoryItem> & { totalAmount?: string; paidAmount?: string; paymentStatus?: string }) => {
      const { totalAmount, paidAmount, paymentStatus, supplierId, ...inventoryData } = data as any;

      // Set supplier name from suppliers list
      if (supplierId) {
        const sup = suppliers.find(s => s.id === Number(supplierId));
        if (sup) inventoryData.supplier = sup.name;
        inventoryData.supplierId = Number(supplierId);
      }

      // Create the inventory item
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inventoryData),
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed");
      const newItem = await r.json();

      // If supplier + totalAmount given, create purchase record
      if (supplierId && supplierId !== "none" && supplierId !== "" && totalAmount && Number(totalAmount) > 0) {
        const sup = suppliers.find(s => s.id === Number(supplierId));
        const paid = paymentStatus === "paid"
          ? totalAmount
          : paymentStatus === "credit"
          ? "0"
          : (paidAmount || "0");

        await fetch(PURCHASE_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplierId: Number(supplierId),
            supplierName: sup?.name,
            inventoryId: newItem.id,
            productName: inventoryData.partName,
            quantity: inventoryData.quantity || 1,
            totalAmount,
            paidAmount: paid,
            purchaseDate: new Date().toISOString().split("T")[0],
          }),
          credentials: "include",
        });

        qc.invalidateQueries({ queryKey: ["supplier-balances"] });
      }

      return newItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setIsCreateOpen(false);
      toast({ title: "প্রোডাক্ট যোগ হয়েছে ✓" });
    },
    onError: () => toast({ title: "যোগ করা যায়নি", variant: "destructive" }),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InventoryItem> }) => {
      const r = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); setEditingItem(null); toast({ title: "আপডেট হয়েছে ✓" }); },
    onError: () => toast({ title: "আপডেট করা যায়নি", variant: "destructive" }),
  });

  const deleteM = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API}/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); toast({ title: "ডিলিট হয়েছে" }); },
    onError: () => toast({ title: "ডিলিট করা যায়নি", variant: "destructive" }),
  });

  const getFormData = (form: HTMLFormElement) => {
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value ?? "";
    return {
      partName: get("partName").trim(),
      brand: get("brand").trim() || undefined,
      model: get("model").trim() || undefined,
      quantity: Number(get("quantity")) || 0,
      minStock: Number(get("minStock")) || 2,
      purchasePrice: get("purchasePrice").trim() || undefined,
      sellingPrice: get("sellingPrice").trim() || undefined,
      supplier: get("supplier").trim() || undefined,
      supplierId: get("supplierId") || undefined,
      shelfLocation: get("shelfLocation").trim() || undefined,
      notes: (form.elements.namedItem("notes") as HTMLTextAreaElement)?.value.trim() || undefined,
      totalAmount: get("totalAmount").trim() || undefined,
      paidAmount: get("paidAmount").trim() || undefined,
      paymentStatus: get("paymentStatus") || undefined,
    };
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage stock levels for display, battery & spare parts.</p>
        </div>
        <Button onClick={() => { setCreatePartType(""); setCreateQuality("Compatible"); setIsCreateOpen(true); }} className="gap-2 h-9 text-sm">
          <Plus className="h-4 w-4" /> Add Stock
        </Button>
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <button onClick={() => setShowLowStock(!showLowStock)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${showLowStock ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200 hover:border-amber-300"}`}>
          <AlertTriangle className={`h-5 w-5 shrink-0 ${showLowStock ? "text-red-500" : "text-amber-500"}`} />
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">{lowStockCount} item{lowStockCount > 1 ? "s" : ""} low on stock</p>
            <p className="text-xs text-muted-foreground">{showLowStock ? "Showing only low-stock items. Click to show all." : "Click to view low-stock items only."}</p>
          </div>
        </button>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search part name, brand, model..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-card" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-full sm:w-48"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {PART_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span> of <span className="font-semibold text-foreground">{items.length}</span> items
        </p>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Part</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Type</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Stock</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Quality</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Location</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Sell Price</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={7} className="h-11"><div className="h-4 bg-muted animate-pulse rounded w-56" /></TableCell></TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-muted-foreground opacity-25" />
                    <span className="text-sm text-muted-foreground">No items found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(item => {
                const isLow = item.quantity <= item.minStock;
                return (
                  <TableRow key={item.id} className={`group transition-colors ${isLow ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-muted/30"}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{item.partName}</p>
                        {(item.brand || item.model) && (
                          <p className="text-xs text-muted-foreground">{[item.brand, item.model].filter(Boolean).join(" ")}</p>
                        )}
                        {item.supplier && <p className="text-[10px] text-muted-foreground">{item.supplier}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-muted-foreground">{item.partType}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {isLow && <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                        <span className={`text-sm font-bold ${isLow ? "text-red-600" : "text-foreground"}`}>{item.quantity}</span>
                        <span className="text-xs text-muted-foreground">/ min {item.minStock}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${QUALITY_COLORS[item.quality || "Compatible"] || QUALITY_COLORS["Compatible"]}`}>
                        {item.quality || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{item.shelfLocation || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{item.sellingPrice || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditPartType(item.partType); setEditQuality(item.quality || "Compatible"); setEditingItem(item); }}><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Delete this item?")) deleteM.mutate(item.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={e => {
            e.preventDefault();
            const data = getFormData(e.currentTarget);
            createM.mutate({ ...data, partType: createPartType, quality: createQuality } as any);
          }}>
            <DialogHeader><DialogTitle>Add Stock Item</DialogTitle></DialogHeader>
            <ItemForm
              partType={createPartType}
              onPartType={setCreatePartType}
              quality={createQuality}
              onQuality={setCreateQuality}
              suppliers={suppliers}
              isCreate
            />
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={!createPartType || createM.isPending}>
                {createM.isPending ? "Saving..." : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={o => !o && setEditingItem(null)}>
        <DialogContent className="max-w-lg">
          <form onSubmit={e => {
            e.preventDefault();
            if (editingItem) {
              const data = getFormData(e.currentTarget);
              updateM.mutate({ id: editingItem.id, data: { ...data, partType: editPartType, quality: editQuality } as any });
            }
          }}>
            <DialogHeader><DialogTitle>Edit Stock Item</DialogTitle></DialogHeader>
            {editingItem && (
              <ItemForm
                def={editingItem}
                key={editingItem.id}
                partType={editPartType}
                onPartType={setEditPartType}
                quality={editQuality}
                onQuality={setEditQuality}
                suppliers={suppliers}
              />
            )}
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={!editPartType || updateM.isPending}>
                {updateM.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
