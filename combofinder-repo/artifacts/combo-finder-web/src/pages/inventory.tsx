import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Plus, Search, Package, X, AlertCircle, ScanLine, ChevronRight,
  Tag, Truck, ArrowDownToLine, ShoppingCart, Edit3, Trash2,
  QrCode, CheckCircle, ArrowUpFromLine, MoreVertical, Boxes, Settings,
  FolderOpen, ChevronDown,
} from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";
import { useAuth } from "@/context/auth-context";
import { localInventory } from "@/lib/local-store";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD:"$",EUR:"€",GBP:"£",BDT:"৳",INR:"₹",PKR:"₨",NPR:"रू",LKR:"Rs",AED:"د.إ",
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

// ─── Types ────────────────────────────────────────────────────────────────────
type Item = {
  id: number; partName: string; partType?: string; quality?: string;
  quantity: number; minStock: number; sellingPrice?: string | number;
  purchasePrice?: string | number; supplierId?: number; categoryId?: number;
  barcode?: string; sku?: string; supplier?: string; notes?: string;
  model?: string; brand?: string; shelfLocation?: string;
};
type Supplier = { id: number; name: string; phone?: string; whatsapp?: string; partTypes?: string; isActive: boolean; };
type Category = { id: number; name: string; description?: string; color?: string; icon?: string; parentId?: number; };

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
      <style>{`
        @keyframes scanPulse { 0%,100%{top:8%} 50%{top:84%} }
        .inv-scan-line { position:absolute; left:8px; right:8px; height:2px; animation:scanPulse 2s ease-in-out infinite; background:linear-gradient(90deg,transparent,#3b82f6,#06b6d4,#3b82f6,transparent); box-shadow:0 0 10px #3b82f6,0 0 4px #06b6d4; border-radius:2px; }
      `}</style>
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
            {/* Dark vignette overlay */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 60% 55% at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 100%)" }} />
            {/* Viewfinder with corner brackets */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative" style={{ width: "68%", aspectRatio: "1" }}>
                {/* Corner brackets */}
                {[
                  { top:0, left:0, borderTop:"2.5px solid white", borderLeft:"2.5px solid white", borderRadius:"6px 0 0 0" },
                  { top:0, right:0, borderTop:"2.5px solid white", borderRight:"2.5px solid white", borderRadius:"0 6px 0 0" },
                  { bottom:0, left:0, borderBottom:"2.5px solid white", borderLeft:"2.5px solid white", borderRadius:"0 0 0 6px" },
                  { bottom:0, right:0, borderBottom:"2.5px solid white", borderRight:"2.5px solid white", borderRadius:"0 0 6px 0" },
                ].map((s, i) => (
                  <div key={i} className="absolute" style={{ ...s, width:24, height:24 }} />
                ))}
                {/* Animated scan line */}
                <div className="inv-scan-line" />
              </div>
            </div>
            {scanning && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Scanning…
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
function AddProductModal({ onClose, existing, suppliers, categories }: {
  onClose: () => void; existing?: Item; suppliers: Supplier[]; categories: Category[];
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
        shelfLocation: form.shelfLocation.trim() || null,
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
        <SubmitBtn pending={mut.isPending} label={existing ? "Save Changes" : "Add Product"} />
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

function StockInModal({ onClose, item: initialItem, suppliers, allItems }: {
  onClose: () => void; item?: Item; suppliers: Supplier[]; allItems: Item[];
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const sym = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? "৳";
  const today = new Date().toISOString().split("T")[0];

  const [invoiceNo, setInvoiceNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [supplierId, setSupplierId] = useState(String(initialItem?.supplierId ?? ""));
  const [paidNow, setPaidNow] = useState("0");
  const [notes, setNotes] = useState("");
  const [recordLedger, setRecordLedger] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [lines, setLines] = useState<StockInLine[]>([newStockLine(initialItem)]);

  const supplierName = suppliers.find(s => String(s.id) === supplierId)?.name;
  const invoiceTotal = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.unitPrice) || 0), 0);
  const dueAmt = Math.max(0, invoiceTotal - (Number(paidNow) || 0));
  const validLines = lines.filter(l => l.item && Number(l.qty) > 0);

  const patchLine = (key: string, patch: Partial<StockInLine>) =>
    setLines(prev => prev.map(l => l._key === key ? { ...l, ...patch } : l));

  const mut = useMutation({
    mutationFn: async () => {
      if (validLines.length === 0) throw new Error("Select at least one product");

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
            notes: notes || null,
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
              notes: notes || null,
            }),
          });
          const d = await res.json();
          if (!res.ok) throw new Error(d.error ?? "Failed");
        }
        return { ok: true };
      }
    },
    onSuccess: async () => {
      // Update shelf locations for lines where shelf was provided
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

          {/* Line items */}
          <div>
            <label className="text-xs font-semibold block mb-2" style={{ color: MUTED }}>Items *</label>
            <div className="flex flex-col gap-2">
              {lines.map((line) => (
                <div key={line._key} className="rounded-xl border" style={{ borderColor: BORDER }}>
                  <div className="p-3">
                    {!line.item ? (
                      <div className="relative mb-2">
                        <Input placeholder="Search product…" value={line.search}
                          onChange={e => patchLine(line._key, { search: e.target.value, showDrop: true })}
                          onFocus={() => patchLine(line._key, { showDrop: true })}
                          onBlur={() => setTimeout(() => patchLine(line._key, { showDrop: false }), 150)} />
                        {line.showDrop && line.search && (() => {
                          const hits = allItems
                            .filter(i => i.partName.toLowerCase().includes(line.search.toLowerCase()))
                            .slice(0, 5);
                          return hits.length > 0 ? (
                            <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border shadow-lg overflow-hidden"
                              style={{ background: CARD, borderColor: BORDER }}>
                              {hits.map(i => (
                                <button key={i.id} type="button"
                                  onMouseDown={() => patchLine(line._key, {
                                    item: i, search: i.partName, showDrop: false,
                                    unitPrice: i.purchasePrice ? String(i.purchasePrice) : "",
                                  })}
                                  className="w-full text-left px-3 py-2 text-sm border-b last:border-0"
                                  style={{ borderColor: BORDER }}>
                                  <span className="font-medium">{i.partName}</span>
                                  <span className="text-xs ml-2" style={{ color: MUTED }}>Stock: {i.quantity}</span>
                                </button>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold">{line.item.partName}</p>
                          <p className="text-xs" style={{ color: MUTED }}>Current stock: {line.item.quantity}</p>
                        </div>
                        <button type="button" style={{ color: MUTED }}
                          onClick={() => patchLine(line._key, { item: undefined, search: "", unitPrice: "" })}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs mb-1 font-medium" style={{ color: MUTED }}>Qty *</p>
                        <Input type="number" min="1" value={line.qty}
                          onChange={e => patchLine(line._key, { qty: e.target.value })} />
                      </div>
                      <div>
                        <p className="text-xs mb-1 font-medium" style={{ color: MUTED }}>Unit Price</p>
                        <Input type="text" inputMode="decimal" value={line.unitPrice}
                          onChange={e => patchLine(line._key, { unitPrice: e.target.value })}
                          placeholder="0.00" />
                      </div>
                    </div>
                    {line.item && (
                      <div className="mt-2">
                        <p className="text-xs mb-1 font-medium" style={{ color: MUTED }}>Shelf / Location</p>
                        <Input placeholder="e.g. A-2, Row 3" value={line.shelf}
                          onChange={e => patchLine(line._key, { shelf: e.target.value })} />
                      </div>
                    )}
                    {Number(line.qty) > 0 && Number(line.unitPrice) > 0 && (
                      <p className="text-xs mt-1.5 font-semibold text-right" style={{ color: PRIMARY }}>
                        = {sym}{(Number(line.qty) * Number(line.unitPrice)).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {lines.length > 1 && (
                    <button type="button"
                      onClick={() => setLines(prev => prev.filter(l => l._key !== line._key))}
                      className="w-full py-1.5 text-xs border-t text-center"
                      style={{ borderColor: BORDER, color: "#EF4444" }}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setLines(prev => [...prev, newStockLine()])}
              className="mt-2 w-full py-2.5 rounded-xl border border-dashed text-sm font-medium flex items-center justify-center gap-2"
              style={{ borderColor: PRIMARY, color: PRIMARY }}>
              <Plus className="w-4 h-4" /> Add Another Item
            </button>
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

          <Field label="Notes">
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" />
          </Field>
          {error && <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
          <SubmitBtn pending={mut.isPending}
            label={validLines.length > 1 ? `Add ${validLines.length} Items to Stock` : "Add to Stock"}
            pendingLabel="Adding…" />
        </form>
      )}
    </ModalShell>
  );
}

// ─── Sell / POS Modal ─────────────────────────────────────────────────────────
function SellModal({ onClose, item: initialItem, allItems }: { onClose: () => void; item?: Item; allItems: Item[] }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const sym = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? "৳";
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
  const sym = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? "৳";
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
type FabAction = "add-product" | "stock-in" | "manage-categories" | "manage-customers" | "manage-suppliers";
const FAB_ITEMS: { action: FabAction; label: string; icon: React.ReactNode; color: string }[] = [
  { action: "add-product",       label: "Add Product",        icon: <Package className="w-4 h-4" />,        color: "#6366F1" },
  { action: "manage-categories", label: "Manage Categories",  icon: <Settings className="w-4 h-4" />,        color: "#64748B" },
  { action: "manage-customers",  label: "Manage Customers",   icon: <Boxes className="w-4 h-4" />,           color: "#F59E0B" },
  { action: "manage-suppliers",  label: "Manage Suppliers",   icon: <Truck className="w-4 h-4" />,           color: "#0EA5E9" },
  { action: "stock-in",          label: "Stock In",           icon: <ArrowDownToLine className="w-4 h-4" />, color: "#10B981" },
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
type Modal = "add-product" | "add-supplier" | "stock-in" | "scanner" | null;
type CatModal = "category" | "subcategory" | "edit" | "manage" | null;

export default function Inventory() {
  const { user, isGuest } = useAuth();
  const [, setLocation] = useLocation();
  const sym = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? "৳";
  const [modal, setModal] = useState<Modal>(null);
  const [catModal, setCatModal] = useState<CatModal>(null);
  const [activeCategoryKey, setActiveCategoryKey] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [selectedItem, setSelectedItem] = useState<Item | undefined>();
  const [showSheet, setShowSheet] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | undefined>();
  const qc = useQueryClient();

  const isInvFreePlan = user?.plan === "Free" || !user?.plan;

  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      if (isInvFreePlan && user?.id) return localInventory.getAll(user.id);
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
      if (isInvFreePlan && user?.id) {
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

  // Category tabs: "All" + DB categories.
  // Fallback part-type chips only shown when user has created zero categories.
  const catTabs: { key: string; name: string; id?: number; parentId?: number }[] = [
    { key: "All", name: "All" },
    ...categories.map(c => ({ key: `cat:${c.id}`, name: c.name, id: c.id, parentId: c.parentId ?? undefined })),
    ...(categories.length === 0
      ? ["Display","Battery","IC","Connector","Camera","Speaker","Other"]
          .filter(t => list.some(i => i.partType === t))
          .map(t => ({ key: `type:${t}`, name: t }))
      : []),
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

  // Stats based on full list (before any filter) for accurate counts
  const lowCount  = list.filter(i => i.minStock > 0 && i.quantity <= i.minStock && i.quantity > 0).length;
  const outCount  = list.filter(i => i.quantity === 0).length;
  const totalValue = list.reduce((s, i) => s + (Number(i.purchasePrice) || 0) * i.quantity, 0);

  const filtered = list.filter(item => {
    const matchCat = (() => {
      if (activeTab.key === "All") return true;
      if (activeTab.id != null) {
        const childIds = categories.filter(c => c.parentId === activeTab.id).map(c => c.id);
        return item.categoryId === activeTab.id || childIds.includes(item.categoryId ?? -1);
      }
      return item.partType === activeTab.name;
    })();
    const matchStock = (() => {
      if (stockFilter === "low") return item.minStock > 0 && item.quantity <= item.minStock && item.quantity > 0;
      if (stockFilter === "out") return item.quantity === 0;
      return true;
    })();
    const q = searchQ.toLowerCase();
    const matchSearch = !q ||
      (item.partName ?? "").toLowerCase().includes(q) ||
      (item.barcode ?? "").toLowerCase().includes(q) ||
      (item.sku ?? "").toLowerCase().includes(q) ||
      (item.model ?? "").toLowerCase().includes(q);
    return matchCat && matchStock && matchSearch;
  });

  function openItemSheet(item: Item) { setSelectedItem(item); setShowSheet(true); }
  function handleFAB(action: FabAction) {
    if (action === "add-product")       { setModal("add-product"); return; }
    if (action === "stock-in")          { setSelectedItem(undefined); setModal("stock-in"); return; }
    if (action === "manage-categories") { setLocation("/manage-categories"); return; }
    if (action === "manage-customers")  { setLocation("/customers?from=inventory"); return; }
    if (action === "manage-suppliers")  { setLocation("/manage-suppliers"); return; }
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

        {/* Stats bar — 2×2 clickable cards with colored borders */}
        <div className="grid grid-cols-2 gap-2.5">
          {([
            {
              key: "all" as const,
              label: "Total Items",
              value: String(list.length),
              accent: "#3B82F6",
              activeBg: "rgba(59,130,246,0.10)",
              idleBg: "rgba(59,130,246,0.05)",
            },
            {
              key: "all" as const,
              label: "Stock Value",
              value: `${sym}${totalValue > 999 ? (totalValue/1000).toFixed(1)+"k" : totalValue.toLocaleString()}`,
              accent: "#10B981",
              activeBg: "rgba(16,185,129,0.10)",
              idleBg: "rgba(16,185,129,0.05)",
            },
            {
              key: "low" as const,
              label: "Low Stock",
              value: String(lowCount),
              accent: "#F59E0B",
              activeBg: "rgba(245,158,11,0.18)",
              idleBg: "rgba(245,158,11,0.05)",
            },
            {
              key: "out" as const,
              label: "Out of Stock",
              value: String(outCount),
              accent: "#EF4444",
              activeBg: "rgba(239,68,68,0.18)",
              idleBg: "rgba(239,68,68,0.05)",
            },
          ] as const).map(({ key, label, value, accent, activeBg, idleBg }) => {
            const isActive = stockFilter === key && (key === "low" || key === "out");
            return (
              <button key={label}
                onClick={() => {
                  if (key === "all") { setStockFilter("all"); }
                  else { setStockFilter(prev => prev === key ? "all" : key); }
                }}
                className="rounded-2xl p-3.5 flex flex-col gap-1 text-left transition-all active:scale-95"
                style={{
                  background: isActive ? activeBg : idleBg,
                  border: `1.5px solid ${isActive ? accent : `${accent}40`}`,
                  boxShadow: `0 2px 8px ${accent}18`,
                }}>
                <span className="text-xl font-black leading-none" style={{ color: accent }}>{value}</span>
                <span className="text-[11px] font-semibold" style={{ color: MUTED }}>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Search + scan (scanner icon inside the bar) */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search name, barcode, SKU…"
            className="w-full pl-10 pr-12 py-3 rounded-2xl border text-sm outline-none"
            style={{ borderColor: BORDER, background: CARD }} />
          <button onClick={() => setModal("scanner")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
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
              const isOut = qty === 0;
              const isLow = !isOut && item.minStock > 0 && qty <= item.minStock;
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
                      {(() => {
                        const catName = categories.find(c => c.id === item.categoryId)?.name;
                        const parts = [catName, item.quality, item.shelfLocation].filter(Boolean);
                        return parts.join(" · ") || "—";
                      })()}
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
        <AddProductModal suppliers={suppliers} categories={categories}
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
        <StockInModal item={selectedItem} suppliers={suppliers} allItems={list}
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
