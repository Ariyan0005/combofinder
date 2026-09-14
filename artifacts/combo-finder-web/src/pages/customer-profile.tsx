import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Phone, MessageSquare, Wrench, X, Receipt, CreditCard,
  CheckCircle, ShoppingBag, Share2, Package, Filter, FileDown,
  ChevronDown, ChevronUp, Check, RotateCcw, Minus, Plus, Loader2, AlertCircle,
} from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";
import { generateInvoicePdf, generateInvoicePdfBlob, generateSalesReportPdf } from "@/lib/invoice-pdf";
import { saleToInvoiceData } from "@/pages/pos";
import { useAuth } from "@/context/auth-context";
import { localCustomers, localSales } from "@/lib/local-store";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", BDT: "Tk", INR: "₹",
  PKR: "₨", NPR: "रू", LKR: "Rs", AED: "د.إ", SAR: "﷼",
  OMR: "OMR", KWD: "KD", QAR: "QR", MYR: "RM", SGD: "S$",
};

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  Waiting:   { text: "#F59E0B", bg: "#FFF7E6" },
  Repairing: { text: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.1)" },
  Ready:     { text: "#10B981", bg: "#ECFDF5" },
  Delivered: { text: "#6B7280", bg: "#F3F4F6" },
  Cancelled: { text: "#EF4444", bg: "#FEF2F2" },
};

// ── Sale badge helper ─────────────────────────────────────────────────────────
function saleBadge(s: { paymentMethod: string; total: string; advancePaid?: string; totalRefund?: number; status?: string }) {
  if (s.paymentMethod !== "Credit") {
    return { label: s.paymentMethod, bg: "#F3F4F6", color: "#6B7280" };
  }
  if (s.status === "Returned") return { label: "Paid", bg: "#ECFDF5", color: "#059669" };
  const total   = Number(s.total);
  const advance = Number(s.advancePaid ?? 0);
  const refund  = Number(s.totalRefund ?? 0);
  const due     = Math.max(0, total - advance - refund);
  if (due <= 0)              return { label: "Paid",    bg: "#ECFDF5", color: "#059669" };
  if (advance > 0 || refund > 0) return { label: "Partial", bg: "#FFF7E6", color: "#D97706" };
  return                         { label: "Credit",   bg: "#FEF3C7", color: "#D97706" };
}

// ── Invoice Detail Modal ──────────────────────────────────────────────────────
function InvoiceDetailModal({
  saleId,
  sym,
  shopName,
  shopAddress,
  shopPhone,
  shopLogo,
  customerId,
  userId,
  isLocalStore,
  onClose,
  onReturned,
}: {
  saleId: number;
  sym: string;
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  shopLogo?: string | null;
  customerId?: number;
  userId?: number;
  isLocalStore?: boolean;
  onClose: () => void;
  onReturned?: () => void;
}) {
  const qc = useQueryClient();

  // Block body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const [showReturnView, setShowReturnView] = useState(false);
  const [returnQtys, setReturnQtys] = useState<Record<number, number>>({});
  const [returnReason, setReturnReason] = useState("");
  const [returnError, setReturnError] = useState("");
  const [returnSuccessMsg, setReturnSuccessMsg] = useState("");
  const [isReturning, setIsReturning] = useState(false);

  const { data: detail, isLoading } = useQuery<any>({
    queryKey: ["sale-detail", saleId],
    queryFn: () => {
      if (isLocalStore && userId) {
        return localSales.getById(userId, saleId);
      }
      return fetch(`/api/sales/${saleId}`, { credentials: "include" }).then(r => r.json());
    },
    enabled: !!saleId,
  });

  async function handleDownload() {
    if (!detail) return;
    const data = saleToInvoiceData(detail);
    data.shopName = shopName;
    data.shopAddress = shopAddress;
    data.shopPhone = shopPhone;
    data.shopLogo = shopLogo;
    data.currencySymbol = sym;
    await generateInvoicePdf(data);
  }

  async function handleShare() {
    if (!detail) return;
    const data = saleToInvoiceData(detail);
    data.shopName = shopName;
    data.shopAddress = shopAddress;
    data.shopPhone = shopPhone;
    data.shopLogo = shopLogo;
    data.currencySymbol = sym;

    const blob = await generateInvoicePdfBlob(data);
    const file = new File([blob], `${data.invoiceNumber}.pdf`, { type: "application/pdf" });

    if (typeof navigator.share !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: `Invoice ${data.invoiceNumber}`, files: [file] });
        return; // shared or dismissed — do NOT auto-download
      } catch (err: any) {
        if (err?.name === "AbortError") return; // user cancelled — no download
      }
    }
    handleDownload();
  }

  const items = detail?.items ?? [];
  const returnableItems = items.filter((it: any) => (it.quantity - (it.returnedQuantity ?? 0)) > 0);
  const isFullyReturned = detail?.status === "Returned" || (items.length > 0 && returnableItems.length === 0);

  function startReturnProcess() {
    const initial: Record<number, number> = {};
    items.forEach((it: any) => {
      const remaining = it.quantity - (it.returnedQuantity ?? 0);
      if (remaining > 0) initial[it.id] = remaining;
    });
    setReturnQtys(initial);
    setReturnReason("");
    setReturnError("");
    setShowReturnView(true);
  }

  const calculatedRefundTotal = items.reduce((acc: number, it: any) => {
    const qty = returnQtys[it.id] || 0;
    return acc + (qty * (Number(it.unitPrice) || 0));
  }, 0);

  async function handleConfirmReturn() {
    const itemsToReturn = Object.entries(returnQtys)
      .map(([idStr, qty]) => ({ saleItemId: Number(idStr), quantity: Number(qty) }))
      .filter(it => it.quantity > 0);

    if (itemsToReturn.length === 0) {
      setReturnError("Please select at least 1 item quantity to return.");
      return;
    }

    setIsReturning(true);
    setReturnError("");

    try {
      if (isLocalStore && userId) {
        localSales.returnItems(userId, saleId, itemsToReturn, returnReason);
      } else {
        const res = await fetch(`/api/sales/${saleId}/return`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            items: itemsToReturn,
            reason: returnReason || "Returned from Customer Profile",
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to process return");
        }
      }

      await qc.invalidateQueries({ queryKey: ["sale-detail", saleId] });
      await qc.invalidateQueries({ queryKey: ["sales"] });
      if (customerId) {
        await qc.invalidateQueries({ queryKey: ["customer", customerId] });
        await qc.invalidateQueries({ queryKey: ["customer-sales", customerId] });
      }
      await qc.invalidateQueries({ queryKey: ["inventory"] });
      await qc.invalidateQueries({ queryKey: ["sales-summary"] });
      
      onReturned?.();
      setShowReturnView(false);
      setReturnSuccessMsg("Bill returned successfully! Stock and dues have been updated.");
      setTimeout(() => setReturnSuccessMsg(""), 4000);
    } catch (err: any) {
      setReturnError(err.message || "Failed to process return.");
    } finally {
      setIsReturning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: "hsl(var(--card))", maxHeight: "88vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pt-5 pb-4 border-b flex-shrink-0"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2">
            {showReturnView ? (
              <button
                onClick={() => setShowReturnView(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center -ml-1.5 transition-colors"
                style={{ background: "hsl(var(--muted))" }}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <Receipt className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            )}
            <div>
              <h3 className="font-bold text-base leading-tight">
                {showReturnView ? "Return Bill" : (isLoading ? "Loading…" : detail?.invoiceNumber ?? "Invoice")}
              </h3>
              {showReturnView && (
                <p className="text-[11px] text-muted-foreground font-medium">{detail?.invoiceNumber}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Banner */}
        {returnSuccessMsg && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{returnSuccessMsg}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 rounded-xl animate-pulse"
                  style={{ background: "hsl(var(--muted))" }} />
              ))}
            </div>
          ) : detail ? (
            showReturnView ? (
              /* ── RETURN BILL FORM ── */
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl border bg-amber-50/70 border-amber-200/80 text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>Return & Stock Restock</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Selected items will be automatically returned to inventory stock, and customer dues or refund totals will be adjusted.
                  </p>
                </div>

                {/* Items selection */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Select Items to Return
                  </label>
                  <div className="space-y-2">
                    {items.map((it: any) => {
                      const returnedSoFar = it.returnedQuantity ?? 0;
                      const maxReturnable = it.quantity - returnedSoFar;
                      const currentQty = returnQtys[it.id] ?? 0;
                      const isUnavailable = maxReturnable <= 0;

                      return (
                        <div
                          key={it.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isUnavailable ? "opacity-50 bg-slate-50 border-dashed" : "border-border bg-card shadow-xs"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate">{it.partName}</p>
                              <p className="text-xs text-muted-foreground">
                                {sym}{Number(it.unitPrice).toLocaleString()} / unit · Sold: {it.quantity}
                                {returnedSoFar > 0 && ` (${returnedSoFar} returned)`}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-primary">
                              {sym}{(currentQty * Number(it.unitPrice)).toLocaleString()}
                            </span>
                          </div>

                          {isUnavailable ? (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                              Fully Returned
                            </span>
                          ) : (
                            <div className="flex items-center justify-between pt-2 border-t border-border/60">
                              <span className="text-xs font-medium text-muted-foreground">
                                Return Qty (Max: {maxReturnable})
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={currentQty <= 0}
                                  onClick={() => setReturnQtys(prev => ({ ...prev, [it.id]: Math.max(0, currentQty - 1) }))}
                                  className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  max={maxReturnable}
                                  value={currentQty === 0 ? "" : currentQty}
                                  placeholder="0"
                                  onChange={e => {
                                    const val = e.target.value === "" ? 0 : Number(e.target.value);
                                    setReturnQtys(prev => ({
                                      ...prev,
                                      [it.id]: Math.max(0, Math.min(maxReturnable, isNaN(val) ? 0 : val)),
                                    }));
                                  }}
                                  className="w-12 text-center text-sm font-bold px-1 py-1 rounded-lg border border-border outline-none focus:ring-1 focus:ring-primary"
                                />
                                <button
                                  type="button"
                                  disabled={currentQty >= maxReturnable}
                                  onClick={() => setReturnQtys(prev => ({ ...prev, [it.id]: Math.min(maxReturnable, currentQty + 1) }))}
                                  className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reason Input */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Return Reason (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Faulty display, customer exchanged, wrong item..."
                    value={returnReason}
                    onChange={e => setReturnReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Return Summary Card */}
                <div className="p-4 rounded-2xl border border-border bg-muted/40 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Original Total:</span>
                    <span className="font-semibold">{sym}{Number(detail.total).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-rose-600">Total Return Value:</span>
                    <span className="text-rose-600 text-base">
                      {sym}{calculatedRefundTotal.toLocaleString()}
                    </span>
                  </div>
                  {detail.paymentMethod === "Credit" && calculatedRefundTotal > 0 && (
                    <p className="text-[11px] text-amber-700 pt-1 border-t border-border/50">
                      💡 Note: This is a Credit bill. Customer amount due will be reduced by {sym}{calculatedRefundTotal.toLocaleString()}.
                    </p>
                  )}
                </div>

                {/* Error Banner */}
                {returnError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                    <span>{returnError}</span>
                  </div>
                )}
              </div>
            ) : (
              /* ── INVOICE DETAIL VIEW ── */
              <div className="space-y-4">
                {/* Meta */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {detail.date}
                      {detail.customerName && ` · ${detail.customerName}`}
                      {detail.customerPhone && ` · ${detail.customerPhone}`}
                    </p>
                    <p className="text-xs mt-0.5 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {detail.paymentMethod}
                    </p>
                  </div>
                  {(() => {
                    const b = saleBadge(detail);
                    return (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: b.bg, color: b.color }}>
                        {b.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Items */}
                <div className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: "hsl(var(--border))" }}>
                  <div className="px-4 py-2.5 flex text-[10px] font-bold uppercase tracking-wide"
                    style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                    <span className="flex-1">Item</span>
                    <span className="w-8 text-center">Qty</span>
                    <span className="w-20 text-right">Total</span>
                  </div>
                  {(detail.items ?? []).map((it: any) => (
                    <div key={it.id}
                      className="flex items-center px-4 py-3 border-t"
                      style={{ borderColor: "hsl(var(--border))" }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{it.partName}</p>
                        {it.returnedQuantity > 0 && (
                          <p className="text-[10px] font-semibold flex items-center gap-1" style={{ color: "#DC2626" }}>
                            <RotateCcw className="w-3 h-3" />
                            {it.returnedQuantity} returned
                          </p>
                        )}
                      </div>
                      <span className="w-8 text-center text-sm font-medium"
                        style={{ color: "hsl(var(--muted-foreground))" }}>
                        {it.quantity}
                      </span>
                      <span className="w-20 text-right text-sm font-semibold">
                        {sym}{Number(it.total).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Returns History if any */}
                {detail.returns && detail.returns.length > 0 && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3.5 space-y-1.5">
                    <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> Return Records
                    </p>
                    {detail.returns.map((r: any, idx: number) => (
                      <div key={r.id || idx} className="text-xs text-rose-700 flex justify-between border-t border-rose-200/60 pt-1">
                        <span>{r.partName || `Item #${r.saleItemId}`} ({r.quantity} pcs) {r.reason ? `· ${r.reason}` : ""}</span>
                        <span className="font-bold">-{sym}{Number(r.refundAmount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals */}
                <div className="rounded-2xl border p-4 space-y-2"
                  style={{ borderColor: "hsl(var(--border))" }}>
                  {Number(detail.discount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "hsl(var(--muted-foreground))" }}>Discount</span>
                      <span className="font-semibold" style={{ color: "#DC2626" }}>
                        -{sym}{Number(detail.discount).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="font-extrabold" style={{ color: "hsl(var(--primary))" }}>
                      {sym}{Number(detail.total).toLocaleString()}
                    </span>
                  </div>
                  {detail.paymentMethod === "Credit" && (
                    <>
                      {Number(detail.advancePaid ?? 0) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span style={{ color: "hsl(var(--muted-foreground))" }}>Advance Paid</span>
                          <span className="font-semibold" style={{ color: "#059669" }}>
                            {sym}{Number(detail.advancePaid).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {(() => {
                        const totalRefunded = (detail.returns ?? []).reduce(
                          (s: number, r: any) => s + Number(r.refundAmount), 0
                        );
                        const due = Math.max(0, Number(detail.total) - Number(detail.advancePaid ?? 0) - totalRefunded);
                        return due > 0 ? (
                          <div className="flex justify-between pt-1 border-t"
                            style={{ borderColor: "hsl(var(--border))" }}>
                            <span className="font-bold" style={{ color: "#DC2626" }}>Amount Due</span>
                            <span className="font-extrabold" style={{ color: "#DC2626" }}>
                              {sym}{due.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <div className="flex justify-between pt-1 border-t"
                            style={{ borderColor: "hsl(var(--border))" }}>
                            <span className="font-bold" style={{ color: "#059669" }}>Amount Due</span>
                            <span className="font-extrabold" style={{ color: "#059669" }}>Settled ✓</span>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>
            )
          ) : (
            <p className="text-center py-8 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Failed to load invoice.
            </p>
          )}
        </div>

        {/* Footer actions */}
        {detail && (
          <div className="px-5 py-4 border-t flex gap-3 flex-shrink-0 bg-card"
            style={{ borderColor: "hsl(var(--border))" }}>
            {showReturnView ? (
              <>
                <button
                  type="button"
                  disabled={isReturning}
                  onClick={() => setShowReturnView(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={calculatedRefundTotal <= 0 || isReturning}
                  onClick={handleConfirmReturn}
                  className="flex-[1.4] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "#E11D48" }}
                >
                  {isReturning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing…</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Confirm Return ({sym}{calculatedRefundTotal.toLocaleString()})</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {!isFullyReturned ? (
                  <button
                    onClick={startReturnProcess}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-colors shadow-xs hover:bg-rose-100/70"
                    style={{ borderColor: "#FECDD3", color: "#E11D48", background: "#FFF1F2" }}
                  >
                    <RotateCcw className="w-4 h-4" /> Return Bill
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Fully Returned
                  </div>
                )}
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white shadow-sm"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Update Payment Modal ──────────────────────────────────────────────────────
function UpdatePaymentModal({
  repairList, saleList, customerId, userId, isGeneralStore, isLocalStore, onClose, onSaved,
}: {
  repairList: any[];
  saleList: any[];
  customerId: number;
  userId?: number;
  isGeneralStore: boolean;
  isLocalStore: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  // Block body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const [amounts, setAmounts]     = useState<Record<number, string>>({});
  const [saving, setSaving]       = useState<number | null>(null);
  const [done, setDone]           = useState<Set<number>>(new Set());
  const [saleAmount, setSaleAmount] = useState("");
  const [saleNotes, setSaleNotes]   = useState("");
  const [saleSaving, setSaleSaving] = useState(false);
  const [saleDone, setSaleDone]     = useState(false);
  const [saleError, setSaleError]   = useState("");
  const [repairError, setRepairError] = useState("");
  // Multi-invoice selection state
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);

  const unpaidRepairs = isGeneralStore ? [] : repairList.filter(
    r => Number(r.totalCost) > 0 && !r.isPaid && r.status !== "Cancelled"
  );
  const unpaidCreditSales = saleList.filter(
    s => s.paymentMethod === "Credit" && s.status !== "Returned" &&
      Math.max(0, Number(s.total) - Number(s.advancePaid ?? 0) - Number((s as any).totalRefund ?? 0)) > 0
  );
  const totalCreditSaleDue = unpaidCreditSales.reduce(
    (sum, s) => sum + Math.max(0, Number(s.total) - Number(s.advancePaid ?? 0) - Number((s as any).totalRefund ?? 0)), 0
  );
  const selectedSales = unpaidCreditSales.filter(s => selectedInvoiceIds.includes(s.id));
  const selectedDueSum = selectedSales.reduce(
    (sum, s) => sum + Math.max(0, Number(s.total) - Number(s.advancePaid ?? 0) - Number((s as any).totalRefund ?? 0)), 0
  );
  const effectiveDue = selectedInvoiceIds.length > 0 ? selectedDueSum : totalCreditSaleDue;

  async function saveRepairPayment(repair: any, fullyPaid: boolean) {
    const amountStr = amounts[repair.id] ?? "";
    const totalCost = Number(repair.totalCost);
    const amount = fullyPaid ? totalCost : Number(amountStr);
    if (!fullyPaid && (!amountStr || amount <= 0)) { setRepairError("Enter an amount first"); return; }
    setRepairError("");
    setSaving(repair.id);
    try {
      const isPaidNow = fullyPaid || amount >= totalCost;
      const res = await fetch(`/api/repairs/${repair.id}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: repair.customerName, customerPhone: repair.customerPhone ?? "",
          phoneBrand: repair.phoneBrand, phoneModel: repair.phoneModel,
          imei: repair.imei ?? null, problem: repair.problem, status: repair.status,
          engineer: repair.engineer ?? null, partsUsed: repair.partsUsed ?? null,
          laborCost: repair.laborCost ?? null, partsCost: repair.partsCost ?? null,
          totalCost: repair.totalCost ?? null, advancePaid: String(amount),
          isPaid: isPaidNow, notes: repair.notes ?? null, warrantyDays: repair.warrantyDays ?? 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setDone(prev => new Set([...prev, repair.id]));
      onSaved();
    } catch (err: any) {
      setRepairError(err.message ?? "Failed to update payment");
    } finally { setSaving(null); }
  }

  async function saveSalePayment() {
    const amount = Number(saleAmount);
    if (!saleAmount || amount <= 0) { setSaleError("Enter a valid amount"); return; }

    // Validate against selected invoice(s) due or total due
    if (selectedInvoiceIds.length > 0) {
      if (amount > selectedDueSum + 0.01) {
        setSaleError(`Amount exceeds selected bills' due (${selectedDueSum.toLocaleString()})`);
        return;
      }
    } else {
      if (amount > totalCreditSaleDue + 0.01) {
        setSaleError(`Amount exceeds total due (${totalCreditSaleDue.toLocaleString()})`);
        return;
      }
    }

    setSaleError(""); setSaleSaving(true);
    try {
      if (isLocalStore && userId) {
        const result = localSales.applyPayment(
          userId,
          amount,
          selectedInvoiceIds.length > 0 ? selectedInvoiceIds : undefined
        );
        if (result.applied <= 0) {
          throw new Error(selectedInvoiceIds.length > 0 ? "Selected bills have no outstanding balance" : "This customer has no outstanding credit due");
        }
        setSaleDone(true); setSaleAmount(""); setSaleNotes(""); setSelectedInvoiceIds([]); onSaved();
        return;
      }
      const body: Record<string, unknown> = { amount, notes: saleNotes || undefined };
      if (selectedInvoiceIds.length === 1) {
        body.saleId = selectedInvoiceIds[0];
      } else if (selectedInvoiceIds.length > 1) {
        body.saleIds = selectedInvoiceIds;
      }
      const res = await fetch(`/api/sales/customers/${customerId}/payment`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to record payment");
      }
      setSaleDone(true); setSaleAmount(""); setSaleNotes(""); setSelectedInvoiceIds([]); onSaved();
    } catch (err: any) {
      setSaleError(err.message ?? "Failed to record payment");
    } finally { setSaleSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col"
        style={{ background: "hsl(var(--card))", maxHeight: "85vh" }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b flex-shrink-0"
          style={{ borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            <h3 className="font-bold text-base">Update Payment</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* POS Credit Sales */}
          {unpaidCreditSales.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" style={{ color: "#D97706" }} />
                  <h4 className="font-bold text-sm" style={{ color: "#D97706" }}>POS Credit Sales</h4>
                </div>
                {unpaidCreditSales.length > 1 && !saleDone && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedInvoiceIds.length === unpaidCreditSales.length) {
                        setSelectedInvoiceIds([]);
                      } else {
                        setSelectedInvoiceIds(unpaidCreditSales.map(s => s.id));
                      }
                      setSaleAmount("");
                      setSaleError("");
                    }}
                    className="text-xs font-bold px-2 py-1 rounded-lg border transition-colors"
                    style={{
                      borderColor: "hsl(var(--border))",
                      color: selectedInvoiceIds.length === unpaidCreditSales.length ? "#DC2626" : "#D97706",
                      background: "hsl(var(--background))",
                    }}>
                    {selectedInvoiceIds.length === unpaidCreditSales.length ? "Deselect All" : "Select All Bills"}
                  </button>
                )}
              </div>
              {saleDone ? (
                <div className="rounded-2xl border p-4 flex items-center gap-3"
                  style={{ borderColor: "#6EE7B7", background: "#ECFDF5" }}>
                  <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#059669" }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#059669" }}>Payment recorded</p>
                    <p className="text-xs mt-0.5" style={{ color: "#065F46" }}>
                      Payment applied successfully to selected bills.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border p-4 space-y-3"
                  style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}>

                  {/* Invoice list with multi-selection */}
                  <div className="space-y-1.5">
                    {unpaidCreditSales.map(s => {
                      const due = Math.max(0, Number(s.total) - Number(s.advancePaid ?? 0) - Number((s as any).totalRefund ?? 0));
                      const isSelected = selectedInvoiceIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedInvoiceIds(prev =>
                              prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                            );
                            setSaleAmount("");
                            setSaleError("");
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors"
                          style={{
                            background: isSelected ? "#FFF7E6" : "hsl(var(--card))",
                            border: isSelected ? "1.5px solid #F59E0B" : "1px solid hsl(var(--border))",
                          }}>
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                              style={{
                                borderColor: isSelected ? "#D97706" : "hsl(var(--muted-foreground) / 0.4)",
                                background: isSelected ? "#D97706" : "transparent",
                              }}>
                              {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                            </div>
                            <span className="font-semibold" style={{ color: isSelected ? "#D97706" : "hsl(var(--foreground))" }}>
                              {s.invoiceNumber}
                            </span>
                          </div>
                          <span className="font-bold" style={{ color: "#DC2626" }}>Due: {due.toLocaleString()}</span>
                        </button>
                      );
                    })}

                    <div className="pt-2 border-t flex items-center justify-between"
                      style={{ borderColor: "hsl(var(--border))" }}>
                      <span className="text-xs font-semibold">
                        {selectedInvoiceIds.length === 1
                          ? `Paying: ${selectedSales[0]?.invoiceNumber}`
                          : selectedInvoiceIds.length > 1
                          ? `Paying: ${selectedInvoiceIds.length} Bills Selected`
                          : "Total Due (all bills)"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold" style={{ color: "#DC2626" }}>
                          {effectiveDue.toLocaleString()}
                        </span>
                        {effectiveDue > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSaleAmount(String(effectiveDue));
                              setSaleError("");
                            }}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-lg border text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700">
                            Fill
                          </button>
                        )}
                      </div>
                    </div>
                    {selectedInvoiceIds.length === 0 && (
                      <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Tap bills to select one or multiple, or leave unselected to pay oldest bills first
                      </p>
                    )}
                  </div>

                  {/* Amount + Pay */}
                  <div className="flex gap-2">
                    <input type="number" min="0" step="0.01" value={saleAmount}
                      onChange={e => { setSaleAmount(e.target.value); setSaleError(""); }}
                      placeholder="Amount received…"
                      className="flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} />
                    <button disabled={saleSaving || !saleAmount || Number(saleAmount) <= 0}
                      onClick={saveSalePayment}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex-shrink-0"
                      style={{ background: "#D97706" }}>
                      {saleSaving ? "…" : "Pay"}
                    </button>
                  </div>
                  <input type="text" value={saleNotes} onChange={e => setSaleNotes(e.target.value)}
                    placeholder="Notes (optional)"
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} />
                  {saleError && <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{saleError}</p>}
                </div>
              )}
            </div>
          )}

          {/* Repair Payments */}
          {unpaidRepairs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                <h4 className="font-bold text-sm" style={{ color: "hsl(var(--primary))" }}>Repair Payments</h4>
              </div>
              <div className="space-y-3">
                {unpaidRepairs.map(r => {
                  const total   = Number(r.totalCost);
                  const advance = Number(r.advancePaid ?? 0);
                  const balance = Math.max(0, total - advance);
                  const isDone   = done.has(r.id);
                  const isSaving = saving === r.id;
                  return (
                    <div key={r.id} className="rounded-2xl border p-4 space-y-3"
                      style={{
                        borderColor: isDone ? "#6EE7B7" : "hsl(var(--border))",
                        background:  isDone ? "#ECFDF5" : "hsl(var(--background))",
                      }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{r.phoneBrand} {r.phoneModel}</p>
                          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{r.problem}</p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                              Total: <b>{total.toLocaleString()}</b>
                            </span>
                            {advance > 0 && (
                              <span className="text-xs" style={{ color: "#059669" }}>
                                Advance: <b>{advance.toLocaleString()}</b>
                              </span>
                            )}
                            <span className="text-xs font-bold" style={{ color: "#DC2626" }}>
                              Due: {balance.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {isDone ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                            style={{ background: "#ECFDF5", color: "#059669" }}>✓ Updated</span>
                        ) : (
                          <button disabled={isSaving} onClick={() => saveRepairPayment(r, true)}
                            className="text-xs font-bold px-2.5 py-1.5 rounded-xl text-white flex-shrink-0 disabled:opacity-50"
                            style={{ background: "#10B981" }}>
                            {isSaving ? "…" : "Mark Paid"}
                          </button>
                        )}
                      </div>
                      {!isDone && (
                        <div className="flex gap-2">
                          <input type="number" min="0" step="0.01" value={amounts[r.id] ?? ""}
                            onChange={e => setAmounts(p => ({ ...p, [r.id]: e.target.value }))}
                            placeholder="Or enter amount received…"
                            className="flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none"
                            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} />
                          <button
                            disabled={isSaving || !amounts[r.id] || Number(amounts[r.id]) <= 0}
                            onClick={() => saveRepairPayment(r, false)}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex-shrink-0"
                            style={{ background: "hsl(var(--primary))" }}>
                            {isSaving ? "…" : "Save"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {repairError && (
                  <p className="text-xs text-center" style={{ color: "hsl(var(--destructive))" }}>{repairError}</p>
                )}
              </div>
            </div>
          )}

          {unpaidRepairs.length === 0 && unpaidCreditSales.length === 0 && (
            <div className="text-center py-10">
              <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "#10B981" }} />
              <p className="font-semibold">All payments cleared</p>
              <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                No outstanding balance for this customer
              </p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t flex-shrink-0" style={{ borderColor: "hsl(var(--border))" }}>
          <button onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-sm border"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CustomerProfile() {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);
  const qc = useQueryClient();
  const { user } = useAuth();
  const isGeneralStore = user?.businessType === "general_store";
  const isManager = Boolean(user?.isManager || user?.role?.toLowerCase() === "manager");
  const isFreePlan = (user?.plan === "Free" || !user?.plan) && !user?.isStaff && !isManager;
  const sym      = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? user?.currency ?? "$";
  const shopName = user?.shopName ?? user?.name ?? "My Shop";

  const [showPayment, setShowPayment]       = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [showFilter, setShowFilter]         = useState(false);
  const [filterFrom, setFilterFrom]         = useState("");
  const [filterTo, setFilterTo]             = useState("");
  const [salesLimit, setSalesLimit]         = useState(5);
  const [repairsLimit, setRepairsLimit]     = useState(5);

  const { data: customer, isLoading } = useQuery<any>({
    queryKey: ["customer", customerId, isGeneralStore ? "general-local" : "repair-server", user?.id],
    queryFn: () => {
      if (isGeneralStore && isFreePlan && user?.id) {
        return Promise.resolve(
          localCustomers.getAll(user.id).find(c => Number(c.id) === customerId) ?? { error: "Customer not found" },
        );
      }
      return fetch(`/api/customers/${customerId}`, { credentials: "include" }).then(r => r.json());
    },
    enabled: !!customerId && !!user?.id,
  });

  const { data: repairs, refetch: refetchRepairs } = useQuery<any[]>({
    queryKey: ["repairs", "customer", customerId],
    queryFn: () =>
      fetch(`/api/repairs?customerId=${customerId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!customerId && !isGeneralStore,
  });

  const { data: customerSales, refetch: refetchSales } = useQuery<any[]>({
    queryKey: ["sales", "customer", customerId, isGeneralStore ? "general-local" : "repair-server", user?.id],
    queryFn: () => {
      if (isGeneralStore && isFreePlan && user?.id) {
        const localCustomer = localCustomers.getAll(user.id).find(c => Number(c.id) === customerId);
        return Promise.resolve(
          localSales.getAll(user.id).filter(s =>
            Number(s.customerId) === customerId ||
            (!s.customerId && s.customerName === localCustomer?.name),
          ),
        );
      }
      return fetch(`/api/sales/customers/${customerId}`, { credentials: "include" }).then(r => r.json());
    },
    enabled: !!customerId && !!user?.id,
  });

  const repairList = !isGeneralStore && Array.isArray(repairs) ? repairs : [];
  const saleList   = Array.isArray(customerSales) ? customerSales : [];

  // Filtered sales for display
  const filteredSales = saleList.filter(s => {
    if (filterFrom && s.date < filterFrom) return false;
    if (filterTo   && s.date > filterTo)   return false;
    return true;
  });

  const totalSpent = repairList.reduce((sum, r) => sum + (Number(r.totalCost) || 0), 0) +
                     saleList.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const repairDue  = repairList.reduce((sum, r) => {
    if (r.isPaid || r.status === "Cancelled") return sum;
    return sum + Math.max(0, Number(r.totalCost || 0) - Number(r.advancePaid || 0));
  }, 0);
  const hasUnpaidRepairs = repairList.some(r => !r.isPaid && Number(r.totalCost) > 0 && r.status !== "Cancelled");

  const creditSaleDue = saleList.reduce((sum, s) => {
    if (s.paymentMethod !== "Credit") return sum;
    if (s.status === "Returned") return sum; // fully returned — no due
    return sum + Math.max(0, Number(s.total) - Number(s.advancePaid ?? 0) - Number((s as any).totalRefund ?? 0));
  }, 0);
  const hasUnpaidCreditSales = creditSaleDue > 0;
  const showPaymentBtn = hasUnpaidRepairs || hasUnpaidCreditSales;

  function exportSalePdf() {
    const rows = filteredSales.map(s => {
      const totalRefund = (s as any).totalRefund ?? (s.returns ?? []).reduce((sum: number, r: any) => sum + Number(r.refundAmount || 0), 0);
      return {
        invoiceNumber: s.invoiceNumber,
        date: s.date,
        customerName: s.customerName ?? customer?.name,
        total: Number(s.total),
        totalRefund: Number(totalRefund || 0),
        advancePaid: Number(s.advancePaid ?? 0),
        status: s.status,
        paymentMethod: s.paymentMethod,
      };
    });
    generateSalesReportPdf(rows, filterFrom, filterTo, shopName, sym);
  }

  if (isLoading) {
    return (
      <ProtectedPage>
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 rounded-full animate-spin"
            style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
        </div>
      </ProtectedPage>
    );
  }

  if (!customer || customer.error) {
    return (
      <ProtectedPage>
        <div className="text-center py-16">
          <p style={{ color: "hsl(var(--muted-foreground))" }}>Customer not found.</p>
          <Link href="/customers">
            <button className="mt-4 text-sm font-semibold" style={{ color: "hsl(var(--primary))" }}>
              ← Back to Customers
            </button>
          </Link>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <div className="space-y-4">
        <Link href="/customers">
          <button className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "hsl(var(--muted-foreground))" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Customers
          </button>
        </Link>

        {/* Profile card */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-extrabold text-white flex-shrink-0"
              style={{ background: "hsl(var(--primary))" }}>
              {initials(customer.name ?? "?")}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-extrabold truncate">{customer.name}</h1>
              {customer.phone && (
                <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{customer.phone}</p>
              )}
              {customer.notes && (
                <p className="text-xs mt-1 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{customer.notes}</p>
              )}
            </div>
          </div>

          {(customer.phone || customer.whatsapp) && (
            <div className="flex gap-3 mt-4">
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                    <Phone className="w-4 h-4" /> Call
                  </button>
                </a>
              )}
              {(customer.whatsapp || customer.phone) && (
                <a href={`https://wa.me/${(customer.whatsapp ?? customer.phone).replace(/\D/g, "")}`}
                  target="_blank" rel="noreferrer" className="flex-1">
                  <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "#DCFCE7", color: "#16A34A" }}>
                    <MessageSquare className="w-4 h-4" /> WhatsApp
                  </button>
                </a>
              )}
            </div>
          )}

          <div className={`grid ${isGeneralStore ? "grid-cols-1" : "grid-cols-3"} gap-3 mt-4 pt-4 border-t border-border`}>
            {!isGeneralStore && <div className="text-center">
              <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Total Repairs</p>
              <p className="text-xl font-extrabold mt-0.5">{repairList.length}</p>
            </div>}
            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Total Spent</p>
              <p className="text-xl font-extrabold mt-0.5">{totalSpent.toLocaleString()}</p>
            </div>
            {!isGeneralStore && <div className="text-center">
              <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Active</p>
              <p className="text-xl font-extrabold mt-0.5">
                {repairList.filter(r => r.status === "Repairing" || r.status === "Waiting").length}
              </p>
            </div>}
          </div>

          {showPaymentBtn && (
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              {hasUnpaidRepairs && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Repair Balance Due</p>
                    <p className="text-lg font-extrabold" style={{ color: "#DC2626" }}>{repairDue.toLocaleString()}</p>
                  </div>
                </div>
              )}
              {hasUnpaidCreditSales && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Sale Balance Due</p>
                    <p className="text-lg font-extrabold" style={{ color: "#D97706" }}>{creditSaleDue.toLocaleString()}</p>
                  </div>
                </div>
              )}
              <button onClick={() => setShowPayment(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "hsl(var(--primary))" }}>
                <CreditCard className="w-4 h-4" /> Update Payment
              </button>
            </div>
          )}
        </div>

        {/* Sale History */}
        <div>
          {/* Section header with filter + PDF */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base">Sale History</h2>
            <div className="flex items-center gap-2">
              {saleList.length > 0 && (
                <button
                  onClick={exportSalePdf}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border"
                  style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--primary))" }}
                  title="Export PDF"
                >
                  <FileDown className="w-3.5 h-3.5" /> PDF
                </button>
              )}
              <button
                onClick={() => setShowFilter(v => !v)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border"
                style={{
                  borderColor: (filterFrom || filterTo) ? "hsl(var(--primary))" : "hsl(var(--border))",
                  color: (filterFrom || filterTo) ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  background: (filterFrom || filterTo) ? "hsl(var(--primary) / 0.07)" : undefined,
                }}
              >
                <Filter className="w-3.5 h-3.5" />
                Filter
                {showFilter ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Filter panel */}
          {showFilter && (
            <div className="bg-card rounded-2xl border border-border p-4 mb-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block"
                    style={{ color: "hsl(var(--muted-foreground))" }}>From</label>
                  <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block"
                    style={{ color: "hsl(var(--muted-foreground))" }}>To</label>
                  <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }} />
                </div>
              </div>
              {(filterFrom || filterTo) && (
                <button
                  onClick={() => { setFilterFrom(""); setFilterTo(""); }}
                  className="text-xs font-semibold"
                  style={{ color: "#DC2626" }}
                >
                  Clear filter
                </button>
              )}
            </div>
          )}

          {filteredSales.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-2xl border border-border">
              <Receipt className="w-8 h-8 mx-auto mb-2" style={{ color: "hsl(var(--muted-foreground))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                {saleList.length === 0 ? "No purchases yet." : "No sales in this date range."}
              </p>
            </div>
          ) : (
            <div>
              <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
                {filteredSales.slice(0, salesLimit).map(s => {
                  const badge = saleBadge(s);
                  const due   = s.paymentMethod === "Credit" && (s as any).status !== "Returned"
                    ? Math.max(0, Number(s.total) - Number(s.advancePaid ?? 0) - Number((s as any).totalRefund ?? 0))
                    : 0;
                  return (
                    <button
                      key={s.id}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
                      onClick={() => setSelectedSaleId(s.id)}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "hsl(var(--primary) / 0.1)" }}>
                        <Receipt className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{s.invoiceNumber}</p>
                        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {s.paymentMethod} · {new Date(s.date).toLocaleDateString()}
                        </p>
                        {due > 0 && (
                          <p className="text-[10px] font-bold mt-0.5" style={{ color: "#D97706" }}>
                            Due: {due.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-sm font-bold" style={{ color: "hsl(var(--primary))" }}>
                          {Number(s.total).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {filteredSales.length > salesLimit && (
                <button
                  onClick={() => setSalesLimit(prev => prev + 5)}
                  className="w-full py-2.5 mt-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 hover:bg-muted/40 transition-colors"
                  style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--primary))", background: "hsl(var(--card))" }}
                >
                  <ChevronDown className="w-4 h-4" /> More ({filteredSales.length - salesLimit} remaining)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Repair history — not part of a general-store customer profile */}
        {!isGeneralStore && <div>
          <h2 className="font-bold text-base mb-3">Repair History</h2>
          {repairList.length === 0 ? (
            <div className="text-center py-10 bg-card rounded-2xl border border-border">
              <Wrench className="w-8 h-8 mx-auto mb-2" style={{ color: "hsl(var(--muted-foreground))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>No repairs for this customer yet.</p>
            </div>
          ) : (
            <div>
              <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
                {repairList.slice(0, repairsLimit).map(r => {
                  const sc      = STATUS_COLOR[r.status] ?? { text: "#9CA3AF", bg: "#F3F4F6" };
                  const advance = Number(r.advancePaid ?? 0);
                  const total   = Number(r.totalCost ?? 0);
                  const balance = Math.max(0, total - advance);
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {[r.phoneBrand, r.phoneModel].filter(Boolean).join(" ") || "Device"}
                        </p>
                        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{r.problem ?? "–"}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ background: sc.bg, color: sc.text }}>{r.status}</span>
                        {total > 0 && (
                          <span className="text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {total.toLocaleString()}
                          </span>
                        )}
                        {!r.isPaid && balance > 0 && r.status !== "Cancelled" && (
                          <span className="text-[10px] font-bold" style={{ color: "#DC2626" }}>
                            Due: {balance.toLocaleString()}
                          </span>
                        )}
                        {r.isPaid && (
                          <span className="text-[10px] font-bold" style={{ color: "#059669" }}>✓ Paid</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {repairList.length > repairsLimit && (
                <button
                  onClick={() => setRepairsLimit(prev => prev + 5)}
                  className="w-full py-2.5 mt-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 hover:bg-muted/40 transition-colors"
                  style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--primary))", background: "hsl(var(--card))" }}
                >
                  <ChevronDown className="w-4 h-4" /> More ({repairList.length - repairsLimit} remaining)
                </button>
              )}
            </div>
          )}
        </div>}
      </div>

      {/* Update Payment Modal */}
      {showPayment && (
        <UpdatePaymentModal
          repairList={repairList}
          saleList={saleList}
          customerId={customerId}
          userId={user?.id}
          isGeneralStore={isGeneralStore}
          isLocalStore={isGeneralStore && isFreePlan}
          onClose={() => setShowPayment(false)}
          onSaved={() => {
            refetchRepairs();
            refetchSales();
            qc.invalidateQueries({ queryKey: ["repairs"] });
            qc.invalidateQueries({ queryKey: ["sales"] });
            qc.invalidateQueries({ queryKey: ["customer", customerId] });
          }}
        />
      )}

      {/* Invoice Detail Modal */}
      {selectedSaleId != null && (
        <InvoiceDetailModal
          saleId={selectedSaleId}
          sym={sym}
          shopName={shopName}
          shopAddress={user?.shopAddress}
          shopPhone={user?.phone}
          shopLogo={user?.shopLogo}
          customerId={customerId}
          userId={user?.id}
          isLocalStore={isGeneralStore && isFreePlan}
          onClose={() => setSelectedSaleId(null)}
          onReturned={() => {
            refetchSales();
            qc.invalidateQueries({ queryKey: ["sales"] });
            qc.invalidateQueries({ queryKey: ["customer", customerId] });
            qc.invalidateQueries({ queryKey: ["inventory"] });
          }}
        />
      )}
    </ProtectedPage>
  );
}
