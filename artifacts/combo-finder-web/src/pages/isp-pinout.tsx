import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Plus, X, Cpu, ExternalLink, ChevronDown, Trash2, ZoomIn,
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
  fileUrl?: string;       // image url (cloudinary)
  thumbnailUrl?: string;  // link url (optional)
  tags?: string;
};

// ── Admin Add Form ────────────────────────────────────────────────────────────
function AddPinoutSheet({
  onClose, onSaved,
}: { onClose: () => void; onSaved: () => void }) {
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
        method: "POST", credentials: "include",
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
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)" }}
      onClick={onClose}>
      <div className="w-full max-w-md space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-white font-semibold text-sm truncate flex-1">{title}</p>
          <button onClick={onClose}><X className="w-5 h-5 text-white" /></button>
        </div>
        <img src={src} alt={title} className="w-full rounded-2xl object-contain max-h-[70vh]" />
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: "#fff", color: "#111" }}
            onClick={e => e.stopPropagation()}>
            <ExternalLink className="w-4 h-4" /> Open Full Diagram
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function IspPinout() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [zoomed, setZoomed] = useState<Pinout | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: raw = [], isLoading } = useQuery<Pinout[]>({
    queryKey: ["isp-pinouts"],
    queryFn: () => fetch("/api/schematics", { credentials: "include" })
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

  // Group by brand
  const byBrand: Record<string, Pinout[]> = {};
  for (const p of pinouts) {
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

  // Only show admin add button — simple check: user is authenticated (all users can add for now;
  // refine with a role flag if needed in the future)
  const canAdd = !!user;

  return (
    <ProtectedPage>
      <div className="space-y-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-extrabold">ISP & Pinout</h1>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>Mobile model-wise ISP pinout diagrams</p>
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
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search brand or model… e.g. Samsung A05s"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm outline-none"
            style={{ borderColor: BORDER, background: CARD }} />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
            ))}
          </div>
        ) : raw.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: "#FFF7E6" }}>
              <Cpu className="w-8 h-8" style={{ color: "#F59E0B" }} />
            </div>
            <p className="font-bold text-base">No pinouts yet</p>
            <p className="text-sm" style={{ color: MUTED }}>
              {canAdd ? "Tap + Add to upload the first ISP pinout diagram." : "Admin will add pinout diagrams soon."}
            </p>
          </div>
        ) : pinouts.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: MUTED }}>No results for "{search}"</p>
        ) : (
          <div className="space-y-5">
            {Object.entries(byBrand).map(([brand, items]) => {
              const palette = brandPalette(brand);
              return (
                <div key={brand}>
                  {/* Brand header */}
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

                  {/* Pinout grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {items.map(p => (
                      <div key={p.id} className="rounded-2xl border overflow-hidden relative group"
                        style={{ borderColor: BORDER, background: CARD }}>
                        {/* Image */}
                        <button className="block w-full" onClick={() => setZoomed(p)}>
                          {p.fileUrl ? (
                            <img src={p.fileUrl} alt={p.title}
                              className="w-full h-36 object-cover"
                              loading="lazy" />
                          ) : (
                            <div className="w-full h-36 flex items-center justify-center"
                              style={{ background: palette.bg }}>
                              <Cpu className="w-10 h-10" style={{ color: palette.color }} />
                            </div>
                          )}
                          {/* Zoom overlay */}
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                            <ZoomIn className="w-7 h-7 text-white" />
                          </div>
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
                                className="flex items-center gap-1 text-[10px] font-semibold"
                                style={{ color: PRIMARY }}>
                                <ExternalLink className="w-3 h-3" /> Link
                              </a>
                            )}
                            {canAdd && (
                              <button onClick={() => deletePinout(p.id)}
                                disabled={deleting === p.id}
                                className="ml-auto disabled:opacity-40"
                                style={{ color: "hsl(var(--destructive))" }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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
