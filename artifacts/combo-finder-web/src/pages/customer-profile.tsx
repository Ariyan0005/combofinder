import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Phone, MessageSquare, Wrench, DollarSign, X } from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";


function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  Waiting:   { text: "#F59E0B", bg: "#FFF7E6" },
  Repairing: { text: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.1)" },
  Ready:     { text: "#10B981", bg: "#ECFDF5" },
  Delivered: { text: "#6B7280", bg: "#F3F4F6" },
};

function RecordPaymentModal({ customerId, due, onClose, onSaved }: { customerId: number; due: number; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState(String(due));
  const [error, setError] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/sales/customers/${customerId}/payment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to record payment");
      return data;
    },
    onSuccess: () => { onSaved(); onClose(); },
    onError: (err: any) => setError(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-3xl md:rounded-3xl shadow-2xl p-5 space-y-4"
        style={{ background: "hsl(var(--card))" }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">Record Payment</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--muted))" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          Outstanding credit due: <strong>{due.toLocaleString()}</strong>
        </p>
        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Amount received</label>
          <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }} />
        </div>
        {error && <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
        <button onClick={() => mut.mutate()} disabled={mut.isPending || !Number(amount) || Number(amount) <= 0}
          className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: "hsl(var(--primary))" }}>
          {mut.isPending ? "Saving…" : "Record Payment"}
        </button>
      </div>
    </div>
  );
}

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

  const { data: repairs } = useQuery<any[]>({
    queryKey: ["repairs", "customer", customerId],
    queryFn: () =>
      fetch(`/api/repairs?customerId=${customerId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!customerId,
  });

  const repairList = Array.isArray(repairs) ? repairs : [];
  const totalSpent = repairList.reduce((sum, r) => sum + (r.totalCost ?? 0), 0);

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
          <button className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Customers
          </button>
        </Link>

        {/* Profile header */}
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

          {/* Credit due (POS credit sales) */}
          {(customer.creditDue ?? 0) > 0 && (
            <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>Credit Due (POS)</p>
                <p className="text-lg font-extrabold" style={{ color: "#DC2626" }}>{Number(customer.creditDue).toLocaleString()}</p>
              </div>
              <button onClick={() => setShowPayment(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white flex-shrink-0"
                style={{ background: "hsl(var(--primary))" }}>
                <DollarSign className="w-4 h-4" /> Record Payment
              </button>
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
                return (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{[r.phoneBrand, r.phoneModel].filter(Boolean).join(" ") || "Device"}</p>
                      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {r.problem ?? "–"}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: sc.bg, color: sc.text }}>{r.status}</span>
                      {r.totalCost ? (
                        <span className="text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {Number(r.totalCost).toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showPayment && (
        <RecordPaymentModal
          customerId={customerId}
          due={Number(customer.creditDue ?? 0)}
          onClose={() => setShowPayment(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["customer", customerId] }); qc.invalidateQueries({ queryKey: ["customers"] }); }}
        />
      )}
    </ProtectedPage>
  );
}
