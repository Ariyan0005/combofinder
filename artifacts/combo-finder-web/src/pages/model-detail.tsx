import { useState, type ElementType } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, BadgeCheck, Repeat2, Copy, Check, ZoomIn, ZoomOut, X, ExternalLink, Cpu } from "lucide-react";

type CompatType = "OEM" | "Compatible" | "Refurbished";

const compatTypeConfig: Record<CompatType, { label: string; color: string; bg: string; icon: ElementType }> = {
  OEM:          { label: "OEM",          color: "#1D4ED8", bg: "#EFF6FF", icon: BadgeCheck },
  Compatible:   { label: "Compatible",   color: "#047857", bg: "#ECFDF5", icon: CheckCircle },
  Refurbished:  { label: "Refurbished",  color: "#B45309", bg: "#FFFBEB", icon: Repeat2 },
};

type Compatibility = {
  id: number; name: string; comboType: CompatType;
  qualityGrade?: string | null; notes?: string | null;
};

type Pinout = {
  id: number; title: string; deviceBrand?: string; deviceModel?: string;
  fileUrl?: string; thumbnailUrl?: string;
};

const MUTED  = "hsl(var(--muted-foreground))";
const BORDER = "hsl(var(--border))";
const CARD   = "hsl(var(--card))";
const PRIMARY = "hsl(var(--primary))";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors"
      style={{ color: MUTED }}>
      {copied ? <Check className="w-3.5 h-3.5" style={{ color: "#10B981" }} /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function ImageModal({ src, title, link, onClose }: { src: string; title: string; link?: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
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
          <button onClick={() => setScale(s => Math.max(0.5, parseFloat((s - 0.25).toFixed(2))))} disabled={scale <= 0.5}
            className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <ZoomOut className="w-5 h-5 text-white" />
          </button>
          <span className="text-white text-sm font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(4, parseFloat((s + 0.25).toFixed(2))))} disabled={scale >= 4}
            className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <ZoomIn className="w-5 h-5 text-white" />
          </button>
        </div>
        {scale !== 1 && (
          <button onClick={() => setScale(1)} className="w-full py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
            Reset Zoom
          </button>
        )}
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: PRIMARY, color: "#fff" }}>
            <ExternalLink className="w-4 h-4" /> Open Full Size
          </a>
        )}
      </div>
    </div>
  );
}

type MainTab = CompatType;

function useModel(id: number) {
  return useQuery({
    queryKey: ["model", id],
    queryFn: () => fetch(`/api/models/${id}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export default function ModelDetail() {
  const { id } = useParams<{ id: string }>();
  const modelId = Number(id);

  const { data: model, isLoading } = useModel(modelId);

  const compatibilities: Compatibility[] = model?.combos ?? [];

  const [activeTab, setActiveTab] = useState<MainTab>("Compatible");

  const tabs: { key: MainTab; label: string }[] = [
    { key: "OEM",         label: `OEM (${compatibilities.filter(c => c.comboType === "OEM").length})` },
    { key: "Compatible",  label: `Compatible (${compatibilities.filter(c => c.comboType === "Compatible").length})` },
    { key: "Refurbished", label: `Refurbished (${compatibilities.filter(c => c.comboType === "Refurbished").length})` },
  ].filter(t => compatibilities.some(c => c.comboType === t.key) || t.key === "Compatible");

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: PRIMARY, borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <div className="min-h-screen pb-16" style={{ background: "hsl(var(--background))" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => window.history.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "hsl(var(--card))", border: `1px solid ${BORDER}` }}>
          <ArrowLeft className="w-4.5 h-4.5" style={{ color: MUTED }} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: MUTED }}>{model?.brandName}</p>
          <h1 className="text-xl font-extrabold leading-tight truncate">{model?.name}</h1>
        </div>
        <CopyButton text={model?.name ?? ""} />
      </div>

      {/* Tabs */}
      <div className="px-4 overflow-x-auto">
        <div className="flex gap-2 py-2 w-max">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
                style={isActive
                  ? { background: PRIMARY, color: "#fff" }
                  : { background: "hsl(var(--muted))", color: MUTED }}>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {(() => {
        const filtered = compatibilities.filter(c => c.comboType === activeTab);
        const cfg = compatTypeConfig[activeTab];
        if (filtered.length === 0) return (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium" style={{ color: MUTED }}>No {cfg.label} entries available.</p>
          </div>
        );
        return (
          <div className="px-4 space-y-2 mt-2">
            {filtered.map((c) => {
              const Icon = cfg.icon;
              return (
                <div key={c.id} className="p-4 flex items-start justify-between gap-3 rounded-2xl border"
                  style={{ background: CARD, borderColor: BORDER }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: cfg.bg }}>
                      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-snug">{c.name}</p>
                      {c.qualityGrade && <p className="text-xs mt-0.5 font-semibold" style={{ color: MUTED }}>Grade: {c.qualityGrade}</p>}
                      {c.notes && <p className="text-xs mt-1" style={{ color: MUTED }}>{c.notes}</p>}
                    </div>
                  </div>
                  <CopyButton text={c.name} />
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
