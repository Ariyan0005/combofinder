import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft, Plus, CreditCard, TrendingDown, CheckCircle2,
  Clock, DollarSign, ShoppingCart, X, AlertCircle,
} from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";

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
  paymentStatus: "paid" | "partial" | "due";
  purchaseDate?: string; notes?: string; createdAt: string;
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

// ─── Add Purchase Modal (multi-item invoice) ──────────────────────────────────
function AddPurchaseModal({ supplierId, supplierName, onClose }: {
  supplierId: number; supplierName: string; onClose: () => void;
}) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
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
  const dueAmount = Math.max(0, invoiceTotal - (Number(paidAmount) || 0));
  const payStatus = dueAmount <= 0 ? "paid" : Number(paidAmount) <= 0 ? "credit" : "partial";
  const validLines = lines.filter(l => Number(l.qty) > 0 && Number(l.unitPrice) > 0 && (l.item || l.search.trim()));
  const stockLines = validLines.filter(l => l.item);

  const mut = useMutation({
    mutationFn: async () => {
      if (validLines.length === 0) throw new Error("Add at least one item with quantity and price");
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
                <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="e.g. INV-001" />
              </Field>
              <Field label="Purchase Date">
                <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
              </Field>
            </div>

            {/* Line items */}
            <div>
              <label className="text-xs font-semibold block mb-2" style={{ color: MUTED }}>Items *</label>
              <div className="flex flex-col gap-2">
                {lines.map((line) => (
                  <div key={line._key} className="rounded-xl border" style={{ borderColor: BORDER }}>
                    <div className="p-3">
                      {/* Product selector */}
                      {!line.item ? (
                        <div className="relative mb-2">
                          <Input placeholder="Search inventory or type product name…"
                            value={line.search}
                            onChange={e => patchLine(line._key, { search: e.target.value, showDrop: true })}
                            onFocus={() => patchLine(line._key, { showDrop: true })}
                            onBlur={() => setTimeout(() => patchLine(line._key, { showDrop: false }), 150)} />
                          {line.showDrop && line.search && (() => {
                            const hits = inventoryItems
                              .filter(i => i.partName.toLowerCase().includes(line.search.toLowerCase()))
                              .slice(0, 5);
                            return hits.length > 0 ? (
                              <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border shadow-lg overflow-hidden"
                                style={{ background: CARD, borderColor: BORDER }}>
                                {hits.map(i => (
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
              <Input type="number" min="0" step="0.01" value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)} placeholder="0.00" />
            </Field>
            {invoiceTotal > 0 && (
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm"
                style={{ background: dueAmount > 0 ? "#FEF3C7" : "#D1FAE5" }}>
                <span className="font-medium" style={{ color: dueAmount > 0 ? AMBER : GREEN }}>
                  {dueAmount > 0 ? `Due: ${fmt(dueAmount)}` : "✓ Fully Paid"}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: payStatus === "paid" ? GREEN : payStatus === "partial" ? AMBER : RED }}>
                  {payStatus === "paid" ? "PAID" : payStatus === "partial" ? "PARTIAL" : "CREDIT"}
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
              {mut.isPending ? "Saving…"
                : stockLines.length > 0
                  ? `Save & Update Stock (${validLines.length} item${validLines.length > 1 ? "s" : ""})`
                  : `Save Invoice (${validLines.length} item${validLines.length > 1 ? "s" : ""})`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Pay Now Modal ────────────────────────────────────────────────────────────
function PayNowModal({ supplierId, supplierName, dueAmount, onClose }: {
  supplierId: number; supplierName: string; dueAmount: number; onClose: () => void;
}) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    amount: String(dueAmount > 0 ? dueAmount : ""),
    paymentMethod: "cash",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const [error, setError] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/supplier-purchases/general-pay", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId, supplierName,
          amount: Number(f.amount),
          paymentMethod: f.paymentMethod,
          date: f.date,
          notes: f.notes || null,
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
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--muted))", color: MUTED }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5 overflow-y-auto" style={{ maxHeight: "70vh" }}>
          <form onSubmit={e => {
            e.preventDefault();
            if (!f.amount || Number(f.amount) <= 0) { setError("Amount required"); return; }
            mut.mutate();
          }} className="flex flex-col gap-3">
            <Field label="Amount Paid *">
              <Input type="number" min="0.01" step="0.01" value={f.amount}
                onChange={e => set("amount", e.target.value)} placeholder="0.00" autoFocus />
            </Field>
            <Field label="Payment Method">
              <select value={f.paymentMethod} onChange={e => set("paymentMethod", e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
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
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "paid"|"partial"|"due" }) {
  const map = {
    paid:    { bg: "#D1FAE5", color: GREEN,  label: "Paid" },
    partial: { bg: "#FEF3C7", color: AMBER,  label: "Partial" },
    due:     { bg: "#FEE2E2", color: RED,    label: "Credit" },
  };
  const s = map[status] ?? map.due;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>{s.label}</span>
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

  const { data: supplier } = useQuery<Supplier>({
    queryKey: ["supplier", supplierId],
    queryFn: () => fetch(`/api/suppliers/${supplierId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!supplierId,
  });

  const { data: balance } = useQuery<Balance>({
    queryKey: ["supplier-balance", supplierId],
    queryFn: () => fetch(`/api/supplier-purchases/balance?supplierId=${supplierId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!supplierId,
  });

  const { data: purchases = [], isLoading: loadingPurchases } = useQuery<Purchase[]>({
    queryKey: ["supplier-purchases", supplierId],
    queryFn: () => fetch(`/api/supplier-purchases?supplierId=${supplierId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!supplierId,
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery<Payment[]>({
    queryKey: ["supplier-payments", supplierId],
    queryFn: () => fetch(`/api/supplier-purchases/payments?supplierId=${supplierId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!supplierId,
  });

  const totalDue = balance?.totalDue ?? 0;

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
          <div className="rounded-2xl p-3 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-[10px] font-semibold mb-1" style={{ color: MUTED }}>Purchased</p>
            <p className="text-sm font-extrabold">${fmt(balance?.totalPurchased ?? 0)}</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: "#D1FAE5" }}>
            <p className="text-[10px] font-semibold mb-1" style={{ color: GREEN }}>Paid</p>
            <p className="text-sm font-extrabold" style={{ color: GREEN }}>${fmt(balance?.totalPaid ?? 0)}</p>
          </div>
          <div className="rounded-2xl p-3 text-center"
            style={{ background: totalDue > 0 ? "#FEE2E2" : "#D1FAE5" }}>
            <p className="text-[10px] font-semibold mb-1" style={{ color: totalDue > 0 ? RED : GREEN }}>Due</p>
            <p className="text-sm font-extrabold" style={{ color: totalDue > 0 ? RED : GREEN }}>
              ${fmt(totalDue)}
            </p>
          </div>
        </div>

        {/* Due alert + Pay Now */}
        {totalDue > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: "#FEF3C7", border: `1px solid ${AMBER}` }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: AMBER }} />
            <p className="text-xs font-semibold flex-1" style={{ color: "#92400E" }}>
              ${fmt(totalDue)} still owed to {supplier?.name}
            </p>
            <button onClick={() => setShowPayNow(true)}
              className="text-xs font-bold text-white px-3 py-1.5 rounded-xl"
              style={{ background: GREEN }}>
              Pay Now
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setShowAddPurchase(true)}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white"
            style={{ background: PRIMARY }}>
            <ShoppingCart className="w-4 h-4" /> Add Purchase
          </button>
          <button onClick={() => setShowPayNow(true)}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white"
            style={{ background: GREEN }}>
            <CreditCard className="w-4 h-4" /> Record Payment
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "hsl(var(--muted))" }}>
          {(["purchases", "payments"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={tab === t
                ? { background: CARD, color: PRIMARY, boxShadow: "0 1px 4px rgba(0,0,0,.08)" }
                : { color: MUTED }}>
              {t === "purchases" ? `Purchases (${purchases.length})` : `Payments (${payments.length})`}
            </button>
          ))}
        </div>

        {/* Purchases list */}
        {tab === "purchases" && (
          loadingPurchases ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />)}
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3" style={{ color: MUTED }} />
              <p className="font-semibold">No purchases yet</p>
              <p className="text-sm mt-1" style={{ color: MUTED }}>Tap "Add Purchase" to record one</p>
            </div>
          ) : (
            <div className="rounded-2xl border divide-y overflow-hidden" style={{ borderColor: BORDER, background: CARD }}>
              {purchases.map(p => (
                <div key={p.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.productName || "Purchase"}</p>
                      <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                        {dateStr(p.purchaseDate ?? p.createdAt)}
                        {p.quantity ? ` · Qty: ${p.quantity}` : ""}
                      </p>
                      {p.notes && <p className="text-xs mt-0.5 truncate" style={{ color: MUTED }}>{p.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <StatusBadge status={p.paymentStatus} />
                      <p className="text-sm font-bold">${fmt(p.totalAmount)}</p>
                    </div>
                  </div>
                  {Number(p.dueAmount) > 0 && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: BORDER }}>
                      <span className="text-xs" style={{ color: MUTED }}>
                        Paid: ${fmt(p.paidAmount)} &nbsp;·&nbsp; Due: <span style={{ color: RED }}>${fmt(p.dueAmount)}</span>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Payments list */}
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
                    +${fmt(p.amount)}
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
          onClose={() => setShowAddPurchase(false)}
        />
      )}
      {showPayNow && supplier && (
        <PayNowModal
          supplierId={supplierId}
          supplierName={supplier.name}
          dueAmount={totalDue}
          onClose={() => setShowPayNow(false)}
        />
      )}
    </ProtectedPage>
  );
}
