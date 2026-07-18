import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit2, Trash2, Factory, Phone, Mail, Wallet, History, CreditCard, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = "/api/suppliers";
const PURCHASE_API = "/api/supplier-purchases";

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

interface SupplierBalance {
  supplierId: number;
  supplierName: string;
  totalPurchased: number;
  totalPaid: number;
  totalDue: number;
  purchaseCount: number;
}

interface SupplierPurchase {
  id: number;
  productName?: string;
  quantity: number;
  totalAmount: string;
  paidAmount: string;
  dueAmount: string;
  paymentStatus: string;
  purchaseDate: string;
  notes?: string;
  createdAt: string;
}

interface SupplierPaymentRecord {
  id: number;
  amount: string;
  paymentMethod: string;
  date: string;
  notes?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  paid: { label: "পরিশোধিত", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle className="h-3 w-3" /> },
  partial: { label: "আংশিক", color: "bg-amber-100 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3" /> },
  credit: { label: "বাকি", color: "bg-red-100 text-red-700 border-red-200", icon: <AlertCircle className="h-3 w-3" /> },
};

const PAYMENT_METHODS = [
  { value: "cash", label: "নগদ (Cash)" },
  { value: "bank", label: "ব্যাংক ট্রান্সফার" },
  { value: "mobile_banking", label: "মোবাইল ব্যাংকিং" },
  { value: "other", label: "অন্যান্য" },
];

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSup, setEditingSup] = useState<Supplier | null>(null);
  const [ledgerSup, setLedgerSup] = useState<Supplier | null>(null);
  const [payDueSup, setPayDueSup] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payNotes, setPayNotes] = useState("");
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

  // All supplier balances — shows dues for each
  const { data: balances = [] } = useQuery<SupplierBalance[]>({
    queryKey: ["supplier-balances"],
    queryFn: async () => {
      const r = await fetch(`${PURCHASE_API}/balances`, { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  // Ledger: purchases for selected supplier
  const { data: purchases = [] } = useQuery<SupplierPurchase[]>({
    queryKey: ["supplier-purchases", ledgerSup?.id],
    enabled: !!ledgerSup,
    queryFn: async () => {
      const r = await fetch(`${PURCHASE_API}?supplierId=${ledgerSup!.id}`, { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
  });

  // Ledger: payment history for selected supplier
  const { data: paymentHistory = [] } = useQuery<SupplierPaymentRecord[]>({
    queryKey: ["supplier-payment-history", ledgerSup?.id],
    enabled: !!ledgerSup,
    queryFn: async () => {
      const r = await fetch(`${PURCHASE_API}/payments?supplierId=${ledgerSup!.id}`, { credentials: "include" });
      if (!r.ok) return [];
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
    onError: () => toast({ title: "সাপ্লায়ার যোগ করা যায়নি", variant: "destructive" }),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Supplier> }) => {
      const r = await fetch(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); setEditingSup(null); toast({ title: "Supplier updated" }); },
    onError: () => toast({ title: "আপডেট করা যায়নি", variant: "destructive" }),
  });

  const deleteM = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API}/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast({ title: "Supplier deleted" }); },
    onError: () => toast({ title: "ডিলিট করা যায়নি", variant: "destructive" }),
  });

  const payDueM = useMutation({
    mutationFn: async () => {
      if (!payDueSup) throw new Error("No supplier");
      const r = await fetch(`${PURCHASE_API}/general-pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: payDueSup.id,
          supplierName: payDueSup.name,
          amount: payAmount,
          paymentMethod: payMethod,
          date: payDate,
          notes: payNotes,
        }),
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-balances"] });
      qc.invalidateQueries({ queryKey: ["supplier-purchases"] });
      qc.invalidateQueries({ queryKey: ["supplier-payment-history"] });
      setPayDueSup(null);
      setPayAmount("");
      setPayNotes("");
      toast({ title: "পেমেন্ট সফলভাবে রেকর্ড হয়েছে ✓" });
    },
    onError: () => toast({ title: "পেমেন্ট রেকর্ড করা যায়নি", variant: "destructive" }),
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

  const balanceMap = Object.fromEntries(balances.map(b => [b.supplierId, b]));

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

  const ledgerBalance = ledgerSup ? balanceMap[ledgerSup.id] : null;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">সাপ্লায়ার ও তাদের বাকি-পাওনা ট্র্যাক করুন।</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-9 text-sm">
          <Plus className="h-4 w-4" /> Add Supplier
        </Button>
      </div>

      {/* Total dues summary */}
      {balances.length > 0 && (() => {
        const totalDue = balances.reduce((s, b) => s + b.totalDue, 0);
        return totalDue > 0 ? (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-red-200 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">মোট বাকি: {totalDue.toLocaleString()} টাকা</p>
              <p className="text-xs text-red-500">{balances.filter(b => b.totalDue > 0).length} জন সাপ্লায়ারের কাছে বাকি আছে</p>
            </div>
          </div>
        ) : null;
      })()}

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
              <TableHead className="font-semibold text-xs uppercase tracking-wider">বাকি</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5} className="h-11"><div className="h-4 bg-muted animate-pulse rounded w-52" /></TableCell></TableRow>
              ))
            ) : suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Factory className="h-8 w-8 text-muted-foreground opacity-25" />
                    <span className="text-sm text-muted-foreground">No suppliers found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map(s => {
                const bal = balanceMap[s.id];
                const hasDue = bal && bal.totalDue > 0;
                return (
                  <TableRow key={s.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 font-semibold text-sm ${hasDue ? "bg-red-100 text-red-700" : "bg-primary/10 text-primary"}`}>
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
                    <TableCell>
                      {bal ? (
                        <div className="flex flex-col gap-0.5">
                          {hasDue ? (
                            <span className="text-xs font-semibold text-red-600">৳{bal.totalDue.toLocaleString()} বাকি</span>
                          ) : (
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> পরিশোধিত</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{bal.purchaseCount} টি কেনা</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {hasDue && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                            onClick={() => { setPayDueSup(s); setPayAmount(String(bal!.totalDue)); setPayDate(new Date().toISOString().split("T")[0]); setPayMethod("cash"); setPayNotes(""); }}
                          >
                            <Wallet className="h-3 w-3" /> Pay Due
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Ledger" onClick={() => setLedgerSup(s)}>
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingSup(s)}><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Delete supplier?")) deleteM.mutate(s.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Supplier Dialog */}
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

      {/* Edit Supplier Dialog */}
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

      {/* Pay Due Dialog */}
      <Dialog open={!!payDueSup} onOpenChange={o => !o && setPayDueSup(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              বাকি পরিশোধ — {payDueSup?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {payDueSup && balanceMap[payDueSup.id] && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">মোট বাকি:</span>
                  <span className="font-bold text-red-700">৳{balanceMap[payDueSup.id].totalDue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-muted-foreground">এখন পর্যন্ত পরিশোধ:</span>
                  <span className="text-emerald-600">৳{balanceMap[payDueSup.id].totalPaid.toLocaleString()}</span>
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">পরিশোধের পরিমাণ *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">পেমেন্ট পদ্ধতি</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">তারিখ</Label>
              <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">নোট (ঐচ্ছিক)</Label>
              <Textarea value={payNotes} onChange={e => setPayNotes(e.target.value)} rows={2} placeholder="কোন বিশেষ তথ্য..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPayDueSup(null)}>বাতিল</Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              disabled={!payAmount || Number(payAmount) <= 0 || payDueM.isPending}
              onClick={() => payDueM.mutate()}
            >
              {payDueM.isPending ? "..." : <><CreditCard className="h-3.5 w-3.5" /> পেমেন্ট রেকর্ড করুন</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Ledger Dialog */}
      <Dialog open={!!ledgerSup} onOpenChange={o => !o && setLedgerSup(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              {ledgerSup?.name} — হিসাব খাতা
            </DialogTitle>
          </DialogHeader>

          {/* Balance summary */}
          {ledgerBalance && (
            <div className="grid grid-cols-3 gap-3 py-2">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                <p className="text-[10px] text-blue-600 uppercase font-semibold tracking-wide">মোট কেনা</p>
                <p className="text-lg font-bold text-blue-700">৳{ledgerBalance.totalPurchased.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                <p className="text-[10px] text-emerald-600 uppercase font-semibold tracking-wide">পরিশোধ</p>
                <p className="text-lg font-bold text-emerald-700">৳{ledgerBalance.totalPaid.toLocaleString()}</p>
              </div>
              <div className={`p-3 rounded-lg text-center border ${ledgerBalance.totalDue > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                <p className={`text-[10px] uppercase font-semibold tracking-wide ${ledgerBalance.totalDue > 0 ? "text-red-600" : "text-gray-500"}`}>বাকি</p>
                <p className={`text-lg font-bold ${ledgerBalance.totalDue > 0 ? "text-red-700" : "text-gray-500"}`}>৳{ledgerBalance.totalDue.toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="overflow-y-auto flex-1 space-y-4 pr-1">
            {/* Purchase history */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> ক্রয় ইতিহাস ({purchases.length} টি)
              </h3>
              {purchases.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">কোনো ক্রয় রেকর্ড নেই</p>
              ) : (
                <div className="space-y-2">
                  {purchases.map(p => {
                    const cfg = STATUS_CONFIG[p.paymentStatus] || STATUS_CONFIG.credit;
                    return (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border bg-card text-sm hover:bg-muted/30 transition-colors">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{p.productName || "পণ্য"}</span>
                          <span className="text-xs text-muted-foreground">{p.purchaseDate} · {p.quantity} পিস</span>
                          {p.notes && <span className="text-xs text-muted-foreground italic">{p.notes}</span>}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-semibold">৳{Number(p.totalAmount).toLocaleString()}</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                            {p.paymentStatus !== "paid" && ` · ৳${Number(p.dueAmount).toLocaleString()} বাকি`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment history */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> পেমেন্ট ইতিহাস ({paymentHistory.length} টি)
              </h3>
              {paymentHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">কোনো পেমেন্ট রেকর্ড নেই</p>
              ) : (
                <div className="space-y-2">
                  {paymentHistory.map(pm => (
                    <div key={pm.id} className="flex items-center justify-between p-3 rounded-lg border bg-emerald-50/50 text-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-emerald-700">পেমেন্ট</span>
                        <span className="text-xs text-muted-foreground">
                          {pm.date} · {PAYMENT_METHODS.find(m => m.value === pm.paymentMethod)?.label || pm.paymentMethod}
                        </span>
                        {pm.notes && <span className="text-xs text-muted-foreground italic">{pm.notes}</span>}
                      </div>
                      <span className="font-semibold text-emerald-700">+৳{Number(pm.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            {ledgerSup && ledgerBalance && ledgerBalance.totalDue > 0 && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                onClick={() => {
                  setLedgerSup(null);
                  setPayDueSup(ledgerSup);
                  setPayAmount(String(ledgerBalance.totalDue));
                  setPayDate(new Date().toISOString().split("T")[0]);
                  setPayMethod("cash");
                  setPayNotes("");
                }}
              >
                <CreditCard className="h-3.5 w-3.5" /> Pay Due ৳{ledgerBalance.totalDue.toLocaleString()}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setLedgerSup(null)}>বন্ধ করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
