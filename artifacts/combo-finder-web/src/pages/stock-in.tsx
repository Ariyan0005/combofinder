import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowDownToLine, Barcode, CheckCircle, ChevronDown, Package, Plus, Search, Trash2, X } from "lucide-react";
import { Link } from "wouter";
import { ProtectedPage } from "@/components/protected-page";
import { useAuth } from "@/context/auth-context";
import { localInventory, localSuppliers } from "@/lib/local-store";
import { StockInDemo } from "@/components/demo/stock-in-demo";

const PRIMARY = "hsl(var(--primary))";
const MUTED = "hsl(var(--muted-foreground))";
const BORDER = "hsl(var(--border))";
const CARD = "hsl(var(--card))";
const BG = "hsl(var(--background))";

type Item = {
  id: number;
  partName: string;
  quantity: number;
  purchasePrice?: string | number;
  barcode?: string;
  sku?: string;
  supplierId?: number;
  supplier?: string;
  brand?: string;
  model?: string;
  shelfLocation?: string;
};

type Supplier = { id: number; name: string; isActive?: boolean };
type StockLine = { item: Item; qty: string; unitPrice: string };

function Scanner({ onDetect, onClose }: { onDetect: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<number | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const canDetect = "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia;
    setSupported(canDetect);
    if (!canDetect) return;
    let stream: MediaStream | null = null;
    let stopped = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!videoRef.current || stopped) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        // @ts-expect-error BarcodeDetector is not included in all TS lib versions.
        const detector = new window.BarcodeDetector({
          formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"],
        });
        const scan = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length) {
              onDetect(codes[0].rawValue);
              return;
            }
          } catch {}
          frameRef.current = requestAnimationFrame(scan);
        };
        frameRef.current = requestAnimationFrame(scan);
      } catch {
        setSupported(false);
      }
    })();
    return () => {
      stopped = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [onDetect]);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl" style={{ background: CARD }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Scan Barcode</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full" style={{ background: "hsl(var(--muted))" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        {supported ? (
          <div className="relative overflow-hidden rounded-2xl bg-black aspect-[4/3]">
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-[18%_8%] rounded-xl border-2 border-cyan-300 shadow-[0_0_20px_#22d3ee]" />
          </div>
        ) : (
          <p className="text-sm mb-3" style={{ color: MUTED }}>Camera scanning is unavailable. Enter the barcode or SKU manually.</p>
        )}
        <div className="flex gap-2 mt-4">
          <input
            value={manual}
            onChange={e => setManual(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && manual.trim()) onDetect(manual.trim()); }}
            placeholder="Enter barcode / SKU"
            className="flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: BORDER, background: BG }}
          />
          <button type="button" disabled={!manual.trim()} onClick={() => onDetect(manual.trim())}
            className="px-4 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ background: PRIMARY }}>
            Find
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StockIn() {
  const { user, isGuest } = useAuth();
  if (isGuest && !user) {
    return <StockInDemo />;
  }
  return <StockInMain />;
}

function StockInMain() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isManager = Boolean(user?.isManager || user?.role?.toLowerCase() === "manager");
  const isFreePlan = (user?.plan === "Free" || !user?.plan) && !user?.isStaff && !isManager;
  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [lines, setLines] = useState<StockLine[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      if (isFreePlan && user?.id) return localInventory.getAll(user.id);
      const response = await fetch("/api/inventory", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to load inventory");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
  });
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      if (isFreePlan && user?.id) return localSuppliers.getAll(user.id) as Supplier[];
      const response = await fetch("/api/suppliers", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to load suppliers");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
  });

  const selectedIds = useMemo(() => new Set(lines.map(line => line.item.id)), [lines]);
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return items.filter(item =>
      item.partName.toLowerCase().includes(q) ||
      (item.barcode ?? "").toLowerCase().includes(q) ||
      (item.sku ?? "").toLowerCase().includes(q) ||
      (item.brand ?? "").toLowerCase().includes(q) ||
      (item.model ?? "").toLowerCase().includes(q)
    ).slice(0, 8);
  }, [items, search]);

  function addItem(item: Item) {
    setLines(prev => {
      const existing = prev.find(line => line.item.id === item.id);
      if (existing) {
        return prev.map(line => line.item.id === item.id
          ? { ...line, qty: String(Number(line.qty || 0) + 1) }
          : line);
      }
      return [...prev, {
        item,
        qty: "1",
        unitPrice: item.purchasePrice != null ? String(item.purchasePrice) : "",
      }];
    });
    setSearch("");
  }

  function findByCode(code: string) {
    const clean = code.trim().toLowerCase();
    const item = items.find(i => (i.barcode ?? "").toLowerCase() === clean || (i.sku ?? "").toLowerCase() === clean);
    setShowScanner(false);
    if (item) {
      addItem(item);
      setError("");
    } else {
      setSearch(code);
      setError("No product found for this barcode/SKU. Add the product to Inventory first.");
    }
  }

  const total = lines.reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.unitPrice || 0), 0);
  const supplierName = suppliers.find(s => String(s.id) === supplierId)?.name;

  const save = useMutation({
    mutationFn: async () => {
      if (!lines.length) throw new Error("Search and select at least one product");
      if (lines.some(line => !Number.isInteger(Number(line.qty)) || Number(line.qty) < 1)) {
        throw new Error("Quantity must be a whole number greater than 0");
      }
      if (isFreePlan && user?.id) {
        lines.forEach(line => localInventory.update(user.id!, line.item.id, {
          ...line.item,
          quantity: Number(line.item.quantity || 0) + Number(line.qty),
          purchasePrice: line.unitPrice || line.item.purchasePrice || null,
          supplierId: supplierId ? Number(supplierId) : line.item.supplierId ?? null,
          supplier: supplierName ?? line.item.supplier ?? null,
        }));
        return;
      }

      if (supplierId) {
        const response = await fetch("/api/supplier-purchases/invoice", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplierId: Number(supplierId),
            supplierName: supplierName ?? null,
            invoiceNumber: invoiceNo.trim() || null,
            purchaseDate,
            paidAmount: 0,
            notes: notes || null,
            items: lines.map(line => ({
              inventoryId: line.item.id,
              productName: line.item.partName,
              quantity: Number(line.qty),
              unitPrice: Number(line.unitPrice) || 0,
            })),
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Failed to save stock");
      } else {
        for (const line of lines) {
          const response = await fetch("/api/stock-movements", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inventoryId: line.item.id,
              type: "in",
              quantity: Number(line.qty),
              unitPrice: line.unitPrice || null,
              totalPrice: line.unitPrice ? String(Number(line.qty) * Number(line.unitPrice)) : null,
              notes: invoiceNo ? `Invoice #${invoiceNo}` : null,
              reference: purchaseDate,
            }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? "Failed to save stock");
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
      setLines([]);
      setSearch("");
      setInvoiceNo("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <ProtectedPage>
      <div className="max-w-3xl mx-auto space-y-4 pb-8">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button type="button" className="w-9 h-9 rounded-xl flex items-center justify-center border" style={{ borderColor: BORDER }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold">Stock In</h1>
            <p className="text-xs" style={{ color: MUTED }}>Add incoming products to your inventory</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#ECFDF5", color: "#059669" }}>
            <ArrowDownToLine className="w-5 h-5" />
          </div>
        </div>

        {/* Invoice, Date & Supplier section at top */}
        <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: BORDER, background: CARD }}>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold">
              Invoice # (optional)
              <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="e.g. INV-1024"
                className="w-full mt-1 px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: BORDER, background: BG }} />
            </label>
            <label className="text-xs font-semibold">
              Date
              <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: BORDER, background: BG }} />
            </label>
          </div>
          <label className="text-xs font-semibold block">
            Supplier (optional)
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: BORDER, background: BG }}>
              <option value="">No supplier</option>
              {suppliers.filter(s => s.isActive !== false).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        </div>

        {/* Search product section (Clean without extra text) */}
        <div className="rounded-2xl border p-3.5" style={{ borderColor: BORDER, background: CARD }}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setError(""); }}
                placeholder="Search name, barcode, SKU, brand…"
                className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: BORDER, background: BG }}
              />
              {matches.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border shadow-xl overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
                  {matches.map(item => (
                    <button key={item.id} type="button" onClick={() => addItem(item)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left border-b last:border-0 hover:bg-muted/30"
                      style={{ borderColor: BORDER }}>
                      <Package className="w-4 h-4 flex-shrink-0" style={{ color: PRIMARY }} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold truncate">{item.partName}</span>
                        <span className="block text-[11px]" style={{ color: MUTED }}>
                          Stock: {item.quantity}{item.barcode ? ` · ${item.barcode}` : ""}
                        </span>
                      </span>
                      {selectedIds.has(item.id)
                        ? <span className="text-[11px] font-bold" style={{ color: "#059669" }}>Added</span>
                        : <Plus className="w-4 h-4" style={{ color: PRIMARY }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setShowScanner(true)}
              className="w-12 rounded-xl border flex items-center justify-center flex-shrink-0"
              style={{ borderColor: PRIMARY, color: PRIMARY, background: "hsl(var(--primary) / 0.08)" }}
              title="Scan barcode">
              <Barcode className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Line items section */}
        {lines.length > 0 && (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER, background: CARD }}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
              <h2 className="font-bold text-sm">Products to stock in ({lines.length})</h2>
              <span className="text-sm font-extrabold" style={{ color: PRIMARY }}>{total.toLocaleString()}</span>
            </div>
            <div className="divide-y" style={{ borderColor: BORDER }}>
              {lines.map(line => (
                <div key={line.item.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between min-w-0">
                    <p className="font-semibold text-sm truncate">{line.item.partName}</p>
                    <p className="text-xs flex-shrink-0 ml-2" style={{ color: MUTED }}>Current stock: {line.item.quantity}</p>
                  </div>
                  
                  {/* Quantity, Unit price, and Delete button on ONE horizontal line */}
                  <div className="flex items-end gap-2">
                    <label className="flex-1 min-w-0 text-[11px] font-medium" style={{ color: MUTED }}>
                      Quantity
                      <input type="number" min="1" step="1" value={line.qty}
                        onChange={e => setLines(prev => prev.map(x => x.item.id === line.item.id ? { ...x, qty: e.target.value } : x))}
                        className="w-full mt-1 px-3 py-2 rounded-xl border text-sm outline-none text-foreground font-semibold" style={{ borderColor: BORDER, background: BG }} />
                    </label>
                    <label className="flex-1 min-w-0 text-[11px] font-medium" style={{ color: MUTED }}>
                      Unit price
                      <input type="number" min="0" step="0.01" value={line.unitPrice}
                        onChange={e => setLines(prev => prev.map(x => x.item.id === line.item.id ? { ...x, unitPrice: e.target.value } : x))}
                        className="w-full mt-1 px-3 py-2 rounded-xl border text-sm outline-none text-foreground font-semibold" style={{ borderColor: BORDER, background: BG }} />
                    </label>
                    <button type="button" onClick={() => setLines(prev => prev.filter(x => x.item.id !== line.item.id))}
                      className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FEF2F2", color: "#DC2626" }} title="Remove item">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="px-3 py-2.5 rounded-xl text-sm font-medium" style={{ color: "#DC2626", background: "#FEF2F2" }}>{error}</p>}
        {saved && <p className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold" style={{ color: "#059669", background: "#ECFDF5" }}><CheckCircle className="w-4 h-4" /> Stock added successfully</p>}

        {/* Add Stock Button */}
        <button type="button" disabled={save.isPending || !lines.length} onClick={() => { setError(""); save.mutate(); }}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
          style={{ background: PRIMARY }}>
          <ArrowDownToLine className="w-4 h-4" />
          {save.isPending ? "Saving…" : "Add Stock"}
        </button>

        {showScanner && <Scanner onClose={() => setShowScanner(false)} onDetect={findByCode} />}
      </div>
    </ProtectedPage>
  );
}