import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Phone, MessageSquare, Wrench, X, Receipt, CreditCard, CheckCircle } from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";

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

// ─── Update Payment Modal ─────────────────────────────────────────────────────
function UpdatePaymentModal({
  repairList, onClose, onSaved,
}: {
  repairList: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  // Only show repairs with a total cost that are not yet fully paid
  const unpaid = repairList.filter(
    r => Number(r.totalCost) > 0 && !r.isPaid && r.status !== "Cancelled"
  );

  async function savePayment(repair: any, fullyPaid: boolean) {
    const amountStr = amounts[repair.id] ?? "";
    const totalCost = Number(repair.totalCost);
    const amount = fullyPaid ? totalCost : Number(amountStr);

    if (!fullyPaid && (!amountStr || amount <= 0)) {
      setError("Enter an amount first");
      return;
    }
    setError("");
    setSaving(repair.id);
    try {
      const isPaidNow = fullyPaid || amount >= totalCost;
      const res = await fetch(`/api/repairs/${repair.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName:  repair.customerName,
          customerPhone: repair.customerPhone ?? "",
          phoneBrand:    repair.phoneBrand,
          phoneModel:    repair.phoneModel,
          imei:          repair.imei ?? null,
          problem:       repair.problem,
          status:        repair.status,
          engineer:      repair.engineer ?? null,
          partsUsed:     repair.partsUsed ?? null,
          laborCost:     repair.laborCost ?? null,
          partsCost:     repair.partsCost ?? null,
          totalCost:     repair.totalCost ?? null,
          advancePaid:   String(amount),
          isPaid:        isPaidNow,
          notes:         repair.notes ?? null,
          warrantyDays:  repair.warrantyDays ?? 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setDone(prev => new Set([...prev, repair.id]));
      onSaved();
    } catch (err: any) {
      setError(err.message ?? "Failed to update payment");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col"
        style={{ background: "hsl(var(--card))", maxHeight: "80vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b flex-shrink-0"
          style={{ borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            <h3 className="font-bold text-base">Update Payment</h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {unpaid.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "#10B981" }} />
              <p className="font-semibold">All repairs fully paid</p>
              <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                No outstanding balance for this customer
              </p>
            </div>
          ) : (
            unpaid.map(r => {
              const total    = Number(r.totalCost);
              const advance  = Number(r.advancePaid ?? 0);
              const balance  = Math.max(0, total - advance);
              const isDone   = done.has(r.id);
              const isSaving = saving === r.id;

              return (
                <div key={r.id} className="rounded-2xl border p-4 space-y-3"
                  style={{
                    borderColor: isDone ? "#6EE7B7" : "hsl(var(--border))",
                    background: isDone ? "#ECFDF5" : "hsl(var(--background))",
                  }}>
                  {/* Repair info row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {r.phoneBrand} {r.phoneModel}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {r.problem}
                      </p>
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
                      <button
                        disabled={isSaving}
                        onClick={() => savePayment(r, true)}
                        className="text-xs font-bold px-2.5 py-1.5 rounded-xl text-white flex-shrink-0 disabled:opacity-50"
                        style={{ background: "#10B981" }}>
                        {isSaving ? "…" : "Mark Paid"}
                      </button>
                    )}
                  </div>

                  {/* Partial amount input */}
                  {!isDone && (
                    <div className="flex gap-2">
                      <input
                        type="number" min="0" step="0.01"
                        value={amounts[r.id] ?? ""}
                        onChange={e => setAmounts(p => ({ ...p, [r.id]: e.target.value }))}
                        placeholder="Or enter amount received…"
                        className="flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none"
                        style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
                      />
                      <button
                        disabled={isSaving || !amounts[r.id] || Number(amounts[r.id]) <= 0}
                        onClick={() => savePayment(r, false)}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex-shrink-0"
                        style={{ background: "hsl(var(--primary))" }}>
                        {isSaving ? "…" : "Save"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
          {error && (
            <p className="text-xs text-center" style={{ color: "hsl(var(--destructive))" }}>{error}</p>
          )}
        </div>

        {/* Footer close */}
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CustomerProfile() {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);
  const qc = useQueryClient();
  const [showPayment, setShowPayment] = useState(false);

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

  const { data: customerSales } = useQuery<any[]>({
    queryKey: ["sales", "customer", customerId],
    queryFn: () =>
      fetch(`/api/sales/customers/${customerId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!customerId,
  });

  const repairList = Array.isArray(repairs) ? repairs : [];
  const saleList   = Array.isArray(customerSales) ? customerSales : [];
  const totalSpent = repairList.reduce((sum, r) => sum + (Number(r.totalCost) || 0), 0);

  // Total unpaid repair balance
  const repairDue = repairList.reduce((sum, r) => {
    if (r.isPaid || r.status === "Cancelled") return sum;
    const balance = Math.max(0, Number(r.totalCost || 0) - Number(r.advancePaid || 0));
    return sum + balance;
  }, 0);
  const hasUnpaidRepairs = repairList.some(
    r => !r.isPaid && Number(r.totalCost) > 0 && r.status !== "Cancelled"
  );

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
            <button className="mt-4 text-sm font-semibold" style={{ color: "hsl(var(--primary))" }}>← Back to Customers</button>
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
          {/* Avatar + name */}
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

          {/* Contact buttons */}
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

          {/* Stats */}
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

          {/* Repair balance due + Update Payment button */}
          {hasUnpaidRepairs && (
            <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Repair Balance Due</p>
                <p className="text-lg font-extrabold" style={{ color: "#DC2626" }}>
                  {repairDue.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setShowPayment(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white flex-shrink-0"
                style={{ background: "hsl(var(--primary))" }}>
                <CreditCard className="w-4 h-4" /> Update Payment
              </button>
            </div>
          )}
        </div>

        {/* Sale History */}
        <div>
          <h2 className="font-bold text-base mb-3">Sale History</h2>
          {saleList.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-2xl border border-border">
              <Receipt className="w-8 h-8 mx-auto mb-2" style={{ color: "hsl(var(--muted-foreground))" }} />
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>No purchases yet.</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
              {saleList.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(var(--primary) / 0.1)" }}>
                    <Receipt className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{s.invoiceNumber}</p>
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {s.paymentMethod} · {new Date(s.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-bold" style={{ color: "hsl(var(--primary))" }}>
                      {Number(s.total).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: s.status === "Paid" ? "#ECFDF5" : s.status === "Credit" ? "#FEF3C7" : "#F3F4F6",
                        color:      s.status === "Paid" ? "#059669" : s.status === "Credit" ? "#D97706" : "#6B7280",
                      }}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
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
                const sc = STATUS_COLOR[r.status] ?? { text: "#9CA3AF", bg: "#F3F4F6" };
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
          onClose={() => setShowPayment(false)}
          onSaved={() => {
            refetchRepairs();
            qc.invalidateQueries({ queryKey: ["repairs"] });
          }}
        />
      )}
    </ProtectedPage>
  );
}
