import { useState, useMemo } from "react";
import { useAuth } from "@/context/auth-context";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", BDT: "৳", INR: "₹",
  PKR: "₨", NPR: "रू", LKR: "Rs", AED: "د.إ", SAR: "﷼",
  OMR: "OMR", KWD: "KD", QAR: "QR", MYR: "RM", SGD: "S$",
  THB: "฿", IDR: "Rp", PHP: "₱", CNY: "¥", JPY: "¥",
  KRW: "₩", TRY: "₺", ZAR: "R", NGN: "₦", GHS: "₵",
};
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft, Plus, CreditCard, CheckCircle2,
  ShoppingCart, X, ChevronDown, FileText, Package,
} from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";
import {
  localSuppliers, localInventory,
  localSupplierPurchases, localSupplierPayments,
} from "@/lib/local-store";

const PRIMARY = "hsl(var(--primary))";
const MUTED   = "hsl(var(--muted-foreground))";
const BORDER  = "hsl(var(--border))";
const BG      = "hsl(var(--background))";
const CARD    = "hsl(var(--card))";
const GREEN   = "#10B981";
const RED     = "#EF4444";
const AMBER   = "#F59E0B";

type Supplier = { id: number; name: string; phone?: string; partTypes?: string; };
type Purchase = {
  id: number; productName?: string; quantity?: number;
  totalAmount: string; paidAmount: string; dueAmount: string;
  paymentStatus: "paid" | "partial" | "due" | "credit";
  purchaseDate?: string; notes?: string; createdAt: string;
  invoiceNumber?: string | null;
};
type Payment = {
  id: number; amount: string; paymentMethod: string;
  date?: string; notes?: string; createdAt: string;
};
type Balance = {
  totalPurchased: number; totalPaid: number; totalDue: number; purchaseCount: number;
};

function fmt(n: number | string) {
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function dateStr(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none focus:ring-2"
      style={{ borderColor: BORDER, background: BG, ...props.style }} />
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1.5" style={{ color: MUTED }}>{label}</label>
      {children}
    </div>
  );
}

type InventoryItem = { id: number; partName: string; quantity: number; purchasePrice?: string; };
type PurchaseLine = {
  _key: string; item: InventoryItem | null;
  search: string; showDrop: boolean;
  qty: string; unitPrice: string;
};
function newPurchaseLine(): PurchaseLine {
  return { _key: Math.random().toString(36).slice(2), item: null, search: "", showDrop: false, qty: "1", unitPrice: "" };
}

// ─── Add Purchase Modal ───────────────────────────────────────────────────────
function AddPurchaseModal({ supplierId, supplierName, onClose, isFree, userId }: {
  supplierId: number; supplierName: string; onClose: () => void;
  isFree: boolean; userId?: number;
}) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      // ── Free plan: local storage ─────────────────────────────────────────
      if (isFree && userId) return localInventory.getAll(userId) as InventoryItem[];
      // ── Pro plan: server ─────────────────────────────────────────────────
      const r = await fetch("/api/inventory", { credentials: "include" });
      return r.json();
    },
  });

  const [invoiceNo, setInvoiceNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [paidAmount, setPaidAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<PurchaseLine[]>([newPurchaseLine()]);
  const [error, setError] = useState("");

  const patchLine = (key: string, patch: Partial<PurchaseLine>) =>
    setLines(prev => prev.map(l => l._key === key ? { ...l, ...patch } : l));

  const invoiceTotal = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0);
  const dueAmt = Math.max(0, invoiceTotal - (Number(paidAmount) || 0));
  const payStatus: "paid" | "partial" | "credit" = dueAmt <= 0 ? "paid" : Number(paidAmount) <= 0 ? "credit" : "partial";
  const validLines = lines.filter(l => Number(l.qty) > 0 && Number(l.unitPrice) > 0 && (l.item || l.search.trim()));
  const stockLines = validLines.filter(l => l.item);

  const mut = useMutation({
    mutationFn: async () => {
      if (validLines.length === 0) throw new Error("Add at least one item with quantity and price");

      // ── Free plan: local storage ─────────────────────────────────────────
      if (isFree && userId) {
        const paidAmt = Number(paidAmount) || 0;
        const totalAmt = invoiceTotal;
        const due = Math.max(0, totalAmt - paidAmt);

        for (const line of validLines) {
          localSupplierPurchases.create(userId, {
            supplierId,
            supplierName,
            inventoryId: line.item?.id ?? null,
            productName: line.item?.partName ?? line.search.trim(),
            quantity: Number(line.qty),
            totalAmount: String(Number(line.qty) * Number(line.unitPrice)),
            paidAmount: String(paidAmt / validLines.length), // spread payment evenly per line
            dueAmount: String(due / validLines.length),
            paymentStatus: payStatus,
            purchaseDate,
            invoiceNumber: invoiceNo.trim() || null,
            notes: notes || null,
          });
          // Update local inventory stock (add purchased qty)
          if (line.item) {
            const all = localInventory.getAll(userId) as any[];
            const inv = all.find(i => i.id === line.item!.id);
            if (inv) {
              localInventory.update(userId, line.item.id, {
                quantity: (inv.quantity ?? 0) + Number(line.qty),
                purchasePrice: line.unitPrice || inv.purchasePrice,
              });
            }
          }
        }
        return { success: true };
      }

      // ── Pro plan: server ─────────────────────────────────────────────────
      const res = await fetch("/api/supplier-purchases/invoice", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId, supplierName,
          invoiceNumber: invoiceNo.trim() || null,
          purchaseDate,
          paidAmount: Number(paidAmount) || 0,
          notes: notes || null,
          items: validLines.map(l => ({
            inventoryId: l.item?.id ?? null,
            productName: l.item?.partName ?? l.search.trim(),
            quantity: Number(l.qty),
            unitPrice: Number(l.unitPrice),
          })),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-purchases", supplierId] });
      qc.invalidateQueries({ queryKey: ["supplier-balance", supplierId] });
      qc.invalidateQueries({ queryKey: ["supplier-payments", supplierId] });
      qc.invalidateQueries({ queryKey: ["suppliers-balances"] });
      if (stockLines.length > 0) qc.invalidateQueries({ queryKey: ["inventory"] });
      onClose();
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl"
        style={{ background: CARD }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="font-bold text-base">Purchase Invoice</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--muted))", color: MUTED }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5 overflow-y-auto" style={{ maxHeight: "75vh" }}>
          <form onSubmit={e => {
            e.preventDefault(); setError("");
            if (validLines.length === 0) { setError("Add at least one item with quantity and price"); return; }
            mut.mutate();
          }} className="flex flex-col gap-3">

            {/* Invoice header */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Invoice # (optional)">
                <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="INV-001" />
              </Field>
              <Field label="Date">
                <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
              </Field>
            </div>

            {/* Line items */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>Items</p>
              <div className="flex flex-col gap-2">
                {lines.map(line => (
                  <div key={line._key} className="rounded-xl border overflow-hidden" style={{ borderColor: BORDER, background: BG }}>
                    <div className="p-3">
                      {!line.item ? (
                        <div className="relative">
                          <Input
                            value={line.search}
                            onChange={e => patchLine(line._key, { search: e.target.value, showDrop: true })}
                            onFocus={() => patchLine(line._key, { showDrop: true })}
                            onBlur={() => setTimeout(() => patchLine(line._key, { showDrop: false }), 150)}
                            placeholder="Type item name or search…"
                          />
                          {(() => {
                            const q = line.search.trim().toLowerCase();
                            const matches = q.length > 0
                              ? inventoryItems.filter(i => i.partName.toLowerCase().includes(q)).slice(0, 5)
                              : [];
                            return line.showDrop && matches.length > 0 ? (
                              <div className="absolute top-full left-0 right-0 z-10 rounded-xl border shadow-lg overflow-hidden"
                                style={{ background: CARD, borderColor: BORDER }}>
                                {matches.map(i => (
                                  <button key={i.id} type="button"
                                    onMouseDown={() => patchLine(line._key, {
                                      item: i, search: i.partName, showDrop: false,
                                      unitPrice: i.purchasePrice ? String(i.purchasePrice) : "",
                                    })}
                                    className="w-full text-left px-3 py-2 text-sm border-b last:border-0"
                                    style={{ borderColor: BORDER }}>
                                    <span className="font-medium">{i.partName}</span>
                                    <span className="text-xs ml-2" style={{ color: MUTED }}>Stock: {i.quantity}</span>
                                  </button>
                                ))}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold">{line.item.partName}</p>
                            <p className="text-xs" style={{ color: MUTED }}>
                              Stock: {line.item.quantity} · ✓ Stock will update
                            </p>
                          </div>
                          <button type="button"
                            onClick={() => patchLine(line._key, { item: null, search: "", unitPrice: "" })}
                            style={{ color: MUTED }}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs mb-1 font-medium" style={{ color: MUTED }}>Qty</p>
                          <Input type="number" min="1" value={line.qty}
                            onChange={e => patchLine(line._key, { qty: e.target.value })} />
                        </div>
                        <div>
                          <p className="text-xs mb-1 font-medium" style={{ color: MUTED }}>Unit Price *</p>
                          <Input type="text" inputMode="decimal" value={line.unitPrice}
                            onChange={e => patchLine(line._key, { unitPrice: e.target.value })}
                            placeholder="0.00" />
                        </div>
                      </div>
                      {Number(line.qty) > 0 && Number(line.unitPrice) > 0 && (
                        <p className="text-xs mt-1.5 font-semibold text-right" style={{ color: PRIMARY }}>
                          = {(Number(line.qty) * Number(line.unitPrice)).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {lines.length > 1 && (
                      <button type="button"
                        onClick={() => setLines(prev => prev.filter(l => l._key !== line._key))}
                        className="w-full py-1.5 text-xs border-t text-center"
                        style={{ borderColor: BORDER, color: RED }}>
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setLines(prev => [...prev, newPurchaseLine()])}
                className="mt-2 w-full py-2.5 rounded-xl border border-dashed text-sm font-medium flex items-center justify-center gap-2"
                style={{ borderColor: PRIMARY, color: PRIMARY }}>
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            {/* Total + payment */}
            {invoiceTotal > 0 && (
              <div className="px-3.5 py-2.5 rounded-xl flex justify-between text-sm font-semibold"
                style={{ background: "hsl(var(--muted))" }}>
                <span>Invoice Total</span>
                <span style={{ color: PRIMARY }}>{fmt(invoiceTotal)}</span>
              </div>
            )}
            <Field label="Paid Now">
              <Input type="text" inputMode="decimal" value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)} placeholder="0" />
            </Field>
            {invoiceTotal > 0 && (
              <div className="flex gap-2 text-xs font-semibold">
                <span className="flex-1 px-3 py-2 rounded-lg text-center"
                  style={{ background: "#D1FAE5", color: GREEN }}>
                  Paid: {fmt(Math.min(Number(paidAmount) || 0, invoiceTotal))}
                </span>
                <span className="flex-1 px-3 py-2 rounded-lg text-center"
                  style={{ background: dueAmt > 0 ? "#FEE2E2" : "#D1FAE5", color: dueAmt > 0 ? RED : GREEN }}>
                  Due: {fmt(dueAmt)}
                </span>
              </div>
            )}
            <Field label="Notes">
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
            </Field>
            {error && <p className="text-xs" style={{ color: RED }}>{error}</p>}
            <button type="submit" disabled={mut.isPending}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 mt-1"
              style={{ background: PRIMARY }}>
              {mut.isPending ? "Saving…" : "Save Purchase"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Pay Now Modal ────────────────────────────────────────────────────────────
function PayNowModal({ supplierId, supplierName, dueAmount, onClose, isFree, userId }: {
  supplierId: number; supplierName: string; dueAmount: number; onClose: () => void;
  isFree: boolean; userId?: number;
}) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [f, setF] = useState({ amount: String(dueAmount > 0 ? dueAmount : ""), method: "cash", date: today, notes: "" });
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const [error, setError] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      const payAmt = Number(f.amount);
      if (!payAmt || payAmt <= 0) throw new Error("Enter a valid amount");

      // ── Free plan: local storage ─────────────────────────────────────────
      if (isFree && userId) {
        localSupplierPayments.create(userId, {
          supplierId,
          supplierName,
          amount: String(payAmt),
          paymentMethod: f.method,
          date: f.date,
          notes: f.notes || null,
        });
        localSupplierPurchases.applyPayment(userId, supplierId, payAmt);
        return { success: true };
      }

      // ── Pro plan: server ─────────────────────────────────────────────────
      const res = await fetch("/api/supplier-purchases/general-pay", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, supplierName, amount: payAmt, paymentMethod: f.method, date: f.date, notes: f.notes || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-purchases", supplierId] });
      qc.invalidateQueries({ queryKey: ["supplier-balance", supplierId] });
      qc.invalidateQueries({ queryKey: ["supplier-payments", supplierId] });
      qc.invalidateQueries({ queryKey: ["suppliers-balances"] });
      onClose();
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl"
        style={{ background: CARD }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: BORDER }}>
          <h2 className="font-bold text-base">Record Payment</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--muted))", color: MUTED }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5 flex flex-col gap-3">
          <form onSubmit={e => { e.preventDefault(); mut.mutate(); }}>
            <div className="flex flex-col gap-3">
              {dueAmount > 0 && (
                <div className="px-3.5 py-2.5 rounded-xl text-sm font-semibold flex justify-between"
                  style={{ background: "#FEE2E2", color: RED }}>
                  <span>Current Due</span>
                  <span>{fmt(dueAmount)}</span>
                </div>
              )}
              <Field label="Amount *">
                <Input type="text" inputMode="decimal" value={f.amount}
                  onChange={e => set("amount", e.target.value)} placeholder="0.00" autoFocus />
              </Field>
              <Field label="Payment Method">
                <select value={f.method} onChange={e => set("method", e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none appearance-none"
                  style={{ borderColor: BORDER, background: BG }}>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="mobile_banking">Mobile Banking</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Date">
                <Input type="date" value={f.date} onChange={e => set("date", e.target.value)} />
              </Field>
              <Field label="Notes">
                <Input value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Optional" />
              </Field>
              {error && <p className="text-xs" style={{ color: RED }}>{error}</p>}
              <button type="submit" disabled={mut.isPending}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 mt-1"
                style={{ background: GREEN }}>
                {mut.isPending ? "Saving…" : "Record Payment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    paid:    { bg: "#D1FAE5", color: GREEN, label: "Paid"    },
    partial: { bg: "#FEF3C7", color: AMBER, label: "Partial" },
    due:     { bg: "#FEE2E2", color: RED,   label: "Credit"  },
    credit:  { bg: "#FEE2E2", color: RED,   label: "Credit"  },
  };
  const s = map[status] ?? map.credit;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>{s.label}</span>
  );
}

// ─── Invoice Group type (used in both component and detail view) ──────────────
type InvoiceGroup = {
  key: string;
  invoiceNumber: string | null;
  items: Purchase[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  purchaseDate: string;
};

// ─── Invoice Detail Page ──────────────────────────────────────────────────────
function InvoiceDetail({ group, supplierName, sym, onBack }: {
  group: InvoiceGroup; supplierName: string; sym: string; onBack: () => void;
}) {
  const totalUnits = group.items.reduce((s, i) => s + (i.quantity ?? 0), 0);
  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <button onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "hsl(var(--muted))", color: MUTED }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-extrabold truncate">
            {group.invoiceNumber ?? "Purchase"}
          </h1>
          <p className="text-xs" style={{ color: MUTED }}>
            {supplierName} · {dateStr(group.purchaseDate)}
          </p>
        </div>
        <StatusBadge status={group.paymentStatus} />
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl px-2 py-2.5 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: MUTED }}>Total</p>
          <p className="text-xs font-extrabold">{sym}{fmt(group.totalAmount)}</p>
        </div>
        <div className="rounded-xl px-2 py-2.5 text-center" style={{ background: "#D1FAE5" }}>
          <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: GREEN }}>Paid</p>
          <p className="text-xs font-extrabold" style={{ color: GREEN }}>{sym}{fmt(group.paidAmount)}</p>
        </div>
        <div className="rounded-xl px-2 py-2.5 text-center"
          style={{ background: group.dueAmount > 0.001 ? "#FEE2E2" : "#D1FAE5" }}>
          <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5"
            style={{ color: group.dueAmount > 0.001 ? RED : GREEN }}>Due</p>
          <p className="text-xs font-extrabold" style={{ color: group.dueAmount > 0.001 ? RED : GREEN }}>
            {sym}{fmt(group.dueAmount)}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER, background: CARD }}>
        {/* Table header */}
        <div className="grid px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide border-b"
          style={{ borderColor: BORDER, background: "hsl(var(--muted))", color: MUTED,
            gridTemplateColumns: "1fr auto auto auto" }}>
          <span>Product</span>
          <span className="text-center w-10">Qty</span>
          <span className="text-right w-20">Unit</span>
          <span className="text-right w-20">Total</span>
        </div>

        {group.items.map((item, idx) => {
          const unitPrice = item.quantity && Number(item.totalAmount) > 0
            ? Number(item.totalAmount) / item.quantity
            : null;
          return (
            <div key={item.id}
              className="grid px-4 py-3 border-b last:border-0 items-center"
              style={{ borderColor: BORDER, gridTemplateColumns: "1fr auto auto auto" }}>
              <div className="min-w-0 pr-2">
                <p className="text-sm font-semibold truncate">{item.productName ?? `Item ${idx + 1}`}</p>
              </div>
              <span className="text-sm text-center w-10">{item.quantity ?? "—"}</span>
              <span className="text-sm text-right w-20" style={{ color: MUTED }}>
                {unitPrice != null ? `${sym}${fmt(unitPrice)}` : "—"}
              </span>
              <span className="text-sm font-bold text-right w-20">{sym}{fmt(item.totalAmount)}</span>
            </div>
          );
        })}

        {/* Footer totals */}
        <div className="px-4 py-3 border-t flex justify-between items-center"
          style={{ borderColor: BORDER, background: "hsl(var(--muted) / 0.4)" }}>
          <span className="text-xs font-semibold" style={{ color: MUTED }}>
            {group.items.length} product{group.items.length !== 1 ? "s" : ""}
            {totalUnits > 0 ? ` · ${totalUnits} units` : ""}
          </span>
          <span className="text-base font-extrabold" style={{ color: PRIMARY }}>
            {sym}{fmt(group.totalAmount)}
          </span>
        </div>
      </div>

      {/* Notes (if any item has notes) */}
      {group.items.some(i => i.notes) && (
        <div className="rounded-2xl border px-4 py-3" style={{ borderColor: BORDER, background: CARD }}>
          <p className="text-xs font-semibold mb-1" style={{ color: MUTED }}>Notes</p>
          <p className="text-sm">{group.items.find(i => i.notes)?.notes}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SupplierLedger() {
  const [, setLocation] = useLocation();
  const [, params]  = useRoute("/supplier-ledger/:id");
  const supplierId = Number(params?.id);
  const [tab, setTab] = useState<"purchases"|"payments">("purchases");
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showPayNow, setShowPayNow] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceGroup | null>(null);
  const { user } = useAuth();
  const sym = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? user?.currency ?? "$";

  const isFree = !user || user.plan === "Free";
  const userId = user?.id;

  const { data: supplier } = useQuery<Supplier>({
    queryKey: ["supplier", supplierId],
    queryFn: () => {
      // ── Free plan: find in local store ───────────────────────────────────
      if (isFree && userId) {
        const found = localSuppliers.getAll(userId).find(s => s.id === supplierId);
        return Promise.resolve(found ?? null);
      }
      return fetch(`/api/suppliers/${supplierId}`, { credentials: "include" }).then(r => r.json());
    },
    enabled: !!supplierId && !!userId,
  });

  const { data: balance } = useQuery<Balance>({
    queryKey: ["supplier-balance", supplierId],
    queryFn: () => {
      if (isFree && userId) {
        return Promise.resolve(localSupplierPurchases.getBalance(userId, supplierId));
      }
      return fetch(`/api/supplier-purchases/balance?supplierId=${supplierId}`, { credentials: "include" }).then(r => r.json());
    },
    enabled: !!supplierId && !!userId,
  });

  const { data: purchases = [], isLoading: loadingPurchases } = useQuery<Purchase[]>({
    queryKey: ["supplier-purchases", supplierId],
    queryFn: () => {
      if (isFree && userId) {
        return Promise.resolve(localSupplierPurchases.getBySupplierId(userId, supplierId) as Purchase[]);
      }
      return fetch(`/api/supplier-purchases?supplierId=${supplierId}`, { credentials: "include" }).then(r => r.json());
    },
    enabled: !!supplierId && !!userId,
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery<Payment[]>({
    queryKey: ["supplier-payments", supplierId],
    queryFn: () => {
      if (isFree && userId) {
        return Promise.resolve(localSupplierPayments.getBySupplierId(userId, supplierId) as Payment[]);
      }
      return fetch(`/api/supplier-purchases/payments?supplierId=${supplierId}`, { credentials: "include" }).then(r => r.json());
    },
    enabled: !!supplierId && !!userId,
  });

  const totalDue = balance?.totalDue ?? 0;

  // Group purchases by invoice number; solo items (no invoiceNumber) each get their own group
  const invoiceGroups = useMemo<InvoiceGroup[]>(() => {
    const map = new Map<string, InvoiceGroup>();
    for (const p of purchases) {
      const key = p.invoiceNumber ? `inv:${p.invoiceNumber}` : `solo:${p.id}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          invoiceNumber: p.invoiceNumber ?? null,
          items: [],
          totalAmount: 0, paidAmount: 0, dueAmount: 0,
          paymentStatus: p.paymentStatus,
          purchaseDate: p.purchaseDate ?? p.createdAt,
        });
      }
      const g = map.get(key)!;
      g.items.push(p);
      g.totalAmount += Number(p.totalAmount);
      g.paidAmount  += Number(p.paidAmount);
      g.dueAmount   += Number(p.dueAmount);
    }
    // Recompute status for grouped invoices
    for (const g of map.values()) {
      if (g.dueAmount   <= 0.001) g.paymentStatus = "paid";
      else if (g.paidAmount <= 0) g.paymentStatus = "credit";
      else                        g.paymentStatus = "partial";
    }
    return Array.from(map.values())
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }, [purchases]);

  // ── Invoice detail page ───────────────────────────────────────────────────
  if (selectedInvoice) {
    return (
      <ProtectedPage>
        <InvoiceDetail
          group={selectedInvoice}
          supplierName={supplier?.name ?? "Supplier"}
          sym={sym}
          onBack={() => setSelectedInvoice(null)}
        />
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <div className="space-y-4 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <button onClick={() => setLocation("/manage-suppliers")}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--muted))", color: MUTED }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold truncate">{supplier?.name ?? "Supplier"}</h1>
            <p className="text-xs" style={{ color: MUTED }}>Supplier Ledger</p>
          </div>
        </div>

        {/* Balance summary cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl px-2 py-2 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: MUTED }}>Purchased</p>
            <p className="text-xs font-extrabold leading-tight">{sym}{fmt(balance?.totalPurchased ?? 0)}</p>
          </div>
          <div className="rounded-xl px-2 py-2 text-center" style={{ background: "#D1FAE5" }}>
            <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: GREEN }}>Paid</p>
            <p className="text-xs font-extrabold leading-tight" style={{ color: GREEN }}>{sym}{fmt(balance?.totalPaid ?? 0)}</p>
          </div>
          <div className="rounded-xl px-2 py-2 text-center"
            style={{ background: totalDue > 0 ? "#FEE2E2" : "#D1FAE5" }}>
            <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: totalDue > 0 ? RED : GREEN }}>Due</p>
            <p className="text-xs font-extrabold leading-tight" style={{ color: totalDue > 0 ? RED : GREEN }}>
              {sym}{fmt(totalDue)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddPurchase(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs text-white flex-1"
            style={{ background: PRIMARY }}>
            <ShoppingCart className="w-3.5 h-3.5" /> Add Purchase
          </button>
          <button onClick={() => setShowPayNow(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs text-white flex-1"
            style={{ background: GREEN }}>
            <CreditCard className="w-3.5 h-3.5" /> Record Payment
          </button>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl p-1 gap-1" style={{ background: "hsl(var(--muted))" }}>
          {(["purchases", "payments"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all capitalize"
              style={tab === t
                ? { background: CARD, color: PRIMARY, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                : { color: MUTED }}>
              {t}
            </button>
          ))}
        </div>

        {/* Purchases tab — invoice-grouped */}
        {tab === "purchases" && (
          loadingPurchases ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />)}
            </div>
          ) : invoiceGroups.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3" style={{ color: MUTED }} />
              <p className="font-semibold">No purchases yet</p>
              <p className="text-sm mt-1" style={{ color: MUTED }}>Tap "Add Purchase" to record one</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {invoiceGroups.map(g => {
                const isInvoice  = !!g.invoiceNumber;
                const totalUnits = g.items.reduce((s, i) => s + (i.quantity ?? 0), 0);

                return (
                  <button key={g.key}
                    onClick={() => isInvoice ? setSelectedInvoice(g) : undefined}
                    className={`w-full rounded-2xl border overflow-hidden text-left ${isInvoice ? "active:opacity-80" : ""}`}
                    style={{ borderColor: BORDER, background: CARD,
                      cursor: isInvoice ? "pointer" : "default" }}>

                    <div className="px-4 py-3.5 flex items-center gap-3">
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: isInvoice ? "hsl(var(--primary) / 0.1)" : "hsl(var(--muted))" }}>
                        {isInvoice
                          ? <FileText className="w-4 h-4" style={{ color: PRIMARY }} />
                          : <Package  className="w-4 h-4" style={{ color: MUTED }} />}
                      </div>

                      {/* Title + meta */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">
                          {isInvoice ? g.invoiceNumber : (g.items[0]?.productName ?? "Purchase")}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                          {dateStr(g.purchaseDate)}
                          {isInvoice
                            ? ` · ${g.items.length} item${g.items.length !== 1 ? "s" : ""}${totalUnits > 0 ? ` · ${totalUnits} units` : ""}`
                            : (g.items[0]?.quantity ? ` · Qty: ${g.items[0].quantity}` : "")}
                        </p>
                      </div>

                      {/* Amount + status */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <p className="text-sm font-bold">{sym}{fmt(g.totalAmount)}</p>
                        <StatusBadge status={g.paymentStatus} />
                      </div>

                      {/* Arrow for invoices */}
                      {isInvoice && (
                        <ChevronDown className="w-4 h-4 flex-shrink-0 -rotate-90"
                          style={{ color: MUTED }} />
                      )}
                    </div>

                    {/* Paid/due pill */}
                    {g.dueAmount > 0.001 && (
                      <div className="px-4 pb-3 flex gap-3 text-xs">
                        <span style={{ color: GREEN }}>Paid: {sym}{fmt(g.paidAmount)}</span>
                        <span style={{ color: RED }}>Due: {sym}{fmt(g.dueAmount)}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )
        )}

        {/* Payments tab */}
        {tab === "payments" && (
          loadingPayments ? (
            <div className="space-y-2">
              {[1,2].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />)}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-10 h-10 mx-auto mb-3" style={{ color: MUTED }} />
              <p className="font-semibold">No payments recorded</p>
              <p className="text-sm mt-1" style={{ color: MUTED }}>Tap "Record Payment" to add one</p>
            </div>
          ) : (
            <div className="rounded-2xl border divide-y overflow-hidden" style={{ borderColor: BORDER, background: CARD }}>
              {payments.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#D1FAE5" }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: GREEN }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold capitalize">{p.paymentMethod}</p>
                    <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                      {dateStr(p.date ?? p.createdAt)}
                      {p.notes ? ` · ${p.notes}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-bold flex-shrink-0" style={{ color: GREEN }}>
                    +{sym}{fmt(p.amount)}
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {showAddPurchase && supplier && (
        <AddPurchaseModal
          supplierId={supplierId}
          supplierName={supplier.name}
          isFree={isFree}
          userId={userId}
          onClose={() => setShowAddPurchase(false)}
        />
      )}
      {showPayNow && supplier && (
        <PayNowModal
          supplierId={supplierId}
          supplierName={supplier.name}
          dueAmount={totalDue}
          isFree={isFree}
          userId={userId}
          onClose={() => setShowPayNow(false)}
        />
      )}
    </ProtectedPage>
  );
}
