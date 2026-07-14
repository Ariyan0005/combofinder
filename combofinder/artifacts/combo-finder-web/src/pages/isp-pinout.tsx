import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search, Plus, X, Cpu, ExternalLink, ArrowLeft, ZoomIn, ZoomOut, Trash2,
} from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";
import { useAuth } from "@/context/auth-context";

const PRIMARY = "hsl(var(--primary))";
const MUTED   = "hsl(var(--muted-foreground))";
const BORDER  = "hsl(var(--border))";
const CARD    = "hsl(var(--card))";

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

type Pinout = {
  id: number;
  title: string;
  deviceBrand?: string;
  deviceModel?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  tags?: string;
};

// ── Admin Add Form ────────────────────────────────────────────────────────────
function AddPinoutSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [brand,  setBrand]  = useState("");
  const [model,  setModel]  = useState("");
  const [title,  setTitle]  = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [link,   setLink]   = useState("");
  const [err,    setErr]    = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="rounded-t-3xl p-5 space-y-4" style={{ background: CARD }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">Add ISP Pinout</h3>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: MUTED }} /></button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: MUTED }}>Brand</label>
            <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Samsung"
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: BORDER }} />
          </div>
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: MUTED }}>Model</label>
            <input value={model} onChange={e => setModel(e.target.value)} placeholder="A05s"
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: BORDER }} />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold block mb-1" style={{ color: MUTED }}>Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Samsung A05s ISP Pinout"
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: BORDER }} />
        </div>

        <div>
          <label className="text-[11px] font-semibold block mb-1" style={{ color: MUTED }}>
            Image URL * <span className="font-normal">(Cloudinary / direct image link)</span>
          </label>
          <input value={imgUrl} onChange={e => setImgUrl(e.target.value)}
            placeholder="https://res.cloudinary.com/…"
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: BORDER }} />
        </div>

        <div>
          <label className="text-[11px] font-semibold block mb-1" style={{ color: MUTED }}>
            External Link <span className="font-normal">(optional — full diagram / source)</span>
          </label>
          <input value={link} onChange={e => setLink(e.target.value)}
            placeholder="https://…"
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: BORDER }} />
        </div>

        {err && <p className="text-xs" style={{ color: "hsl(var(--destructive))" }}>{err}</p>}

        <button onClick={save} disabled={saving}
          className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60"
          style={{ background: PRIMARY }}>
          {saving ? "Saving…" : "Save Pinout"}
        </button>
      </div>
    </div>
  );
}

// ── Image Zoom Modal ──────────────────────────────────────────────────────────
function ImageModal({ src, title, link, onClose }: { src: string; title: string; link?: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const MIN = 0.5;
  const MAX = 4;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.92)" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <p className="text-white font-semibold text-sm truncate flex-1 pr-4">{title}</p>
        <button onClick={onClose}><X className="w-5 h-5 text-white" /></button>
      </div>

      {/* Scrollable image area */}
      <div className="flex-1 overflow-auto flex items-center justify-center px-4 pb-4">
        <img
          src={src}
          alt={title}
          style={{ transform: `scale(${scale})`, transformOrigin: "center center", transition: "transform 0.2s ease" }}
          className="max-w-full rounded-2xl object-contain"
        />
      </div>

      {/* Bottom controls */}
      <div className="flex-shrink-0 pb-6 px-4 space-y-3">
        {/* Zoom controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setScale(s => Math.max(MIN, parseFloat((s - 0.25).toFixed(2))))}
            disabled={scale <= MIN}
            className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <ZoomOut className="w-5 h-5 text-white" />
          </button>
          <span className="text-white text-sm font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(s => Math.min(MAX, parseFloat((s + 0.25).toFixed(2))))}
            disabled={scale >= MAX}
            className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <ZoomIn className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Reset & External link */}
        <div className="flex gap-2">
          {scale !== 1 && (
            <button onClick={() => setScale(1)}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
              Reset
            </button>
          )}
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: "#fff", color: "#111" }}>
              <ExternalLink className="w-4 h-4" /> Open Full Diagram
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pinout Card ───────────────────────────────────────────────────────────────
function PinoutCard({
  p, palette, canAdd, deleting, onZoom, onDelete,
}: {
  p: Pinout;
  palette: { bg: string; color: string };
  canAdd: boolean;
  deleting: number | null;
  onZoom: (p: Pinout) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="rounded-2xl border overflow-hidden relative" style={{ borderColor: BORDER, background: CARD }}>
      <button className="block w-full" onClick={() => onZoom(p)}>
        {p.fileUrl ? (
          <img src={p.fileUrl} alt={p.title} className="w-full h-36 object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-36 flex items-center justify-center" style={{ background: palette.bg }}>
            <Cpu className="w-10 h-10" style={{ color: palette.color }} />
          </div>
        )}
        {p.fileUrl && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
            <ZoomIn className="w-7 h-7 text-white" />
          </div>
        )}
      </button>
      <div className="p-2.5 space-y-1">
        <p className="text-xs font-bold leading-tight line-clamp-2">{p.title}</p>
        {p.deviceModel && (
          <p className="text-[10px] font-semibold" style={{ color: palette.color }}>{p.deviceModel}</p>
        )}
        <div className="flex items-center gap-1.5 pt-0.5">
          {p.thumbnailUrl && (
            <a href={p.thumbnailUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-semibold"
              style={{ color: PRIMARY }}>
              <ExternalLink className="w-3 h-3" /> Link
            </a>
          )}
          {canAdd && (
            <button onClick={() => onDelete(p.id)} disabled={deleting === p.id}
              className="ml-auto disabled:opacity-40" style={{ color: "hsl(var(--destructive))" }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function IspPinout() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [zoomed, setZoomed] = useState<Pinout | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: raw = [], isLoading } = useQuery<Pinout[]>({
    queryKey: ["isp-pinouts"],
    queryFn: () =>
      fetch("/api/schematics", { credentials: "include" })
        .then(r => r.json())
        .then((rows: any[]) => rows.filter(r => r.schematicType === "ISP Pinout")),
  });

  const canAdd = user?.role === "admin" || user?.role === "superadmin";

  // Unique brands from data
  const allBrands = Array.from(
    new Set(raw.map(p => p.deviceBrand ?? "Other").filter(Boolean))
  ).sort();

  // Filter logic
  const displayList: Pinout[] = (() => {
    let list = raw;
    if (selectedBrand) {
      list = list.filter(p => (p.deviceBrand ?? "Other") === selectedBrand);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.deviceModel ?? "").toLowerCase().includes(q) ||
        (p.deviceBrand ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  })();

  // Group displayed list by brand
  const byBrand: Record<string, Pinout[]> = {};
  for (const p of displayList) {
    const brand = p.deviceBrand ?? "Other";
    if (!byBrand[brand]) byBrand[brand] = [];
    byBrand[brand].push(p);
  }

  async function deletePinout(id: number) {
    if (!confirm("Delete this pinout?")) return;
    setDeleting(id);
    await fetch(`/api/schematics/${id}`, { method: "DELETE", credentials: "include" });
    qc.invalidateQueries({ queryKey: ["isp-pinouts"] });
    setDeleting(null);
  }

  const isSearching = search.trim().length > 0;

  return (
    <ProtectedPage>
      <div className="space-y-4 pb-8">

        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {selectedBrand && (
              <button onClick={() => { setSelectedBrand(null); setSearch(""); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl"
                style={{ background: "hsl(var(--muted))" }}>
                <ArrowLeft className="w-4 h-4" style={{ color: MUTED }} />
              </button>
            )}
            <div>
              <h1 className="text-xl font-extrabold">
                {selectedBrand ? selectedBrand : "ISP & Pinout"}
              </h1>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                {selectedBrand
                  ? `${displayList.length} pinout${displayList.length !== 1 ? "s" : ""} for ${selectedBrand}`
                  : "Mobile model-wise ISP pinout diagrams"}
              </p>
            </div>
          </div>
          {canAdd && (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold"
              style={{ background: PRIMARY }}>
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); if (e.target.value) setSelectedBrand(null); }}
            placeholder={selectedBrand ? `Search in ${selectedBrand}…` : "Search brand or model…"}
            className="w-full pl-10 pr-10 py-3 rounded-2xl border text-sm outline-none"
            style={{ borderColor: BORDER, background: CARD }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4" style={{ color: MUTED }} />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
            ))}
          </div>
        ) : raw.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "#FFF7E6" }}>
              <Cpu className="w-8 h-8" style={{ color: "#F59E0B" }} />
            </div>
            <p className="font-bold text-base">No pinouts yet</p>
            <p className="text-sm" style={{ color: MUTED }}>
              {canAdd ? "Tap + Add to upload the first ISP pinout diagram." : "Admin will add pinout diagrams soon."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Brand chips — only when not searching and no brand selected */}
            {!isSearching && !selectedBrand && allBrands.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-2.5" style={{ color: MUTED }}>Browse by Brand</p>
                <div className="flex gap-2 flex-wrap">
                  {allBrands.map(brand => {
                    const pal = brandPalette(brand);
                    const initials = brand.split(/[\s/]/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                    return (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all hover:shadow-sm"
                        style={{ borderColor: BORDER, background: CARD }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
                          style={{ background: pal.bg, color: pal.color }}>
                          {initials}
                        </div>
                        <span className="text-sm font-semibold">{brand}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: pal.bg, color: pal.color }}>
                          {raw.filter(p => (p.deviceBrand ?? "Other") === brand).length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No results */}
            {displayList.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: MUTED }}>
                {isSearching ? `No results for "${search}"` : `No pinouts for ${selectedBrand}`}
              </p>
            ) : (
              /* Pinout groups */
              Object.entries(byBrand).map(([brand, items]) => {
                const palette = brandPalette(brand);
                return (
                  <div key={brand}>
                    {/* Brand header (show when multiple brands visible) */}
                    {(isSearching || !selectedBrand) && (
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{ background: palette.bg, color: palette.color }}>
                          {brand[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-sm">{brand}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: palette.bg, color: palette.color }}>
                          {items.length}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {items.map(p => (
                        <PinoutCard
                          key={p.id}
                          p={p}
                          palette={brandPalette(p.deviceBrand ?? "Other")}
                          canAdd={canAdd}
                          deleting={deleting}
                          onZoom={setZoomed}
                          onDelete={deletePinout}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {showAdd && (
        <AddPinoutSheet
          onClose={() => setShowAdd(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["isp-pinouts"] })}
        />
      )}
      {zoomed && (
        <ImageModal
          src={zoomed.fileUrl!}
          title={zoomed.title}
          link={zoomed.thumbnailUrl}
          onClose={() => setZoomed(null)}
        />
      )}
    </ProtectedPage>
  );
}
