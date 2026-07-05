import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Plus, Search, Package, X, AlertCircle, Camera, ChevronRight,
  Tag, Truck, ArrowDownToLine, ShoppingCart, Edit3, Trash2,
  QrCode, CheckCircle, ArrowUpFromLine, MoreVertical, Boxes,
} from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";

// ─── Types ────────────────────────────────────────────────────────────────────
type Item = {
  id: number; partName: string; partType?: string; quality?: string;
  quantity: number; minStock: number; sellingPrice?: string | number;
  purchasePrice?: string | number; supplierId?: number; categoryId?: number;
  barcode?: string; sku?: string; supplier?: string; notes?: string;
  model?: string; brand?: string;
};
type Supplier = { id: number; name: string; phone?: string; whatsapp?: string; partTypes?: string; isActive: boolean; };
type Category = { id: number; name: string; description?: string; color?: string; icon?: string; };

// ─── Shared helpers ────────────────────────────────────────────────────────────
const PRIMARY = "hsl(var(--primary))";
const MUTED = "hsl(var(--muted-foreground))";
const BORDER = "hsl(var(--border))";
const BG = "hsl(var(--background))";
const CARD = "hsl(var(--card))";

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col"
        style={{ background: CARD, maxHeight: "92vh" }}>
        {/* Header — never scrolls */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ background: CARD, borderColor: BORDER }}>
          <h2 className="font-bold text-base">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--muted))", color: MUTED }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: MUTED }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
    style={{ borderColor: BORDER, background: BG, ...props.style }} />;
}

function Select({ ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none appearance-none"
    style={{ borderColor: BORDER, background: BG, ...props.style }} />;
}

function SubmitBtn({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel?: string }) {
  return (
    <button type="submit" disabled={pending}
      className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 mt-2"
      style={{ background: PRIMARY }}>
      {pending ? (pendingLabel ?? "Saving…") : label}
    </button>
  );
}

// ─── QR / Barcode Scanner ─────────────────────────────────────────────────────
function BarcodeScanner({ onDetect, onClose }: { onDetect: (code: string) => void; onClose: () => void }) {
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
        const detector = new window.BarcodeDetector({ formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"] });
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

    return () => {
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [onDetect]);

  return (
    <ModalShell title="Scan Barcode / QR Code" onClose={onClose}>
      {supported === false ? (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: MUTED }}>Camera scan not supported on this browser. Enter the code manually:</p>
          <Input placeholder="Barcode or SKU" value={manualCode} onChange={e => setManualCode(e.target.value)}
            onKeyDown={e => e.key === "Enter" && manualCode && onDetect(manualCode)} />
          <button onClick={() => manualCode && onDetect(manualCode)} disabled={!manualCode}
            className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
            style={{ background: PRIMARY }}>Lookup</button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            {/* scan line overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-52 h-52 border-2 border-white/60 rounded-2xl">
                <div className="w-full h-0.5 bg-white/80 animate-[scan_2s_ease-in-out_infinite]"
                  style={{ animation: "scan 2s ease-in-out infinite" }} />
              </div>
            </div>
            {scanning && <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">Scanning…</div>}
          </div>
          <p className="text-xs text-center" style={{ color: MUTED }}>Point camera at barcode or QR code on the part</p>
          <div className="flex items-center gap-2 my-1"><div className="flex-1 h-px" style={{ background: BORDER }} /><span className="text-xs" style={{ color: MUTED }}>or type manually</span><div className="flex-1 h-px" style={{ background: BORDER }} /></div>
          <div className="flex gap-2">
            <Input placeholder="Enter barcode / SKU" value={manualCode} onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && manualCode && onDetect(manualCode)} />
            <button onClick={() => manualCode && onDetect(manualCode)} disabled={!manualCode}
              className="px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex-shrink-0"
              style={{ background: PRIMARY }}>Go</button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

// ─── Add / Edit Product Modal ─────────────────────────────────────────────────
function AddProductModal({ onClose, existing, suppliers, categories }: {
  onClose: () => void; existing?: Item; suppliers: Supplier[]; categories: Category[];
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    partName: existing?.partName ?? "",
    partType: existing?.partType ?? "Display",
    quality: existing?.quality ?? "Original",
    quantity: String(existing?.quantity ?? ""),
    minStock: String(existing?.minStock ?? "2"),
    purchasePrice: String(existing?.purchasePrice ?? ""),
    sellingPrice: String(existing?.sellingPrice ?? ""),
    supplierId: String(existing?.supplierId ?? ""),
    categoryId: String(existing?.categoryId ?? ""),
    barcode: existing?.barcode ?? "",
    sku: existing?.sku ?? "",
    model: existing?.model ?? "",
    notes: existing?.notes ?? "",
  });
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const mut = useMutation({
    mutationFn: async () => {
          const isEdit = !!(existing && existing.id > 0);
      const url = isEdit ? `/api/inventory/${existing!.id}` : `/api/inventory`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          partName: form.partName,
          quantity: Number(form.quantity) || 0,
          minStock: Number(form.minStock) || 2,
          supplierId: form.supplierId ? Number(form.supplierId) : null,
          categoryId: form.categoryId ? Number(form.categoryId) : null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); onClose(); },
    onError: (err: any) => setError(err.message),
  });

  if (showScanner) return (
    <BarcodeScanner onClose={() => setShowScanner(false)}
      onDetect={code => { set("barcode", code); setShowScanner(false); }} />
  );

  return (
    <ModalShell title={existing ? "Edit Product" : "Add Product"} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); if (!form.partName) { setError("Product name required"); return; } mut.mutate(); }}
        className="flex flex-col gap-3">
        <Field label="Product Name *">
          <Input value={form.partName} onChange={e => set("partName", e.target.value)} placeholder="e.g. iPhone 13 Display" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={form.categoryId} onChange={e => set("categoryId", e.target.value)}>
              <option value="">— Select —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Part Type">
            <Select value={form.partType} onChange={e => set("partType", e.target.value)}>
              {["Display","Battery","IC","Connector","Camera","Speaker","Frame","Other"].map(t => <option key={t}>{t}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Supplier">
          <Select value={form.supplierId} onChange={e => set("supplierId", e.target.value)}>
            <option value="">— No supplier —</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        <Field label="Quality">
          <Select value={form.quality} onChange={e => set("quality", e.target.value)}>
            {["Original","OEM","Copy","Refurbished"].map(q => <option key={q}>{q}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity"><Input type="number" min="0" value={form.quantity} onChange={e => set("quantity", e.target.value)} placeholder="0" /></Field>
          <Field label="Min Stock Alert"><Input type="number" min="0" value={form.minStock} onChange={e => set("minStock", e.target.value)} placeholder="2" /></Field>
          <Field label="Purchase Price (৳)"><Input type="number" min="0" value={form.purchasePrice} onChange={e => set("purchasePrice", e.target.value)} placeholder="0" /></Field>
          <Field label="Selling Price (৳)"><Input type="number" min="0" value={form.sellingPrice} onChange={e => set("sellingPrice", e.target.value)} placeholder="0" /></Field>
        </div>
        <Field label="Barcode / QR Code">
          <div className="flex gap-2">
            <Input value={form.barcode} onChange={e => set("barcode", e.target.value)} placeholder="Scan or type barcode" />
            <button type="button" onClick={() => setShowScanner(true)}
              className="px-3 py-2 rounded-xl border flex items-center" style={{ borderColor: BORDER, color: PRIMARY }}>
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU (internal)"><Input value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="e.g. IP13-LCD-ORG" /></Field>
          <Field label="Model"><Input value={form.model} onChange={e => set("model", e.target.value)} placeholder="e.g. iPhone 13" /></Field>
        </div>
        <Field label="Notes"><Input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Optional notes" /></Field>
        {error && <p className="text-xs text-center" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
        <SubmitBtn pending={mut.isPending} label={existing ? "Save Changes" : "Add Product"} />
      </form>
    </ModalShell>
  );
}

// ─── Add Category Modal ───────────────────────────────────────────────────────
function AddCategoryModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  const [error, setError] = useState("");
  const mut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/inventory-categories", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: desc.trim() || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inv-categories"] }); onClose(); },
    onError: (e: any) => setError(e.message),
  });
  return (
    <ModalShell title="Add Category" onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); if (!name.trim()) { setError("Name required"); return; } mut.mutate(); }}
        className="flex flex-col gap-3">
        <Field label="Category Name *"><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Displays" autoFocus /></Field>
        <Field label="Description"><Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional" /></Field>
        {error && <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
        <SubmitBtn pending={mut.isPending} label="Add Category" />
      </form>
    </ModalShell>
  );
}

// ─── Add Supplier Modal ───────────────────────────────────────────────────────
function AddSupplierModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", phone: "", whatsapp: "", partTypes: "", notes: "" });
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const [error, setError] = useState("");
  const mut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/suppliers", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: f.name.trim(), phone: f.phone || null, whatsapp: f.whatsapp || null, partTypes: f.partTypes || null, notes: f.notes || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); onClose(); },
    onError: (e: any) => setError(e.message),
  });
  return (
    <ModalShell title="Add Supplier" onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); if (!f.name.trim()) { setError("Name required"); return; } mut.mutate(); }}
        className="flex flex-col gap-3">
        <Field label="Supplier Name *"><Input value={f.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Ali Parts BD" autoFocus /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone"><Input value={f.phone} onChange={e => set("phone", e.target.value)} placeholder="01700000000" type="tel" /></Field>
          <Field label="WhatsApp"><Input value={f.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="01700000000" type="tel" /></Field>
        </div>
        <Field label="Supplies (part types)"><Input value={f.partTypes} onChange={e => set("partTypes", e.target.value)} placeholder="Display, Battery, IC…" /></Field>
        <Field label="Notes"><Input value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Optional" /></Field>
        {error && <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
        <SubmitBtn pending={mut.isPending} label="Add Supplier" />
      </form>
    </ModalShell>
  );
}

// ─── Stock In Modal ───────────────────────────────────────────────────────────
function StockInModal({ onClose, item: initialItem, suppliers, allItems }: {
  onClose: () => void; item?: Item; suppliers: Supplier[]; allItems: Item[];
}) {
  const qc = useQueryClient();
  const [item, setItem] = useState<Item | undefined>(initialItem);
  const [itemSearch, setItemSearch] = useState("");
  const [qty, setQty] = useState("1");
  const [supplierId, setSupplierId] = useState(String(initialItem?.supplierId ?? ""));
  const [unitPrice, setUnitPrice] = useState(String(initialItem?.purchasePrice ?? ""));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const supplierName = suppliers.find(s => String(s.id) === supplierId)?.name;

  const filteredItems = itemSearch
    ? allItems.filter(i => (i.partName).toLowerCase().includes(itemSearch.toLowerCase())).slice(0, 6)
    : [];

  const mut = useMutation({
    mutationFn: async () => {
      if (!item) throw new Error("No item selected");
      const res = await fetch("/api/stock-movements", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: item.id, type: "in",
          quantity: Number(qty),
          supplierId: supplierId ? Number(supplierId) : null,
          supplierName: supplierName ?? null,
          unitPrice: unitPrice || null,
          totalPrice: unitPrice ? String(Number(unitPrice) * Number(qty)) : null,
          notes: notes || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
      setSuccess(true);
      setTimeout(onClose, 1200);
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <ModalShell title="Stock In (Add Stock)" onClose={onClose}>
      {success ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "#10B981" }} />
          <p className="font-bold">Stock added!</p>
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); if (!item) { setError("Select a product"); return; } if (Number(qty) <= 0) { setError("Quantity must be > 0"); return; } mut.mutate(); }}
          className="flex flex-col gap-3">
          {/* Item selector when no item pre-selected */}
          {!item ? (
            <Field label="Product *">
              <div className="relative">
                <Input placeholder="Search product…" value={itemSearch} onChange={e => setItemSearch(e.target.value)} />
                {filteredItems.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-xl border overflow-hidden shadow-lg"
                    style={{ background: CARD, borderColor: BORDER }}>
                    {filteredItems.map(i => (
                      <button key={i.id} type="button" onClick={() => { setItem(i); setItemSearch(""); setSupplierId(String(i.supplierId ?? "")); setUnitPrice(String(i.purchasePrice ?? "")); }}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/30 border-b last:border-0"
                        style={{ borderColor: BORDER }}>
                        <span className="font-semibold">{i.partName}</span>
                        <span className="text-xs ml-2" style={{ color: MUTED }}>Stock: {i.quantity}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
              <div className="flex-1">
                <p className="font-semibold text-sm">{item.partName}</p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>Current stock: {item.quantity}</p>
              </div>
              <button type="button" onClick={() => setItem(undefined)} style={{ color: MUTED }}><X className="w-4 h-4" /></button>
            </div>
          )}
          <Field label="Supplier">
            <Select value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">— No supplier —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity *"><Input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} required /></Field>
            <Field label="Unit Price (৳)"><Input type="number" min="0" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="0" /></Field>
          </div>
          {qty && unitPrice && (
            <p className="text-xs font-semibold" style={{ color: PRIMARY }}>
              Total: ৳{(Number(qty) * Number(unitPrice)).toLocaleString()}
            </p>
          )}
          <Field label="Notes"><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Bought from Ali Parts" /></Field>
          {error && <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
          <SubmitBtn pending={mut.isPending} label="Add to Stock" pendingLabel="Adding…" />
        </form>
      )}
    </ModalShell>
  );
}

// ─── Sell / POS Modal ─────────────────────────────────────────────────────────
function SellModal({ onClose, item: initialItem, allItems }: { onClose: () => void; item?: Item; allItems: Item[] }) {
  const qc = useQueryClient();
  const [item, setItem] = useState<Item | undefined>(initialItem);
  const [itemSearch, setItemSearch] = useState("");
  const [qty, setQty] = useState("1");
  const [salePrice, setSalePrice] = useState(String(initialItem?.sellingPrice ?? ""));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const filteredItems = itemSearch
    ? allItems.filter(i => i.partName.toLowerCase().includes(itemSearch.toLowerCase()) && i.quantity > 0).slice(0, 6)
    : [];

  const mut = useMutation({
    mutationFn: async () => {
      if (!item) throw new Error("No item selected");
      const q = Number(qty);
      if (q > item.quantity) throw new Error(`Only ${item.quantity} in stock`);
      const res = await fetch("/api/stock-movements", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: item.id, type: "sale",
          quantity: q,
          unitPrice: salePrice || null,
          totalPrice: salePrice ? String(Number(salePrice) * q) : null,
          notes: notes || null,
          reference: "Walk-in sale",
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
      setSuccess(true);
      setTimeout(onClose, 1200);
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <ModalShell title="Record Sale" onClose={onClose}>
      {success ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "#10B981" }} />
          <p className="font-bold">Sale recorded!</p>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Stock updated.</p>
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); if (!item) { setError("Select a product"); return; } mut.mutate(); }} className="flex flex-col gap-3">
          {!item ? (
            <Field label="Product *">
              <div className="relative">
                <Input placeholder="Search product to sell…" value={itemSearch} onChange={e => setItemSearch(e.target.value)} />
                {filteredItems.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-xl border overflow-hidden shadow-lg"
                    style={{ background: CARD, borderColor: BORDER }}>
                    {filteredItems.map(i => (
                      <button key={i.id} type="button" onClick={() => { setItem(i); setItemSearch(""); setSalePrice(String(i.sellingPrice ?? "")); }}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/30 border-b last:border-0"
                        style={{ borderColor: BORDER }}>
                        <span className="font-semibold">{i.partName}</span>
                        <span className="text-xs ml-2" style={{ color: MUTED }}>Stock: {i.quantity}</span>
                        {i.sellingPrice && <span className="text-xs ml-2 font-bold" style={{ color: PRIMARY }}>৳{Number(i.sellingPrice).toLocaleString()}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
              <div className="flex-1">
                <p className="font-semibold text-sm">{item.partName}</p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>Available: {item.quantity} units</p>
              </div>
              <button type="button" onClick={() => setItem(undefined)} style={{ color: MUTED }}><X className="w-4 h-4" /></button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Qty to Sell *">
              <Input type="number" min="1" max={item?.quantity} value={qty} onChange={e => setQty(e.target.value)} required />
            </Field>
            <Field label="Sale Price (৳)">
              <Input type="number" min="0" value={salePrice} onChange={e => setSalePrice(e.target.value)} />
            </Field>
          </div>
          {qty && salePrice && (
            <div className="p-3 rounded-xl" style={{ background: "#ECFDF5" }}>
              <p className="text-sm font-bold" style={{ color: "#059669" }}>
                Total: ৳{(Number(qty) * Number(salePrice)).toLocaleString()}
              </p>
              {item?.purchasePrice && (
                <p className="text-xs mt-0.5" style={{ color: "#059669" }}>
                  Profit: ৳{((Number(salePrice) - Number(item.purchasePrice)) * Number(qty)).toLocaleString()}
                </p>
              )}
            </div>
          )}
          <Field label="Notes"><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Customer name, repair ref" /></Field>
          {error && <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
          <SubmitBtn pending={mut.isPending} label={`Sell ${qty} unit${Number(qty) !== 1 ? "s" : ""}`} pendingLabel="Recording…" />
        </form>
      )}
    </ModalShell>
  );
}

// ─── Item Detail Sheet ────────────────────────────────────────────────────────
function ItemSheet({ item, suppliers, onClose, onEdit, onStockIn, onSell, onDelete }: {
  item: Item; suppliers: Supplier[];
  onClose: () => void; onEdit: () => void; onStockIn: () => void;
  onSell: () => void; onDelete: () => void;
}) {
  const qty = item.quantity;
  const min = item.minStock;
  const isLow = qty <= min;
  const supplierName = suppliers.find(s => s.id === item.supplierId)?.name ?? item.supplier ?? "—";

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: CARD }}>
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="font-bold text-base leading-tight">{item.partName}</h2>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>{item.quality ?? "—"} · {item.partType ?? "—"}</p>
          </div>
          <button onClick={onClose} style={{ color: MUTED }}><X className="w-5 h-5" /></button>
        </div>

        {/* Stock badge */}
        <div className="flex items-center gap-2 px-5 pb-4">
          <span className="text-2xl font-black">{qty}</span>
          <span className="text-sm font-semibold" style={{ color: MUTED }}>in stock</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full ml-1"
            style={isLow ? { background: "#FFF7E6", color: "#D97706" } : { background: "#ECFDF5", color: "#059669" }}>
            {isLow ? "⚠ Low Stock" : "✓ In Stock"}
          </span>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 px-5 mb-4">
          <button onClick={onStockIn}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm"
            style={{ background: PRIMARY, color: "#fff" }}>
            <ArrowDownToLine className="w-4 h-4" /> Stock In
          </button>
          <button onClick={onSell} disabled={qty === 0}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm disabled:opacity-40"
            style={{ border: `2px solid ${PRIMARY}`, color: PRIMARY }}>
            <ShoppingCart className="w-4 h-4" /> Sell
          </button>
        </div>

        {/* Info grid */}
        <div className="mx-5 mb-4 rounded-2xl divide-y" style={{ border: `1px solid ${BORDER}` }}>
          {[
            { label: "Supplier", value: supplierName },
            { label: "Purchase Price", value: item.purchasePrice ? `৳${Number(item.purchasePrice).toLocaleString()}` : "—" },
            { label: "Selling Price", value: item.sellingPrice ? `৳${Number(item.sellingPrice).toLocaleString()}` : "—" },
            { label: "Min Stock", value: String(item.minStock) },
            { label: "Barcode / SKU", value: item.barcode ?? item.sku ?? "—" },
            { label: "Model", value: item.model ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-4 py-3">
              <span className="text-xs" style={{ color: MUTED }}>{label}</span>
              <span className="text-xs font-semibold">{value}</span>
            </div>
          ))}
        </div>

        {/* Edit / Delete */}
        <div className="flex gap-3 px-5 pb-6">
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: "hsl(var(--muted))" }}>
            <Edit3 className="w-4 h-4" /> Edit
          </button>
          <button onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: "hsl(0 84% 60% / 0.08)", color: "hsl(var(--destructive))" }}>
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FAB Menu ─────────────────────────────────────────────────────────────────
type FabAction = "add-product" | "add-category" | "add-supplier" | "stock-in" | "sell";
const FAB_ITEMS: { action: FabAction; label: string; icon: React.ReactNode; color: string }[] = [
  { action: "add-product",  label: "Add Product",  icon: <Package className="w-4 h-4" />,       color: "#6366F1" },
  { action: "add-category", label: "Add Category", icon: <Tag className="w-4 h-4" />,            color: "#8B5CF6" },
  { action: "add-supplier", label: "Add Supplier", icon: <Truck className="w-4 h-4" />,          color: "#0EA5E9" },
  { action: "stock-in",     label: "Stock In",     icon: <ArrowDownToLine className="w-4 h-4" />, color: "#10B981" },
  { action: "sell",         label: "Record Sale",  icon: <ShoppingCart className="w-4 h-4" />,   color: "#F59E0B" },
];

function FABMenu({ onAction }: { onAction: (a: FabAction) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <div className="fixed right-5 z-50 flex flex-col items-end gap-2"
        style={{ bottom: "calc(6.25rem + env(safe-area-inset-bottom))" }}>
        {open && FAB_ITEMS.map(({ action, label, icon, color }) => (
          <button key={action}
            onClick={() => { setOpen(false); onAction(action); }}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shadow-lg text-white text-sm font-semibold whitespace-nowrap"
            style={{ background: color }}>
            {icon} {label}
          </button>
        ))}
        <button onClick={() => setOpen(o => !o)}
          className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform"
          style={{ background: PRIMARY, transform: open ? "rotate(45deg)" : "none" }}>
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Modal = "add-product" | "add-category" | "add-supplier" | "stock-in" | "sell" | "scanner" | null;

export default function Inventory() {
  const [modal, setModal] = useState<Modal>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | undefined>();
  const [showSheet, setShowSheet] = useState(false);
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["inventory"],
    queryFn: () => fetch("/api/inventory", { credentials: "include" }).then(r => r.json()),
  });
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: () => fetch("/api/suppliers", { credentials: "include" }).then(r => r.json()),
  });
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["inv-categories"],
    queryFn: () => fetch("/api/inventory-categories", { credentials: "include" }).then(r => r.json()),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => fetch(`/api/inventory/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); setShowSheet(false); },
  });

  // Barcode lookup
  const handleBarcodeDetect = useCallback(async (code: string) => {
    setModal(null);
    // Try lookup first
    const res = await fetch(`/api/inventory/barcode/${encodeURIComponent(code)}`, { credentials: "include" });
    if (res.ok) {
      const item = await res.json();
      setSelectedItem(item);
      setShowSheet(true);
    } else {
      // Not found — open add product with barcode pre-filled
      setSelectedItem({ partName: "", barcode: code } as any);
      setModal("add-product");
    }
  }, []);

  const list = Array.isArray(items) ? items : [];
  const filtered = list.filter(item => {
    const matchCat = activeCategory === "All" || item.partType === activeCategory ||
      categories.find(c => c.id === item.categoryId)?.name === activeCategory;
    const q = searchQ.toLowerCase();
    const matchSearch = !q ||
      (item.partName ?? "").toLowerCase().includes(q) ||
      (item.barcode ?? "").toLowerCase().includes(q) ||
      (item.sku ?? "").toLowerCase().includes(q) ||
      (item.model ?? "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const lowCount = list.filter(i => i.quantity <= i.minStock).length;

  // Category tabs: "All" + DB categories + fallback part types
  const catTabs = ["All", ...categories.map(c => c.name),
    ...["Display","Battery","IC","Connector","Camera","Speaker","Other"].filter(
      t => !categories.some(c => c.name === t) && list.some(i => i.partType === t)
    )];

  function openItemSheet(item: Item) { setSelectedItem(item); setShowSheet(true); }
  function handleFAB(action: FabAction) {
    if (action === "stock-in" || action === "sell") { setSelectedItem(undefined); }
    setModal(action);
  }

  return (
    <ProtectedPage>
      <div className="space-y-3 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-extrabold">Inventory</h1>
            <p className="text-xs" style={{ color: MUTED }}>{list.length} products</p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full" style={{ background: "hsl(var(--muted))" }}>
            <button className="px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5" style={{ background: PRIMARY }}>
              <Boxes className="w-3.5 h-3.5" /> Inventory
            </button>
            <Link href="/pos">
              <button className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5" style={{ color: MUTED }}>
                <ShoppingCart className="w-3.5 h-3.5" /> POS
              </button>
            </Link>
          </div>
          <FABMenu onAction={handleFAB} />
        </div>

        {/* Low stock banner */}
        {lowCount > 0 && (
          <div className="flex items-center gap-3 p-3.5 rounded-2xl"
            style={{ background: "hsl(0 84% 60% / 0.08)", border: "1px solid hsl(0 84% 60% / 0.2)" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--destructive))" }} />
            <p className="text-xs font-semibold flex-1" style={{ color: "hsl(var(--destructive))" }}>
              {lowCount} item{lowCount !== 1 ? "s" : ""} below minimum stock
            </p>
          </div>
        )}

        {/* Search + scan */}
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Search name, barcode, SKU…"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm outline-none"
              style={{ borderColor: BORDER, background: CARD }} />
          </div>
          <button onClick={() => setModal("scanner")}
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: CARD, border: `1px solid ${BORDER}`, color: PRIMARY }}
            title="Scan barcode or QR code">
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {catTabs.map(t => (
            <button key={t} onClick={() => setActiveCategory(t)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
              style={t === activeCategory
                ? { background: PRIMARY, color: "#fff" }
                : { background: CARD, color: MUTED, border: `1px solid ${BORDER}` }}>
              {t}
            </button>
          ))}
        </div>

        {/* Item list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 mx-auto mb-3" style={{ color: MUTED }} />
            <p className="font-semibold">No products found</p>
            <p className="text-sm mt-1" style={{ color: MUTED }}>
              {list.length === 0 ? "Tap + to add your first product" : "Try a different search or filter"}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border divide-y overflow-hidden" style={{ borderColor: BORDER, background: CARD }}>
            {filtered.map(item => {
              const qty = item.quantity;
              const isLow = qty <= item.minStock;
              const supplierName = suppliers.find(s => s.id === item.supplierId)?.name ?? item.supplier;
              return (
                <button key={item.id} onClick={() => openItemSheet(item)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(var(--muted))" }}>
                    <Package className="w-4 h-4" style={{ color: MUTED }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.partName}</p>
                    <p className="text-xs truncate" style={{ color: MUTED }}>
                      {item.quality ?? "—"} · {item.partType ?? "—"}
                      {supplierName && <span> · {supplierName}</span>}
                    </p>
                    {item.barcode && <p className="text-xs mt-0.5 font-mono" style={{ color: MUTED }}>{item.barcode}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-sm font-black">{qty}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={isLow ? { background: "#FFF7E6", color: "#D97706" } : { background: "#ECFDF5", color: "#059669" }}>
                      {isLow ? "Low" : "OK"}
                    </span>
                    {item.sellingPrice && (
                      <span className="text-[10px] font-semibold" style={{ color: MUTED }}>৳{Number(item.sellingPrice).toLocaleString()}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Barcode scanner */}
      {modal === "scanner" && (
        <BarcodeScanner onClose={() => setModal(null)} onDetect={handleBarcodeDetect} />
      )}

      {/* Add / Edit product */}
      {modal === "add-product" && (
        <AddProductModal suppliers={suppliers} categories={categories}
          existing={selectedItem?.id ? selectedItem : (selectedItem?.barcode ? { ...selectedItem, id: 0 } as any : undefined)}
          onClose={() => { setModal(null); setSelectedItem(undefined); }} />
      )}

      {/* Add category */}
      {modal === "add-category" && <AddCategoryModal onClose={() => setModal(null)} />}

      {/* Add supplier */}
      {modal === "add-supplier" && <AddSupplierModal onClose={() => setModal(null)} />}

      {/* Stock In */}
      {modal === "stock-in" && (
        <StockInModal item={selectedItem} suppliers={suppliers} allItems={list}
          onClose={() => { setModal(null); setSelectedItem(undefined); }} />
      )}

      {/* Sell / POS */}
      {modal === "sell" && (
        <SellModal item={selectedItem} allItems={list}
          onClose={() => { setModal(null); setSelectedItem(undefined); }} />
      )}

      {/* Item detail sheet */}
      {showSheet && selectedItem && (
        <ItemSheet item={selectedItem} suppliers={suppliers}
          onClose={() => { setShowSheet(false); setSelectedItem(undefined); }}
          onEdit={() => { setShowSheet(false); setModal("add-product"); }}
          onStockIn={() => { setShowSheet(false); setModal("stock-in"); }}
          onSell={() => { setShowSheet(false); setModal("sell"); }}
          onDelete={() => { if (confirm(`Delete "${selectedItem.partName}"?`)) deleteMut.mutate(selectedItem.id); }} />
      )}
    </ProtectedPage>
  );
}
