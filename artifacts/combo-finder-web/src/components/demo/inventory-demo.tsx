import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, Package, Search, Plus, Sparkles,
  AlertTriangle, CheckCircle, XCircle, Tag, QrCode,
  DollarSign, Boxes, Filter, Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InventoryProduct {
  id: number;
  name: string;
  category: string;
  sku: string;
  barcode: string;
  stock: number;
  minStock: number;
  buyPrice: number;
  sellPrice: number;
}

const DEMO_INVENTORY: InventoryProduct[] = [
  { id: 1, name: "20W PD Fast Wall Charger Adapter", category: "Charging", sku: "CHG-PD-020", barcode: "890123456701", stock: 24, minStock: 5, buyPrice: 4.20, sellPrice: 12.00 },
  { id: 2, name: "Type-C Braided Heavy Cable 2M", category: "Cables", sku: "CAB-TC-002", barcode: "890123456702", stock: 45, minStock: 10, buyPrice: 1.50, sellPrice: 5.00 },
  { id: 3, name: "Wireless Bluetooth Earbuds Pro", category: "Audio", sku: "EAR-BT-900", barcode: "890123456703", stock: 3, minStock: 5, buyPrice: 12.50, sellPrice: 28.00 },
  { id: 4, name: "Magnetic Safe Powerbank 10000mAh", category: "Gadgets", sku: "PB-MAG-10K", barcode: "890123456704", stock: 8, minStock: 3, buyPrice: 16.00, sellPrice: 34.00 },
  { id: 5, name: "9D Curved Tempered Glass Shield", category: "Glass", sku: "GLS-9D-PRV", barcode: "890123456705", stock: 60, minStock: 15, buyPrice: 0.80, sellPrice: 4.50 },
  { id: 6, name: "Silicone Anti-Shock Drop Case", category: "Cases", sku: "CAS-SIL-001", barcode: "890123456706", stock: 30, minStock: 8, buyPrice: 2.10, sellPrice: 7.00 },
  { id: 7, name: "Original 5000mAh Battery Replacement", category: "Batteries", sku: "BAT-S21-5K", barcode: "890123456707", stock: 0, minStock: 4, buyPrice: 8.00, sellPrice: 18.00 },
  { id: 8, name: "Universal Metal Desktop Phone Stand", category: "Gadgets", sku: "STN-MET-004", barcode: "890123456708", stock: 18, minStock: 4, buyPrice: 2.80, sellPrice: 6.50 },
];

const CATEGORIES = ["All Items", "Charging", "Cables", "Audio", "Gadgets", "Glass", "Cases", "Batteries"];

export function InventoryDemo() {
  const { toast } = useToast();
  const [selectedCat, setSelectedCat] = useState("All Items");
  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState<"all" | "low" | "out">("all");
  const [selectedItem, setSelectedItem] = useState<InventoryProduct | null>(null);

  const filteredItems = DEMO_INVENTORY.filter((item) => {
    const matchCat = selectedCat === "All Items" || item.category === selectedCat;
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.barcode.includes(search);
    const matchStock =
      filterStock === "all"
        ? true
        : filterStock === "low"
        ? item.stock > 0 && item.stock <= item.minStock
        : item.stock === 0;
    return matchCat && matchSearch && matchStock;
  });

  const totalItemsCount = DEMO_INVENTORY.reduce((sum, item) => sum + item.stock, 0);
  const totalStockValue = DEMO_INVENTORY.reduce((sum, item) => sum + item.stock * item.buyPrice, 0);
  const lowStockCount = DEMO_INVENTORY.filter((i) => i.stock > 0 && i.stock <= i.minStock).length;
  const outOfStockCount = DEMO_INVENTORY.filter((i) => i.stock === 0).length;

  return (
    <div className="space-y-4 pb-14">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Link href="/">
            <button className="p-2 rounded-xl border border-border bg-card hover:bg-muted transition cursor-pointer">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-foreground">Inventory & Stock</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3 h-3 text-primary" />
                Demo Preview
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time stock valuation, low-stock warnings & barcode inventory
            </p>
          </div>
        </div>

        <Link href="/register">
          <button className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary/90 transition cursor-pointer">
            Create Account
          </button>
        </Link>
      </div>

      {/* Top 4 Metrics cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold">Total Stock</span>
            <Boxes className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-black text-foreground">{totalItemsCount} pcs</p>
          <span className="text-[10px] text-muted-foreground">{DEMO_INVENTORY.length} Products</span>
        </div>

        <div className="p-3 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold">Asset Value</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            ${totalStockValue.toFixed(2)}
          </p>
          <span className="text-[10px] text-muted-foreground">Cost Value</span>
        </div>

        <div
          onClick={() => setFilterStock(filterStock === "low" ? "all" : "low")}
          className={`p-3 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterStock === "low"
              ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30"
              : "border-border bg-card hover:border-amber-400/50"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-lg font-black text-amber-500">{lowStockCount} items</p>
          <span className="text-[10px] text-muted-foreground">Needs Reorder</span>
        </div>

        <div
          onClick={() => setFilterStock(filterStock === "out" ? "all" : "out")}
          className={`p-3 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterStock === "out"
              ? "border-destructive bg-red-50/50 dark:bg-red-950/30"
              : "border-border bg-card hover:border-destructive/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-semibold">Out of Stock</span>
            <XCircle className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-lg font-black text-destructive">{outOfStockCount} items</p>
          <span className="text-[10px] text-muted-foreground">Empty Stock</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-3 rounded-2xl border border-border bg-card shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              toast({
                title: "Add Product (Demo)",
                description: "Create an account to add custom products with automatic barcodes.",
              });
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold shrink-0 hover:bg-primary/90 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
        </div>

        {/* Category Pills */}
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

      {/* Inventory Products Table / List */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-3 border-b border-border bg-muted/20 flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">
            Inventory Items ({filteredItems.length})
          </span>
          <span className="text-[11px] text-muted-foreground">Click item to view barcode & details</span>
        </div>

        <div className="divide-y divide-border/60">
          {filteredItems.map((item) => {
            const isLow = item.stock > 0 && item.stock <= item.minStock;
            const isOut = item.stock === 0;
            const profit = item.sellPrice - item.buyPrice;
            const margin = Math.round((profit / item.sellPrice) * 100);

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="p-3.5 hover:bg-muted/30 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-foreground">{item.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono mt-1">
                      <span>SKU: {item.sku}</span>
                      <span>•</span>
                      <span>Barcode: {item.barcode}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 self-stretch sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                  {/* Prices */}
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-bold text-foreground">
                      Sell: <span className="text-primary font-black">${item.sellPrice.toFixed(2)}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Buy: ${item.buyPrice.toFixed(2)} ({margin}% margin)
                    </p>
                  </div>

                  {/* Stock Badge */}
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        isOut
                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                          : isLow
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {isOut ? "Out of Stock" : `${item.stock} in stock`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-sm text-foreground">{selectedItem.name}</h3>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                SKU: {selectedItem.sku} | Barcode: {selectedItem.barcode}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/50 border border-border text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Stock:</span>
                <span className="font-bold text-foreground">{selectedItem.stock} pcs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase Cost:</span>
                <span className="font-bold text-foreground">${selectedItem.buyPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selling Price:</span>
                <span className="font-bold text-primary">${selectedItem.sellPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Profit / Pc:</span>
                <span className="font-bold text-emerald-500">
                  +${(selectedItem.sellPrice - selectedItem.buyPrice).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Link href="/register">
                <button className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition cursor-pointer">
                  Create Account to Manage Products
                </button>
              </Link>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="w-full py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
