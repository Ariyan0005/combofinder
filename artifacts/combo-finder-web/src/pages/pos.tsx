import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Search, Package, Minus, Plus, Trash2, ShoppingCart, CheckCircle,
  ClipboardList, X, Boxes, User, Users, ChevronDown, QrCode, ChevronUp,
} from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";
import { generateInvoicePdf, type InvoiceData } from "@/lib/invoice-pdf";
import { useAuth } from "@/context/auth-context";
import { localInventory, localCustomers, localSales, localStaff } from "@/lib/local-store";
import { PosDemo } from "@/components/demo/pos-demo";
import { useBranchSelection } from "@/lib/branch-store";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", BDT: "Tk", INR: "₹",
  PKR: "₨", NPR: "रू", LKR: "Rs", AED: "د.إ", SAR: "﷼",
  OMR: "OMR", KWD: "KD", QAR: "QR", MYR: "RM", SGD: "S$",
};

const PRIMARY = "hsl(var(--primary))";
const MUTED = "hsl(var(--muted-foreground))";
const BORDER = "hsl(var(--border))";
const CARD = "hsl(var(--card))";
const BG = "hsl(var(--background))";
const MUTED_BG = "hsl(var(--muted))";

type Item = {
  id: number; partName: string; partType?: string; quantity: number;
  sellingPrice?: string | number; barcode?: string; sku?: string;
};

type CartLine = { item: Item; quantity: number; unitPrice: number };

type Customer = {
  id: number; name: string; phone?: string; whatsapp?: string;
};

// ── Customer Picker ──────────────────────────────────────────────────────────
function CustomerPicker({
  customerName,
  onCustomerName,
  customerPhone,
  onCustomerPhone,
  customerId,
  onCustomerId,
  customers,
  onResetCredit,
}: {
  customerName: string;
  onCustomerName: (v: string) => void;
  customerPhone: string;
  onCustomerPhone: (v: string) => void;
  customerId: number | null;
  onCustomerId: (id: number | null) => void;
  customers: Customer[];
  onResetCredit?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isCashCustomer = !customerName || customerName === "Cash Customer";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers.slice(0, 15);
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone ?? "").includes(q)
    ).slice(0, 15);
  }, [customers, search]);

  function selectCashCustomer() {
    onCustomerName("Cash Customer");
    onCustomerPhone("");
    onCustomerId(null);
    setSearch("");
    setOpen(false);
    onResetCredit?.();
  }

  function selectDbCustomer(c: Customer) {
    onCustomerName(c.name);
    onCustomerPhone(c.phone ?? "");
    onCustomerId(c.id);
    setSearch("");
    setOpen(false);
  }

  function selectCustomName(name: string) {
    onCustomerName(name);
    onCustomerId(null);
    setSearch("");
    setOpen(false);
  }

  return (
    <div className="space-y-2 relative" ref={ref}>
      {/* Single Search / Select bar */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
          {isCashCustomer ? (
            <User className="w-4 h-4 text-primary" />
          ) : (
            <Users className="w-4 h-4 text-primary" />
          )}
        </div>

        <input
          type="text"
          value={open ? search : (isCashCustomer ? "Cash Customer (Walk-in)" : customerName)}
          onChange={e => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setSearch("");
          }}
          placeholder="Search customer by name or phone…"
          className={`w-full pl-9 pr-16 py-2.5 rounded-xl border text-xs font-medium outline-none transition-all ${
            isCashCustomer && !open ? "text-foreground font-semibold" : "text-foreground"
          }`}
          style={{ borderColor: open ? PRIMARY : BORDER, background: CARD }}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {!isCashCustomer && (
            <button
              type="button"
              onClick={selectCashCustomer}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Reset to Walk-in Cash Customer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(prev => !prev)}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Selected customer info badge if DB customer or custom customer */}
      {!isCashCustomer && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {customerName ? customerName[0].toUpperCase() : "C"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{customerName}</p>
              {customerPhone ? (
                <p className="text-[10px] text-muted-foreground">{customerPhone}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground">Database Customer</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={selectCashCustomer}
            className="text-[11px] font-bold text-primary hover:underline flex-shrink-0"
          >
            Switch to Walk-in
          </button>
        </div>
      )}

      {/* Dropdown list */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border shadow-xl bg-card divide-y divide-border"
          style={{ borderColor: BORDER }}
        >
          {/* Default: Walk-in / Cash Customer item */}
          <button
            type="button"
            onClick={selectCashCustomer}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors ${
              isCashCustomer ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black flex-shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold">Cash Customer (Walk-in)</p>
                <p className="text-[10px] text-muted-foreground font-normal">Default · Regular OTC sale</p>
              </div>
            </div>
            {isCashCustomer && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
          </button>

          {/* Customer list section */}
          {customers.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Saved Customers ({customers.length})
              </div>
              {filtered.map(c => {
                const isSelected = customerId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectDbCustomer(c)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 text-left transition-colors ${
                      isSelected ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0">
                        {c.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{c.name}</p>
                        {c.phone && <p className="text-[10px] text-muted-foreground font-normal">{c.phone}</p>}
                      </div>
                    </div>
                    {isSelected && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Search with no direct DB match: allow custom name */}
          {search.trim() && !customers.some(c => c.name.toLowerCase() === search.trim().toLowerCase()) && (
            <div className="p-2 space-y-1 bg-muted/20">
              <button
                type="button"
                onClick={() => selectCustomName(search.trim())}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors text-left"
              >
                <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Use &quot;{search.trim()}&quot; as customer</span>
              </button>
              <Link href="/customers">
                <span className="block px-3 py-1 text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  + Add &quot;{search.trim()}&quot; to database →
                </span>
              </Link>
            </div>
          )}

          {customers.length === 0 && !search.trim() && (
            <div className="px-3 py-3 text-xs text-center text-muted-foreground">
              No saved customers in database yet.
              <Link href="/customers">
                <span className="block mt-1 font-bold text-primary cursor-pointer">+ Add Customer</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Barcode Scanner ──────────────────────────────────────────────────────────
function PosBarcodeScanner({ onDetect, onClose }: { onDetect: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const hasApi = "BarcodeDetector" in window;
    setSupported(hasApi);
    if (!hasApi) return;
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        setScanning(true);
        // @ts-ignore
        const detector = new window.BarcodeDetector({ formats: ["qr_code","ean_13","ean_8","code_128","code_39","upc_a","upc_e"] });
        const scan = async () => {
          if (!videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) { onDetect(codes[0].rawValue); return; }
          } catch {}
          rafRef.current = requestAnimationFrame(scan);
        };
        rafRef.current = requestAnimationFrame(scan);
      } catch { setSupported(false); }
    })();
    return () => { cancelAnimationFrame(rafRef.current); stream?.getTracks().forEach(t => t.stop()); };
  }, [onDetect]);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl p-5" style={{ background: CARD }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base">Scan Product Barcode</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: MUTED_BG, color: MUTED }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        {supported === false ? (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: MUTED }}>Camera scan not supported. Enter the barcode manually:</p>
            <input value={manualCode} onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && manualCode && onDetect(manualCode)}
              placeholder="Type barcode / SKU"
              className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: BORDER, background: BG }} />
            <button onClick={() => manualCode && onDetect(manualCode)} disabled={!manualCode}
              className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
              style={{ background: PRIMARY }}>Search Product</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
              <style>{`@keyframes posScan2{0%,100%{top:8%}50%{top:86%}} .pos-sl{position:absolute;left:0;right:0;height:3px;animation:posScan2 1.8s ease-in-out infinite;background:linear-gradient(90deg,transparent 0%,#a855f7 20%,#fff 50%,#ec4899 80%,transparent 100%);box-shadow:0 0 12px 3px #a855f7,0 0 6px 1px #ec4899;border-radius:2px;}`}</style>
              <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
              {/* Dark edges, clear centre */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, transparent 30%, rgba(0,0,0,0.72) 100%)" }} />
              {/* Viewfinder */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative" style={{ width: "76%", aspectRatio: "3/2" }}>
                  {/* Faint inner fill so the box is visible */}
                  <div className="absolute inset-0 rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.18)" }} />
                  {/* Corner brackets — thick & long */}
                  {([
                    { top:0, left:0, borderTop:"3px solid #c084fc", borderLeft:"3px solid #c084fc", borderRadius:"6px 0 0 0" },
                    { top:0, right:0, borderTop:"3px solid #c084fc", borderRight:"3px solid #c084fc", borderRadius:"0 6px 0 0" },
                    { bottom:0, left:0, borderBottom:"3px solid #c084fc", borderLeft:"3px solid #c084fc", borderRadius:"0 0 0 6px" },
                    { bottom:0, right:0, borderBottom:"3px solid #c084fc", borderRight:"3px solid #c084fc", borderRadius:"0 0 6px 0" },
                  ] as const).map((s, i) => <div key={i} className="absolute" style={{ ...s, width:28, height:28 }} />)}
                  <div className="pos-sl" />
                </div>
              </div>
              {scanning && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/75 text-white text-xs px-2.5 py-1.5 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />Scanning…
                </div>
              )}
            </div>
            <p className="text-xs text-center" style={{ color: MUTED }}>Point camera at product barcode</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px" style={{ background: BORDER }} />
              <span className="text-xs" style={{ color: MUTED }}>or type manually</span>
              <div className="flex-1 h-px" style={{ background: BORDER }} />
            </div>
            <div className="flex gap-2">
              <input value={manualCode} onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === "Enter" && manualCode && onDetect(manualCode)}
                placeholder="Barcode / SKU" className="flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: BORDER, background: BG }} />
              <button onClick={() => manualCode && onDetect(manualCode)} disabled={!manualCode}
                className="px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex-shrink-0"
                style={{ background: PRIMARY }}>Go</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cart Panel Contents (shared between desktop panel & mobile drawer) ────────
function CartContents({
  cart, sym, subtotal, discount, setDiscount,
  paymentMethod, setPaymentMethod, advancePay, setAdvancePay,
  customerName, setCustomerName,
  customerPhone, setCustomerPhone, customerId, setCustomerId,
  customerList, notes, setNotes, servedBy, setServedBy, staffList, error,
  checkoutMut, total, discountNum, advancePayNum, amountDue,
  changeQty, changePrice, removeLine,
}: {
  cart: CartLine[]; sym: string; subtotal: number;
  discount: string; setDiscount: (v: string) => void;
  paymentMethod: string; setPaymentMethod: (v: string) => void;
  advancePay: string; setAdvancePay: (v: string) => void;
  customerName: string; setCustomerName: (v: string) => void;
  customerPhone: string; setCustomerPhone: (v: string) => void;
  customerId: number | null; setCustomerId: (id: number | null) => void;
  customerList: Customer[]; notes: string; setNotes: (v: string) => void;
  servedBy: string; setServedBy: (v: string) => void; staffList: any[];
  error: string; checkoutMut: any;
  total: number; discountNum: number; advancePayNum: number; amountDue: number;
  changeQty: (id: number, delta: number) => void;
  changePrice: (id: number, price: string) => void;
  removeLine: (id: number) => void;
}) {
  return (
    <div className="flex flex-col h-full">

      {/* ── Zone 1: Cart items — max 3 visible, scrollable ── */}
      <div className="overflow-y-auto flex-shrink-0 px-4 pt-2 pb-1"
        style={{ maxHeight: "15.5rem" }}>
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8" style={{ color: MUTED }}>
            <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">Cart is empty</p>
            <p className="text-xs mt-1">Tap a product to add it</p>
          </div>
        ) : (
          <div className="space-y-1">
            {cart.map((l, idx) => (
              <div key={l.item.id} className="rounded-xl border p-3 space-y-2.5"
                style={{ borderColor: BORDER, background: CARD }}>
                {/* Name + remove */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-[10px] font-bold flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center"
                      style={{ background: "hsl(var(--primary) / 0.1)", color: PRIMARY }}>
                      {idx + 1}
                    </span>
                    <p className="text-sm font-semibold leading-snug">{l.item.partName}</p>
                  </div>
                  <button onClick={() => removeLine(l.item.id)} className="flex-shrink-0 mt-0.5"
                    style={{ color: "hsl(var(--destructive))" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Price × Qty = Total */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="text-xs font-medium flex-shrink-0" style={{ color: MUTED }}>{sym}</span>
                    <input type="number" min="0" value={l.unitPrice === 0 ? "" : l.unitPrice} placeholder="0"
                      onChange={e => changePrice(l.item.id, e.target.value)}
                      className="w-20 text-sm font-semibold px-2 py-1.5 rounded-lg border outline-none"
                      style={{ borderColor: BORDER }} />
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => changeQty(l.item.id, -1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center border transition-colors hover:bg-muted/40"
                      style={{ borderColor: BORDER }}>
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{l.quantity}</span>
                    <button onClick={() => changeQty(l.item.id, 1)} disabled={l.quantity >= l.item.quantity}
                      className="w-7 h-7 rounded-lg flex items-center justify-center border disabled:opacity-30 transition-colors hover:bg-muted/40"
                      style={{ borderColor: BORDER }}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-bold min-w-[56px] text-right flex-shrink-0" style={{ color: PRIMARY }}>
                    {sym}{(l.unitPrice * l.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (<>

        {/* ── Zone 2: Customer / payment form — scrollable middle ── */}
        <div className="flex-1 overflow-y-auto min-h-0 border-t px-4 pt-3 space-y-3"
          style={{ borderColor: BORDER }}>

          {/* Customer */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: MUTED }}>Customer</p>
            <CustomerPicker
              customerName={customerName}
              onCustomerName={setCustomerName}
              customerPhone={customerPhone}
              onCustomerPhone={setCustomerPhone}
              customerId={customerId}
              onCustomerId={setCustomerId}
              customers={customerList}
              onResetCredit={() => { if (paymentMethod === "Credit") setPaymentMethod("Cash"); }}
            />
          </div>

          {/* Discount + Payment */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold block mb-1" style={{ color: MUTED }}>Discount ({sym})</label>
              <input type="number" min="0" value={discount} placeholder="0" onChange={e => setDiscount(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border text-xs outline-none" style={{ borderColor: BORDER }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold block mb-1" style={{ color: MUTED }}>Payment</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border text-xs outline-none"
                style={{ borderColor: BORDER, background: CARD }}>
                <option>Cash</option>
                <option>Card</option>
                <option>Mobile Banking</option>
                {customerName && customerName !== "Cash Customer" && <option>Credit</option>}
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: MUTED }}>Subtotal</span>
              <span className="text-xs font-semibold">{sym}{subtotal.toLocaleString()}</span>
            </div>
            {discountNum > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: MUTED }}>Discount</span>
                <span className="text-xs font-semibold" style={{ color: "hsl(var(--destructive))" }}>
                  -{sym}{discountNum.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Total</span>
              <span className="text-xl font-black" style={{ color: PRIMARY }}>{sym}{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Credit advance — compact */}
          {paymentMethod === "Credit" && (
            <div className="rounded-xl px-3 py-2 space-y-2"
              style={{ background: "#FFF7E6", border: "1px solid #F59E0B60" }}>
              {/* Advance row */}
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold flex-shrink-0 whitespace-nowrap" style={{ color: "#92400E" }}>
                  Advance ({sym})
                </label>
                <input type="number" min="0" max={total} value={advancePay}
                  onChange={e => setAdvancePay(e.target.value)} placeholder="0"
                  className="flex-1 px-2 py-1 rounded-lg border text-xs font-semibold outline-none min-w-0"
                  style={{ borderColor: "#F59E0B", background: "#fff" }} />
                {advancePayNum > 0 && (
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: "#059669" }}>
                    {sym}{advancePayNum.toLocaleString()}
                  </span>
                )}
              </div>
              {/* Amount due row */}
              <div className="flex items-center justify-between border-t pt-1.5" style={{ borderColor: "#F59E0B60" }}>
                <span className="text-xs font-bold" style={{ color: "#D97706" }}>Amount Due</span>
                <span className="text-sm font-black" style={{ color: "#DC2626" }}>{sym}{amountDue.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* ── Served By (staff) ── */}
          {staffList.length > 0 && (
            <div>
              <label className="text-[10px] font-semibold block mb-1" style={{ color: MUTED }}>Served By</label>
              <select
                value={servedBy}
                onChange={e => setServedBy(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border text-xs outline-none"
                style={{ borderColor: BORDER, background: CARD }}>
                <option value="">— Select employee —</option>
                {staffList.map((s: any) => (
                  <option key={s.id} value={s.name}>
                    {s.name}{s.staffId ? ` (${s.staffId})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-xs pb-1" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
        </div>

        {/* ── Zone 3: Checkout — always pinned at bottom ── */}
        <div className="flex-shrink-0 border-t px-4 pt-3 pb-4 space-y-2" style={{ borderColor: BORDER }}>
          <button onClick={() => checkoutMut.mutate()} disabled={checkoutMut.isPending}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 transition-opacity"
            style={{ background: PRIMARY }}>
            {checkoutMut.isPending ? "Processing…" : `Checkout · ${sym}${total.toLocaleString()}`}
          </button>
          <Link href="/invoices">
            <button className="w-full py-1.5 text-xs font-semibold text-center" style={{ color: MUTED }}>
              View Invoices &amp; Returns
            </button>
          </Link>
        </div>

      </>)}
    </div>
  );
}

// ── Main POS Page ─────────────────────────────────────────────────────────────
export default function Pos() {
  const { user, isGuest } = useAuth();
  const { activeBranch } = useBranchSelection();
  if (isGuest && !user) {
    return <PosDemo />;
  }
  const qc = useQueryClient();
  const sym      = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? user?.currency ?? "$";
  const shopName = user?.shopName ?? user?.name ?? "My Shop";

  const [search,           setSearch]           = useState("");
  const [activeCategory,   setActiveCategory]   = useState<string>("All");
  const [showPosScanner,   setShowPosScanner]   = useState(false);
  const [showMobileCart,   setShowMobileCart]   = useState(false);
  const [cart,             setCart]             = useState<CartLine[]>([]);
  const [discount,         setDiscount]         = useState("");
  const [paymentMethod,    setPaymentMethod]    = useState("Cash");
  const [advancePay,       setAdvancePay]       = useState("");
  const [customerName,     setCustomerName]     = useState("Cash Customer");
  const [customerPhone,    setCustomerPhone]    = useState("");
  const [customerId,       setCustomerId]       = useState<number | null>(null);
  const [notes,            setNotes]            = useState("");
  const [servedBy,         setServedBy]         = useState("");
  const [error,            setError]            = useState("");
  const [completedInvoice, setCompletedInvoice] = useState<any | null>(null);

  const isPro = user?.plan === "Pro";
  const branchParam = activeBranch?.code === "MAIN" ? "MAIN" : (activeBranch?.id || "");

  // Block body scroll when scanner or mobile cart drawer is open
  useEffect(() => {
    if (showPosScanner || showMobileCart) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showPosScanner, showMobileCart]);

  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["inventory", isPro, user?.id, activeBranch?.id],
    queryFn: () => {
      if (!isPro && user?.id) return Promise.resolve(localInventory.getAll(user.id) as Item[]);
      return fetch(`/api/inventory?branchId=${encodeURIComponent(branchParam)}`, { credentials: "include" }).then(r => r.json());
    },
    enabled: !!user?.id,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers", isPro, user?.id],
    queryFn: () => {
      if (!isPro && user?.id) return Promise.resolve(localCustomers.getAll(user.id) as Customer[]);
      return fetch("/api/customers", { credentials: "include" }).then(r => r.json());
    },
    enabled: !!user?.id,
  });

  const { data: staffData = [] } = useQuery<any[]>({
    queryKey: ["staff", isPro, user?.id],
    queryFn: async () => {
      if (!isPro && user?.id) return localStaff.getActive(user.id);
      const res = await fetch("/api/staff", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user?.id,
  });
  const staffList = (Array.isArray(staffData) ? staffData : []).filter((s: any) =>
    s.isActive && (s.role === "Staff" || s.role === "Both")
  ).length > 0
    ? (Array.isArray(staffData) ? staffData : []).filter((s: any) => s.isActive && (s.role === "Staff" || s.role === "Both"))
    : (Array.isArray(staffData) ? staffData : []).filter((s: any) => s.isActive);

  const list = Array.isArray(items) ? items : [];
  const customerList = Array.isArray(customers) ? customers : [];
  const inCartQty = (id: number) => cart.find(l => l.item.id === id)?.quantity ?? 0;

  // Derive unique categories from the product list
  const categories = useMemo(() => {
    const types = [...new Set(list.filter(i => i.partType).map(i => i.partType!))];
    return ["All", ...types];
  }, [list]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const inStock = list.filter(i => i.quantity > 0);
    const byCat = activeCategory === "All" ? inStock : inStock.filter(i => i.partType === activeCategory);
    if (!q) return byCat;
    return byCat.filter(i =>
      i.partName.toLowerCase().includes(q) ||
      (i.partType ?? "").toLowerCase().includes(q) ||
      (i.barcode ?? "").toLowerCase().includes(q) ||
      (i.sku ?? "").toLowerCase().includes(q)
    );
  }, [list, search, activeCategory]);

  function addToCart(item: Item) {
    setError("");
    setCart(prev => {
      const existing = prev.find(l => l.item.id === item.id);
      if (existing) {
        if (existing.quantity >= item.quantity) return prev;
        return prev.map(l => l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...prev, { item, quantity: 1, unitPrice: Number(item.sellingPrice ?? 0) }];
    });
  }

  function changeQty(id: number, delta: number) {
    setCart(prev => prev.flatMap(l => {
      if (l.item.id !== id) return [l];
      const next = l.quantity + delta;
      if (next <= 0) return [];
      if (next > l.item.quantity) return [l];
      return [{ ...l, quantity: next }];
    }));
  }

  function changePrice(id: number, price: string) {
    const val = price === "" ? 0 : Number(price);
    setCart(prev => prev.map(l => l.item.id === id ? { ...l, unitPrice: isNaN(val) ? 0 : Math.max(0, val) } : l));
  }

  function removeLine(id: number) {
    setCart(prev => prev.filter(l => l.item.id !== id));
  }

  const subtotal      = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const discountNum   = Number(discount) || 0;
  const total         = Math.max(0, subtotal - discountNum);
  const advancePayNum = paymentMethod === "Credit" ? Math.min(Number(advancePay) || 0, total) : 0;
  const amountDue     = paymentMethod === "Credit" ? Math.max(0, total - advancePayNum) : 0;

  const isWalkIn               = !customerName || customerName === "Cash Customer";
  const effectiveCustomerName  = isWalkIn ? "Cash Customer" : customerName;
  const effectiveCustomerPhone = isWalkIn ? null : (customerPhone || null);
  const effectiveCustomerId    = isWalkIn ? null : customerId;

  const checkoutMut = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) throw new Error("Cart is empty");

      if (!isPro && user?.id) {
        // ── Local checkout ──────────────────────────────────────────────────
        const uid = user.id;
        // Deduct inventory quantities
        for (const line of cart) {
          const inv = localInventory.getAll(uid).find((i: any) => i.id === line.item.id);
          if (!inv) throw new Error(`Item "${line.item.partName}" not found in inventory`);
          if (inv.quantity < line.quantity) throw new Error(`Not enough stock for "${line.item.partName}"`);
          localInventory.update(uid, line.item.id, { quantity: inv.quantity - line.quantity });
        }
        const saleItems = cart.map(l => ({
          id: -(Date.now() + Math.random()),
          inventoryId: l.item.id,
          partName: l.item.partName,
          quantity: l.quantity,
          unitPrice: String(l.unitPrice),
          total: String(l.unitPrice * l.quantity),
          returnedQuantity: 0,
        }));
        const sale = localSales.create(uid, {
          items: saleItems,
          subtotal: String(subtotal),
          discount: String(discountNum),
          total: String(total),
          paymentMethod,
          advancePaid: String(advancePayNum),
          customerId: effectiveCustomerId,
          customerName: effectiveCustomerName,
          customerPhone: effectiveCustomerPhone,
          notes: [servedBy ? `Served by: ${servedBy}` : "", notes].filter(Boolean).join("\n") || null,
        });
        return sale;
      }

      // ── Server checkout ────────────────────────────────────────────────────
      // Build local YYYY-MM-DD so the sale is stored in the user's timezone,
      // not the server's UTC date (which can be a day behind for UTC+ users).
      const _now = new Date();
      const localDate = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}-${String(_now.getDate()).padStart(2, "0")}`;
      const res = await fetch("/api/sales", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(l => ({ inventoryId: l.item.id, quantity: l.quantity, unitPrice: l.unitPrice })),
          discount: discountNum, paymentMethod,
          advancePaid: advancePayNum,
          customerId: effectiveCustomerId,
          customerName: effectiveCustomerName,
          customerPhone: effectiveCustomerPhone,
          notes: [servedBy ? `Served by: ${servedBy}` : "", notes].filter(Boolean).join("\n") || null,
          date: localDate,
        }),
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) throw new Error("Server error. Please try again later.");
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Checkout failed");
      return d;
    },
    onSuccess: (sale) => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      setCompletedInvoice(sale);
      setShowMobileCart(false);
      setCart([]); setDiscount(""); setAdvancePay("");
      setCustomerName("Cash Customer"); setCustomerPhone(""); setCustomerId(null); setNotes(""); setServedBy("");
    },
    onError: (e: any) => setError(e.message),
  });

  // ── Sale Completed screen ──────────────────────────────────────────────────
  if (completedInvoice) {
    return (
      <ProtectedPage>
        <div className="max-w-md mx-auto pt-10 pb-10 space-y-5 text-center">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
            style={{ background: "#ECFDF5" }}>
            <CheckCircle className="w-8 h-8" style={{ color: "#10B981" }} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Sale Completed</h1>
            <p className="text-sm mt-1" style={{ color: MUTED }}>
              Invoice <span className="font-bold">{completedInvoice.invoiceNumber}</span>
            </p>
            <p className="text-2xl font-black mt-2" style={{ color: PRIMARY }}>
              {sym}{Number(completedInvoice.total).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                const data = saleToInvoiceData(completedInvoice);
                data.shopName = shopName;
                data.shopAddress = user?.shopAddress;
                data.shopPhone = user?.phone;
                data.shopLogo = user?.shopLogo;
                data.currencySymbol = sym;
                void generateInvoicePdf(data);
              }}
              className="w-full py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: PRIMARY }}>
              Download Invoice (PDF)
            </button>
            <button onClick={() => setCompletedInvoice(null)}
              className="w-full py-3 rounded-xl font-bold text-sm border"
              style={{ borderColor: BORDER }}>
              New Sale
            </button>
            <Link href="/invoices">
              <button className="w-full py-3 rounded-xl font-bold text-sm" style={{ color: PRIMARY }}>
                View All Invoices
              </button>
            </Link>
          </div>
        </div>
      </ProtectedPage>
    );
  }

  const cartProps = {
    cart, sym, subtotal, discount, setDiscount,
    paymentMethod, setPaymentMethod, advancePay, setAdvancePay,
    customerName, setCustomerName,
    customerPhone, setCustomerPhone, customerId, setCustomerId,
    customerList, notes, setNotes, servedBy, setServedBy, staffList, error, checkoutMut,
    total, discountNum, advancePayNum, amountDue,
    changeQty, changePrice, removeLine,
  };

  return (
    <ProtectedPage>
      {showPosScanner && (
        <PosBarcodeScanner
          onClose={() => setShowPosScanner(false)}
          onDetect={code => {
            setShowPosScanner(false);
            const match = list.find(i =>
              i.barcode === code || i.sku === code ||
              i.partName.toLowerCase() === code.toLowerCase()
            );
            if (match && match.quantity > 0) addToCart(match);
            else setSearch(code);
          }}
        />
      )}

      {/* ── Mobile cart drawer ─────────────────────────────────────────────── */}
      {showMobileCart && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileCart(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl flex flex-col overflow-hidden"
            style={{ background: BG, height: "94dvh" }}>
            {/* Drawer handle + header */}
            <div className="flex-shrink-0 px-4 pt-2 pb-2 border-b" style={{ borderColor: BORDER }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-2" style={{ background: BORDER }} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" style={{ color: PRIMARY }} />
                  <h2 className="text-base font-bold">Cart ({cart.length})</h2>
                </div>
                <button onClick={() => setShowMobileCart(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: MUTED_BG, color: MUTED }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Cart contents fill the rest */}
            <div className="flex-1 min-h-0 flex flex-col">
              <CartContents {...cartProps} />
            </div>
          </div>
        </div>
      )}

      {/* ── Main split layout ──────────────────────────────────────────────── */}
      <div className="flex -mx-4 -mt-4 md:mx-0 md:mt-0 md:rounded-2xl overflow-hidden border md:border"
        style={{ height: "calc(100dvh - 112px)", borderColor: BORDER }}>

        {/* ── LEFT: Products panel ─────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0" style={{ background: BG }}>

          {/* Header */}
          <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b space-y-3"
            style={{ borderColor: BORDER, background: CARD }}>
            {/* Search + QR — scanner icon inside the bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search product, barcode…"
                className="w-full pl-10 pr-20 py-2.5 rounded-xl border text-sm outline-none transition-colors"
                style={{ borderColor: BORDER, background: BG }} />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-11 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ color: MUTED }}>
                  <X className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setShowPosScanner(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                title="Scan barcode"
                style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
                <QrCode className="w-4 h-4" />
              </button>
            </div>

            {/* Category chips — hide-scrollbar horizontal scroll */}
            {categories.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
                {categories.map(cat => (
                  <button key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                    style={activeCategory === cat
                      ? { background: PRIMARY, color: "#fff", borderColor: PRIMARY }
                      : { background: CARD, color: MUTED, borderColor: BORDER }}>
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product list — scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3">
            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: MUTED_BG }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10" style={{ color: MUTED }}>
                <Package className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No products found</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filtered.map(item => {
                  const inCart = inCartQty(item.id);
                  const maxed  = inCart >= item.quantity;
                  return (
                    <button key={item.id} disabled={maxed} onClick={() => addToCart(item)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-[0.99] disabled:opacity-40 hover:shadow-sm"
                      style={{
                        borderColor: inCart > 0 ? PRIMARY : BORDER,
                        background: CARD,
                        borderLeftWidth: inCart > 0 ? "3px" : "1px",
                      }}>
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: inCart > 0 ? `${PRIMARY}18` : MUTED_BG }}>
                        <Package className="w-4 h-4" style={{ color: inCart > 0 ? PRIMARY : MUTED }} />
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-snug truncate">{item.partName}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {item.partType && (
                            <span className="text-[10px]" style={{ color: MUTED }}>{item.partType}</span>
                          )}
                          <span className="text-[10px]" style={{ color: MUTED }}>Stock: {item.quantity}</span>
                          {inCart > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: "#ECFDF5", color: "#059669" }}>
                              {inCart} in cart
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Price + add */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-bold" style={{ color: PRIMARY }}>
                          {sym}{Number(item.sellingPrice ?? 0).toLocaleString()}
                        </span>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                          style={{ background: maxed ? MUTED_BG : PRIMARY }}>
                          <Plus className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile sticky bottom bar */}
          <div className="md:hidden flex-shrink-0 border-t" style={{ borderColor: BORDER }}>
            {cart.length === 0 ? (
              <Link href="/invoices">
                <button className="w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold"
                  style={{ color: MUTED }}>
                  <ClipboardList className="w-4 h-4" /> View Invoices &amp; Returns
                </button>
              </Link>
            ) : (
              <button onClick={() => setShowMobileCart(true)}
                className="w-full flex items-center justify-between px-4 py-3 text-white transition-opacity active:opacity-80"
                style={{ background: PRIMARY }}>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4.5 h-4.5" />
                  <span className="text-sm font-bold">{cart.length} item{cart.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black">{sym}{total.toLocaleString()}</span>
                  <ChevronUp className="w-4 h-4" />
                </div>
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT: Cart panel (desktop only) ─────────────────────────────── */}
        <div className="hidden md:flex flex-col w-80 lg:w-96 flex-shrink-0 border-l min-h-0"
          style={{ borderColor: BORDER, background: BG }}>
          {/* Cart header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: BORDER, background: CARD }}>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" style={{ color: PRIMARY }} />
              <h2 className="text-sm font-bold">Current Order</h2>
              {cart.length > 0 && (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: PRIMARY }}>{cart.length}</span>
              )}
            </div>
            {cart.length > 0 && (
              <Link href="/invoices">
                <button className="text-[10px] font-semibold flex items-center gap-1" style={{ color: MUTED }}>
                  <ClipboardList className="w-3 h-3" /> Invoices
                </button>
              </Link>
            )}
          </div>

          {/* Cart body */}
          <div className="flex-1 min-h-0 flex flex-col">
            <CartContents {...cartProps} />
          </div>
        </div>

      </div>
    </ProtectedPage>
  );
}

export function saleToInvoiceData(sale: any): InvoiceData {
  const total = Number(sale.total);
  const advancePaid = Number(sale.advancePaid ?? 0);
  const isCredit = sale.paymentMethod === "Credit";
  const isReturned = sale.status === "Returned";

  const returnsArr = (sale.returns ?? []).map((r: any) => {
    const matchItem = (sale.items ?? []).find((it: any) => it.id === r.saleItemId);
    return {
      date: r.date,
      partName: matchItem?.partName ?? "Item",
      quantity: Number(r.quantity),
      refundAmount: Number(r.refundAmount),
      reason: r.reason ?? null,
    };
  });
  const totalRefunded = returnsArr.reduce((s: number, r: any) => s + r.refundAmount, 0);

  const rawDue = isCredit ? Math.max(0, total - advancePaid) : 0;
  const amountDue = isReturned ? 0 : Math.max(0, rawDue - totalRefunded);

  return {
    invoiceNumber: sale.invoiceNumber,
    date: sale.date,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    items: (sale.items ?? []).map((it: any) => ({
      partName: it.partName, quantity: it.quantity,
      unitPrice: Number(it.unitPrice), total: Number(it.total),
      returnedQuantity: it.returnedQuantity ?? 0,
    })),
    subtotal: Number(sale.subtotal), discount: Number(sale.discount), total,
    paymentMethod: sale.paymentMethod, status: sale.status,
    advancePaid: isCredit ? advancePaid : undefined,
    amountDue: amountDue > 0 ? amountDue : undefined,
    returns: returnsArr.length > 0 ? returnsArr : undefined,
    totalRefunded: totalRefunded > 0 ? totalRefunded : undefined,
  };
}
