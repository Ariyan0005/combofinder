import { useState, type ElementType } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useGetModel } from "@workspace/api-client-react";
import { ArrowLeft, CheckCircle, BadgeCheck, Repeat2, Copy, Check, ZoomIn, ZoomOut, X, ExternalLink, Cpu } from "lucide-react";

type ComboType = "OEM" | "Compatible" | "Refurbished";

const comboTypeConfig: Record<ComboType, { label: string; color: string; bg: string; icon: ElementType }> = {
  OEM:          { label: "OEM",          color: "#1D4ED8", bg: "#EFF6FF", icon: BadgeCheck },
  Compatible:   { label: "Compatible",   color: "#047857", bg: "#ECFDF5", icon: CheckCircle },
  Refurbished:  { label: "Refurbished",  color: "#B45309", bg: "#FFFBEB", icon: Repeat2 },
};

type Pinout = {
  id: number;
  title: string;
  deviceBrand?: string;
  deviceModel?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
};

const MUTED = "hsl(var(--muted-foreground))";
const BORDER = "hsl(var(--border))";
const CARD = "hsl(var(--card))";
const PRIMARY = "hsl(var(--primary))";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors"
      style={{ color: MUTED }}>
      {copied ? <Check className="w-3.5 h-3.5" style={{ color: "#10B981" }} /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ── Image Zoom Modal ──────────────────────────────────────────────────────────
function ImageModal({ src, title, link, onClose }: { src: string; title: string; link?: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const MIN = 0.5;
  const MAX = 4;
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.92)" }}>
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <p className="text-white font-semibold text-sm truncate flex-1 pr-4">{title}</p>
        <button onClick={onClose}><X className="w-5 h-5 text-white" /></button>
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center px-4 pb-4">
        <img src={src} alt={title}
          style={{ transform: `scale(${scale})`, transformOrigin: "center center", transition: "transform 0.2s ease" }}
          className="max-w-full rounded-2xl object-contain" />
      </div>
      <div className="flex-shrink-0 pb-6 px-4 space-y-3">
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setScale(s => Math.max(MIN, parseFloat((s - 0.25).toFixed(2))))}
            disabled={scale <= MIN}
            className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <ZoomOut className="w-5 h-5 text-white" />
          </button>
          <span className="text-white text-sm font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(MAX, parseFloat((s + 0.25).toFixed(2))))}
            disabled={scale >= MAX}
            className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <ZoomIn className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="flex gap-2">
          {scale !== 1 && (
            <button onClick={() => setScale(1)}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>Reset</button>
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

type MainTab = ComboType | "ISP";

export default function ModelDetail() {
  const { id } = useParams<{ id: string }>();
  const modelId = Number(id);
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<MainTab>("OEM");
  const [zoomed, setZoomed] = useState<Pinout | null>(null);

  const partTypeParam = (() => {
    try { return new URLSearchParams(window.location.search).get("type") ?? ""; } catch { return ""; }
  })();

  const { data: model, isLoading } = useGetModel(modelId);

  // Fetch ISP pinouts for this model
  const modelName = (model as any)?.name ?? "";
  const { data: allPinouts = [] } = useQuery<Pinout[]>({
    queryKey: ["isp-pinouts"],
    queryFn: () =>
      fetch("/api/schematics", { credentials: "include" })
        .then(r => r.json())
        .then((rows: any[]) => rows.filter((r: any) => r.schematicType === "ISP Pinout")),
    enabled: !!modelName,
  });

  const modelPinouts = allPinouts.filter(p =>
    modelName && (p.deviceModel ?? "").toLowerCase().includes(modelName.toLowerCase())
  );

  const combos = model?.combos ?? [];

  function goBack() {
    const backPath = partTypeParam ? `/compatibility?type=${partTypeParam}` : "/compatibility";
    navigate(backPath);
  }

  const ALL_TABS: { key: MainTab; label: string }[] = [
    { key: "OEM",         label: `OEM (${combos.filter(c => c.comboType === "OEM").length})` },
    { key: "Compatible",  label: `Compatible (${combos.filter(c => c.comboType === "Compatible").length})` },
    { key: "Refurbished", label: `Refurbished (${combos.filter(c => c.comboType === "Refurbished").length})` },
    { key: "ISP",         label: `ISP (${modelPinouts.length})` },
  ];

  return (
    <div className="space-y-4">
      <button onClick={goBack}
        className="flex items-center gap-1.5 text-sm font-medium"
        style={{ color: MUTED }}>
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: PRIMARY, borderTopColor: "transparent" }} />
        </div>
      ) : !model ? (
        <div className="text-center py-12" style={{ color: MUTED }}>Model not found.</div>
      ) : (
        <>
          {/* Model info card */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h1 className="text-xl font-extrabold">{model.name}</h1>
            <p className="text-sm mt-0.5" style={{ color: MUTED }}>
              {(model as any).brand?.name ?? (model as any).brandName ?? ""}
              {(model as any).releaseYear ? ` · Released ${(model as any).releaseYear}` : ""}
            </p>
            <div className="flex gap-3 mt-3 flex-wrap">
              {(["OEM", "Compatible", "Refurbished"] as ComboType[]).map(t => {
                const count = combos.filter(c => c.comboType === t).length;
                const cfg = comboTypeConfig[t];
                return (
                  <span key={t} className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}: {count}
                  </span>
                );
              })}
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: "#FFF7E6", color: "#F59E0B" }}>
                ISP: {modelPinouts.length}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {ALL_TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={key === activeTab
                  ? { background: PRIMARY, color: "#fff" }
                  : { background: CARD, color: MUTED, border: `1px solid ${BORDER}` }}>
                {label}
              </button>
            ))}
          </div>

          {/* Combo tab content */}
          {activeTab !== "ISP" && (() => {
            const filtered = combos.filter(c => c.comboType === activeTab);
            const cfg = comboTypeConfig[activeTab as ComboType];
            return filtered.length === 0 ? (
              <div className="text-center py-10 text-sm" style={{ color: MUTED }}>
                No {cfg.label} combos available.
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
                {filtered.map((combo: any) => {
                  const displayName = combo.name ?? combo.comboCode ?? "—";
                  return (
                    <div key={combo.id} className="p-4 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{displayName}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                          {combo.qualityGrade && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: "hsl(var(--muted))", color: MUTED }}>
                              {combo.qualityGrade}
                            </span>
                          )}
                          {combo.inStock
                            ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#ECFDF5", color: "#059669" }}>In Stock</span>
                            : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF2F2", color: "#DC2626" }}>Out of Stock</span>}
                        </div>
                        {combo.notes && <p className="text-xs mt-1" style={{ color: MUTED }}>{combo.notes}</p>}
                        {combo.priceRange && <p className="text-xs mt-0.5 font-semibold" style={{ color: PRIMARY }}>{combo.priceRange}</p>}
                      </div>
                      <CopyButton text={displayName} />
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ISP tab content */}
          {activeTab === "ISP" && (
            <div>
              {modelPinouts.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "#FFF7E6" }}>
                    <Cpu className="w-7 h-7" style={{ color: "#F59E0B" }} />
                  </div>
                  <p className="font-bold text-sm">No ISP pinouts for this model</p>
                  <p className="text-xs" style={{ color: MUTED }}>Admin will add pinout diagrams soon.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {modelPinouts.map(p => (
                    <div key={p.id} className="rounded-2xl border overflow-hidden relative"
                      style={{ borderColor: BORDER, background: CARD }}>
                      <button className="block w-full" onClick={() => setZoomed(p)}>
                        {p.fileUrl ? (
                          <img src={p.fileUrl} alt={p.title} className="w-full h-36 object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-36 flex items-center justify-center" style={{ background: "#FFF7E6" }}>
                            <Cpu className="w-10 h-10" style={{ color: "#F59E0B" }} />
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
                          <p className="text-[10px] font-semibold" style={{ color: "#F59E0B" }}>{p.deviceModel}</p>
                        )}
                        {p.thumbnailUrl && (
                          <a href={p.thumbnailUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] font-semibold"
                            style={{ color: PRIMARY }}>
                            <ExternalLink className="w-3 h-3" /> Link
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {zoomed && (
        <ImageModal
          src={zoomed.fileUrl!}
          title={zoomed.title}
          link={zoomed.thumbnailUrl}
          onClose={() => setZoomed(null)}
        />
      )}
    </div>
  );
}
