import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import {
  Plus, Search, Package, X, AlertCircle, ScanLine, ChevronRight,
  Tag, Truck, ArrowDownToLine, ShoppingCart, Edit3, Trash2,
  QrCode, CheckCircle, ArrowUpFromLine, MoreVertical, Boxes, Settings,
  FolderOpen, ChevronDown, Users2,
} from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";
import { useAuth } from "@/context/auth-context";
import { localInventory } from "@/lib/local-store";
import { getLocalYMD } from "@/lib/date-utils";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD:"$",EUR:"€",GBP:"£",BDT:"Tk",INR:"₹",PKR:"₨",NPR:"रू",LKR:"Rs",AED:"د.إ",
  SAR:"﷼",MYR:"RM",SGD:"S$",THB:"฿",IDR:"Rp",PHP:"₱",NGN:"₦",KES:"KSh",GHS:"₵",
  ZAR:"R",TRY:"₺",CAD:"C$",AUD:"A$",JPY:"¥",CNY:"¥",KRW:"₩",HKD:"HK$",TWD:"NT$",
  CHF:"Fr",SEK:"kr",NOK:"kr",DKK:"kr",PLN:"zł",CZK:"Kč",HUF:"Ft",RON:"lei",
  BGN:"лв",HRK:"kn",RSD:"din",UAH:"₴",RUB:"₽",BRL:"R$",MXN:"$",ARS:"$",CLP:"$",
  COP:"$",PEN:"S/",VES:"Bs",UYU:"$U",GTQ:"Q",HNL:"L",CRC:"₡",DOP:"RD$",CUP:"$",
  JMD:"J$",TTD:"TT$",BBD:"Bds$",BSD:"B$",BZD:"BZ$",GYD:"G$",SRD:"$",PAB:"B/.",
  BOB:"Bs",PYG:"₲",EGP:"£",MAD:"د.م.",DZD:"دج",TND:"د.ت",LYD:"ل.د",SDG:"ج.س.",
  IQD:"ع.د",SYP:"£",JOD:"JD",LBP:"ل.ل",OMR:"ر.ع.",KWD:"د.ك",BHD:"BD",QAR:"﷼",
  YER:"﷼",ILS:"₪",IRR:"﷼",AFN:"؋",UZS:"so'm",KZT:"₸",AZN:"₼",GEL:"₾",AMD:"֏",
  TJS:"SM",KGS:"лв",TMT:"T",MNT:"₮",VND:"₫",KHR:"៛",LAK:"₭",MMK:"K",BND:"B$",
  MOP:"P",FJD:"FJ$",PGK:"K",SBD:"SI$",VUV:"VT",WST:"WS$",TOP:"T$",XPF:"Fr",
  XOF:"Fr",XAF:"Fr",GNF:"Fr",MGA:"Ar",MZN:"MT",ZMW:"ZK",MWK:"MK",BWP:"P",
  SZL:"L",LSL:"L",NAD:"N$",ZWL:"Z$",SCR:"SR",MUR:"Rs",MVR:"Rf",BTN:"Nu",
  UGX:"USh",TZS:"TSh",ETB:"Br",DJF:"Fdj",
  SOS:"Sh",KMF:"Fr",MRU:"UM",SLL:"Le",GMD:"D",HTG:"G",NIO:"C$",
};

// ─── Currency formatter ───────────────────────────────────────────────────────
// Works for all currencies: RTL symbols (AED, MAD…), multi-char symbols,
// and large values. Uses Intl.NumberFormat compact notation when available.
function fmtValue(currencyCode: string, value: number): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    // Fallback: manual compact with symbol from the map
    const sym = CURRENCY_SYMBOLS[currencyCode] ?? currencyCode;
    if (value >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000)     return `${sym}${(value / 1_000).toFixed(1)}K`;
    return `${sym}${value.toLocaleString()}`;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type Item = {
  id: number; partName: string; partType?: string; quality?: string;
  quantity: number; minStock: number; sellingPrice?: string | number;
  purchasePrice?: string | number; supplierId?: number; categoryId?: number;
  barcode?: string; sku?: string; supplier?: string; notes?: string;
  model?: string; brand?: string; shelfLocation?: string;
};
export type Supplier = { id: number; name: string; phone?: string; whatsapp?: string; partTypes?: string; isActive: boolean; };
export type Category = { id: number; name: string; description?: string; color?: string; icon?: string; parentId?: number; };

// ─── Shared helpers ────────────────────────────────────────────────────────────
export const PRIMARY = "hsl(var(--primary))";
export const MUTED = "hsl(var(--muted-foreground))";
export const BORDER = "hsl(var(--border))";
export const BG = "hsl(var(--background))";
export const CARD = "hsl(var(--card))";

export function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col"
        style={{ background: CARD, maxHeight: "85vh" }}>
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
export function BarcodeScanner({ onDetect, onClose }: { onDetect: (code: string) => void; onClose: () => void }) {
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
            <style>{`@keyframes invScan2{0%,100%{top:8%}50%{top:86%}} .inv-sl{position:absolute;left:0;right:0;height:3px;animation:invScan2 1.8s ease-in-out infinite;background:linear-gradient(90deg,transparent 0%,#22d3ee 20%,#fff 50%,#22d3ee 80%,transparent 100%);box-shadow:0 0 12px 3px #22d3ee,0 0 6px 1px #fff;border-radius:2px;}`}</style>
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            {/* Dark edges, clear centre */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, transparent 30%, rgba(0,0,0,0.72) 100%)" }} />
            {/* Viewfinder */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative" style={{ width: "76%", aspectRatio: "3/2" }}>
                {/* Faint inner outline */}
                <div className="absolute inset-0 rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.18)" }} />
                {([
                  { top:0, left:0, borderTop:"3px solid #22d3ee", borderLeft:"3px solid #22d3ee", borderRadius:"6px 0 0 0" },
                  { top:0, right:0, borderTop:"3px solid #22d3ee", borderRight:"3px solid #22d3ee", borderRadius:"0 6px 0 0" },
                  { bottom:0, left:0, borderBottom:"3px solid #22d3ee", borderLeft:"3px solid #22d3ee", borderRadius:"0 0 0 6px" },
                  { bottom:0, right:0, borderBottom:"3px solid #22d3ee", borderRight:"3px solid #22d3ee", borderRadius:"0 0 6px 0" },
                ] as const).map((s, i) => <div key={i} className="absolute" style={{ ...s, width:28, height:28 }} />)}
                <div className="inv-sl" />
              </div>
            </div>
            {scanning && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/75 text-white text-xs px-2.5 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />Scanning…
              </div>
            )}
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
export function AddProductModal({ onClose, existing, suppliers, categories, allItems }: {
  onClose: () => void; existing?: Item; suppliers: Supplier[]; categories: Category[]; allItems?: Item[];
}) {
  const qc = useQueryClient();
  const isEdit = !!(existing && existing.id > 0);

  // Split existing categoryId into parent + sub for two-step UX
  const existingCat = existing?.categoryId ? categories.find(c => c.id === existing.categoryId) : undefined;
  const initParentId = existingCat
    ? (existingCat.parentId ? String(existingCat.parentId) : String(existingCat.id))
    : "";
  const initSubId = existingCat?.parentId ? String(existingCat.id) : "";

  const [parentCatId, setParentCatId] = useState(initParentId);
  const [subCatId, setSubCatId] = useState(initSubId);

  const [form, setForm] = useState({
    partName: existing?.partName ?? "",
    quality: existing?.quality ?? "",
    brand: existing?.brand ?? "",
    quantity: String(existing?.quantity ?? ""),
    minStock: existing ? String(existing.minStock) : "",
    purchasePrice: String(existing?.purchasePrice ?? ""),
    sellingPrice: String(existing?.sellingPrice ?? ""),
    supplierId: String(existing?.supplierId ?? ""),
    barcode: existing?.barcode ?? "",
    sku: existing?.sku ?? "",
    model: existing?.model ?? "",
    notes: existing?.notes ?? "",
    shelfLocation: existing?.shelfLocation ?? "",
  });
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  // Parent categories only; sub-categories of selected parent
  const parentCats = categories.filter(c => !c.parentId);
  const subCats = parentCatId ? categories.filter(c => c.parentId === Number(parentCatId)) : [];
  const finalCategoryId = subCatId || parentCatId;

  const { user: addProductUser } = useAuth();
  const isAddProductFree = addProductUser?.plan === "Free" || !addProductUser?.plan;

  const mut = useMutation({
    mutationFn: async () => {
      const body = {
        ...form,
        partName: form.partName,
        partType: form.partType ?? "General",
        quantity: Number(form.quantity) || 0,
        minStock: Number(form.minStock),
        supplierId: form.supplierId ? Number(form.supplierId) : null,
        categoryId: finalCategoryId ? Number(finalCategoryId) : null,
      };

      // ── Free plan: local storage ────────────────────────────────────────────
      if (isAddProductFree && addProductUser?.id) {
        const uid = addProductUser.id;
        return isEdit
          ? localInventory.update(uid, existing!.id, body)
          : localInventory.create(uid, body);
      }

      // ── Pro plan: server ────────────────────────────────────────────────────
      const url = isEdit ? `/api/inventory/${existing!.id}` : `/api/inventory`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); onClose(); },
    onError: (err: any) => setError(err.message),
  });

  function handleSubmit() {
    setError("");
    // ── Barcode / SKU duplicate check ───────────────────────────────────────
    if (allItems) {
      const others = allItems.filter(i => i.id !== (existing?.id ?? 0));
      if (form.barcode.trim()) {
        const clash = others.find(i => (i.barcode ?? "").trim().toLowerCase() === form.barcode.trim().toLowerCase());
        if (clash) { setError(`Barcode already used by "${clash.partName}"`); return; }
      }
      if (form.sku.trim()) {
        const clash = others.find(i => (i.sku ?? "").trim().toLowerCase() === form.sku.trim().toLowerCase());
        if (clash) { setError(`SKU already used by "${clash.partName}"`); return; }
      }
    }
    mut.mutate();
  }

  if (showScanner) return (
    <BarcodeScanner onClose={() => setShowScanner(false)}
      onDetect={code => { set("barcode", code); setShowScanner(false); }} />
  );

  return (
    <ModalShell title={isEdit ? "Edit Product" : "Add Product"} onClose={onClose}>
      <form onSubmit={e => {
        e.preventDefault();
        if (!form.partName) { setError("Product name required"); return; }
        if (!form.quality) { setError("Please select a quality"); return; }
        mut.mutate();
      }}
        className="flex flex-col gap-3">
        <Field label="Product Name *">
          <Input value={form.partName} onChange={e => set("partName", e.target.value)} placeholder="Enter product name" required />
        </Field>
        <Field label="Category">
          <Select value={parentCatId} onChange={e => { setParentCatId(e.target.value); setSubCatId(""); }}>
            <option value="">— Select category —</option>
            {parentCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        {subCats.length > 0 && (
          <Field label="Sub-category">
            <Select value={subCatId} onChange={e => setSubCatId(e.target.value)}>
              <option value="">— No sub-category —</option>
              {subCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        )}
        {/* Supplier only shown when editing — for new products use Supplier Ledger */}
        {isEdit && (
          <Field label="Supplier">
            <Select value={form.supplierId} onChange={e => set("supplierId", e.target.value)}>
              <option value="">— No supplier —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Quality *">
          <Select value={form.quality} onChange={e => set("quality", e.target.value)} required>
            <option value="">— Select Quality —</option>
            {["Brand New","Original","OEM","Copy","Refurbished","Used","Reconditioned"].map(q => <option key={q} value={q}>{q}</option>)}
          </Select>
        </Field>
        <Field label="Brand / Company">
          <Input value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="e.g. Samsung, Apple, Huawei…" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          {/* Quantity only in edit mode — initial stock is set via Stock In */}
          {isEdit
            ? <Field label="Quantity"><Input type="number" min="0" value={form.quantity} onChange={e => set("quantity", e.target.value)} placeholder="0" /></Field>
            : <Field label="Min Stock Alert"><Input type="number" min="0" value={form.minStock} onChange={e => set("minStock", e.target.value)} placeholder="" /></Field>
          }
          {isEdit
            ? <Field label="Min Stock Alert"><Input type="number" min="0" value={form.minStock} onChange={e => set("minStock", e.target.value)} placeholder="" /></Field>
            : <Field label="Selling Price"><Input type="text" inputMode="decimal" value={form.sellingPrice} onChange={e => set("sellingPrice", e.target.value)} placeholder="0.00" /></Field>
          }
          {/* Edit mode: show purchase + selling price */}
          {isEdit && (
            <>
              <Field label="Purchase Price"><Input type="text" inputMode="decimal" value={form.purchasePrice} onChange={e => set("purchasePrice", e.target.value)} placeholder="0.00" /></Field>
              <Field label="Selling Price"><Input type="text" inputMode="decimal" value={form.sellingPrice} onChange={e => set("sellingPrice", e.target.value)} placeholder="0.00" /></Field>
            </>
          )}
        </div>
        {/* Hint for new products */}
        {!isEdit && (
          <p className="text-xs px-1" style={{ color: MUTED }}>
            💡 Stock quantity &amp; purchase price are recorded per batch via <strong>Stock In</strong>
          </p>
        )}
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
        <Field label="Shelf / Location"><Input value={form.shelfLocation} onChange={e => set("shelfLocation", e.target.value)} placeholder="e.g. A-2, Row 3, Shelf B" /></Field>
        <Field label="Notes"><Input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Optional notes" /></Field>
        {error && (
          <p className="text-xs text-center" style={{ color: "hsl(var(--destructive))" }}>{error}</p>
        )}
        <button type="button" disabled={mut.isPending}
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 mt-1"
          style={{ background: "hsl(var(--primary))" }}>
          {mut.isPending ? "Saving…" : existing ? "Save Changes" : "Add Product"}
        </button>
      </form>
    </ModalShell>
  );
}

// ─── Add / Edit Category Modal ───────────────────────────────────────────────
// mode: "category" = top-level, "subcategory" = needs parent selection, "edit" = editing existing
function CategoryModal({ onClose, existing, mode, parentCategories, initialParentId }: {
  onClose: () => void;
  existing?: Category;
  mode: "category" | "subcategory" | "edit";
  parentCategories?: Category[]; // all top-level categories (for sub-cat parent selector)
  initialParentId?: number;      // pre-select a parent (e.g. from chip row)
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(existing?.name ?? "");
  const [desc, setDesc] = useState(existing?.description ?? "");
  const [selectedParent, setSelectedParent] = useState<string>(
    initialParentId != null ? String(initialParentId) :
    (existing?.parentId ? String(existing.parentId) : "")
  );
  const [error, setError] = useState("");

  const resolvedParentId = mode === "subcategory"
    ? (selectedParent ? Number(selectedParent) : null)
    : mode === "edit"
      ? (existing?.parentId ?? null)
      : null;

  const mut = useMutation({
    mutationFn: async () => {
      const url = mode === "edit" ? `/api/inventory-categories/${existing!.id}` : "/api/inventory-categories";
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: desc.trim() || null, parentId: resolvedParentId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inv-categories"] }); onClose(); },
    onError: (e: any) => setError(e.message),
  });

  const title = mode === "edit"
    ? (existing?.parentId ? "Edit Sub-category" : "Edit Category")
    : mode === "subcategory" ? "Add Sub-category" : "Add Category";

  return (
    <ModalShell title={title} onClose={onClose}>
      <form onSubmit={e => {
        e.preventDefault();
        if (!name.trim()) { setError("Name required"); return; }
        if (mode === "subcategory" && !selectedParent) { setError("Select a parent category"); return; }
        mut.mutate();
      }} className="flex flex-col gap-3">
        {/* Parent selector for sub-category mode */}
        {mode === "subcategory" && parentCategories && (
          <Field label="Parent Category *">
            <Select value={selectedParent} onChange={e => setSelectedParent(e.target.value)}>
              <option value="">— Select parent —</option>
              {parentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        )}
        {/* Show locked parent for edit mode */}
        {mode === "edit" && existing?.parentId && parentCategories && (
          <div className="px-3 py-2 rounded-xl text-xs" style={{ background: "hsl(var(--muted))" }}>
            Sub-category of: <span className="font-semibold">
              {parentCategories.find(c => c.id === existing.parentId)?.name ?? "—"}
            </span>
          </div>
        )}
        <Field label={mode === "subcategory" ? "Sub-category Name *" : "Category Name *"}>
          <Input value={name} onChange={e => setName(e.target.value)}
            placeholder={mode === "subcategory" ? "e.g. Display" : "e.g. Spare Parts"} autoFocus />
        </Field>
        <Field label="Description">
          <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional" />
        </Field>
        {error && <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
        <SubmitBtn pending={mut.isPending}
          label={mode === "edit" ? "Save Changes" : mode === "subcategory" ? "Add Sub-category" : "Add Category"} />
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
          <Field label="Phone"><Input value={f.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 555 000 0000" type="tel" /></Field>
          <Field label="WhatsApp"><Input value={f.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="+1 555 000 0000" type="tel" /></Field>
        </div>
        <Field label="Supplies (part types)"><Input value={f.partTypes} onChange={e => set("partTypes", e.target.value)} placeholder="Display, Battery, IC…" /></Field>
        <Field label="Notes"><Input value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Optional" /></Field>
        {error && <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
        <SubmitBtn pending={mut.isPending} label="Add Supplier" />
      </form>
    </ModalShell>
  );
}

// ─── Stock In Modal (multi-item invoice) ─────────────────────────────────────
type StockInLine = {
  _key: string; item?: Item;
  search: string; showDrop: boolean;
  qty: string; unitPrice: string; shelf: string;
};
function newStockLine(item?: Item): StockInLine {
  return {
    _key: Math.random().toString(36).slice(2),
    item, search: item?.partName ?? "", showDrop: false,
    qty: "1", unitPrice: item?.purchasePrice ? String(item.purchasePrice) : "",
    shelf: item?.shelfLocation ?? "",
  };
}

function StockInModal({ onClose, item: initialItem, suppliers, allItems, categories = [] }: {
  onClose: () => void; item?: Item; suppliers: Supplier[]; allItems: Item[]; categories?: Category[];
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const sym = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? "Tk";
  const today = getLocalYMD();
  const isFreePlan = user?.plan === "Free" || !user?.plan;

  const [invoiceNo, setInvoiceNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [supplierId, setSupplierId] = useState(String(initialItem?.supplierId ?? ""));
  const [paidNow, setPaidNow] = useState("0");
  const [recordLedger, setRecordLedger] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [lines, setLines] = useState<StockInLine[]>(initialItem ? [newStockLine(initialItem)] : []);

  const [universalSearch, setUniversalSearch] = useState("");
  const [showUniversalDrop, setShowUniversalDrop] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const supplierName = suppliers.find(s => String(s.id) === supplierId)?.name;
  const invoiceTotal = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0);
  const dueAmt = Math.max(0, invoiceTotal - (Number(paidNow) || 0));
  const validLines = lines.filter(l => l.item && Number(l.qty) > 0);

  const patchLine = (key: string, patch: Partial<StockInLine>) =>
    setLines(prev => prev.map(l => l._key === key ? { ...l, ...patch } : l));

  const addItemToLines = (i: Item) => {
    setLines(prev => {
      const idx = prev.findIndex(l => l.item?.id === i.id);
      if (idx !== -1) {
        return prev.map((l, index) =>
          index === idx ? { ...l, qty: String((Number(l.qty) || 0) + 1) } : l
        );
      }
      return [
        ...prev,
        {
          _key: Math.random().toString(36).slice(2),
          item: i,
          search: i.partName,
          showDrop: false,
          qty: "1",
          unitPrice: i.purchasePrice ? String(i.purchasePrice) : "",
          shelf: i.shelfLocation ?? "",
        },
      ];
    });
    setUniversalSearch("");
    setShowUniversalDrop(false);
    setError("");
  };

  const handleScanDetect = (code: string) => {
    setShowScanner(false);
    const clean = code.trim().toLowerCase();
    const found = allItems.find(i =>
      (i.barcode ?? "").toLowerCase() === clean ||
      (i.sku ?? "").toLowerCase() === clean ||
      i.partName.toLowerCase() === clean
    );
    if (found) {
      addItemToLines(found);
      setError("");
    } else {
      setUniversalSearch(code);
      setShowUniversalDrop(true);
      setError(`No product found matching "${code}". Try selecting manually.`);
    }
  };

  const mut = useMutation({
    mutationFn: async () => {
      if (validLines.length === 0) throw new Error("Search and select at least one product");

      // Free-plan users keep inventory locally.
      if (isFreePlan && user?.id) {
        for (const l of validLines) {
          localInventory.update(user.id, l.item!.id, {
            ...l.item,
            quantity: Number(l.item!.quantity || 0) + Number(l.qty),
            purchasePrice: l.unitPrice || l.item!.purchasePrice || null,
            supplierId: supplierId ? Number(supplierId) : l.item!.supplierId ?? null,
            supplier: supplierName ?? l.item!.supplier ?? null,
            shelfLocation: l.shelf.trim() || l.item!.shelfLocation || null,
          });
        }
        return { ok: true };
      }

      if (supplierId && recordLedger) {
        // Invoice endpoint — atomically updates stock + ledger in one transaction
        const res = await fetch("/api/supplier-purchases/invoice", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplierId: Number(supplierId),
            supplierName: supplierName ?? null,
            invoiceNumber: invoiceNo.trim() || null,
            purchaseDate,
            paidAmount: Number(paidNow) || 0,
            notes: invoiceNo.trim() ? `Invoice #${invoiceNo.trim()}` : null,
            items: validLines.map(l => ({
              inventoryId: l.item!.id,
              productName: l.item!.partName,
              quantity: Number(l.qty),
              unitPrice: Number(l.unitPrice) || 0,
            })),
          }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "Failed");
        return d;
      } else {
        // No supplier: just stock movements (no ledger)
        for (const l of validLines) {
          const res = await fetch("/api/stock-movements", {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inventoryId: l.item!.id, type: "in",
              quantity: Number(l.qty),
              unitPrice: l.unitPrice || null,
              totalPrice: l.unitPrice ? String(Number(l.qty) * Number(l.unitPrice)) : null,
              notes: invoiceNo.trim() ? `Invoice #${invoiceNo.trim()}` : null,
            }),
          });
          const d = await res.json();
          if (!res.ok) throw new Error(d.error ?? "Failed");
        }
        return { ok: true };
      }
    },
    onSuccess: async () => {
      // Update shelf locations for lines where a shelf was entered
      const shelfLines = validLines.filter(l => l.shelf.trim());
      for (const l of shelfLines) {
        try {
          await fetch(`/api/inventory/${l.item!.id}`, {
            method: "PUT", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              partName: l.item!.partName,
              partType: l.item!.partType ?? "Other",
              brand: l.item!.brand,
              model: l.item!.model,
              quality: l.item!.quality,
              quantity: l.item!.quantity + Number(l.qty),
              minStock: l.item!.minStock,
              purchasePrice: l.item!.purchasePrice,
              sellingPrice: l.item!.sellingPrice,
              supplierId: l.item!.supplierId,
              categoryId: l.item!.categoryId,
              barcode: l.item!.barcode,
              sku: l.item!.sku,
              supplier: l.item!.supplier,
              shelfLocation: l.shelf.trim(),
              notes: l.item!.notes,
            }),
          });
        } catch {}
      }
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
      if (supplierId && recordLedger) {
        qc.invalidateQueries({ queryKey: ["supplier-purchases"] });
        qc.invalidateQueries({ queryKey: ["supplier-balance"] });
        qc.invalidateQueries({ queryKey: ["suppliers-balances"] });
      }
      setSuccess(true);
      setTimeout(onClose, 1400);
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <ModalShell title="Stock In" onClose={onClose}>
      {success ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "#10B981" }} />
          <p className="font-bold">{validLines.length > 1 ? `${validLines.length} items added!` : "Stock added!"}</p>
          {supplierId && recordLedger && (
            <p className="text-xs mt-1" style={{ color: MUTED }}>Invoice saved to supplier ledger</p>
          )}
        </div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); setError(""); mut.mutate(); }} className="flex flex-col gap-3">
          {/* Invoice header */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Invoice # (optional)">
              <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="e.g. INV-001" />
            </Field>
            <Field label="Date">
              <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Supplier">
            <Select value={supplierId} onChange={e => {
              setSupplierId(e.target.value);
              setRecordLedger(!!e.target.value);
            }}>
              <option value="">— No supplier —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>

          {/* Line items section */}
          <div>
            {/* Universal Search Bar, Scanner & Add Product Button */}
            <div className="relative mb-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search product…"
                    value={universalSearch}
                    onChange={e => { setUniversalSearch(e.target.value); setShowUniversalDrop(true); setError(""); }}
                    onFocus={() => setShowUniversalDrop(true)}
                    className="pr-16"
                  />
                  {universalSearch && (
                    <button
                      type="button"
                      onClick={() => { setUniversalSearch(""); setShowUniversalDrop(false); }}
                      className="absolute right-9 top-1/2 -translate-y-1/2 p-1"
                      style={{ color: MUTED }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: `${PRIMARY}15`, color: PRIMARY }}
                    title="Scan Barcode / QR Code"
                  >
                    <ScanLine className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(true)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-opacity hover:opacity-90 active:scale-95"
                  style={{ background: PRIMARY, color: "#fff" }}
                  title="Add New Product"
                >
                  <div className="relative flex items-center justify-center">
                    <Package className="w-4 h-4" />
                    <Plus className="w-3 h-3 absolute -top-1.5 -right-1.5 stroke-[3]" />
                  </div>
                </button>
              </div>

              {/* Universal Search Dropdown */}
              {showUniversalDrop && universalSearch.trim() && (() => {
                const q = universalSearch.trim().toLowerCase();
                const hits = allItems.filter(i =>
                  i.partName.toLowerCase().includes(q) ||
                  (i.barcode ?? "").toLowerCase().includes(q) ||
                  (i.sku ?? "").toLowerCase().includes(q) ||
                  (i.brand ?? "").toLowerCase().includes(q) ||
                  (i.model ?? "").toLowerCase().includes(q)
                ).slice(0, 8);

                return hits.length > 0 ? (
                  <div
                    className="absolute top-full left-0 right-0 z-30 mt-1 rounded-xl border shadow-xl overflow-hidden max-h-60 overflow-y-auto"
                    style={{ background: CARD, borderColor: BORDER }}
                  >
                    {hits.map(i => {
                      const existing = lines.find(l => l.item?.id === i.id);
                      return (
                        <button
                          key={i.id}
                          type="button"
                          onMouseDown={() => addItemToLines(i)}
                          className="w-full text-left px-3 py-2 text-sm border-b last:border-0 hover:bg-muted/40 flex items-center justify-between"
                          style={{ borderColor: BORDER }}
                        >
                          <div>
                            <p className="font-semibold text-sm">{i.partName}</p>
                            <p className="text-xs" style={{ color: MUTED }}>
                              Stock: {i.quantity} {i.barcode ? `· Barcode: ${i.barcode}` : ""}
                            </p>
                          </div>
                          {existing ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981" }}>
                              Added ({existing.qty})
                            </span>
                          ) : (
                            <span className="text-xs font-semibold" style={{ color: PRIMARY }}>
                              + Add
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className="absolute top-full left-0 right-0 z-30 mt-1 rounded-xl border shadow-xl p-3 text-xs text-center flex flex-col items-center gap-2"
                    style={{ background: CARD, borderColor: BORDER, color: MUTED }}
                  >
                    <span>No products found matching "{universalSearch}"</span>
                    <button
                      type="button"
                      onMouseDown={() => { setShowUniversalDrop(false); setShowAddProduct(true); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                      style={{ background: PRIMARY }}
                    >
                      + Create Product Now
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* List of selected items */}
            {lines.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-center text-xs" style={{ borderColor: BORDER, color: MUTED }}>
                Search or scan product above to add to stock
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {lines.map((line) => (
                  <div key={line._key} className="rounded-xl border p-3 space-y-2" style={{ borderColor: BORDER }}>
                    <div className="flex items-center justify-between min-w-0">
                      <p className="text-sm font-semibold truncate">{line.item?.partName}</p>
                      <p className="text-xs flex-shrink-0 ml-2" style={{ color: MUTED }}>Stock: {line.item?.quantity ?? 0}</p>
                    </div>

                    {/* Qty, Price, Delete on ONE line */}
                    <div className="flex items-end gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] mb-1 font-medium" style={{ color: MUTED }}>Qty *</p>
                        <Input type="number" min="1" value={line.qty}
                          onChange={e => patchLine(line._key, { qty: e.target.value })} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] mb-1 font-medium" style={{ color: MUTED }}>Unit Price</p>
                        <Input type="text" inputMode="decimal" value={line.unitPrice}
                          onChange={e => patchLine(line._key, { unitPrice: e.target.value })}
                          placeholder="0.00" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setLines(prev => prev.filter(l => l._key !== line._key))}
                        className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "#FEF2F2", color: "#EF4444" }}
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invoice total */}
          {invoiceTotal > 0 && (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: "hsl(var(--muted))" }}>
              <span>Invoice Total</span>
              <span style={{ color: PRIMARY }}>{sym}{invoiceTotal.toLocaleString()}</span>
            </div>
          )}

          {/* Supplier ledger section */}
          {supplierId && invoiceTotal > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
              <label className="flex items-center gap-3 px-3.5 py-3 cursor-pointer">
                <input type="checkbox" checked={recordLedger}
                  onChange={e => setRecordLedger(e.target.checked)} />
                <span className="text-sm font-medium">Record to Supplier Ledger</span>
              </label>
              {recordLedger && (
                <div className="px-3.5 pb-3 pt-2 border-t" style={{ borderColor: BORDER }}>
                  <Field label="Paid Now">
                    <Input type="text" inputMode="decimal" value={paidNow}
                      onChange={e => setPaidNow(e.target.value)} placeholder="0.00" />
                  </Field>
                  {dueAmt > 0 && (
                    <p className="text-xs mt-1.5 font-medium" style={{ color: "#F59E0B" }}>
                      Due to supplier: {sym}{dueAmt.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs font-medium" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
          <SubmitBtn pending={mut.isPending}
            label={validLines.length > 1 ? `Add ${validLines.length} Items to Stock` : "Add to Stock"}
            pendingLabel="Adding…" />
        </form>
      )}

      {showScanner && (
        <BarcodeScanner
          onDetect={handleScanDetect}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showAddProduct && (
        <AddProductModal
          suppliers={suppliers}
          categories={categories}
          onClose={() => setShowAddProduct(false)}
          onCreated={(newItem) => {
            setShowAddProduct(false);
            if (newItem) {
              addItemToLines(newItem);
            }
          }}
        />
      )}
    </ModalShell>
  );
}

// ─── Sell / POS Modal ─────────────────────────────────────────────────────────
function SellModal({ onClose, item: initialItem, allItems }: { onClose: () => void; item?: Item; allItems: Item[] }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const sym = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? "Tk";
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
                        {i.sellingPrice && <span className="text-xs ml-2 font-bold" style={{ color: PRIMARY }}>{sym}{Number(i.sellingPrice).toLocaleString()}</span>}
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
            <Field label="Sale Price">
              <Input type="text" inputMode="decimal" value={salePrice} onChange={e => setSalePrice(e.target.value)} />
            </Field>
          </div>
          {qty && salePrice && (
            <div className="p-3 rounded-xl" style={{ background: "#ECFDF5" }}>
              <p className="text-sm font-bold" style={{ color: "#059669" }}>
                Total: {sym}{(Number(qty) * Number(salePrice)).toLocaleString()}
              </p>
              {item?.purchasePrice && (
                <p className="text-xs mt-0.5" style={{ color: "#059669" }}>
                  Profit: {sym}{((Number(salePrice) - Number(item.purchasePrice)) * Number(qty)).toLocaleString()}
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
function ItemSheet({ item, suppliers, onClose, onEdit, onStockIn, onDelete }: {
  item: Item; suppliers: Supplier[];
  onClose: () => void; onEdit: () => void; onStockIn: () => void;
  onDelete: () => void;
}) {
  const { user } = useAuth();
  const sym = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? "Tk";
  const qty = item.quantity;
  const min = item.minStock;
  const isOut = qty === 0;
  const isLow = !isOut && min > 0 && qty <= min;
  const supplierName = suppliers.find(s => s.id === item.supplierId)?.name ?? item.supplier ?? "—";

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl shadow-2xl overflow-y-auto"
        style={{ background: CARD, maxHeight: "calc(85vh - env(safe-area-inset-bottom, 0px))", WebkitOverflowScrolling: "touch" as any, touchAction: "pan-y" }}>
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
            style={isOut
              ? { background: "#FEF2F2", color: "#DC2626" }
              : isLow
                ? { background: "#FFF7E6", color: "#D97706" }
                : { background: "#ECFDF5", color: "#059669" }}>
            {isOut ? "✕ Out of Stock" : isLow ? "⚠ Low Stock" : "✓ In Stock"}
          </span>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 px-5 mb-4">
          <button onClick={onStockIn}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm"
            style={{ background: PRIMARY, color: "#fff" }}>
            <ArrowDownToLine className="w-4 h-4" /> Stock In
          </button>
          <a href="/pos" style={{ flex: 1 }}><button type="button" className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm" style={{ border: `2px solid ${PRIMARY}`, color: PRIMARY }}><ShoppingCart className="w-4 h-4" /> POS</button></a>
        </div>

        {/* Info grid */}
        <div className="mx-5 mb-4 rounded-2xl divide-y" style={{ border: `1px solid ${BORDER}` }}>
          {[
            { label: "Supplier", value: supplierName },
            { label: "Purchase Price", value: item.purchasePrice ? `${sym}${Number(item.purchasePrice).toLocaleString()}` : "—" },
            { label: "Selling Price", value: item.sellingPrice ? `${sym}${Number(item.sellingPrice).toLocaleString()}` : "—" },
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
        <div className="flex gap-3 px-5 pb-24">
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

// ─── Manage Categories Modal ──────────────────────────────────────────────────
function ManageCategoriesModal({ onClose, categories, onEdit, onDeleteCat }: {
  onClose: () => void;
  categories: Category[];
  onEdit: (cat: Category) => void;
  onDeleteCat: (cat: Category) => void;
}) {
  const parentCats = categories.filter(c => !c.parentId);
  const subOf = (parentId: number) => categories.filter(c => c.parentId === parentId);

  return (
    <ModalShell title="Manage Categories" onClose={onClose}>
      {parentCats.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: MUTED }}>No categories yet. Tap + to add one.</p>
      ) : (
        <div className="space-y-2">
          {parentCats.map(parent => (
            <div key={parent.id} className="rounded-2xl overflow-hidden border" style={{ borderColor: BORDER }}>
              {/* Parent row */}
              <div className="flex items-center gap-2 px-4 py-3" style={{ background: "hsl(var(--muted))" }}>
                <FolderOpen className="w-4 h-4 flex-shrink-0" style={{ color: PRIMARY }} />
                <span className="flex-1 font-semibold text-sm">{parent.name}</span>
                <button onClick={() => onEdit(parent)} className="p-1.5 rounded-lg" style={{ color: PRIMARY }}>
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDeleteCat(parent)}
                  className="p-1.5 rounded-lg" style={{ color: "hsl(var(--destructive))" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Sub-category rows */}
              {subOf(parent.id).map((sub, idx, arr) => (
                <div key={sub.id}
                  className="flex items-center gap-2 px-4 py-2.5 border-t"
                  style={{ borderColor: BORDER }}>
                  <span className="text-xs" style={{ color: MUTED }}>↳</span>
                  <span className="flex-1 text-sm">{sub.name}</span>
                  <button onClick={() => onEdit(sub)} className="p-1.5 rounded-lg" style={{ color: PRIMARY }}>
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDeleteCat(sub)}
                    className="p-1.5 rounded-lg" style={{ color: "hsl(var(--destructive))" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

// ─── FAB Menu ─────────────────────────────────────────────────────────────────
type FabAction = "add-product" | "stock-in" | "manage-categories" | "manage-parties";
const FAB_ITEMS: { action: FabAction; label: string; icon: React.ReactNode; color: string }[] = [
  { action: "add-product",       label: "Add Product",        icon: <Package className="w-4 h-4" />,        color: "#6366F1" },
  { action: "manage-categories", label: "Manage Categories",  icon: <Settings className="w-4 h-4" />,        color: "#64748B" },
  { action: "manage-parties",     label: "Customers & Suppliers", icon: <Users2 className="w-4 h-4" />,      color: "#F59E0B" },
  { action: "stock-in",          label: "Stock In",           icon: <ArrowDownToLine className="w-4 h-4" />, color: "#10B981" },
];

function FABMenu({ onAction, isStaff }: { onAction: (a: FabAction) => void; isStaff?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <div className="fixed right-5 z-50 flex flex-col items-end gap-2"
        style={{ bottom: "calc(6.25rem + env(safe-area-inset-bottom))" }}>
        {open && (isStaff ? FAB_ITEMS.filter(item => item.action === "manage-parties") : FAB_ITEMS).map(({ action, label, icon, color }) => (
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
type Modal = "add-product" | "add-supplier" | "stock-in" | "scanner" | null;
type CatModal = "category" | "subcategory" | "edit" | "manage" | null;

export default function Inventory() {
  const { user, isGuest } = useAuth();
  const [, setLocation] = useLocation();
  const sym = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? "Tk";
  const [modal, setModal] = useState<Modal>(null);
  const [catModal, setCatModal] = useState<CatModal>(null);
  const [activeCategoryKey, setActiveCategoryKey] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | undefined>();
  const [showSheet, setShowSheet] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | undefined>();
  const search = useSearch();
  const [activeStockFilter, setActiveStockFilter] = useState<null | "low" | "out">(() => {
    const p = new URLSearchParams(search).get("filter");
    return p === "low" || p === "out" ? p : null;
  });
  const qc = useQueryClient();

  useEffect(() => {
    if (new URLSearchParams(search).get("action") === "stock-in") {
      setModal("stock-in");
    }
  }, [search]);

  const isInvFreePlan = user?.plan === "Free" || !user?.plan;
  const useLocalInventory = isInvFreePlan && !user?.isStaff;

  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
       if (useLocalInventory && user?.id) return localInventory.getAll(user.id);
      const d = await fetch("/api/inventory", { credentials: "include" }).then(r => r.json());
      return Array.isArray(d) ? d : [];
    },
    enabled: !isGuest && !!user,
  });
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: async () => { const d = await fetch("/api/suppliers", { credentials: "include" }).then(r => r.json()); return Array.isArray(d) ? d : []; },
    enabled: !isGuest && !!user,
  });
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["inv-categories"],
    queryFn: async () => { const d = await fetch("/api/inventory-categories", { credentials: "include" }).then(r => r.json()); return Array.isArray(d) ? d : []; },
    enabled: !isGuest && !!user,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => {
       if (useLocalInventory && user?.id) {
        localInventory.delete(user.id, id);
        return Promise.resolve({ success: true });
      }
      return fetch(`/api/inventory/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json());
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inventory"] }); setShowSheet(false); },
  });

  const deleteCatMut = useMutation({
    mutationFn: (id: number) => fetch(`/api/inventory-categories/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inv-categories"] }),
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

  // Category tabs: "All" plus categories created by the user.
  const catTabs: { key: string; name: string; id?: number; parentId?: number }[] = [
    { key: "All", name: "All" },
    ...categories.map(c => ({ key: `cat:${c.id}`, name: c.name, id: c.id, parentId: c.parentId ?? undefined })),
  ];

  // Two-tier category logic
  const parentTabs = catTabs.filter(t => t.key === "All" || !t.parentId);
  const activeTab = catTabs.find(t => t.key === activeCategoryKey) ?? catTabs[0];

  // Which parent is "active" (either directly selected, or is parent of selected sub)
  const activeParentKey = (() => {
    if (!activeTab.parentId) return activeTab.key;
    const parent = catTabs.find(t => t.id === activeTab.parentId);
    return parent?.key ?? "All";
  })();

  // Sub-tabs of the active parent
  const activeParentId = parentTabs.find(t => t.key === activeParentKey)?.id;
  const subTabs = activeParentId != null
    ? catTabs.filter(t => t.parentId === activeParentId)
    : [];

  const filtered = list.filter(item => {
    const matchCat = (() => {
      if (activeTab.key === "All") return true;
      if (activeTab.id != null) {
        // parent selected → include its children too; sub selected → exact match
        const childIds = categories.filter(c => c.parentId === activeTab.id).map(c => c.id);
        return item.categoryId === activeTab.id || childIds.includes(item.categoryId ?? -1);
      }
      return item.partType === activeTab.name; // fallback part-type
    })();
    const q = searchQ.toLowerCase();
    const matchSearch = !q ||
      (item.partName ?? "").toLowerCase().includes(q) ||
      (item.barcode ?? "").toLowerCase().includes(q) ||
      (item.sku ?? "").toLowerCase().includes(q) ||
      (item.model ?? "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const lowCount = list.filter(i => i.minStock > 0 && i.quantity > 0 && i.quantity <= i.minStock).length;
  const outCount = list.filter(i => i.quantity === 0).length;
  // Category-aware stock value: total when "All", category-specific otherwise
  const categoryValue = (activeTab.key === "All" ? list : list.filter(item => {
    if (activeTab.id != null) {
      const childIds = categories.filter(c => c.parentId === activeTab.id).map(c => c.id);
      return item.categoryId === activeTab.id || childIds.includes(item.categoryId ?? -1);
    }
    return item.partType === activeTab.name;
  })).reduce((s, i) => s + (Number(i.purchasePrice) || 0) * i.quantity, 0);

  // Apply stock filter on top of the existing filtered list
  const displayList = activeStockFilter === "low"
    ? filtered.filter(i => i.minStock > 0 && i.quantity > 0 && i.quantity <= i.minStock)
    : activeStockFilter === "out"
      ? filtered.filter(i => i.quantity === 0)
      : filtered;

  function openItemSheet(item: Item) { setSelectedItem(item); setShowSheet(true); }
  function handleFAB(action: FabAction) {
    if (action === "add-product")       { setModal("add-product"); return; }
    if (action === "stock-in")          { setSelectedItem(undefined); setModal("stock-in"); return; }
    if (action === "manage-categories") { setLocation("/manage-categories"); return; }
    if (action === "manage-parties")    { setLocation("/customers?from=inventory"); return; }
  }

  return (
    <ProtectedPage>
      <div className="space-y-3 pb-6">
         <FABMenu onAction={handleFAB} isStaff={user?.isStaff} />
        {/* Stats bar — 2×2 compact clickable cards */}
        <div className="grid grid-cols-2 gap-2">
          {([
            { key: "all"  as const, label: "Total Items",  value: String(list.length),
              accent: "#3B82F6", activeBg: "rgba(59,130,246,0.12)", idleBg: "rgba(59,130,246,0.05)" },
            { key: "val"  as const,
              label: activeTab.key === "All" ? "Stock Value" : `${activeTab.name} Value`,
              value: fmtValue(user?.currency ?? "USD", categoryValue),
              accent: "#10B981", activeBg: "rgba(16,185,129,0.12)", idleBg: "rgba(16,185,129,0.05)" },
            { key: "low"  as const, label: "Low Stock",    value: String(lowCount),
              accent: "#F59E0B", activeBg: "rgba(245,158,11,0.20)", idleBg: "rgba(245,158,11,0.05)" },
            { key: "out"  as const, label: "Out of Stock", value: String(outCount),
              accent: "#EF4444", activeBg: "rgba(239,68,68,0.20)", idleBg: "rgba(239,68,68,0.05)" },
          ] as const).map(({ key, label, value, accent, activeBg, idleBg }) => {
            const isActive = (key === "low" || key === "out") && activeStockFilter === key;
            return (
              <button key={label}
                onClick={() => {
                  if (key === "low" || key === "out")
                    setActiveStockFilter(f => f === key ? null : key);
                  else
                    setActiveStockFilter(null);
                }}
                className="rounded-xl px-2.5 py-1.5 flex flex-col text-left transition-all active:scale-95"
                style={{
                  background: isActive ? activeBg : idleBg,
                  border: `1.5px solid ${isActive ? accent : `${accent}40`}`,
                }}>
                <span className="text-[9px] font-bold uppercase tracking-wide leading-tight" style={{ color: accent }}>{label}</span>
                <span className="font-bold text-sm leading-tight" style={{ color: accent }}>{value}</span>
              </button>
            );
          })}
        </div>

        {/* Search + scan — scanner icon inside the bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search name, barcode, SKU…"
            className="w-full pl-10 pr-20 py-3 rounded-2xl border text-sm outline-none"
            style={{ borderColor: BORDER, background: CARD }} />
          {searchQ && (
            <button onClick={() => setSearchQ("")}
              className="absolute right-11 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ color: MUTED }}>
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setModal("scanner")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${PRIMARY}15`, color: PRIMARY }}
            title="Scan barcode or QR code">
            <ScanLine className="w-4 h-4" />
          </button>
        </div>

        {/* Two-tier category filter */}
        <div className="space-y-1.5">
          {/* Parent categories row */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
            {parentTabs.map(tab => (
              <button key={tab.key}
                onClick={() => setActiveCategoryKey(tab.key)}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
                style={tab.key === activeParentKey
                  ? { background: PRIMARY, color: "#fff" }
                  : { background: CARD, color: MUTED, border: `1px solid ${BORDER}` }}>
                {tab.name}
              </button>
            ))}
          </div>
          {/* Sub-category row — visible when a parent with subs is selected */}
          {activeParentKey !== "All" && activeParentId != null && subTabs.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pl-1 pb-0.5">
              {subTabs.map(tab => (
                <button key={tab.key}
                  onClick={() => setActiveCategoryKey(tab.key)}
                  className="flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all"
                  style={tab.key === activeCategoryKey
                    ? { background: PRIMARY, color: "#fff" }
                    : { background: `hsl(var(--primary) / 0.1)`, color: PRIMARY }}>
                  ↳ {tab.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />)}
          </div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 mx-auto mb-3" style={{ color: MUTED }} />
            <p className="font-semibold">No products found</p>
            <p className="text-sm mt-1" style={{ color: MUTED }}>
              {list.length === 0 ? "Tap + to add your first product" : "Try a different search or filter"}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border divide-y overflow-hidden" style={{ borderColor: BORDER, background: CARD }}>
            {displayList.map(item => {
              const qty = item.quantity;
              const isOut = qty === 0;
              const isLow = !isOut && item.minStock > 0 && qty <= item.minStock;
              const supplierName = suppliers.find(s => s.id === item.supplierId)?.name ?? item.supplier;
              const categoryName = item.categoryId ? categories.find(c => c.id === item.categoryId)?.name : undefined;
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
                      {[categoryName, item.quality, item.shelfLocation].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {item.barcode && <p className="text-xs mt-0.5 font-mono" style={{ color: MUTED }}>{item.barcode}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-sm font-black">{qty}</span>
                    {isOut && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "#FEF2F2", color: "#DC2626" }}>
                        Out
                      </span>
                    )}
                    {isLow && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "#FFF7E6", color: "#D97706" }}>
                        Low
                      </span>
                    )}
                    {item.sellingPrice && (
                      <span className="text-[10px] font-semibold" style={{ color: MUTED }}>{sym}{Number(item.sellingPrice).toLocaleString()}</span>
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
        <AddProductModal suppliers={suppliers} categories={categories} allItems={list}
          existing={selectedItem?.id ? selectedItem : (selectedItem?.barcode ? { ...selectedItem, id: 0 } as any : undefined)}
          onClose={() => { setModal(null); setSelectedItem(undefined); }} />
      )}

      {/* Add Category / Sub-category / Edit category */}
      {(catModal === "category" || catModal === "subcategory" || catModal === "edit") && (
        <CategoryModal
          mode={catModal}
          existing={catModal === "edit" ? editCategory : undefined}
          parentCategories={categories.filter(c => !c.parentId)}
          onClose={() => { setCatModal(null); setEditCategory(undefined); }}
        />
      )}

      {/* Manage Categories */}
      {catModal === "manage" && (
        <ManageCategoriesModal
          categories={categories}
          onClose={() => setCatModal(null)}
          onEdit={cat => { setEditCategory(cat); setCatModal("edit"); }}
          onDeleteCat={cat => {
            const hasSubs = categories.some(c => c.parentId === cat.id);
            const msg = hasSubs
              ? `Delete "${cat.name}" and all its sub-categories?`
              : `Delete "${cat.name}"?`;
            if (confirm(msg)) deleteCatMut.mutate(cat.id);
          }}
        />
      )}

      {/* Add supplier */}
      {modal === "add-supplier" && <AddSupplierModal onClose={() => setModal(null)} />}

      {/* Stock In */}
      {modal === "stock-in" && (
        <StockInModal item={selectedItem} suppliers={suppliers} allItems={list} categories={categories}
          onClose={() => { setModal(null); setSelectedItem(undefined); }} />
      )}

      {/* Item detail sheet */}
      {showSheet && selectedItem && (
        <ItemSheet item={selectedItem} suppliers={suppliers}
          onClose={() => { setShowSheet(false); setSelectedItem(undefined); }}
          onEdit={() => { setShowSheet(false); setModal("add-product"); }}
          onStockIn={() => { setShowSheet(false); setModal("stock-in"); }}
          onDelete={() => { if (confirm(`Delete "${selectedItem.partName}"?`)) deleteMut.mutate(selectedItem.id); }} />
      )}
    </ProtectedPage>
  );
}
