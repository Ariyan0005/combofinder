import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Search, Receipt, ChevronRight, X, Download, RotateCcw,
  CheckCircle, FileDown, ArrowLeft, Package,
} from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";
import { generateInvoicePdf, generateSalesReportPdf } from "@/lib/invoice-pdf";
import { saleToInvoiceData } from "@/pages/pos";
import { useAuth } from "@/context/auth-context";
import { localSales, localInventory } from "@/lib/local-store";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", BDT: "৳", INR: "₹",
  PKR: "₨", NPR: "रू", LKR: "Rs", AED: "د.إ", SAR: "﷼",
  OMR: "OMR", KWD: "KD", QAR: "QR", MYR: "RM", SGD: "S$",
};

const PRIMARY = "hsl(var(--primary))";
const MUTED = "hsl(var(--muted-foreground))";
const BORDER = "hsl(var(--border))";
const CARD = "hsl(var(--card))";

type Sale = {
  id: number; invoiceNumber: string; date: string; customerName?: string; customerPhone?: string;
  subtotal: string; discount: string; total: string; paymentMethod: string; status: string;
  advancePaid?: string;
};

type SaleItem = { id: number; partName: string; quantity: number; unitPrice: string; total: string; returnedQuantity: number; };
type SaleDetail = Sale & { items: SaleItem[]; returns: any[]; advancePaid?: string; };

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  "Completed": { bg: "#ECFDF5", color: "#059669" },
  "Returned": { bg: "#FEF2F2", color: "#DC2626" },
  "Partially Returned": { bg: "#FFF7E6", color: "#D97706" },
};

export default function Invoices() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const sym      = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? user?.currency ?? "$";
  const shopName = user?.shopName ?? user?.name ?? "My Shop";
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [creditOnly, setCreditOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [returnMode, setReturnMode] = useState(false);
  const [returnQty, setReturnQty] = useState<Record<number, string>>({});
  const [returnReason, setReturnReason] = useState("");
  const [returnError, setReturnError] = useState("");

  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (search) params.set("q", search);

  const isPro = user?.plan === "Pro";

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ["sales", from, to, search, isPro, user?.id],
    queryFn: () => {
      if (!isPro && user?.id) {
        let list = localSales.getAll(user.id) as Sale[];
        if (from) list = list.filter(s => (s.date ?? "") >= from);
        if (to)   list = list.filter(s => (s.date ?? "") <= to);
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(s =>
            (s.invoiceNumber ?? "").toLowerCase().includes(q) ||
            (s.customerName  ?? "").toLowerCase().includes(q) ||
            (s.customerPhone ?? "").toLowerCase().includes(q)
          );
        }
        return Promise.resolve(list);
      }
      return fetch(`/api/sales?${params.toString()}`, { credentials: "include" }).then(r => r.json());
    },
    enabled: !!user?.id,
  });

  const { data: detail } = useQuery<SaleDetail>({
    queryKey: ["sale", selectedId, isPro, user?.id],
    queryFn: async () => {
      if (!isPro && user?.id && selectedId != null) {
        const s = localSales.getById(user.id, selectedId);
        if (!s) throw new Error("Invoice not found");
        return s as SaleDetail;
      }
      const r = await fetch(`/api/sales/${selectedId}`, { credentials: "include" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed to load invoice");
      return d;
    },
    enabled: selectedId != null,
  });

  const returnMut = useMutation({
    mutationFn: async () => {
      const returnItems = Object.entries(returnQty)
        .filter(([, q]) => Number(q) > 0)
        .map(([saleItemId, q]) => ({ saleItemId: Number(saleItemId), quantity: Number(q) }));
      if (returnItems.length === 0) throw new Error("Enter a quantity to return");

      if (!isPro && user?.id && selectedId != null) {
        const uid = user.id;
        const sale = localSales.getById(uid, selectedId);
        if (!sale) throw new Error("Invoice not found");
        // Restore inventory quantities for returned items
        for (const { saleItemId, quantity } of returnItems) {
          const saleItem = (sale.items ?? []).find((i: any) => i.id === saleItemId);
          if (!saleItem) continue;
          if (saleItem.inventoryId) {
            const inv = localInventory.getAll(uid).find((i: any) => i.id === saleItem.inventoryId);
            if (inv) localInventory.update(uid, inv.id, { quantity: inv.quantity + quantity });
          }
          saleItem.returnedQuantity = (saleItem.returnedQuantity ?? 0) + quantity;
        }
        const now = new Date().toISOString().slice(0, 10);
        const returnRecords = returnItems.map(ri => ({
          id: -(Date.now() + Math.random()),
          saleItemId: ri.saleItemId,
          quantity: ri.quantity,
          refundAmount: 0,
          reason: returnReason || null,
          date: now,
        }));
        const updatedReturns = [...(sale.returns ?? []), ...returnRecords];
        const allReturned = (sale.items ?? []).every((i: any) => i.returnedQuantity >= i.quantity);
        const status = allReturned ? "Returned" : "Partially Returned";
        localSales.update(uid, selectedId, { items: sale.items, returns: updatedReturns, status });
        return {};
      }

      const res = await fetch(`/api/sales/${selectedId}/return`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: returnItems, reason: returnReason || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Return failed");
      return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["sale", selectedId] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setReturnMode(false); setReturnQty({}); setReturnReason(""); setReturnError("");
    },
    onError: (e: any) => setReturnError(e.message),
  });

  function exportCsv() {
    if (!isPro) return; // CSV export is server-side only
    window.open(`/api/sales/export?${params.toString()}`, "_blank");
  }

  function exportPdf() {
    const rows = sales.map(s => ({
      invoiceNumber: s.invoiceNumber, date: s.date, customerName: s.customerName,
      total: Number(s.total), status: s.status, paymentMethod: s.paymentMethod,
    }));
    generateSalesReportPdf(rows, from, to, shopName, sym);
  }

  // ── Invoice detail view ──────────────────────────────────────────────────
  if (selectedId != null) {
    return (
      <ProtectedPage>
        <div className="space-y-4 pb-6">
          <button onClick={() => { setSelectedId(null); setReturnMode(false); }}
            className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: MUTED }}>
            <ArrowLeft className="w-4 h-4" /> Back to Invoices
          </button>

          {!detail ? (
            <div className="h-40 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
          ) : (
            <>
              <div className="rounded-2xl border p-4" style={{ borderColor: BORDER, background: CARD }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-lg font-extrabold">{detail.invoiceNumber}</h1>
                    <p className="text-xs mt-0.5" style={{ color: MUTED }}>{detail.date}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={STATUS_COLOR[detail.status] ?? { bg: "hsl(var(--muted))", color: MUTED }}>
                    {detail.status}
                  </span>
                </div>
                {(detail.customerName || detail.customerPhone) && (
                  <p className="text-xs mt-2" style={{ color: MUTED }}>
                    {detail.customerName} {detail.customerPhone && `· ${detail.customerPhone}`}
                  </p>
                )}

                <div className="mt-4 divide-y" style={{ borderColor: BORDER }}>
                  {detail.items.map(it => {
                    const eligible = it.quantity - it.returnedQuantity;
                    return (
                      <div key={it.id} className="py-2.5 flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 flex-shrink-0" style={{ color: MUTED }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{it.partName}</p>
                          <p className="text-xs" style={{ color: MUTED }}>
                            {it.quantity} × {sym}{Number(it.unitPrice).toLocaleString()}
                            {it.returnedQuantity > 0 && <span> · {it.returnedQuantity} returned</span>}
                          </p>
                        </div>
                        {returnMode ? (
                          <input type="number" min="0" max={eligible} placeholder="0"
                            value={returnQty[it.id] ?? ""}
                            onChange={e => setReturnQty(prev => ({ ...prev, [it.id]: e.target.value }))}
                            disabled={eligible === 0}
                            className="w-16 text-xs px-2 py-1.5 rounded-lg border outline-none disabled:opacity-30" style={{ borderColor: BORDER }} />
                        ) : (
                          <span className="text-sm font-bold">{sym}{Number(it.total).toLocaleString()}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 pt-3 border-t space-y-1.5" style={{ borderColor: BORDER }}>
                  <div className="flex justify-between text-xs"><span style={{ color: MUTED }}>Subtotal</span><span>{sym}{Number(detail.subtotal).toLocaleString()}</span></div>
                  {Number(detail.discount) > 0 && (
                    <div className="flex justify-between text-xs"><span style={{ color: MUTED }}>Discount</span><span style={{ color: "#DC2626" }}>-{sym}{Number(detail.discount).toLocaleString()}</span></div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-1 border-t" style={{ borderColor: BORDER }}>
                    <span>Total</span>
                    <span style={{ color: PRIMARY }}>{sym}{Number(detail.total).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1"><span style={{ color: MUTED }}>Payment Method</span><span className="font-semibold">{detail.paymentMethod}</span></div>
                  {/* Credit sale breakdown */}
                  {detail.paymentMethod === "Credit" && (() => {
                    const total = Number(detail.total);
                    const advance = Number(detail.advancePaid ?? 0);
                    const totalRefunded = (detail.returns ?? []).reduce(
                      (s: number, r: any) => s + Number(r.refundAmount), 0
                    );
                    const due = Math.max(0, total - advance - totalRefunded);
                    return (
                      <div className="mt-2 p-3 rounded-xl space-y-1.5" style={{ background: "#FFF7E6", border: "1px solid #F59E0B60" }}>
                        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#D97706" }}>Credit Sale Details</p>
                        {advance > 0 && (
                          <div className="flex justify-between text-xs">
                            <span style={{ color: "#92400E" }}>Advance Collected</span>
                            <span className="font-bold" style={{ color: "#059669" }}>{sym}{advance.toLocaleString()}</span>
                          </div>
                        )}
                        {totalRefunded > 0 && (
                          <div className="flex justify-between text-xs">
                            <span style={{ color: "#92400E" }}>Refunded (Returns)</span>
                            <span className="font-bold" style={{ color: "#059669" }}>{sym}{totalRefunded.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-bold">
                          <span style={{ color: "#D97706" }}>Amount Due</span>
                          <span style={{ color: due > 0 ? "#DC2626" : "#059669" }}>
                            {due > 0 ? `${sym}${due.toLocaleString()}` : "Settled ✓"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {detail.returns?.length > 0 && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: BORDER }}>
                    <p className="text-xs font-bold mb-1.5" style={{ color: MUTED }}>RETURN HISTORY</p>
                    {detail.returns.map((r: any) => (
                      <p key={r.id} className="text-xs" style={{ color: MUTED }}>
                        {r.date} · {r.quantity} unit(s) · refunded {sym}{Number(r.refundAmount).toLocaleString()} {r.reason && `— ${r.reason}`}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {returnMode ? (
                <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: BORDER, background: CARD }}>
                  <p className="text-sm font-bold">Process Return / Refund</p>
                  <input value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder="Reason (optional)"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: BORDER }} />
                  {returnError && <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{returnError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setReturnMode(false); setReturnQty({}); setReturnError(""); }}
                      className="flex-1 py-2.5 rounded-xl font-semibold text-sm border" style={{ borderColor: BORDER }}>Cancel</button>
                    <button onClick={() => returnMut.mutate()} disabled={returnMut.isPending}
                      className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-60" style={{ background: "hsl(var(--destructive))" }}>
                      {returnMut.isPending ? "Processing…" : "Confirm Return"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => {
                    const d = saleToInvoiceData(detail);
                    d.shopName = shopName; d.currencySymbol = sym;
                    generateInvoicePdf(d);
                  }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white" style={{ background: PRIMARY }}>
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  {detail.status !== "Returned" && (
                    <button onClick={() => setReturnMode(true)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border" style={{ borderColor: BORDER }}>
                      <RotateCcw className="w-4 h-4" /> Return / Refund
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </ProtectedPage>
    );
  }

  // ── Invoice list view ────────────────────────────────────────────────────
  const isRangeFiltered = !!(from || to);
  const rangeTotal = sales.reduce((s, sale) => s + Number(sale.total), 0);
  const rangeCreditDue = sales.reduce((s, sale) => {
    if (sale.paymentMethod !== "Credit") return s;
    if ((sale as any).status === "Returned") return s;
    const due = Number(sale.total) - Number(sale.advancePaid ?? 0) - Number((sale as any).totalRefund ?? 0);
    return s + (due > 0.005 ? due : 0);
  }, 0);

  return (
    <ProtectedPage>
      <div className="space-y-3 pb-6">
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-extrabold">Invoices</h1>
            <p className="text-xs" style={{ color: MUTED }}>{sales.length} invoice{sales.length !== 1 ? "s" : ""}{isRangeFiltered ? " in selected range" : ""}</p>
          </div>
          <Link href="/pos">
            <button className="px-3.5 py-2 rounded-xl text-xs font-bold text-white" style={{ background: PRIMARY }}>
              + New Sale
            </button>
          </Link>
        </div>

        {/* Summary */}
        {sales.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border p-3" style={{ borderColor: BORDER, background: CARD }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: MUTED }}>Total Value</p>
              <p className="font-bold text-base">{sym}{rangeTotal.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border p-3" style={{ borderColor: BORDER, background: rangeCreditDue > 0 ? "#FEF2F2" : CARD }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: rangeCreditDue > 0 ? "#DC2626" : MUTED }}>Credit Due</p>
              <p className="font-bold text-base" style={{ color: rangeCreditDue > 0 ? "#DC2626" : undefined }}>{sym}{rangeCreditDue.toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice #, customer, phone…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm outline-none"
            style={{ borderColor: BORDER, background: CARD }} />
        </div>

        <div className="rounded-2xl border p-3 space-y-2" style={{ borderColor: BORDER, background: CARD }}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Date Range</p>
            {isRangeFiltered && (
              <button onClick={() => { setFrom(""); setTo(""); }} className="text-[11px] font-bold" style={{ color: PRIMARY }}>
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold block mb-1" style={{ color: MUTED }}>From</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} max={to || undefined}
                className="w-full px-2.5 py-2 rounded-lg border text-xs outline-none" style={{ borderColor: BORDER, background: "hsl(var(--background))" }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold block mb-1" style={{ color: MUTED }}>To</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} min={from || undefined}
                className="w-full px-2.5 py-2 rounded-lg border text-xs outline-none" style={{ borderColor: BORDER, background: "hsl(var(--background))" }} />
            </div>
          </div>
        </div>

        {/* Credit filter chip + export buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreditOnly(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all"
            style={creditOnly
              ? { background: "#FFF7E6", color: "#D97706", borderColor: "#F59E0B" }
              : { borderColor: BORDER, color: MUTED }}>
            ⚠ Credit Only {creditOnly && `(${sales.filter(s => s.paymentMethod === "Credit" && (Number(s.total) - Number(s.advancePaid ?? 0) - Number((s as any).totalRefund ?? 0)) > 0.005 && (s as any).status !== "Returned").length})`}
          </button>
          <div className="flex-1" />
          <button onClick={exportCsv} disabled={sales.length === 0}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold border disabled:opacity-40" style={{ borderColor: BORDER }}>
            <FileDown className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={exportPdf} disabled={sales.length === 0}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold border disabled:opacity-40" style={{ borderColor: BORDER }}>
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>

        {(() => {
          const filtered = creditOnly
            ? sales.filter(s => s.paymentMethod === "Credit" && (s as any).status !== "Returned" && (Number(s.total) - Number(s.advancePaid ?? 0) - Number((s as any).totalRefund ?? 0)) > 0.005)
            : sales;
          return isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Receipt className="w-10 h-10 mx-auto mb-3" style={{ color: MUTED }} />
              <p className="font-semibold">{creditOnly ? "No credit sales found" : "No invoices yet"}</p>
              <p className="text-sm mt-1" style={{ color: MUTED }}>
                {creditOnly ? "Try removing the Credit filter" : "Sales from the POS will show up here"}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border divide-y overflow-hidden" style={{ borderColor: BORDER, background: CARD }}>
              {filtered.map(s => (
                <button key={s.id} onClick={() => setSelectedId(s.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--muted))" }}>
                    <Receipt className="w-4 h-4" style={{ color: MUTED }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold truncate">{s.invoiceNumber}</p>
                      {s.paymentMethod === "Credit" && (() => {
                        const due = Math.max(0, Number(s.total) - Number(s.advancePaid ?? 0));
                        return due > 0.005
                          ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: "#FFF7E6", color: "#D97706" }}>CREDIT</span>
                          : <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: "#ECFDF5", color: "#059669" }}>SETTLED</span>;
                      })()}
                    </div>
                    <p className="text-xs truncate" style={{ color: MUTED }}>
                      {s.date} {s.customerName && `· ${s.customerName}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-bold">{sym}{Number(s.total).toLocaleString()}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={STATUS_COLOR[s.status] ?? { bg: "hsl(var(--muted))", color: MUTED }}>
                      {s.status}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: MUTED }} />
                </button>
              ))}
            </div>
          );
        })()}
      </div>
    </ProtectedPage>
  );
}
