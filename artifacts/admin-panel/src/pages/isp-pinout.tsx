import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Trash2, X, ExternalLink, ZoomIn, Cpu, RefreshCw,
  Edit2, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────
type Pinout   = { id: number; title: string; deviceBrand?: string; deviceModel?: string; fileUrl?: string; thumbnailUrl?: string; schematicType?: string; tags?: string };
type IspBrand = { id: number; name: string; logoUrl?: string | null; modelCount: number; categoryId?: number | null };
type IspModel = { id: number; name: string; brandId: number; brandName: string; releaseYear?: number | null };
type Category = { id: number; name: string; slug: string };

const PALETTES = [
  { bg: "#EEF2FF", color: "#6366F1" }, { bg: "#F5F3FF", color: "#8B5CF6" },
  { bg: "#FDF2F8", color: "#EC4899" }, { bg: "#FFF7E6", color: "#F59E0B" },
  { bg: "#ECFDF5", color: "#10B981" }, { bg: "#EFF6FF", color: "#3B82F6" },
  { bg: "#FEF2F2", color: "#EF4444" }, { bg: "#F0FDFF", color: "#06B6D4" },
];
const pal = (name: string) => PALETTES[(name ?? "?").charCodeAt(0) % PALETTES.length];

// ── Shared input style ────────────────────────────────────────────────────────
const inp = "w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground outline-none focus:ring-1 focus:ring-primary";
const sel = inp + " disabled:opacity-50";

// ── Add / Edit Brand Modal ────────────────────────────────────────────────────
function BrandModal({
  brand, ispCategoryId, onClose, onSaved,
}: {
  brand?: IspBrand;
  ispCategoryId: number | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName]     = useState(brand?.name ?? "");
  const [logo, setLogo]     = useState(brand?.logoUrl ?? "");
  const [err,  setErr]      = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) { setErr("Brand name is required"); return; }
    setSaving(true); setErr("");
    try {
      const url    = brand ? `/api/brands/${brand.id}` : "/api/brands";
      const method = brand ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), logoUrl: logo.trim() || null, categoryId: ispCategoryId ?? null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      onSaved(); onClose();
    } catch (e: any) { setErr(e.message); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{brand ? "Edit Brand" : "Add Brand"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Brand Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Samsung" className={inp} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Logo URL <span className="font-normal">(optional)</span></label>
          <input value={logo} onChange={e => setLogo(e.target.value)} placeholder="https://…" className={inp} />
        </div>
        {err && <p className="text-xs text-destructive">{err}</p>}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="flex-1">
            {saving ? "Saving…" : brand ? "Update" : "Add Brand"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Add / Edit Model Modal ────────────────────────────────────────────────────
function ModelModal({
  model, brands, defaultBrandId, onClose, onSaved,
}: {
  model?: IspModel;
  brands: IspBrand[];
  defaultBrandId?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [brandId, setBrandId] = useState<number | "">(model?.brandId ?? defaultBrandId ?? "");
  const [name,    setName]    = useState(model?.name ?? "");
  const [year,    setYear]    = useState(model?.releaseYear?.toString() ?? "");
  const [err,     setErr]     = useState("");
  const [saving,  setSaving]  = useState(false);

  async function save() {
    if (!brandId) { setErr("Please select a brand"); return; }
    if (!name.trim()) { setErr("Model name is required"); return; }
    setSaving(true); setErr("");
    try {
      const url    = model ? `/api/models/${model.id}` : "/api/models";
      const method = model ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: Number(brandId), name: name.trim(), releaseYear: year ? Number(year) : null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      onSaved(); onClose();
    } catch (e: any) { setErr(e.message); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{model ? "Edit Model" : "Add Model"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Brand *</label>
          <select value={brandId} onChange={e => setBrandId(e.target.value ? Number(e.target.value) : "")} className={sel}>
            <option value="">— Select brand —</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Model Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Galaxy A05s" className={inp} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Release Year <span className="font-normal">(optional)</span></label>
          <input value={year} onChange={e => setYear(e.target.value)} placeholder="2024" type="number" className={inp} />
        </div>
        {err && <p className="text-xs text-destructive">{err}</p>}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={save} disabled={saving || !brandId || !name.trim()} className="flex-1">
            {saving ? "Saving…" : model ? "Update" : "Add Model"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Manage Brands Panel (inline) ──────────────────────────────────────────────
function ManageBrandsPanel({
  brands, ispCategoryId, onClose, onChanged,
}: {
  brands: IspBrand[];
  ispCategoryId: number | undefined;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [editBrand, setEditBrand] = useState<IspBrand | undefined>();
  const [showAdd,   setShowAdd]   = useState(false);
  const [deleting,  setDeleting]  = useState<number | null>(null);

  async function del(b: IspBrand) {
    if (!confirm(`Delete brand "${b.name}"? All its models will also be removed.`)) return;
    setDeleting(b.id);
    await fetch(`/api/brands/${b.id}`, { method: "DELETE", credentials: "include" });
    onChanged();
    setDeleting(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-bold">Manage ISP Brands</h2>
            <p className="text-xs text-muted-foreground">{brands.length} brand{brands.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5 h-8 px-3 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Brand
            </Button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Brand list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {brands.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              No brands yet. Click "Add Brand" to create one.
            </div>
          ) : (
            brands.map(b => {
              const p = pal(b.name);
              return (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: p.bg, color: p.color }}>
                    {b.logoUrl
                      ? <img src={b.logoUrl} alt={b.name} className="w-full h-full rounded-lg object-contain" />
                      : b.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.modelCount} model{b.modelCount !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setEditBrand(b)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => del(b)} disabled={deleting === b.id}
                      className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {(showAdd || editBrand) && (
        <BrandModal
          brand={editBrand}
          ispCategoryId={ispCategoryId}
          onClose={() => { setShowAdd(false); setEditBrand(undefined); }}
          onSaved={() => { onChanged(); setShowAdd(false); setEditBrand(undefined); }}
        />
      )}
    </div>
  );
}

// ── Manage Models Panel (inline) ──────────────────────────────────────────────
function ManageModelsPanel({
  brands, onClose, onChanged,
}: {
  brands: IspBrand[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const [activeBrandId, setActiveBrandId] = useState<number | "">(brands[0]?.id ?? "");
  const [editModel, setEditModel]         = useState<IspModel | undefined>();
  const [showAdd,   setShowAdd]           = useState(false);
  const [deleting,  setDeleting]          = useState<number | null>(null);

  const { data: models = [], refetch } = useQuery<IspModel[]>({
    queryKey: ["isp-panel-models", activeBrandId],
    queryFn: () =>
      fetch(`/api/brands/${activeBrandId}/models`, { credentials: "include" }).then(r => r.json()),
    enabled: !!activeBrandId,
  });

  function handleChanged() { refetch(); onChanged(); }

  async function del(m: IspModel) {
    if (!confirm(`Delete model "${m.name}"?`)) return;
    setDeleting(m.id);
    await fetch(`/api/models/${m.id}`, { method: "DELETE", credentials: "include" });
    handleChanged();
    setDeleting(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-bold">Manage ISP Models</h2>
            <p className="text-xs text-muted-foreground">Select a brand to view & edit its models</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowAdd(true)} disabled={!activeBrandId} className="gap-1.5 h-8 px-3 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Model
            </Button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Brand selector */}
        <div className="px-5 pt-4 pb-2 shrink-0">
          <select
            value={activeBrandId}
            onChange={e => setActiveBrandId(e.target.value ? Number(e.target.value) : "")}
            className={sel}
          >
            <option value="">— Select a brand —</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name} ({b.modelCount} models)</option>)}
          </select>
        </div>

        {/* Model list */}
        <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-2 mt-2">
          {!activeBrandId ? (
            <div className="text-center py-10 text-sm text-muted-foreground">Select a brand above to see its models.</div>
          ) : models.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">No models yet for this brand.</div>
          ) : (
            models.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{m.name}</p>
                  {m.releaseYear && <p className="text-xs text-muted-foreground">{m.releaseYear}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setEditModel(m)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => del(m)} disabled={deleting === m.id}
                    className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {(showAdd || editModel) && (
        <ModelModal
          model={editModel}
          brands={brands}
          defaultBrandId={activeBrandId || undefined}
          onClose={() => { setShowAdd(false); setEditModel(undefined); }}
          onSaved={() => { handleChanged(); setShowAdd(false); setEditModel(undefined); }}
        />
      )}
    </div>
  );
}

// ── Add Pinout Modal ──────────────────────────────────────────────────────────
function AddPinoutModal({ brands, onClose, onSaved }: { brands: IspBrand[]; onClose: () => void; onSaved: () => void }) {
  const [brandId, setBrandId] = useState<number | "">("");
  const [modelId, setModelId] = useState<number | "">("");
  const [title,   setTitle]   = useState("");
  const [imgUrl,  setImgUrl]  = useState("");
  const [link,    setLink]    = useState("");
  const [err,     setErr]     = useState("");
  const [saving,  setSaving]  = useState(false);

  const { data: models = [] } = useQuery<IspModel[]>({
    queryKey: ["isp-models-select", brandId],
    queryFn: () => fetch(`/api/brands/${brandId}/models`, { credentials: "include" }).then(r => r.json()),
    enabled: !!brandId,
  });

  const selectedBrand = brands.find(b => b.id === Number(brandId));
  const selectedModel = models.find(m => m.id === Number(modelId));

  useEffect(() => {
    if (selectedBrand && selectedModel && !title.trim()) {
      setTitle(`${selectedBrand.name} ${selectedModel.name} ISP Pinout`);
    }
  }, [selectedBrand, selectedModel]);

  function handleBrandChange(val: string) { setBrandId(val ? Number(val) : ""); setModelId(""); setTitle(""); }

  async function save() {
    if (!selectedBrand || !selectedModel) { setErr("Brand and model are required"); return; }
    if (!title.trim() || !imgUrl.trim())  { setErr("Title and Image URL are required"); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/schematics", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          deviceBrand: selectedBrand.name,
          deviceModel: selectedModel.name,
          schematicType: "ISP Pinout",
          fileUrl: imgUrl.trim(),
          thumbnailUrl: link.trim() || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      onSaved(); onClose();
    } catch (e: any) { setErr(e.message); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Add ISP Pinout</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {brands.length === 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            No ISP brands yet. Click <strong>Add Brand</strong> first to create brands and models.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Brand *</label>
            <select value={brandId} onChange={e => handleBrandChange(e.target.value)} className={sel}>
              <option value="">— Select brand —</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Model *</label>
            <select value={modelId} onChange={e => setModelId(e.target.value ? Number(e.target.value) : "")} disabled={!brandId} className={sel}>
              <option value="">— Select model —</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Samsung A05s ISP Pinout" className={inp} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Image URL * <span className="font-normal">(Cloudinary / direct link)</span></label>
          <input value={imgUrl} onChange={e => setImgUrl(e.target.value)} placeholder="https://res.cloudinary.com/…" className={inp} />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">External Link <span className="font-normal">(optional)</span></label>
          <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://…" className={inp} />
        </div>

        {err && <p className="text-xs text-destructive">{err}</p>}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={save} disabled={saving || !brandId || !modelId || !title.trim() || !imgUrl.trim()} className="flex-1">
            {saving ? "Saving…" : "Save Pinout"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Image Zoom ────────────────────────────────────────────────────────────────
function ImageModal({ src, title, link, onClose }: { src: string; title: string; link?: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)" }} onClick={onClose}>
      <div className="w-full max-w-lg space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-white font-semibold text-sm truncate flex-1 pr-4">{title}</p>
          <button onClick={onClose}><X className="w-5 h-5 text-white" /></button>
        </div>
        <img src={src} alt={title} className="w-full rounded-2xl object-contain max-h-[75vh]" />
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm bg-white text-black"
            onClick={e => e.stopPropagation()}>
            <ExternalLink className="w-4 h-4" /> Open Full Diagram
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function IspPinoutAdmin() {
  const qc = useQueryClient();
  const [search,       setSearch]       = useState("");
  const [showAdd,      setShowAdd]      = useState(false);
  const [showBrands,   setShowBrands]   = useState(false);
  const [showModels,   setShowModels]   = useState(false);
  const [zoomed,       setZoomed]       = useState<Pinout | null>(null);
  const [deleting,     setDeleting]     = useState<number | null>(null);

  // Categories → resolve isp id
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories", { credentials: "include" }).then(r => r.json()),
  });
  const ispCategoryId = categories.find(c => c.slug === "isp")?.id;

  // ISP brands
  const { data: brands = [], refetch: refetchBrands } = useQuery<IspBrand[]>({
    queryKey: ["isp-brands", ispCategoryId],
    queryFn: () =>
      fetch(`/api/brands?category_id=${ispCategoryId}`, { credentials: "include" }).then(r => r.json()),
    enabled: ispCategoryId !== undefined,
  });

  // Pinouts
  const { data: raw = [], isLoading, refetch } = useQuery<Pinout[]>({
    queryKey: ["admin-isp-pinouts"],
    queryFn: () =>
      fetch("/api/schematics")
        .then(r => r.json())
        .then((rows: any[]) => rows.filter(r => r.schematicType === "ISP Pinout")),
  });

  const pinouts = search.trim()
    ? raw.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.deviceModel ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.deviceBrand ?? "").toLowerCase().includes(search.toLowerCase()))
    : raw;

  const byBrand: Record<string, Pinout[]> = {};
  for (const p of pinouts) {
    const brand = p.deviceBrand ?? "Other";
    if (!byBrand[brand]) byBrand[brand] = [];
    byBrand[brand].push(p);
  }

  async function deletePinout(id: number) {
    if (!confirm("Delete this pinout? This cannot be undone.")) return;
    setDeleting(id);
    await fetch(`/api/schematics/${id}`, { method: "DELETE", credentials: "include" });
    qc.invalidateQueries({ queryKey: ["admin-isp-pinouts"] });
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ISP & Pinout</h1>
          <p className="text-sm text-muted-foreground">
            Manage ISP pinout diagrams for mobile models · {raw.length} total
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBrands(true)} className="gap-2">
            <Cpu className="h-4 w-4" /> Add Brand
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowModels(true)} className="gap-2">
            <ChevronRight className="h-4 w-4" /> Add Model
          </Button>
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Pinout
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text" placeholder="Search brand or model…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Pinout grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-52 rounded-xl animate-pulse bg-muted" />)}
        </div>
      ) : raw.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-amber-50">
            <Cpu className="w-8 h-8 text-amber-500" />
          </div>
          <p className="font-bold text-base">No pinouts yet</p>
          <p className="text-sm text-muted-foreground">Add brands & models first, then click "Add Pinout".</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowBrands(true)} className="gap-2">
              <Cpu className="h-4 w-4" /> Add Brand
            </Button>
            <Button onClick={() => setShowAdd(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add Pinout
            </Button>
          </div>
        </div>
      ) : pinouts.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No results for "{search}"</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byBrand).map(([brand, items]) => {
            const p = pal(brand);
            return (
              <div key={brand}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: p.bg, color: p.color }}>
                    {brand[0].toUpperCase()}
                  </div>
                  <span className="font-bold text-sm">{brand}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: p.bg, color: p.color }}>
                    {items.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {items.map(pin => (
                    <div key={pin.id} className="rounded-xl border border-border overflow-hidden bg-card relative group">
                      <button className="block w-full relative" onClick={() => pin.fileUrl && setZoomed(pin)}>
                        {pin.fileUrl ? (
                          <img src={pin.fileUrl} alt={pin.title} className="w-full h-36 object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-36 flex items-center justify-center" style={{ background: p.bg }}>
                            <Cpu className="w-8 h-8" style={{ color: p.color }} />
                          </div>
                        )}
                        {pin.fileUrl && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <ZoomIn className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </button>
                      <div className="p-2.5 space-y-1">
                        <p className="text-xs font-bold leading-tight line-clamp-2">{pin.title}</p>
                        {pin.deviceModel && (
                          <p className="text-[10px] font-semibold" style={{ color: p.color }}>{pin.deviceModel}</p>
                        )}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          {pin.thumbnailUrl && (
                            <a href={pin.thumbnailUrl} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] font-semibold text-primary flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> Link
                            </a>
                          )}
                          <button onClick={() => deletePinout(pin.id)} disabled={deleting === pin.id}
                            className="ml-auto text-destructive hover:opacity-80 disabled:opacity-40 transition-opacity">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showBrands && (
        <ManageBrandsPanel
          brands={brands}
          ispCategoryId={ispCategoryId}
          onClose={() => setShowBrands(false)}
          onChanged={() => { refetchBrands(); qc.invalidateQueries({ queryKey: ["isp-brands"] }); }}
        />
      )}
      {showModels && (
        <ManageModelsPanel
          brands={brands}
          onClose={() => setShowModels(false)}
          onChanged={() => qc.invalidateQueries({ queryKey: ["isp-panel-models"] })}
        />
      )}
      {showAdd && (
        <AddPinoutModal
          brands={brands}
          onClose={() => setShowAdd(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-isp-pinouts"] })}
        />
      )}
      {zoomed?.fileUrl && (
        <ImageModal src={zoomed.fileUrl} title={zoomed.title} link={zoomed.thumbnailUrl} onClose={() => setZoomed(null)} />
      )}
    </div>
  );
}
