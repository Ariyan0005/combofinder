import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, Package, Plus, Trash2, Search,
  CheckCircle, Sparkles, UserPlus, Truck, DollarSign,
  Barcode, Info, ArrowDownToLine
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StockLine {
  id: number;
  name: string;
  sku: string;
  qty: number;
  unitCost: number;
}

const INITIAL_ITEMS: StockLine[] = [
  { id: 1, name: "Type-C Fast Charging Cable (Braided 1M)", sku: "CAB-TC-001", qty: 50, unitCost: 1.50 },
  { id: 2, name: "20W PD Super Fast Charger Adapter", sku: "CHG-PD-020", qty: 20, unitCost: 4.20 },
  { id: 3, name: "Magnetic Dashboard Car Mount Holder", sku: "MNT-CAR-003", qty: 15, unitCost: 3.80 },
  { id: 4, name: "9D Curved Tempered Glass Box (30 Pcs)", sku: "GLS-9D-BOX", qty: 2, unitCost: 18.00 },
];

export function StockInDemo() {
  const { toast } = useToast();
  const [supplier, setSupplier] = useState("Direct Wholesaler & Importers Ltd.");
  const [memoNo, setMemoNo] = useState("INV-2026-0842");
  const [items, setItems] = useState<StockLine[]>(INITIAL_ITEMS);
  const [paymentType, setPaymentType] = useState<"cash" | "due">("cash");
  const [paidAmount, setPaidAmount] = useState("200.00");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const totalCost = items.reduce((sum, item) => sum + item.qty * item.unitCost, 0);
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const numPaid = parseFloat(paidAmount) || 0;
  const dueAmount = Math.max(0, totalCost - numPaid);

  const updateQty = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  const updateCost = (id: number, val: string) => {
    const num = parseFloat(val) || 0;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unitCost: num } : item))
    );
  };

  const removeItem = (id: number) => {
    if (items.length <= 1) {
      toast({ title: "Note", description: "Keep at least 1 demo item to see calculations." });
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = () => {
    setShowSuccessModal(true);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Link href="/">
            <button className="p-2 rounded-xl border border-border bg-card hover:bg-muted transition cursor-pointer">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-foreground">Stock In / Purchase</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3 h-3 text-primary" />
                Demo Preview
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Add vendor invoices, update stock quantities & track purchase balances
            </p>
          </div>
        </div>

        <Link href="/register">
          <button className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary/90 transition cursor-pointer">
            Create Account
          </button>
        </Link>
      </div>

      {/* Demo Explanatory Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="flex-1 text-xs">
          <p className="font-bold text-foreground">How Stock In Works:</p>
          <p className="text-muted-foreground mt-0.5">
            Select or create suppliers, scan barcodes, enter purchase prices, and incoming quantities are automatically added to your live inventory & supplier ledger.
          </p>
        </div>
      </div>

      {/* Supplier & Invoice info card */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
            <Truck className="w-4 h-4 text-primary" /> Supplier & Invoice Info
          </h2>
          <span className="text-[11px] text-muted-foreground">Auto Ledger Sync</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Supplier / Party Name
            </label>
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="Direct Wholesaler & Importers Ltd.">Direct Wholesaler & Importers Ltd.</option>
              <option value="Apex Mobile & Gadget Distribution">Apex Mobile & Gadget Distribution</option>
              <option value="Global Electronics Importers Co.">Global Electronics Importers Co.</option>
              <option value="Star Tech Accessories Hub">Star Tech Accessories Hub</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Purchase Invoice / Memo No.
            </label>
            <input
              type="text"
              value={memoNo}
              onChange={(e) => setMemoNo(e.target.value)}
              placeholder="e.g. INV-2026-0842"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Items in this purchase */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Purchased Items ({items.length})</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              const newId = Date.now();
              setItems((prev) => [
                ...prev,
                { id: newId, name: "New Wireless Earbuds Sample", sku: "GAD-EAR-09", qty: 10, unitCost: 6.50 },
              ]);
              toast({ title: "Item Added", description: "Added sample gadget to stock in list." });
            }}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
        </div>

        {/* Items List */}
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl border border-border bg-background/60 hover:bg-background transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">SKU: {item.sku}</p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                {/* Qty +/- */}
                <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, -1)}
                    className="w-7 h-7 flex items-center justify-center text-xs font-bold hover:bg-muted cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-9 text-center text-xs font-bold">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, 1)}
                    className="w-7 h-7 flex items-center justify-center text-xs font-bold hover:bg-muted cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Unit Cost input */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-muted-foreground">$</span>
                  <input
                    type="number"
                    step="0.1"
                    value={item.unitCost}
                    onChange={(e) => updateCost(item.id, e.target.value)}
                    className="w-16 px-2 py-1 text-xs font-bold rounded-lg border border-border bg-card text-right focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Total */}
                <div className="w-16 text-right font-bold text-xs text-foreground">
                  ${(item.qty * item.unitCost).toFixed(2)}
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-1 text-muted-foreground hover:text-destructive transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost & Payment Summary */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
        <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
          <DollarSign className="w-4 h-4 text-emerald-500" /> Payment & Summary
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground block">Total Quantity</span>
            <span className="font-bold text-foreground text-sm">{totalQty} pcs</span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground block">Grand Total Cost</span>
            <span className="font-bold text-primary text-sm">${totalCost.toFixed(2)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground block">Paid Amount</span>
            <input
              type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full mt-0.5 px-1 py-0.5 text-xs font-bold rounded bg-background border border-border"
            />
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground block">Supplier Due</span>
            <span className={`font-bold text-sm ${dueAmount > 0 ? "text-amber-500" : "text-emerald-500"}`}>
              ${dueAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 transition-transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          <ArrowDownToLine className="w-4 h-4" /> Save Stock In Entry (Demo)
        </button>
      </div>

      {/* Success Modal Preview */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 text-center space-y-3.5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Stock In Simulated!</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {totalQty} items added to stock. Vendor balance of ${dueAmount.toFixed(2)} recorded in supplier ledger.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 border border-border text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier:</span>
                <span className="font-bold text-foreground truncate max-w-[180px]">{supplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Total:</span>
                <span className="font-bold text-primary">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Amount:</span>
                <span className="font-bold text-amber-500">${dueAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <Link href="/register">
                <button className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition cursor-pointer">
                  Create Account to Start Real Inventory
                </button>
              </Link>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
