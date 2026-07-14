import { useState, type ElementType } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, CheckCircle, BadgeCheck, Repeat2,
  Share2, Check, ZoomIn, ZoomOut, X, ExternalLink,
} from "lucide-react";

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

function ShareButton({ title, text }: { title: string; text: string }) {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95"
      style={{ background: "#F1F5F9", color: "#64748B" }}
    >
      {shared
        ? <><Check className="w-4 h-4" style={{ color: "#10B981" }} /> Copied!</>
        : <><Share2 className="w-4 h-4" /> Share</>
      }
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
            style={{ background: "#6C47FF", color: "#fff" }}>
            <ExternalLink className="w-4 h-4" /> Open Full Size
          </a>
        )}
      </div>
    </div>
  );
}

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

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F1F5F9" }}>
      <div className="w-7 h-7 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: "#6C47FF", borderTopColor: "transparent" }} />
    </div>
  );

  // Build breadcrumb: category → brand, or just brand
  const breadcrumb = [model?.categoryName, model?.brandName]
    .filter(Boolean)
    .join(" / ") || "—";

  return (
    <div className="min-h-screen pb-20" style={{ background: "#F1F5F9" }}>

      {/* Back button */}
      <div className="px-4 pt-5 pb-3">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "#64748B" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Model card */}
      <div className="mx-4 rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-5">
          {/* Breadcrumb */}
          <p className="text-xs font-semibold mb-1" style={{ color: "#6C47FF" }}>
            {breadcrumb}
          </p>

          {/* Name + share row */}
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-extrabold leading-tight flex-1" style={{ color: "#0F172A" }}>
              {model?.name}
            </h1>
            <div className="pt-1">
              <ShareButton title={model?.name ?? "ComboFinder"} text={`Check out ${model?.name} on ComboFinder`} />
            </div>
          </div>

          {/* Availability dot */}
          <div className="mt-3 flex items-center gap-2">
            <span
              className="inline-block w-3.5 h-3.5 rounded-full"
              style={{ background: "#22C55E", boxShadow: "0 0 0 3px rgba(34,197,94,0.25)" }}
            />
          </div>
        </div>
      </div>

      {/* Combos section */}
      <div className="mt-5 px-4">
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#94A3B8" }}>
          Display Combos ({compatibilities.length})
        </p>

        {compatibilities.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm px-4 py-10 text-center">
            <p className="text-sm font-medium" style={{ color: "#94A3B8" }}>
              No combos available for this model yet
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {compatibilities.map(c => {
              const cfg = compatTypeConfig[c.comboType] ?? compatTypeConfig["Compatible"];
              const Icon = cfg.icon;
              return (
                <div key={c.id}
                  className="bg-white rounded-2xl shadow-sm px-4 py-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: cfg.bg }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-snug" style={{ color: "#0F172A" }}>{c.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {c.comboType}
                      </span>
                      {c.qualityGrade && (
                        <span className="text-[11px] font-medium" style={{ color: "#64748B" }}>
                          Grade: {c.qualityGrade}
                        </span>
                      )}
                    </div>
                    {c.notes && (
                      <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{c.notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
