import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Trash2, X, ExternalLink, ZoomIn, Cpu, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Pinout = {
  id: number;
  title: string;
  deviceBrand?: string;
  deviceModel?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  schematicType?: string;
  tags?: string;
};

const BRAND_PALETTES = [
  { bg: "#EEF2FF", color: "#6366F1" },
  { bg: "#F5F3FF", color: "#8B5CF6" },
  { bg: "#FDF2F8", color: "#EC4899" },
  { bg: "#FFF7E6", color: "#F59E0B" },
  { bg: "#ECFDF5", color: "#10B981" },
  { bg: "#EFF6FF", color: "#3B82F6" },
  { bg: "#FEF2F2", color: "#EF4444" },
  { bg: "#F0FDFF", color: "#06B6D4" },
];
function brandPalette(name: string) {
  return BRAND_PALETTES[(name ?? "?").charCodeAt(0) % BRAND_PALETTES.length];
}

// ── Add Form ──────────────────────────────────────────────────────────────────
function AddPinoutModal({
  onClose, onSaved, brandSuggestions, modelSuggestions,
}: {
  onClose: () => void;
  onSaved: () => void;
  brandSuggestions: string[];
  modelSuggestions: string[];
}) {
  const [brand,  setBrand]  = useState("");
  const [model,  setModel]  = useState("");
  const [title,  setTitle]  = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [link,   setLink]   = useState("");
  const [err,    setErr]    = useState("");
  const [saving, setSaving] = useState(false);

  function handleBrandChange(val: string) {
    setBrand(val);
    if (val && model && !title.trim()) setTitle(`${val} ${model} ISP Pinout`);
  }
  function handleModelChange(val: string) {
    setModel(val);
    if (brand && val && !title.trim()) setTitle(`${brand} ${val} ISP Pinout`);
  }

  async function save() {
    if (!brand.trim() || !model.trim()) { setErr("Brand and model are required"); return; }
    if (!title.trim() || !imgUrl.trim()) { setErr("Title and Image URL are required"); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/schematics", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          deviceBrand: brand.trim() || null,
          deviceModel: model.trim() || null,
          schematicType: "ISP Pinout",
          fileUrl: imgUrl.trim(),
          thumbnailUrl: link.trim() || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      onSaved();
      onClose();
    } catch (e: any) { setErr(e.message); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Add ISP Pinout</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Independent brand + model inputs — not tied to display brands */}
        <datalist id="isp-brand-list">
          {brandSuggestions.map(b => <option key={b} value={b} />)}
        </datalist>
        <datalist id="isp-model-list">
          {modelSuggestions.map(m => <option key={m} value={m} />)}
        </datalist>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Brand *</label>
            <input
              list="isp-brand-list"
              value={brand}
              onChange={e => handleBrandChange(e.target.value)}
              placeholder="e.g. Samsung"
              className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Model *</label>
            <input
              list="isp-model-list"
              value={model}
              onChange={e => handleModelChange(e.target.value)}
              placeholder="e.g. A05s"
              className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Samsung A05s ISP Pinout"
            className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">
            Image URL * <span className="font-normal">(Cloudinary / direct image link)</span>
          </label>
          <input value={imgUrl} onChange={e => setImgUrl(e.target.value)}
            placeholder="https://res.cloudinary.com/…"
            className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">
            External Link <span className="font-normal">(optional — full diagram / source)</span>
          </label>
          <input value={link} onChange={e => setLink(e.target.value)}
            placeholder="https://…"
            className="w-full px-3 py-2 rounded-lg border border-border bg-input text-sm text-foreground outline-none focus:ring-1 focus:ring-primary" />
        </div>

        {err && <p className="text-xs text-destructive">{err}</p>}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={save} disabled={saving || !brand.trim() || !model.trim() || !title.trim() || !imgUrl.trim()} className="flex-1">
            {saving ? "Saving…" : "Save Pinout"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Image Zoom ─────────────────────────────────────────────────────────────────
function ImageModal({ src, title, link, onClose }: { src: string; title: string; link?: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)" }}
      onClick={onClose}>
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
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [zoomed, setZoomed] = useState<Pinout | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

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
        (p.deviceBrand ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : raw;

  // Unique brand + model suggestions for the add form (independent of display brands)
  const brandSuggestions = useMemo(() =>
    Array.from(new Set(raw.map(p => p.deviceBrand).filter(Boolean) as string[])).sort(),
    [raw]);
  const modelSuggestions = useMemo(() =>
    Array.from(new Set(raw.map(p => p.deviceModel).filter(Boolean) as string[])).sort(),
    [raw]);

  // Group by brand
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
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
            type="text"
            placeholder="Search brand or model…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-52 rounded-xl animate-pulse bg-muted" />
          ))}
        </div>
      ) : raw.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-amber-50">
            <Cpu className="w-8 h-8 text-amber-500" />
          </div>
          <p className="font-bold text-base">No pinouts yet</p>
          <p className="text-sm text-muted-foreground">Click "Add Pinout" to upload the first ISP pinout diagram.</p>
          <Button onClick={() => setShowAdd(true)} className="gap-2 mt-2">
            <Plus className="h-4 w-4" /> Add First Pinout
          </Button>
        </div>
      ) : pinouts.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No results for "{search}"
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byBrand).map(([brand, items]) => {
            const palette = brandPalette(brand);
            return (
              <div key={brand}>
                {/* Brand header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: palette.bg, color: palette.color }}>
                    {brand[0].toUpperCase()}
                  </div>
                  <span className="font-bold text-sm">{brand}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: palette.bg, color: palette.color }}>
                    {items.length}
                  </span>
                </div>

                {/* Pinout grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {items.map(p => (
                    <div key={p.id} className="rounded-xl border border-border overflow-hidden bg-card relative group">
                      {/* Image */}
                      <button className="block w-full relative" onClick={() => p.fileUrl && setZoomed(p)}>
                        {p.fileUrl ? (
                          <img src={p.fileUrl} alt={p.title}
                            className="w-full h-36 object-cover"
                            loading="lazy" />
                        ) : (
                          <div className="w-full h-36 flex items-center justify-center"
                            style={{ background: palette.bg }}>
                            <Cpu className="w-8 h-8" style={{ color: palette.color }} />
                          </div>
                        )}
                        {p.fileUrl && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <ZoomIn className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </button>

                      {/* Info */}
                      <div className="p-2.5 space-y-1">
                        <p className="text-xs font-bold leading-tight line-clamp-2">{p.title}</p>
                        {p.deviceModel && (
                          <p className="text-[10px] font-semibold" style={{ color: palette.color }}>
                            {p.deviceModel}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          {p.thumbnailUrl && (
                            <a href={p.thumbnailUrl} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] font-semibold text-primary flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> Link
                            </a>
                          )}
                          <button
                            onClick={() => deletePinout(p.id)}
                            disabled={deleting === p.id}
                            className="ml-auto text-destructive hover:opacity-80 disabled:opacity-40 transition-opacity"
                            title="Delete">
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

      {showAdd && (
        <AddPinoutModal
          onClose={() => setShowAdd(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-isp-pinouts"] })}
          brandSuggestions={brandSuggestions}
          modelSuggestions={modelSuggestions}
        />
      )}
      {zoomed && zoomed.fileUrl && (
        <ImageModal
          src={zoomed.fileUrl}
          title={zoomed.title}
          link={zoomed.thumbnailUrl}
          onClose={() => setZoomed(null)}
        />
      )}
    </div>
  );
}
