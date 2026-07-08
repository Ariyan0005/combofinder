import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Search, Package, Minus, Plus, Trash2, ShoppingCart, CheckCircle,
  ClipboardList, X, Boxes, User, Users, ChevronDown,
} from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";
import { generateInvoicePdf, type InvoiceData } from "@/lib/invoice-pdf";
import { useAuth } from "@/context/auth-context";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", BDT: "৳", INR: "₹",
  PKR: "₨", NPR: "रू", LKR: "Rs", AED: "د.إ", SAR: "﷼",
  OMR: "OMR", KWD: "KD", QAR: "QR", MYR: "RM", SGD: "S$",
};

const PRIMARY = "hsl(var(--primary))";
const MUTED = "hsl(var(--muted-foreground))";
const BORDER = "hsl(var(--border))";
const CARD = "hsl(var(--card))";

type Item = {
  id: number; partName: string; partType?: string; quantity: number;
  sellingPrice?: string | number; barcode?: string; sku?: string;
};

type CartLine = { item: Item; quantity: number; unitPrice: number };

type Customer = {
  id: number; name: string; phone?: string; whatsapp?: string;
};

// ── Customer Picker ─────────────────────────────────────────────────────────
type CustomerMode = "cash" | "db";

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
  const [open, setOpen]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
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
  }

  return (
    <div className="space-y-2.5">
      {/* Mode toggle */}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => { onModeChange("cash"); onCustomerName("Cash Customer"); onCustomerPhone(""); onResetCredit?.(); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all"
          title="Credit not available for walk-in cash customers"
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

      {/* Clear button resets customerId too */}
      {/* Cash Customer — just a display chip */}
      {mode === "cash" && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: "hsl(var(--muted))" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: PRIMARY }}>C</div>
          <div>
            <p className="text-xs font-bold">Cash Customer</p>
            <p className="text-[10px]" style={{ color: MUTED }}>Walk-in / no record kept</p>
          </div>
        </div>
      )}

      {/* From Database — search dropdown */}
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

            {/* Dropdown */}
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

          {/* Show selected customer info */}
          {customerName && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "hsl(var(--muted))" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: PRIMARY }}>{customerName[0].toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{customerName}</p>
                {customerPhone && <p className="text-[10px]" style={{ color: MUTED }}>{customerPhone}</p>}
              </div>
              <button type="button" onClick={() => { onCustomerName(""); onCustomerPhone(""); setSearch(""); }}
                style={{ color: MUTED }}><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* Phone (editable when selected) */}
          {customerName && (
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

// ── Main POS Page ────────────────────────────────────────────────────────────
export default function Pos() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const sym      = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? user?.currency ?? "$";
  const shopName = user?.shopName ?? user?.name ?? "My Shop";

  const [search,          setSearch]          = useState("");
  const [cart,            setCart]            = useState<CartLine[]>([]);
  const [discount,        setDiscount]        = useState("0");
  const [paymentMethod,   setPaymentMethod]   = useState("Cash");
  const [advancePay,      setAdvancePay]      = useState("0");
  const [customerMode,    setCustomerMode]    = useState<CustomerMode>("cash");
  const [customerName,    setCustomerName]    = useState("Cash Customer");
  const [customerPhone,   setCustomerPhone]   = useState("");
  const [customerId,      setCustomerId]      = useState<number | null>(null);
  const [notes,           setNotes]           = useState("");
  const [error,           setError]           = useState("");
  const [completedInvoice, setCompletedInvoice] = useState<any | null>(null);

  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["inventory"],
    queryFn: () => fetch("/api/inventory", { credentials: "include" }).then(r => r.json()),
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: () => fetch("/api/customers", { credentials: "include" }).then(r => r.json()),
  });

  const list = Array.isArray(items) ? items : [];
  const customerList = Array.isArray(customers) ? customers : [];
  const inCartQty = (id: number) => cart.find(l => l.item.id === id)?.quantity ?? 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const inStock = list.filter(i => i.quantity > 0);
    if (!q) return inStock.slice(0, 30);
    return inStock.filter(i =>
      i.partName.toLowerCase().includes(q) ||
      (i.barcode ?? "").toLowerCase().includes(q) ||
      (i.sku ?? "").toLowerCase().includes(q)
    ).slice(0, 30);
  }, [list, search]);

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

  // Effective customer fields sent to API
  const effectiveCustomerName  = customerMode === "cash" ? "Cash Customer" : (customerName || null);
  const effectiveCustomerPhone = customerMode === "cash" ? null : (customerPhone || null);
  const effectiveCustomerId    = customerMode === "db" ? customerId : null;

  const checkoutMut = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) throw new Error("Cart is empty");
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
      setCart([]); setDiscount("0"); setAdvancePay("0");
      setCustomerMode("cash"); setCustomerName("Cash Customer"); setCustomerPhone(""); setCustomerId(null); setNotes("");
    },
    onError: (e: any) => setError(e.message),
  });

  if (completedInvoice) {
    return (
      <ProtectedPage>
        <div className="max-w-md mx-auto pt-6 pb-6 space-y-4 text-center">
          <CheckCircle className="w-14 h-14 mx-auto" style={{ color: "#10B981" }} />
          <h1 className="text-xl font-extrabold">Sale Completed!</h1>
          <p className="text-sm" style={{ color: MUTED }}>
            Invoice <span className="font-bold">{completedInvoice.invoiceNumber}</span> · Total {sym}{Number(completedInvoice.total).toLocaleString()}
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                const data = saleToInvoiceData(completedInvoice);
                data.shopName = shopName;
                data.currencySymbol = sym;
                generateInvoicePdf(data);
              }}
              className="w-full py-3 rounded-xl font-bold text-white text-sm" style={{ background: PRIMARY }}>
              Download Invoice (PDF)
            </button>
            <button onClick={() => setCompletedInvoice(null)}
              className="w-full py-3 rounded-xl font-bold text-sm border" style={{ borderColor: BORDER }}>
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

  return (
    <ProtectedPage>
      <div className="space-y-3 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-extrabold">Point of Sale</h1>
            <p className="text-xs" style={{ color: MUTED }}>Sell products &amp; checkout</p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full" style={{ background: "hsl(var(--muted))" }}>
            <Link href="/inventory">
              <button className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5" style={{ color: MUTED }}>
                <Boxes className="w-3.5 h-3.5" /> Inventory
              </button>
            </Link>
            <button className="px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5" style={{ background: PRIMARY }}>
              <ShoppingCart className="w-3.5 h-3.5" /> POS
            </button>
          </div>
        </div>

        <Link href="/invoices">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border" style={{ borderColor: BORDER, color: PRIMARY }}>
            <ClipboardList className="w-4 h-4" /> View Invoices &amp; Returns
          </button>
        </Link>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search product to add…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm outline-none"
            style={{ borderColor: BORDER, background: CARD }} />
        </div>

        {/* Product grid */}
        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />)}</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map(item => {
              const inCart = inCartQty(item.id);
              const maxed  = inCart >= item.quantity;
              return (
                <button key={item.id} disabled={maxed} onClick={() => addToCart(item)}
                  className="flex flex-col items-start gap-1 p-3 rounded-2xl border text-left disabled:opacity-40"
                  style={{ borderColor: BORDER, background: CARD }}>
                  <div className="flex items-center gap-1.5 w-full">
                    <Package className="w-3.5 h-3.5 flex-shrink-0" style={{ color: MUTED }} />
                    <p className="text-xs font-semibold truncate flex-1">{item.partName}</p>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px]" style={{ color: MUTED }}>Stock: {item.quantity}</span>
                    <span className="text-xs font-bold" style={{ color: PRIMARY }}>{sym}{Number(item.sellingPrice ?? 0).toLocaleString()}</span>
                  </div>
                  {inCart > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#ECFDF5", color: "#059669" }}>
                      {inCart} in cart
                    </span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-10">
                <Package className="w-8 h-8 mx-auto mb-2" style={{ color: MUTED }} />
                <p className="text-sm" style={{ color: MUTED }}>No products found</p>
              </div>
            )}
          </div>
        )}

        {/* Cart */}
        <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: BORDER, background: CARD }}>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" style={{ color: PRIMARY }} />
            <h2 className="text-sm font-bold">Cart ({cart.length})</h2>
          </div>

          {cart.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: MUTED }}>Add products above to start a sale</p>
          ) : (
            <div className="space-y-1">
              {cart.map(l => (
                <div key={l.item.id} className="py-3 border-b last:border-0 space-y-2" style={{ borderColor: BORDER }}>
                  {/* Row 1: name + remove */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate flex-1">{l.item.partName}</p>
                    <button onClick={() => removeLine(l.item.id)} style={{ color: "hsl(var(--destructive))" }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Row 2: price × qty = total */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-xs font-medium" style={{ color: MUTED }}>{sym}</span>
                      <input type="number" min="0" value={l.unitPrice}
                        onChange={e => changePrice(l.item.id, e.target.value)}
                        className="w-20 text-sm font-semibold px-2 py-1.5 rounded-lg border outline-none"
                        style={{ borderColor: BORDER }} />
                      <span className="text-xs" style={{ color: MUTED }}>×</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => changeQty(l.item.id, -1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center border"
                        style={{ borderColor: BORDER }}>
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-base font-bold w-6 text-center">{l.quantity}</span>
                      <button onClick={() => changeQty(l.item.id, 1)} disabled={l.quantity >= l.item.quantity}
                        className="w-7 h-7 rounded-full flex items-center justify-center border disabled:opacity-30"
                        style={{ borderColor: BORDER }}>
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-bold min-w-[56px] text-right" style={{ color: PRIMARY }}>
                      {sym}{(l.unitPrice * l.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <>
              {/* Customer Picker */}
              <div className="pt-1 border-t" style={{ borderColor: BORDER }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>Customer</p>
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
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-semibold block mb-1" style={{ color: MUTED }}>Discount ({sym})</label>
                  <input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border text-xs outline-none" style={{ borderColor: BORDER }} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold block mb-1" style={{ color: MUTED }}>Payment Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border text-xs outline-none" style={{ borderColor: BORDER, background: CARD }}>
                    <option>Cash</option>
                    <option>Card</option>
                    <option>Mobile Banking</option>
                    {/* Credit only available when a real (DB) customer is selected */}
                    {customerMode === "db" && customerName && <option>Credit</option>}
                    <option>Other</option>
                  </select>
                </div>
              </div>

              {/* Totals */}
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: BORDER }}>
                <span className="text-xs" style={{ color: MUTED }}>Subtotal</span>
                <span className="text-xs font-semibold">{sym}{subtotal.toLocaleString()}</span>
              </div>
              {discountNum > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: MUTED }}>Discount</span>
                  <span className="text-xs font-semibold" style={{ color: "hsl(var(--destructive))" }}>-{sym}{discountNum.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Total</span>
                <span className="text-lg font-black" style={{ color: PRIMARY }}>{sym}{total.toLocaleString()}</span>
              </div>

              {paymentMethod === "Credit" && (
                <div className="space-y-3 p-3 rounded-xl"
                  style={{ background: "#FFF7E6", border: "1px solid #F59E0B60" }}>
                  <p className="text-xs font-bold" style={{ color: "#D97706" }}>⚠ Credit Sale</p>
                  {/* Advance / partial payment input */}
                  <div>
                    <label className="text-[11px] font-semibold block mb-1" style={{ color: "#92400E" }}>
                      Advance Payment ({sym}) — optional
                    </label>
                    <input
                      type="number" min="0" max={total} value={advancePay}
                      onChange={e => setAdvancePay(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-lg border text-sm font-semibold outline-none"
                      style={{ borderColor: "#F59E0B", background: "#fff" }}
                    />
                  </div>
                  {/* Advance paid row */}
                  {advancePayNum > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold" style={{ color: "#92400E" }}>Advance Collected</span>
                      <span className="text-sm font-bold" style={{ color: "#059669" }}>
                        {sym}{advancePayNum.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {/* Amount due */}
                  <div className="flex items-center justify-between border-t pt-2" style={{ borderColor: "#F59E0B60" }}>
                    <span className="text-sm font-bold" style={{ color: "#D97706" }}>Amount Due (Remaining)</span>
                    <span className="text-lg font-black" style={{ color: "#DC2626" }}>
                      {sym}{amountDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {error && <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}

              <button onClick={() => checkoutMut.mutate()} disabled={checkoutMut.isPending}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60" style={{ background: PRIMARY }}>
                {checkoutMut.isPending ? "Processing…" : `Checkout · ${sym}${total.toLocaleString()}`}
              </button>
            </>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}

export function saleToInvoiceData(sale: any): InvoiceData {
  const total = Number(sale.total);
  const advancePaid = Number(sale.advancePaid ?? 0);
  const isCredit = sale.paymentMethod === "Credit";
  const amountDue = isCredit ? Math.max(0, total - advancePaid) : 0;
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
    // shopName and currencySymbol must be set by the caller from user context
  };
}
