import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Phone, MessageSquare, Wrench, X, Receipt, CreditCard,
  CheckCircle, ShoppingBag, Download, Share2, Package, Filter, FileDown,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";
import { generateInvoicePdf, generateInvoicePdfBlob, generateSalesReportPdf } from "@/lib/invoice-pdf";
import { saleToInvoiceData } from "@/pages/pos";
import { useAuth } from "@/context/auth-context";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", BDT: "৳", INR: "₹",
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
  onClose,
}: {
  saleId: number;
  sym: string;
  shopName: string;
  onClose: () => void;
}) {
  const { data: detail, isLoading } = useQuery<any>({
    queryKey: ["sale-detail", saleId],
    queryFn: () =>
      fetch(`/api/sales/${saleId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!saleId,
  });

  async function handleDownload() {
    if (!detail) return;
    const data = saleToInvoiceData(detail);
    data.shopName = shopName;
    data.currencySymbol = sym;
    generateInvoicePdf(data);
  }

  async function handleShare() {
    if (!detail) return;
    const data = saleToInvoiceData(detail);
    data.shopName = shopName;
    data.currencySymbol = sym;

    const blob = generateInvoicePdfBlob(data);
    const file = new File([blob], `${data.invoiceNumber}.pdf`, { type: "application/pdf" });

    if (typeof navigator.share !== "undefined" && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: `Invoice ${data.invoiceNumber}`, files: [file] });
        return; // shared or dismissed — do NOT auto-download
      } catch (err: any) {
        if (err?.name === "AbortError") return; // user cancelled — no download
        // Other errors fall through to download
      }
    }
    handleDownload();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col"
        style={{ background: "hsl(var(--card))", maxHeight: "85vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pt-5 pb-4 border-b flex-shrink-0"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            <h3 className="font-bold text-base">
              {isLoading ? "Loading…" : detail?.invoiceNumber ?? "Invoice"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 rounded-xl animate-pulse"
                  style={{ background: "hsl(var(--muted))" }} />
              ))}
            </div>
          ) : detail ? (
            <div className="space-y-4">
              {/* Meta */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {detail.date}
                    {detail.customerName && ` · ${detail.customerName}`}
                    {detail.customerPhone && ` · ${detail.customerPhone}`}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
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
                        <p className="text-[10px]" style={{ color: "#DC2626" }}>
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
          ) : (
            <p className="text-center py-8 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Failed to load invoice.
            </p>
          )}
        </div>

        {/* Footer actions */}
        {detail && (
          <div className="px-5 py-4 border-t flex gap-3 flex-shrink-0"
            style={{ borderColor: "hsl(var(--border))" }}>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: "hsl(var(--primary))" }}
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--primary))" }}
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Update Payment Modal ──────────────────────────────────────────────────────
function UpdatePaymentModal({
  repairList, saleList, customerId, onClose, onSaved,
}: {
  repairList: any[];
  saleList: any[];
  customerId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amounts, setAmounts]     = useState<Record<number, string>>({});
  const [saving, setSaving]       = useState<number | null>(null);
  const [done, setDone]           = useState<Set<number>>(new Set());
  const [saleAmount, setSaleAmount] = useState("");
  const [saleNotes, setSaleNotes]   = useState("");
  const [saleSaving, setSaleSaving] = useState(false);
  const [saleDone, setSaleDone]     = useState(false);
  const [saleError, setSaleError]   = useState("");
  const [repairError, setRepairError] = useState("");
  // Invoice-specific payment
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | "">("");

  const unpaidRepairs = repairList.filter(
    r => Number(r.totalCost) > 0 && !r.isPaid && r.status !== "Cancelled"
  );
  const unpaidCreditSales = saleList.filter(
    s => s.paymentMethod === "Credit" && s.status !== "Returned" &&
      Math.max(0, Number(s.total) - Number(s.advancePaid ?? 0) - Number((s as any).totalRefund ?? 0)) > 0
  );
  const totalCreditSaleDue = unpaidCreditSales.reduce(
    (sum, s) => sum + Math.max(0, Number(s.total) - Number(s.advancePaid ?? 0) - Number((s as any).totalRefund ?? 0)), 0
  );

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

    // Validate against selected invoice's due (or total due if no specific invoice)
    const invoiceId = selectedInvoiceId !== "" ? Number(selectedInvoiceId) : null;
    if (invoiceId) {
      const targetSale = unpaidCreditSales.find(s => s.id === invoiceId);
      const invoiceDue = targetSale
        ? Math.max(0, Number(targetSale.total) - Number(targetSale.advancePaid ?? 0) - Number((targetSale as any).totalRefund ?? 0))
        : 0;
      if (amount > invoiceDue + 0.01) {
        setSaleError(`Amount exceeds this invoice's due (${invoiceDue.toLocaleString()})`);
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
      const body: Record<string, unknown> = { amount, notes: saleNotes || undefined };
      if (invoiceId) body.saleId = invoiceId;
      const res = await fetch(`/api/sales/customers/${customerId}/payment`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to record payment");
      }
      setSaleDone(true); setSaleAmount(""); setSaleNotes(""); setSelectedInvoiceId(""); onSaved();
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
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="w-4 h-4" style={{ color: "#D97706" }} />
                <h4 className="font-bold text-sm" style={{ color: "#D97706" }}>POS Credit Sales</h4>
              </div>
              {saleDone ? (
                <div className="rounded-2xl border p-4 flex items-center gap-3"
                  style={{ borderColor: "#6EE7B7", background: "#ECFDF5" }}>
                  <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#059669" }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#059669" }}>Payment recorded</p>
                    <p className="text-xs mt-0.5" style={{ color: "#065F46" }}>
                      {selectedInvoiceId !== "" ? `Applied to ${unpaidCreditSales.find(s => s.id === selectedInvoiceId)?.invoiceNumber ?? "invoice"}` : "Applied to oldest invoices first"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border p-4 space-y-3"
                  style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}>

                  {/* Invoice list with due amounts */}
                  <div className="space-y-1.5">
                    {unpaidCreditSales.map(s => {
                      const due = Math.max(0, Number(s.total) - Number(s.advancePaid ?? 0) - Number((s as any).totalRefund ?? 0));
                      const isSelected = selectedInvoiceId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedInvoiceId(isSelected ? "" : s.id);
                            setSaleAmount(""); setSaleError("");
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors"
                          style={{
                            background: isSelected ? "#FFF7E6" : "transparent",
                            border: isSelected ? "1px solid #F59E0B" : "1px solid transparent",
                          }}>
                          <span className="font-semibold" style={{ color: isSelected ? "#D97706" : "hsl(var(--foreground))" }}>
                            {s.invoiceNumber}
                          </span>
                          <span className="font-bold" style={{ color: "#DC2626" }}>Due: {due.toLocaleString()}</span>
                        </button>
                      );
                    })}
                    <div className="pt-1.5 border-t flex items-center justify-between"
                      style={{ borderColor: "hsl(var(--border))" }}>
                      <span className="text-xs font-semibold">
                        {selectedInvoiceId !== ""
                          ? `Paying: ${unpaidCreditSales.find(s => s.id === selectedInvoiceId)?.invoiceNumber}`
                          : "Total Due (all invoices)"}
                      </span>
                      <span className="text-sm font-extrabold" style={{ color: "#DC2626" }}>
                        {selectedInvoiceId !== ""
                          ? (() => {
                              const s = unpaidCreditSales.find(x => x.id === selectedInvoiceId);
                              return s ? Math.max(0, Number(s.total) - Number(s.advancePaid ?? 0) - Number((s as any).totalRefund ?? 0)).toLocaleString() : "0";
                            })()
                          : totalCreditSaleDue.toLocaleString()}
                      </span>
                    </div>
                    {selectedInvoiceId === "" && (
                      <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Tap an invoice to pay it specifically, or leave unselected to pay oldest first
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
  const sym      = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? user?.currency ?? "$";
  const shopName = user?.shopName ?? user?.name ?? "My Shop";

  const [showPayment, setShowPayment]       = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [showFilter, setShowFilter]         = useState(false);
  const [filterFrom, setFilterFrom]         = useState("");
  const [filterTo, setFilterTo]             = useState("");

  const { data: customer, isLoading } = useQuery<any>({
    queryKey: ["customer", customerId],
    queryFn: () => fetch(`/api/customers/${customerId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!customerId,
  });

  const { data: repairs, refetch: refetchRepairs } = useQuery<any[]>({
    queryKey: ["repairs", "customer", customerId],
    queryFn: () =>
      fetch(`/api/repairs?customerId=${customerId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!customerId,
  });

  const { data: customerSales, refetch: refetchSales } = useQuery<any[]>({
    queryKey: ["sales", "customer", customerId],
    queryFn: () =>
      fetch(`/api/sales/customers/${customerId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!customerId,
  });

  const repairList = Array.isArray(repairs) ? repairs : [];
  const saleList   = Array.isArray(customerSales) ? customerSales : [];

  // Filtered sales for display
  const filteredSales = saleList.filter(s => {
    if (filterFrom && s.date < filterFrom) return false;
    if (filterTo   && s.date > filterTo)   return false;
    return true;
  });

  const totalSpent = repairList.reduce((sum, r) => sum + (Number(r.totalCost) || 0), 0);
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
    const rows = filteredSales.map(s => ({
      invoiceNumber: s.invoiceNumber, date: s.date, customerName: s.customerName ?? customer?.name,
      total: Number(s.total), status: s.status, paymentMethod: s.paymentMethod,
    }));
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

          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Total Repairs</p>
              <p className="text-xl font-extrabold mt-0.5">{repairList.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Total Spent</p>
              <p className="text-xl font-extrabold mt-0.5">{totalSpent.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Active</p>
              <p className="text-xl font-extrabold mt-0.5">
                {repairList.filter(r => r.status === "Repairing" || r.status === "Waiting").length}
              </p>
            </div>
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
            <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
              {filteredSales.map(s => {
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
          )}
        </div>

        {/* Repair history */}
        <div>
          <h2 className="font-bold text-base mb-3">Repair History</h2>
          {repairList.length === 0 ? (
            <div className="text-center py-10 bg-card rounded-2xl border border-border">
              <Wrench className="w-8 h-8 mx-auto mb-2" style={{ color: "hsl(var(--muted-foreground))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>No repairs for this customer yet.</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
              {repairList.map(r => {
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
          )}
        </div>
      </div>

      {/* Update Payment Modal */}
      {showPayment && (
        <UpdatePaymentModal
          repairList={repairList}
          saleList={saleList}
          customerId={customerId}
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
          onClose={() => setSelectedSaleId(null)}
        />
      )}
    </ProtectedPage>
  );
}
