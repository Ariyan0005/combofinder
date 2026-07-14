import { useState, useEffect, useRef, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X, Wrench, UserPlus, Package, Trash2, ChevronDown, Check, Share2, Pencil, Phone, MessageCircle } from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";

const STATUSES = ["All", "Repairing", "Ready", "Delivered", "Cancelled"];
const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  Repairing: { text: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.1)" },
  Ready:     { text: "#10B981", bg: "#ECFDF5" },
  Delivered: { text: "#6B7280", bg: "#F3F4F6" },
  Cancelled: { text: "#EF4444", bg: "#FEF2F2" },
};

const PRIMARY = "hsl(var(--primary))";
const MUTED   = "hsl(var(--muted-foreground))";
const BORDER  = "hsl(var(--border))";
const BG      = "hsl(var(--background))";
const CARD    = "hsl(var(--card))";

type Repair = {
  id: number;
  customerId?: number;
  customerName: string;
  customerPhone?: string;
  phoneBrand: string;
  phoneModel: string;
  problem: string;
  status: string;
  partsUsed?: string;
  totalCost?: string;
  laborCost?: string;
  partsCost?: string;
  advancePaid?: string;
  isPaid?: boolean;
  notes?: string;
  engineer?: string;
  createdAt: string;
  updatedAt: string;
};

type Customer = {
  id: number;
  name: string;
  phone?: string;
  whatsapp?: string;
};

type InventoryItem = {
  id: number;
  partName: string;
  quantity: number;
  sellingPrice?: string | number;
};

type PartEntry = { inventoryId: number; name: string; qty: number; unitPrice: string };

// ─── Inline customer search + add ────────────────────────────────────────────
function CustomerSearchField({
  value, phone, onChange,
}: { value: string; phone: string; onChange: (name: string, phone: string, id?: number) => void }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers", "search", query],
    queryFn: () => fetch(`/api/customers?q=${encodeURIComponent(query)}`, { credentials: "include" }).then(r => r.json()),
    enabled: query.length > 0,
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = Array.isArray(customers) ? customers.slice(0, 6) : [];

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value, phone, undefined); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search customer name"
        className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
        style={{ borderColor: BORDER, background: BG }}
        onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
      />

      {/* Dropdown */}
      {open && query.length > 0 && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-lg z-20 overflow-hidden"
          style={{ background: CARD, borderColor: BORDER }}>
          {filtered.map(c => (
            <button key={c.id} type="button"
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/30 transition-colors"
              onMouseDown={() => { onChange(c.name, c.phone ?? "", c.id); setQuery(c.name); setOpen(false); }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: PRIMARY }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{c.name}</p>
                {c.phone && <p className="text-xs" style={{ color: MUTED }}>{c.phone}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Parts selector (from inventory) ─────────────────────────────────────────
function PartsSelector({ parts, onChange }: { parts: PartEntry[]; onChange: (p: PartEntry[]) => void }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: items = [] } = useQuery<InventoryItem[]>({
    queryKey: ["inventory"],
    queryFn: () => fetch("/api/inventory", { credentials: "include" }).then(r => r.json()),
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const available = Array.isArray(items) ? items : [];
  const filtered = search.length > 0
    ? available.filter(i => i.partName.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  function addPart(item: InventoryItem) {
    if (parts.find(p => p.inventoryId === item.id)) return; // already added
    onChange([...parts, {
      inventoryId: item.id,
      name: item.partName,
      qty: 1,
      unitPrice: String(item.sellingPrice ?? ""),
    }]);
    setSearch("");
    setOpen(false);
  }

  function removePart(id: number) {
    onChange(parts.filter(p => p.inventoryId !== id));
  }

  function updatePart(id: number, field: "qty" | "unitPrice", val: string) {
    onChange(parts.map(p => p.inventoryId === id ? { ...p, [field]: val } : p));
  }

  return (
    <div>
      <div ref={ref} className="relative">
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm"
          style={{ borderColor: BORDER, background: BG }}>
          <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: MUTED }} />
          <input value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search inventory parts to add…"
            className="flex-1 outline-none bg-transparent text-sm" />
        </div>
        {open && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-lg z-20 overflow-hidden"
            style={{ background: CARD, borderColor: BORDER }}>
            {filtered.map(item => {
              const already = parts.some(p => p.inventoryId === item.id);
              return (
                <button key={item.id} type="button"
                  disabled={already || item.quantity <= 0}
                  onMouseDown={() => addPart(item)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted/30 transition-colors disabled:opacity-40">
                  <Package className="w-4 h-4 flex-shrink-0" style={{ color: PRIMARY }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.partName}</p>
                    <p className="text-xs" style={{ color: MUTED }}>Stock: {item.quantity}</p>
                  </div>
                  {already && <Check className="w-4 h-4" style={{ color: "#10B981" }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Added parts list */}
      {parts.length > 0 && (
        <div className="mt-2 space-y-2">
          {parts.map(part => (
            <div key={part.inventoryId} className="flex items-center gap-2 p-2.5 rounded-xl border"
              style={{ borderColor: BORDER, background: BG }}>
              <Package className="w-4 h-4 flex-shrink-0" style={{ color: MUTED }} />
              <span className="flex-1 text-xs font-semibold truncate">{part.name}</span>
              <input type="number" min="1" value={part.qty}
                onChange={e => updatePart(part.inventoryId, "qty", e.target.value)}
                className="w-12 text-center text-xs px-1 py-1 rounded-lg border outline-none"
                style={{ borderColor: BORDER, background: BG }}
                placeholder="Qty" />
              <input type="text" value={part.unitPrice}
                onChange={e => updatePart(part.inventoryId, "unitPrice", e.target.value)}
                className="w-20 text-right text-xs px-1 py-1 rounded-lg border outline-none"
                style={{ borderColor: BORDER, background: BG }}
                placeholder="Price" />
              <button type="button" onClick={() => removePart(part.inventoryId)}
                className="text-destructive p-1">
                <Trash2 className="w-3.5 h-3.5" style={{ color: "hsl(var(--destructive))" }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Add Customer Modal (inline) ──────────────────────────────────────────────
function AddCustomerModal({ onClose, onAdded }: { onClose: () => void; onAdded: (c: Customer) => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", phone: "", whatsapp: "", notes: "" });
  const [error, setError] = useState("");
  const mut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/customers", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      return res.json();
    },
    onSuccess: (c) => {
      // force-refetch customers list everywhere (mounted + unmounted)
      qc.invalidateQueries({ queryKey: ["customers"], refetchType: "all" });
      onAdded(c);
      onClose();
    },
    onError: (err: any) => setError(err.message),
  });
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl p-5" style={{ background: CARD }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base">Add New Customer</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--muted))", color: MUTED }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (!form.name.trim()) { setError("Name required"); return; } mut.mutate(); }}
          className="flex flex-col gap-3">
          {[
            { label: "Full Name *", key: "name", placeholder: "Customer name", type: "text" },
            { label: "Phone", key: "phone", placeholder: "Phone number", type: "tel" },
            { label: "WhatsApp", key: "whatsapp", placeholder: "WhatsApp number", type: "tel" },
            { label: "Notes", key: "notes", placeholder: "Optional notes", type: "text" },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="text-xs font-semibold block mb-1" style={{ color: MUTED }}>{label}</label>
              <input type={type} value={(form as any)[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: BORDER, background: BG }} />
            </div>
          ))}
          {error && <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
          <button type="submit" disabled={mut.isPending}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60"
            style={{ background: PRIMARY }}>
            {mut.isPending ? "Adding…" : "Add Customer"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Repair Summary Modal ─────────────────────────────────────────────────────
function RepairSummaryModal({ repair, onClose, onEdit }: { repair: Repair; onClose: () => void; onEdit: () => void }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState(repair.status);
  const [cancelReason, setCancelReason] = useState(
    repair.status === "Cancelled" ? (repair.notes ?? "") : ""
  );
  const [showPayment, setShowPayment] = useState(false);
  const [advancePaid, setAdvancePaid] = useState(String(repair.advancePaid ?? ""));
  const [isPaid, setIsPaid] = useState(!!repair.isPaid);
  const [paymentError, setPaymentError] = useState("");
  // Local reactive state so billing display updates immediately after save
  const [localIsPaid, setLocalIsPaid] = useState(!!repair.isPaid);
  const [localAdvancePaid, setLocalAdvancePaid] = useState(repair.advancePaid);

  const statusMut = useMutation<Repair, Error, { newStatus: string; reason?: string }>({
    mutationFn: async ({ newStatus, reason }) => {
      const res = await fetch(`/api/repairs/${repair.id}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...repair,
          status: newStatus,
          notes: newStatus === "Cancelled" && reason ? reason : repair.notes,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      return res.json();
    },
    onSuccess: (saved: Repair, { newStatus }) => {
      setStatus(newStatus);
      repair.status = newStatus;
      repair.notes = saved.notes; // keep notes in sync so paymentMut doesn't overwrite them
      qc.invalidateQueries({ queryKey: ["repairs"] });
    },
  });

  const paymentMut = useMutation<Repair, Error, { newAdvance: string; newIsPaid: boolean }>({
    mutationFn: async ({ newAdvance, newIsPaid }) => {
      const res = await fetch(`/api/repairs/${repair.id}`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...repair,
          status,
          // Preserve cancellation reason — don't let ...repair's stale notes overwrite it
          notes: status === "Cancelled" ? cancelReason : (repair.notes ?? null),
          advancePaid: newAdvance || null,
          isPaid: newIsPaid,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      return res.json();
    },
    onSuccess: (saved: Repair) => {
      repair.advancePaid = saved.advancePaid;
      repair.isPaid = saved.isPaid;
      repair.notes = saved.notes;
      // Update reactive local state so billing display re-renders immediately
      setLocalIsPaid(!!saved.isPaid);
      setLocalAdvancePaid(saved.advancePaid);
      setPaymentError("");
      setShowPayment(false);
      qc.invalidateQueries({ queryKey: ["repairs"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (err: any) => setPaymentError(err.message ?? "Failed to update payment"),
  });

  const partsArr: PartEntry[] = (() => { try { return repair.partsUsed ? JSON.parse(repair.partsUsed) : []; } catch { return []; } })();

  const shareText = [
    `🔧 Repair Job #${repair.id}`,
    `📱 ${repair.phoneBrand} ${repair.phoneModel}`,
    `👤 ${repair.customerName}${repair.customerPhone ? ` · ${repair.customerPhone}` : ""}`,
    `❗ Problem: ${repair.problem}`,
    repair.engineer ? `🛠 Technician: ${repair.engineer}` : null,
    `📋 Status: ${status}`,
    Number(repair.totalCost) > 0 ? `💰 Total Bill: ${Number(repair.totalCost).toFixed(2)}` : null,
    Number(repair.advancePaid) > 0 ? `✅ Advance: ${Number(repair.advancePaid).toFixed(2)}` : null,
    `📅 Date: ${new Date(repair.createdAt).toLocaleDateString()}`,
  ].filter(Boolean).join("\n");

  function escHtml(s: string | null | undefined): string {
    return String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function buildReceiptHtml(forPrint: boolean): string {
    const partsArr2: PartEntry[] = (() => { try { return repair.partsUsed ? JSON.parse(repair.partsUsed) : []; } catch { return []; } })();
    const dueAmt = Math.max(0, Number(repair.totalCost ?? 0) - Number(localAdvancePaid ?? 0));
    const isPaidNow = localIsPaid;
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Repair #${repair.id} — ${escHtml(repair.phoneBrand)} ${escHtml(repair.phoneModel)}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #111; max-width: 480px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .badge { display:inline-block; padding:2px 10px; border-radius:99px; font-size:12px; font-weight:700; background:#e0e7ff; color:#4338ca; margin-bottom:16px; }
  .section { margin-bottom:16px; padding:14px 16px; border:1px solid #e5e7eb; border-radius:12px; }
  .section h2 { font-size:10px; text-transform:uppercase; letter-spacing:.08em; color:#9ca3af; margin:0 0 8px; }
  .row { display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px; }
  .total { font-size:15px; font-weight:800; color:#4f46e5; }
  .due { color:#dc2626; font-weight:700; }
  .paid { color:#059669; font-weight:700; }
  .footer { margin-top:20px; font-size:11px; color:#9ca3af; text-align:center; }
  @media print { button { display:none; } }
</style></head>
<body>
<h1>🔧 Repair Job #${repair.id}</h1>
<div class="badge">${escHtml(status)}</div>
<div class="section">
  <h2>👤 Customer</h2>
  <div class="row"><span>${escHtml(repair.customerName || "—")}</span></div>
  ${repair.customerPhone ? `<div class="row"><span>📞 ${escHtml(repair.customerPhone ?? "")}</span></div>` : ""}
</div>
<div class="section">
  <h2>📱 Device &amp; Problem</h2>
  <div class="row"><b>${escHtml(repair.phoneBrand)} ${escHtml(repair.phoneModel)}</b></div>
  <div class="row" style="color:#6b7280">${escHtml(repair.problem)}</div>
</div>
${Number(repair.totalCost) > 0 ? `<div class="section">
  <h2>💰 Billing</h2>
  ${Number(repair.laborCost) > 0 ? `<div class="row"><span>Labor</span><span>${Number(repair.laborCost).toFixed(2)}</span></div>` : ""}
  ${partsArr2.length > 0 ? partsArr2.map(p => `<div class="row"><span>${escHtml(p.name)} ×${p.qty}</span><span>${(Number(p.unitPrice)*Number(p.qty)).toFixed(2)}</span></div>`).join("") : ""}
  <div class="row total"><span>Total</span><span>${Number(repair.totalCost).toFixed(2)}</span></div>
  ${Number(localAdvancePaid) > 0 ? `<div class="row paid"><span>Advance Paid</span><span>${Number(localAdvancePaid).toFixed(2)}</span></div>` : ""}
  ${status === "Cancelled" ? `` : isPaidNow ? `<div class="row paid"><span>✓ Fully Paid</span></div>` : dueAmt > 0 ? `<div class="row due"><span>Amount Due</span><span>${dueAmt.toFixed(2)}</span></div>` : `<div class="row paid"><span>✓ Fully Paid</span></div>`}
</div>` : ""}
${repair.engineer ? `<div class="section"><h2>🛠 Technician</h2><div>${escHtml(repair.engineer ?? "")}</div></div>` : ""}
${repair.notes ? `<div class="section"><h2>📝 Notes</h2><div>${escHtml(repair.notes ?? "")}</div></div>` : ""}
<div class="footer">ComboFinder · Created ${escHtml(new Date(repair.createdAt).toLocaleDateString())}</div>
${forPrint ? `<script>window.onload=function(){window.print();}<\/script>` : ""}
</body></html>`;
  }

  async function handleShare() {
    const html = buildReceiptHtml(true);
    // Use blob URL + programmatic link click — not blocked by popup blockers
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function handleDownloadPDF() {
    const html = buildReceiptHtml(false);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Repair-${repair.id}-${repair.phoneBrand}-${repair.phoneModel}.html`.replace(/\s+/g, "-");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const STATUS_OPTS = [
    { val: "Repairing", color: PRIMARY,   bg: `${PRIMARY}18` },
    { val: "Ready",     color: "#10B981", bg: "#ECFDF5" },
    { val: "Delivered", color: "#6B7280", bg: "#F3F4F6" },
    { val: "Cancelled", color: "#EF4444", bg: "#FEF2F2" },
  ];

  const sc = STATUS_COLOR[status] ?? { text: "#9CA3AF", bg: "#F3F4F6" };

  return createPortal((
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col"
        style={{ background: CARD, maxHeight: "92vh" }}>
        {/* Drag handle */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 rounded-full" style={{ background: BORDER }} />
        </div>
        {/* Header */}
        <div className="flex-shrink-0 px-5 pb-4 pt-1" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: sc.bg }}>
                <Wrench className="w-5 h-5" style={{ color: sc.text }} />
              </div>
              <div className="min-w-0">
                <h2 className="font-extrabold text-base truncate">{repair.phoneBrand} {repair.phoneModel}</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: sc.bg, color: sc.text }}>{status}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={onEdit}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1"
                style={{ borderColor: PRIMARY, color: PRIMARY, background: `${PRIMARY}10` }}>
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "hsl(var(--muted))", color: MUTED }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-2.5 space-y-2.5">

          {/* Customer */}
          <div className="rounded-2xl px-3.5 py-2.5" style={{ background: BG, border: `1px solid ${BORDER}` }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: MUTED }}>👤 Customer</p>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight">{repair.customerName || "—"}</p>
                {repair.customerPhone && (
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>{repair.customerPhone}</p>
                )}
              </div>
              {repair.customerPhone && (
                <div className="flex flex-row gap-2 flex-shrink-0">
                  {/* Call button */}
                  <a href={`tel:${repair.customerPhone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: "#ECFDF5", color: "#059669" }}
                    title="Call customer">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                  {/* WhatsApp button */}
                  <a href={`https://wa.me/${repair.customerPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: "#DCFCE7", color: "#16A34A" }}
                    title="WhatsApp">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Device & Problem */}
          <div className="rounded-2xl px-3.5 py-2.5 space-y-1.5" style={{ background: BG, border: `1px solid ${BORDER}` }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: MUTED }}>📱 Device & Problem</p>
            <p className="font-semibold text-sm">{repair.phoneBrand} {repair.phoneModel}</p>
            <p className="text-sm" style={{ color: MUTED }}>{repair.problem}</p>
          </div>

          {/* Update Status */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: MUTED }}>🔧 Update Status</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTS.map(s => (
                <button key={s.val} type="button"
                  disabled={statusMut.isPending}
                  onClick={() => { if (status !== s.val) { setStatus(s.val); statusMut.mutate({ newStatus: s.val, reason: cancelReason }); } }}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold border transition-all"
                  style={status === s.val
                    ? { background: s.bg, color: s.color, borderColor: s.color }
                    : { background: "transparent", color: MUTED, borderColor: BORDER }}>
                  {status === s.val && "✓ "}{s.val}
                </button>
              ))}
            </div>
          </div>

          {/* Cancellation reason */}
          {status === "Cancelled" && (
            <div className="rounded-2xl px-3.5 py-2.5 space-y-1.5" style={{ background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#DC2626" }}>❌ Cancellation Reason</p>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                onBlur={() => { if (cancelReason !== repair.notes) statusMut.mutate({ newStatus: "Cancelled", reason: cancelReason }); }}
                placeholder="Enter reason for cancellation…"
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: "#FCA5A5", background: "#fff", color: "#DC2626" }}
              />
            </div>
          )}

          {/* Billing */}
          {Number(repair.totalCost) > 0 && (
            <div className="rounded-2xl px-3.5 py-2.5 space-y-1.5" style={{ background: BG, border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>💰 Billing</p>
              {Number(repair.partsCost) > 0 && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: MUTED }}>Parts</span>
                  <span className="font-semibold">{Number(repair.partsCost).toFixed(2)}</span>
                </div>
              )}
              {Number(repair.laborCost) > 0 && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: MUTED }}>Labor</span>
                  <span className="font-semibold">{Number(repair.laborCost).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold border-t pt-2" style={{ borderColor: BORDER }}>
                <span>Total</span>
                <span style={{ color: PRIMARY }}>{Number(repair.totalCost).toFixed(2)}</span>
              </div>
              {Number(localAdvancePaid) > 0 && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: MUTED }}>Advance Paid</span>
                  <span className="font-semibold" style={{ color: "#059669" }}>{Number(localAdvancePaid).toFixed(2)}</span>
                </div>
              )}
              <div className="rounded-xl px-3 py-2"
                style={{ background: localIsPaid ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${localIsPaid ? "#6EE7B7" : "#FCA5A5"}` }}>
                <span className="text-xs font-bold" style={{ color: localIsPaid ? "#059669" : "#DC2626" }}>
                  {localIsPaid ? "✓ Fully Paid" : `Amount Due: ${Math.max(0, Number(repair.totalCost) - Number(localAdvancePaid ?? 0)).toFixed(2)}`}
                </span>
              </div>

              {!showPayment && (
                <button type="button" onClick={() => { setAdvancePaid(String(localAdvancePaid ?? "")); setIsPaid(localIsPaid); setPaymentError(""); setShowPayment(true); }}
                  className="w-full py-3 rounded-xl text-sm font-extrabold border-2 flex items-center justify-center gap-2 mt-1"
                  style={{ borderColor: PRIMARY, color: PRIMARY, background: `${PRIMARY}12` }}>
                  💵 Update Payment
                </button>
              )}

              {/* Inline payment editor */}
              {showPayment && (
                <div className="rounded-xl p-3 space-y-2.5 mt-1" style={{ background: CARD, border: `1px solid ${PRIMARY}40` }}>
                  <div>
                    <label className="text-[11px] font-semibold block mb-1" style={{ color: MUTED }}>Advance / Amount Paid</label>
                    <input type="text" inputMode="decimal" value={advancePaid}
                      onChange={e => setAdvancePaid(e.target.value)}
                      placeholder="0.00" autoFocus
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none font-semibold"
                      style={{ borderColor: BORDER, background: BG }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { val: false, label: "Unpaid / Due", color: "#EF4444" },
                      { val: true,  label: "Fully Paid",   color: "#10B981" },
                    ] as const).map(({ val, label, color }) => (
                      <button key={String(val)} type="button"
                        onClick={() => setIsPaid(val)}
                        className="py-2 rounded-xl text-xs font-bold border transition-all"
                        style={isPaid === val
                          ? { background: color, color: "#fff", borderColor: color }
                          : { background: "transparent", color: MUTED, borderColor: BORDER }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {paymentError && (
                    <p className="text-[11px] font-semibold" style={{ color: "#DC2626" }}>{paymentError}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => { setShowPayment(false); setPaymentError(""); }}
                      className="py-2.5 rounded-xl text-xs font-bold border"
                      style={{ borderColor: BORDER, color: MUTED }}>
                      Cancel
                    </button>
                    <button type="button" disabled={paymentMut.isPending}
                      onClick={() => {
                        const trimmed = advancePaid.trim();
                        if (trimmed && (isNaN(Number(trimmed)) || Number(trimmed) < 0)) {
                          setPaymentError("Enter a valid non-negative amount");
                          return;
                        }
                        paymentMut.mutate({ newAdvance: trimmed, newIsPaid: isPaid });
                      }}
                      className="py-2.5 rounded-xl text-xs font-extrabold text-white disabled:opacity-60"
                      style={{ background: PRIMARY }}>
                      {paymentMut.isPending ? "Saving…" : "Save Payment"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parts used */}
          {partsArr.length > 0 && (
            <div className="rounded-2xl px-3.5 py-2.5 space-y-1.5" style={{ background: BG, border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: MUTED }}>📦 Parts Used</p>
              {partsArr.map((p, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span>{p.name} × {p.qty}</span>
                  <span className="font-semibold">{(Number(p.unitPrice) * Number(p.qty)).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {repair.engineer && (
            <div className="rounded-2xl px-3.5 py-2.5" style={{ background: BG, border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: MUTED }}>🛠 Technician</p>
              <p className="text-sm font-semibold">{repair.engineer}</p>
            </div>
          )}

          {/* Notes — hidden when Cancelled (cancel reason is already shown above) */}
          {repair.notes && status !== "Cancelled" && (
            <div className="rounded-2xl px-3.5 py-2.5" style={{ background: BG, border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: MUTED }}>📝 Notes</p>
              <p className="text-sm" style={{ color: MUTED }}>{repair.notes}</p>
            </div>
          )}

          {/* Share / Download */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleShare}
              className="py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border"
              style={{ borderColor: PRIMARY, color: PRIMARY }}>
              <Share2 className="w-4 h-4" /> Share / Print
            </button>
            <button onClick={handleDownloadPDF}
              className="py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white"
              style={{ background: PRIMARY }}>
              ⬇ Download PDF
            </button>
          </div>

          <p className="text-[10px] text-center pb-2" style={{ color: MUTED }}>
            Created {new Date(repair.createdAt).toLocaleDateString()}
            {repair.createdAt !== repair.updatedAt && ` · Updated ${new Date(repair.updatedAt).toLocaleDateString()}`}
          </p>
        </div>
      </div>
    </div>
  ), document.body);
}

// ─── Section label helper ─────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: MUTED }}>
      {children}
    </p>
  );
}

// ─── Repair form (create / edit) ──────────────────────────────────────────────
function RepairForm({ onClose, existing }: { onClose: () => void; existing?: Repair }) {
  const qc = useQueryClient();
  const [customerId, setCustomerId] = useState<number | undefined>(existing?.customerId ?? undefined);
  const [form, setForm] = useState({
    customerName:  existing?.customerName  ?? "",
    customerPhone: existing?.customerPhone ?? "",
    phoneBrand:    existing?.phoneBrand    ?? "",
    phoneModel:    existing?.phoneModel    ?? "",
    problem:       existing?.problem       ?? "",
    status:        existing?.status        ?? "Repairing",
    engineer:      existing?.engineer      ?? "",
    laborCost:     String(existing?.laborCost  ?? ""),
    advancePaid:   String(existing?.advancePaid ?? ""),
    isPaid:        existing?.isPaid        ?? false,
    notes:         existing?.notes         ?? "",
  });
  const [showAddCust, setShowAddCust] = useState(false);

  // Parse existing partsUsed JSON
  const initialParts: PartEntry[] = (() => {
    try { return existing?.partsUsed ? JSON.parse(existing.partsUsed) : []; } catch { return []; }
  })();
  const [parts, setParts] = useState<PartEntry[]>(initialParts);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const partsCost = parts.reduce((sum, p) => sum + (Number(p.unitPrice) * Number(p.qty) || 0), 0);
  const totalCost = (Number(form.laborCost) || 0) + partsCost;

  const mut = useMutation({
    mutationFn: async () => {
      const url = existing ? `/api/repairs/${existing.id}` : `/api/repairs`;
      const body = {
        ...form,
        customerId: customerId ?? null,
        partsUsed: JSON.stringify(parts),
        partsCost: String(partsCost),
        totalCost: String(totalCost),
        advancePaid: form.advancePaid || null,
        isPaid: form.isPaid,
      };
      const res = await fetch(url, {
        method: existing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      const saved = await res.json();

      // Deduct parts from inventory (only on new repair creation)
      if (!existing && parts.length > 0) {
        const results = await Promise.allSettled(parts.map(p =>
          fetch("/api/stock-movements", {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inventoryId: p.inventoryId,
              type: "out",
              quantity: Number(p.qty) || 1,
              unitPrice: p.unitPrice || null,
              notes: `Used in repair #${saved.id}`,
            }),
          }).then(r => r.ok ? r.json() : r.json().then(d => { throw new Error(d.error ?? "Failed"); }))
        ));
        qc.invalidateQueries({ queryKey: ["inventory"] });
        const failed = results.filter(r => r.status === "rejected");
        if (failed.length > 0) {
          console.warn(`${failed.length} part(s) could not be deducted from inventory (may be insufficient stock)`);
        }
      }
      return saved;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["repairs"] }); qc.invalidateQueries({ queryKey: ["stats"] }); onClose(); },
    onError: (err: any) => setError(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // For new repairs, customer must be selected from DB
    if (!existing && !customerId) { setError("Please select a customer from the list or add a new one"); return; }
    if (!form.customerName.trim()) { setError("Customer name is required"); return; }
    if (!form.phoneBrand.trim() || !form.phoneModel.trim()) { setError("Phone brand and model are required"); return; }
    if (!form.problem.trim()) { setError("Problem description is required"); return; }
    mut.mutate();
  }

  const STATUS_OPTS = [
    { val: "Repairing", color: PRIMARY,   bg: `${PRIMARY}18` },
    { val: "Ready",     color: "#10B981", bg: "#ECFDF5" },
    { val: "Delivered", color: "#6B7280", bg: "#F3F4F6" },
    { val: "Cancelled", color: "#EF4444", bg: "#FEF2F2" },
  ];
  const advanceNum = Number(form.advancePaid) || 0;
  const dueAmount  = Math.max(0, totalCost - advanceNum);

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: CARD, maxHeight: "90vh" }}>

        {/* Drag handle */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-12 h-1.5 rounded-full" style={{ background: BORDER }} />
        </div>

        {/* Gradient header */}
        <div className="flex-shrink-0 px-5 pt-3 pb-4"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}15 0%, transparent 100%)`, borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${PRIMARY}20` }}>
                <Wrench className="w-5 h-5" style={{ color: PRIMARY }} />
              </div>
              <div className="min-w-0">
                <h2 className="font-extrabold text-base truncate" style={{ color: "hsl(var(--foreground))" }}>
                  {existing ? "Edit Repair" : "New Repair Job"}
                </h2>
                <p className="text-[10px] truncate" style={{ color: MUTED }}>
                  {existing ? `Repair #${existing.id}` : "Fill in the repair details below"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(var(--muted))", color: MUTED }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-4">

            {/* ── Customer ── */}
            <div className="rounded-2xl border p-4 space-y-3"
              style={{ borderColor: !existing && !customerId && error ? "#FCA5A5" : BORDER, background: BG }}>
              <div className="flex items-center justify-between">
                <SectionLabel>👤 Customer</SectionLabel>
                <button type="button"
                  onClick={() => setShowAddCust(true)}
                  className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg"
                  style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
                  <UserPlus className="w-3 h-3" /> Add New
                </button>
              </div>

              {/* Show selected customer chip OR search */}
              {customerId && form.customerName ? (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border"
                  style={{ borderColor: "#6EE7B7", background: "#ECFDF5" }}>
                  <div>
                    <p className="text-sm font-bold text-green-800">{form.customerName}</p>
                    {form.customerPhone && <p className="text-xs text-green-700">{form.customerPhone}</p>}
                  </div>
                  <button type="button"
                    onClick={() => { setCustomerId(undefined); setForm(p => ({ ...p, customerName: "", customerPhone: "" })); }}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "#D1FAE5", color: "#059669" }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <CustomerSearchField
                  value={form.customerName}
                  phone={form.customerPhone}
                  onChange={(name, phone, id) => {
                    setForm(p => ({ ...p, customerName: name, customerPhone: phone }));
                    setCustomerId(id);
                    if (error) setError("");
                  }}
                />
              )}
            </div>

            {/* ── Device ── */}
            <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: BORDER, background: BG }}>
              <SectionLabel>📱 Device Information</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.phoneBrand} onChange={e => set("phoneBrand", e.target.value)}
                  placeholder="Brand (e.g. Samsung) *" required
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: BORDER, background: CARD }} />
                <input value={form.phoneModel} onChange={e => set("phoneModel", e.target.value)}
                  placeholder="Model (e.g. A54) *" required
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: BORDER, background: CARD }} />
              </div>
              <textarea value={form.problem} onChange={e => set("problem", e.target.value)}
                placeholder="Describe the problem / issue… *" rows={2} required
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: BORDER, background: CARD }} />
            </div>

            {/* ── Status ── */}
            <div>
              <SectionLabel>🔧 Repair Status</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTS.map(s => (
                  <button key={s.val} type="button"
                    onClick={() => set("status", s.val)}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left"
                    style={form.status === s.val
                      ? { background: s.bg, color: s.color, borderColor: s.color }
                      : { background: "transparent", color: MUTED, borderColor: BORDER }}>
                    {form.status === s.val && "✓ "}{s.val}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Technician ── */}
            <div>
              <SectionLabel>🛠 Technician</SectionLabel>
              <input value={form.engineer} onChange={e => set("engineer", e.target.value)}
                placeholder="Technician / engineer name (optional)"
                className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: BORDER, background: BG }} />
            </div>

            {/* ── Parts ── */}
            <div>
              <SectionLabel>📦 Parts Used (from inventory)</SectionLabel>
              <PartsSelector parts={parts} onChange={setParts} />
              {parts.length > 0 && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: MUTED }}>
                  Parts subtotal: {partsCost.toFixed(2)}
                </p>
              )}
            </div>

            {/* ── Billing ── */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER }}>
              <div className="px-4 py-2.5" style={{ background: `${PRIMARY}10`, borderBottom: `1px solid ${BORDER}` }}>
                <SectionLabel>💰 Billing & Payment</SectionLabel>
              </div>
              <div className="p-4 space-y-3" style={{ background: BG }}>
                {/* Labor cost */}
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: MUTED }}>Labor / Service Cost</label>
                  <input type="text" inputMode="decimal" value={form.laborCost}
                    onChange={e => set("laborCost", e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none font-semibold"
                    style={{ borderColor: BORDER, background: CARD }} />
                </div>

                {/* Summary */}
                {totalCost > 0 && (
                  <div className="rounded-xl p-3 space-y-2" style={{ background: `${PRIMARY}08`, border: `1px solid ${PRIMARY}30` }}>
                    {partsCost > 0 && (
                      <div className="flex justify-between text-xs">
                        <span style={{ color: MUTED }}>Parts</span>
                        <span className="font-semibold">{partsCost.toFixed(2)}</span>
                      </div>
                    )}
                    {Number(form.laborCost) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span style={{ color: MUTED }}>Labor</span>
                        <span className="font-semibold">{Number(form.laborCost).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-extrabold border-t pt-2" style={{ borderColor: `${PRIMARY}30` }}>
                      <span>Total Bill</span>
                      <span style={{ color: PRIMARY }}>{totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Advance */}
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: MUTED }}>Advance Received</label>
                  <input type="text" inputMode="decimal" value={form.advancePaid}
                    onChange={e => set("advancePaid", e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: BORDER, background: CARD }} />
                </div>

                {/* Due */}
                {totalCost > 0 && (
                  <div className="flex items-center justify-between rounded-xl px-3 py-2.5"
                    style={{ background: dueAmount > 0 ? "#FEF2F2" : "#ECFDF5", border: `1px solid ${dueAmount > 0 ? "#FCA5A5" : "#6EE7B7"}` }}>
                    <span className="text-xs font-bold" style={{ color: dueAmount > 0 ? "#DC2626" : "#059669" }}>
                      {dueAmount > 0 ? "Amount Due" : "Fully Paid ✓"}
                    </span>
                    {dueAmount > 0 && (
                      <span className="text-base font-extrabold" style={{ color: "#DC2626" }}>{dueAmount.toFixed(2)}</span>
                    )}
                  </div>
                )}

                {/* Payment status */}
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: MUTED }}>Payment Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { val: false, label: "Unpaid / Due",  color: "#EF4444" },
                      { val: true,  label: "Fully Paid",    color: "#10B981" },
                    ] as const).map(({ val, label, color }) => (
                      <button key={String(val)} type="button"
                        onClick={() => setForm(p => ({ ...p, isPaid: val }))}
                        className="py-2 rounded-xl text-xs font-bold border transition-all"
                        style={form.isPaid === val
                          ? { background: color, color: "#fff", borderColor: color }
                          : { background: "transparent", color: MUTED, borderColor: BORDER }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Notes ── */}
            <div>
              <SectionLabel>📝 Internal Notes</SectionLabel>
              <input value={form.notes} onChange={e => set("notes", e.target.value)}
                placeholder="Optional internal notes…"
                className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: BORDER, background: BG }} />
            </div>

            {error && (
              <div className="text-xs text-center px-4 py-2.5 rounded-xl font-semibold"
                style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FCA5A5" }}>
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pb-2">
              <button type="button" onClick={onClose}
                className="py-3.5 rounded-xl font-semibold text-sm border"
                style={{ borderColor: BORDER, color: MUTED }}>
                Cancel
              </button>
              <button type="submit" disabled={mut.isPending}
                className="py-3.5 rounded-xl font-extrabold text-white text-sm disabled:opacity-60"
                style={{ background: PRIMARY }}>
                {mut.isPending ? "Saving…" : existing ? "Save Changes" : "Create Repair"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    {/* Add Customer modal — inside RepairForm so the new customer auto-selects */}
    {showAddCust && (
      <AddCustomerModal
        onClose={() => setShowAddCust(false)}
        onAdded={(c: Customer) => {
          setForm(p => ({ ...p, customerName: c.name, customerPhone: c.phone ?? "" }));
          setCustomerId(c.id);
          setShowAddCust(false);
          if (error) setError("");
        }}
      />
    )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Repairs() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editRepair, setEditRepair] = useState<Repair | undefined>();
  const [viewRepair, setViewRepair] = useState<Repair | undefined>();
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const qc = useQueryClient();

  const { data: repairs = [], isLoading } = useQuery<Repair[]>({
    queryKey: ["repairs"],
    queryFn: () => fetch("/api/repairs", { credentials: "include" }).then(r => r.json()),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => fetch(`/api/repairs/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["repairs"] }); qc.invalidateQueries({ queryKey: ["stats"] }); },
  });

  const list = Array.isArray(repairs) ? repairs : [];
  const filtered = list.filter(r => {
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    const q = searchQ.toLowerCase();
    const matchSearch = !q ||
      r.customerName?.toLowerCase().includes(q) ||
      r.phoneBrand?.toLowerCase().includes(q) ||
      r.phoneModel?.toLowerCase().includes(q) ||
      r.problem?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <ProtectedPage>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-extrabold">Repairs</h1>
            <p className="text-xs" style={{ color: MUTED }}>{list.length} total</p>
          </div>
          <button onClick={() => { setEditRepair(undefined); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-bold shadow-sm"
            style={{ background: PRIMARY }}>
            <Plus className="w-4 h-4" /> New
          </button>
        </div>

        {/* Search + Customer Add */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border"
            style={{ borderColor: BORDER, background: "hsl(var(--card))" }}>
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: MUTED }} />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Search repairs…"
              className="flex-1 text-sm outline-none bg-transparent" />
          </div>
          <button
            onClick={() => setShowAddCustomer(true)}
            className="px-3 py-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold flex-shrink-0"
            style={{ borderColor: PRIMARY, color: PRIMARY, background: `${PRIMARY}10` }}>
            <UserPlus className="w-3.5 h-3.5" />
            Customer
          </button>
        </div>

        {/* Status filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors"
              style={statusFilter === s
                ? { background: PRIMARY, color: "#fff", borderColor: PRIMARY }
                : { background: "transparent", color: MUTED, borderColor: BORDER }}>
              {s}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Wrench className="w-10 h-10 mx-auto mb-3" style={{ color: MUTED }} />
            <p className="font-semibold">No repairs found</p>
            <p className="text-sm mt-1" style={{ color: MUTED }}>
              {list.length === 0 ? "Create your first repair job" : "Try a different filter"}
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {filtered.map(r => {
              const sc = STATUS_COLOR[r.status] ?? { text: "#9CA3AF", bg: "#F3F4F6" };
              const partsCount = (() => { try { return r.partsUsed ? JSON.parse(r.partsUsed).length : 0; } catch { return 0; } })();
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer"
                    style={{ background: sc.bg }} onClick={() => setViewRepair(r)}>
                    <Wrench className="w-4 h-4" style={{ color: sc.text }} />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setViewRepair(r)}>
                    <p className="text-sm font-semibold truncate">{r.phoneBrand} {r.phoneModel}</p>
                    <p className="text-xs truncate" style={{ color: MUTED }}>
                      {r.customerName ? `${r.customerName}${r.customerPhone ? ` · ${r.customerPhone}` : ""} · ` : ""}{r.problem}
                    </p>
                    <p className="text-[10px] mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: MUTED }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                      {partsCount > 0 && <span className="flex items-center gap-0.5"><Package className="w-2.5 h-2.5" /> {partsCount} part{partsCount > 1 ? "s" : ""}</span>}
                      {r.totalCost && Number(r.totalCost) > 0 && <span>· Bill: {Number(r.totalCost).toFixed(2)}</span>}
                      {r.totalCost && Number(r.totalCost) > 0 && r.status !== "Cancelled" && (
                        <span className="px-1.5 py-0.5 rounded-full font-bold text-[9px]"
                          style={r.isPaid
                            ? { background: "#ECFDF5", color: "#059669" }
                            : { background: "#FEF3C7", color: "#D97706" }}>
                          {r.isPaid ? "Paid" : "Due"}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: sc.bg, color: sc.text }}>{r.status}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditRepair(r); setViewRepair(undefined); setShowForm(true); }}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border"
                        style={{ borderColor: PRIMARY, color: PRIMARY, background: `${PRIMARY}10` }}>
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this repair?")) deleteMut.mutate(r.id); }}
                        className="p-1.5 rounded-xl border"
                        style={{ borderColor: "hsl(var(--destructive) / 0.3)", color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.06)" }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && <RepairForm onClose={() => { setShowForm(false); setEditRepair(undefined); }} existing={editRepair} />}
      {viewRepair && (
        <RepairSummaryModal
          repair={viewRepair}
          onClose={() => setViewRepair(undefined)}
          onEdit={() => { setEditRepair(viewRepair); setViewRepair(undefined); setShowForm(true); }}
        />
      )}
      {showAddCustomer && (
        <AddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onAdded={() => {}}
        />
      )}
    </ProtectedPage>
  );
}
