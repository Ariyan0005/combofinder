import { useState, type ElementType } from "react";
import { useParams, useLocation } from "wouter";
import { useGetModel } from "@workspace/api-client-react";
import { ArrowLeft, CheckCircle, BadgeCheck, Repeat2, Copy, Check } from "lucide-react";

type ComboType = "OEM" | "Compatible" | "Refurbished";

const comboTypeConfig: Record<ComboType, { label: string; color: string; bg: string; icon: ElementType }> = {
  OEM:          { label: "OEM",          color: "#1D4ED8", bg: "#EFF6FF", icon: BadgeCheck },
  Compatible:   { label: "Compatible",   color: "#047857", bg: "#ECFDF5", icon: CheckCircle },
  Refurbished:  { label: "Refurbished",  color: "#B45309", bg: "#FFFBEB", icon: Repeat2 },
};

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
      style={{ color: "hsl(var(--muted-foreground))" }}>
      {copied ? <Check className="w-3.5 h-3.5" style={{ color: "#10B981" }} /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function ModelDetail() {
  const { id } = useParams<{ id: string }>();
  const modelId = Number(id);
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<ComboType>("OEM");

  const { data: model, isLoading } = useGetModel(modelId);

  const combos = model?.combos ?? [];
  const filtered = combos.filter(c => c.comboType === activeTab);

  return (
    <div className="space-y-4">
      <button onClick={() => navigate("/compatibility")}
        className="flex items-center gap-1.5 text-sm font-medium"
        style={{ color: "hsl(var(--muted-foreground))" }}>
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
        </div>
      ) : !model ? (
        <div className="text-center py-12" style={{ color: "hsl(var(--muted-foreground))" }}>Model not found.</div>
      ) : (
        <>
          {/* Model info card */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h1 className="text-xl font-extrabold">{model.name}</h1>
            <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              {model.brand?.name ?? ""}
              {model.releaseYear ? ` · Released ${model.releaseYear}` : ""}
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
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {(["OEM", "Compatible", "Refurbished"] as ComboType[]).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={t === activeTab
                  ? { background: "hsl(var(--primary))", color: "#fff" }
                  : { background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
                {comboTypeConfig[t].label} ({combos.filter(c => c.comboType === t).length})
              </button>
            ))}
          </div>

          {/* Combos list */}
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              No {comboTypeConfig[activeTab].label} combos available.
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
              {filtered.map(combo => {
                const cfg = comboTypeConfig[activeTab];
                return (
                  <div key={combo.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{combo.comboCode}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        {combo.inStock
                          ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#ECFDF5", color: "#059669" }}>In Stock</span>
                          : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF2F2", color: "#DC2626" }}>Out of Stock</span>}
                      </div>
                      {combo.notes && (
                        <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{combo.notes}</p>
                      )}
                    </div>
                    <CopyButton text={combo.comboCode} />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
