import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, ShoppingCart, Search, Plus, Minus, Trash2,
  CheckCircle, Sparkles, User, Printer, CreditCard,
  Banknote, QrCode, FileText, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PosProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  color: string;
}

const DEMO_PRODUCTS: PosProduct[] = [
  { id: 1, name: "20W PD Fast Wall Charger", category: "Charging", price: 12.00, stock: 24, sku: "CHG-PD-020", color: "#3B82F6" },
  { id: 2, name: "Type-C Braided Cable 2M", category: "Cables", price: 5.00, stock: 45, sku: "CAB-TC-002", color: "#10B981" },
  { id: 3, name: "Wireless Bluetooth Earbuds Pro", category: "Audio", price: 28.00, stock: 12, sku: "EAR-BT-900", color: "#8B5CF6" },
  { id: 4, name: "Magnetic Safe Powerbank 10000mAh", category: "Gadgets", price: 34.00, stock: 8, sku: "PB-MAG-10K", color: "#F59E0B" },
  { id: 5, name: "9D Privacy Glass Screen Guard", category: "Glass", price: 4.50, stock: 60, sku: "GLS-9D-PRV", color: "#EC4899" },
  { id: 6, name: "Silicone Anti-Shock Phone Case", category: "Cases", price: 7.00, stock: 30, sku: "CAS-SIL-001", color: "#6366F1" },
  { id: 7, name: "Universal Metal Phone Stand", category: "Gadgets", price: 6.50, stock: 18, sku: "STN-MET-004", color: "#14B8A6" },
  { id: 8, name: "Fast Dual-Port USB Car Charger", category: "Charging", price: 8.50, stock: 22, sku: "CHG-CAR-002", color: "#F97316" },
];

const CATEGORIES = ["All Items", "Charging", "Cables", "Audio", "Gadgets", "Glass", "Cases"];

interface CartItem {
  product: PosProduct;
  qty: number;
}

export function PosDemo() {
  const { toast } = useToast();
  const [selectedCat, setSelectedCat] = useState("All Items");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([
    { product: DEMO_PRODUCTS[0], qty: 1 },
    { product: DEMO_PRODUCTS[1], qty: 2 },
  ]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | "QR" | "Due">("Cash");
  const [showReceipt, setShowReceipt] = useState(false);

  const filteredProducts = DEMO_PRODUCTS.filter((p) => {
    const matchCat = selectedCat === "All Items" || p.category === selectedCat;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (product: PosProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
    toast({
      title: "Added to Cart",
      description: `${product.name} added to sale`,
    });
  };

  const updateCartQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeCartItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  return (
    <div className="space-y-4 pb-14">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Link href="/">
            <button className="p-2 rounded-xl border border-border bg-card hover:bg-muted transition cursor-pointer">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-foreground">Point of Sale (POS)</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3 h-3 text-primary" />
                Demo Preview
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Instant product search, thermal receipt generation & live billing
            </p>
          </div>
        </div>

        <Link href="/register">
          <button className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary/90 transition cursor-pointer">
            Create Account
          </button>
        </Link>
      </div>

      {/* Main Grid: Left Catalog, Right Cart (Desktop side-by-side, mobile stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Product Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search & Category Pills */}
          <div className="p-3 rounded-2xl border border-border bg-card shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products by name or scan barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Category scroll pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCat(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                    selectedCat === cat
                      ? "bg-primary text-white shadow-xs"
                      : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className="group relative p-3 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 font-bold text-white text-xs shadow-xs"
                    style={{ background: p.color }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <h3 className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                    {p.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    Stock: {p.stock} pcs
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                  <span className="text-sm font-black text-primary">
                    ${p.price.toFixed(2)}
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Cart & Billing (5 cols) */}
        <div className="lg:col-span-5">
          <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3.5 sticky top-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Current Sale ({cart.length})</h2>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-[11px] text-destructive hover:underline cursor-pointer"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Customer select */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 border border-border">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Customer / Phone"
                className="w-full bg-transparent text-xs font-semibold focus:outline-none text-foreground"
              />
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs space-y-1">
                <ShoppingCart className="w-8 h-8 mx-auto text-muted-foreground/40 mb-1" />
                <p className="font-semibold">Cart is empty</p>
                <p className="text-[11px]">Click items on the left to add them to invoice</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2 rounded-xl bg-background border border-border flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{item.product.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        ${item.product.price.toFixed(2)} × {item.qty} ={" "}
                        <span className="font-bold text-foreground">
                          ${(item.product.price * item.qty).toFixed(2)}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-muted cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-muted cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCartItem(item.product.id)}
                        className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations */}
            <div className="pt-2 border-t border-border space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Discount (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent || ""}
                  placeholder="0"
                  onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-14 px-1.5 py-0.5 text-xs text-right font-bold rounded bg-background border border-border"
                />
              </div>
              <div className="flex justify-between font-extrabold text-sm text-foreground pt-1 border-t border-border/60">
                <span>Total Amount:</span>
                <span className="text-primary font-black">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(["Cash", "Card", "QR", "Due"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                      paymentMethod === m
                        ? "bg-primary text-white border-primary"
                        : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => setShowReceipt(true)}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Complete Sale & Print Bill
            </button>
          </div>
        </div>
      </div>

      {/* POS Thermal Invoice Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-foreground">Thermal Receipt Preview</span>
              <button
                onClick={() => setShowReceipt(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Paper Slip Receipt */}
            <div className="p-4 rounded-xl bg-white text-black font-mono text-[11px] leading-relaxed shadow-sm border border-neutral-200 text-left space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-neutral-300">
                <p className="font-black text-sm tracking-wider">COMBOFINDER STORE</p>
                <p className="text-[10px] text-neutral-600">Main Market Road, Shop #12</p>
                <p className="text-[10px] text-neutral-600">Tel: +880 1700-000000</p>
              </div>

              <div className="flex justify-between text-[10px] text-neutral-600 pb-1 border-b border-dashed border-neutral-300">
                <span>Inv: #POS-{Date.now().toString().slice(-4)}</span>
                <span>{customerName}</span>
              </div>

              <div className="space-y-1 py-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between">
                    <span className="truncate max-w-[170px]">{item.product.name} (x{item.qty})</span>
                    <span>${(item.product.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-dashed border-neutral-300 space-y-1 font-bold">
                <div className="flex justify-between">
                  <span>TOTAL:</span>
                  <span className="text-sm">${grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-normal text-neutral-600">
                  <span>Paid by:</span>
                  <span>{paymentMethod}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[9px] text-neutral-500 border-t border-dashed border-neutral-300">
                *** THANK YOU FOR YOUR BUSINESS ***
              </div>
            </div>

            <div className="space-y-2">
              <Link href="/register">
                <button className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition cursor-pointer">
                  Create Account to Start Live Billing
                </button>
              </Link>
              <button
                type="button"
                onClick={() => setShowReceipt(false)}
                className="w-full py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
