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
import { localInventory, localCustomers, localSales } from "@/lib/local-store";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", BDT: "৳", INR: "₹",
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

type CustomerMode = "cash" | "db";

// ── Customer Picker ──────────────────────────────────────────────────────────
function CustomerPicker({
  mode, onModeChange,
  customerName, onCustomerName,
  customerPhone, onCustomerPhone,
  onCustomerId,
  customers, onResetCredit,
}: {
  mode: CustomerMode;
  onModeChange: (m: CustomerMode) => void;
  customerName: string;
  onCustomerName: (v: string) => void;
  customerPhone: string;
  onCustomerPhone: (v: string) => void;
  onCustomerId: (id: number | null) => void;
  customers: Customer[];
  onResetCredit?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedFromDb, setSelectedFromDb] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search.length >= 1
    ? customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone ?? "").includes(search)
      ).slice(0, 7)
    : customers.slice(0, 7);

  function selectCustomer(c: Customer) {
    onCustomerName(c.name);
    onCustomerPhone(c.phone ?? "");
    onCustomerId(c.id);
    setSearch("");
    setOpen(false);
    setSelectedFromDb(true);
  }

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => { onModeChange("cash"); onCustomerName("Cash Customer"); onCustomerPhone(""); onResetCredit?.(); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all"
          style={mode === "cash"
            ? { background: PRIMARY, color: "#fff", borderColor: PRIMARY }
            : { background: CARD, color: MUTED, borderColor: BORDER }}>
          <User className="w-3.5 h-3.5" /> Cash Customer
        </button>
        <button
          type="button"
          onClick={() => { onModeChange("db"); onCustomerName(""); onCustomerPhone(""); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all"
          style={mode === "db"
            ? { background: PRIMARY, color: "#fff", borderColor: PRIMARY }
            : { background: CARD, color: MUTED, borderColor: BORDER }}>
          <Users className="w-3.5 h-3.5" /> From Database
        </button>
      </div>

      {mode === "cash" && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: MUTED_BG }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: PRIMARY }}>C</div>
          <div>
            <p className="text-xs font-bold">Cash Customer</p>
            <p className="text-[10px]" style={{ color: MUTED }}>Walk-in / no record kept</p>
          </div>
        </div>
      )}

      {mode === "db" && (
        <div className="space-y-2">
          <div className="relative" ref={ref}>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder={customerName ? customerName : "Search customer by name or phone…"}
                className="w-full pl-8 pr-8 py-2.5 rounded-xl border text-xs outline-none"
                style={{ borderColor: BORDER, background: CARD }}
              />
              <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
            </div>
            {open && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border shadow-lg overflow-hidden"
                style={{ background: CARD, borderColor: BORDER }}>
                {filtered.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-center" style={{ color: MUTED }}>
                    No customers found
                    <Link href="/customers">
                      <span className="block mt-1 font-bold" style={{ color: PRIMARY }}>+ Add customer</span>
                    </Link>
                  </div>
                ) : (
                  filtered.map(c => (
                    <button key={c.id} type="button"
                      onClick={() => selectCustomer(c)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/40 border-b last:border-0 transition-colors"
                      style={{ borderColor: BORDER }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: PRIMARY }}>{c.name[0].toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{c.name}</p>
                        {c.phone && <p className="text-[10px]" style={{ color: MUTED }}>{c.phone}</p>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {customerName && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: MUTED_BG }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: PRIMARY }}>{customerName[0].toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{customerName}</p>
                {customerPhone && <p className="text-[10px]" style={{ color: MUTED }}>{customerPhone}</p>}
              </div>
              <button type="button" onClick={() => { onCustomerName(""); onCustomerPhone(""); onCustomerId(null); setSearch(""); setSelectedFromDb(false); }}
                style={{ color: MUTED }}><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          {/* phone input only when typing a new/manual customer, not after DB pick */}
          {customerName && !selectedFromDb && (
            <input value={customerPhone}
              onChange={e => onCustomerPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="w-full px-2.5 py-2 rounded-xl border text-xs outline-none"
              style={{ borderColor: BORDER, background: CARD }} />
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
              <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-52 h-32 border-2 border-white/70 rounded-2xl" />
              </div>
              {scanning && <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">Scanning…</div>}
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
  customerMode, setCustomerMode, customerName, setCustomerName,
  customerPhone, setCustomerPhone, customerId, setCustomerId,
  customerList, notes, setNotes, error,
  checkoutMut, total, discountNum, advancePayNum, amountDue,
  changeQty, changePrice, removeLine,
}: {
  cart: CartLine[]; sym: string; subtotal: number;
  discount: string; setDiscount: (v: string) => void;
  paymentMethod: string; setPaymentMethod: (v: string) => void;
  advancePay: string; setAdvancePay: (v: string) => void;
  customerMode: CustomerMode; setCustomerMode: (m: CustomerMode) => void;
  customerName: string; setCustomerName: (v: string) => void;
  customerPhone: string; setCustomerPhone: (v: string) => void;
  customerId: number | null; setCustomerId: (id: number | null) => void;
  customerList: Customer[]; notes: string; setNotes: (v: string) => void;
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
                    <input type="number" min="0" value={l.unitPrice}
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
              mode={customerMode}
              onModeChange={(m) => { setCustomerMode(m); setCustomerId(null); }}
              customerName={customerName}
              onCustomerName={setCustomerName}
              customerPhone={customerPhone}
              onCustomerPhone={setCustomerPhone}
              onCustomerId={setCustomerId}
              customers={customerList}
              onResetCredit={() => { if (paymentMethod === "Credit") setPaymentMethod("Cash"); }}
            />
          </div>

          {/* Discount + Payment */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold block mb-1" style={{ color: MUTED }}>Discount ({sym})</label>
              <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)}
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
                {customerMode === "db" && customerName && <option>Credit</option>}
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
  const qc = useQueryClient();
  const { user } = useAuth();
  const sym      = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? user?.currency ?? "$";
  const shopName = user?.shopName ?? user?.name ?? "My Shop";

  const [search,           setSearch]           = useState("");
  const [activeCategory,   setActiveCategory]   = useState<string>("All");
  const [showPosScanner,   setShowPosScanner]   = useState(false);
  const [showMobileCart,   setShowMobileCart]   = useState(false);
  const [cart,             setCart]             = useState<CartLine[]>([]);
  const [discount,         setDiscount]         = useState("0");
  const [paymentMethod,    setPaymentMethod]    = useState("Cash");
  const [advancePay,       setAdvancePay]       = useState("0");
  const [customerMode,     setCustomerMode]     = useState<CustomerMode>("cash");
  const [customerName,     setCustomerName]     = useState("Cash Customer");
  const [customerPhone,    setCustomerPhone]    = useState("");
  const [customerId,       setCustomerId]       = useState<number | null>(null);
  const [notes,            setNotes]            = useState("");
  const [error,            setError]            = useState("");
  const [completedInvoice, setCompletedInvoice] = useState<any | null>(null);

  const isPro = user?.plan === "Pro";

  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["inventory", isPro, user?.id],
    queryFn: () => {
      if (!isPro && user?.id) return Promise.resolve(localInventory.getAll(user.id) as Item[]);
      return fetch("/api/inventory", { credentials: "include" }).then(r => r.json());
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
    setCart(prev => prev.map(l => l.item.id === id ? { ...l, unitPrice: Number(price) || 0 } : l));
  }

  function removeLine(id: number) {
    setCart(prev => prev.filter(l => l.item.id !== id));
  }

  const subtotal      = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const discountNum   = Number(discount) || 0;
  const total         = Math.max(0, subtotal - discountNum);
  const advancePayNum = paymentMethod === "Credit" ? Math.min(Number(advancePay) || 0, total) : 0;
  const amountDue     = paymentMethod === "Credit" ? Math.max(0, total - advancePayNum) : 0;

  const effectiveCustomerName  = customerMode === "cash" ? "Cash Customer" : (customerName || null);
  const effectiveCustomerPhone = customerMode === "cash" ? null : (customerPhone || null);
  const effectiveCustomerId    = customerMode === "db" ? customerId : null;

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
          notes: notes || null,
        });
        return sale;
      }

      // ── Server checkout ────────────────────────────────────────────────────
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
          notes: notes || null,
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
      setCart([]); setDiscount("0"); setAdvancePay("0");
      setCustomerMode("cash"); setCustomerName("Cash Customer"); setCustomerPhone(""); setCustomerId(null); setNotes("");
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
    customerMode, setCustomerMode, customerName, setCustomerName,
    customerPhone, setCustomerPhone, customerId, setCustomerId,
    customerList, notes, setNotes, error, checkoutMut,
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-extrabold leading-tight">Point of Sale</h1>
                <p className="text-xs" style={{ color: MUTED }}>Sell products &amp; checkout</p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-full" style={{ background: MUTED_BG }}>
                <Link href="/inventory">
                  <button className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5" style={{ color: MUTED }}>
                    <Boxes className="w-3.5 h-3.5" /> Inventory
                  </button>
                </Link>
                <button className="px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5"
                  style={{ background: PRIMARY }}>
                  <ShoppingCart className="w-3.5 h-3.5" /> POS
                </button>
              </div>
            </div>

            {/* Search + QR */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search product, barcode…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-colors"
                  style={{ borderColor: BORDER, background: BG }} />
              </div>
              <button onClick={() => setShowPosScanner(true)}
                className="w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors hover:bg-muted/40"
                title="Scan barcode"
                style={{ borderColor: BORDER, background: BG, color: PRIMARY }}>
                <QrCode className="w-4.5 h-4.5" />
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
