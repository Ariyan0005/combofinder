import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, BatteryFull, ChevronRight, Search } from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";

const MUTED   = "hsl(var(--muted-foreground))";
const BORDER  = "hsl(var(--border))";
const CARD    = "hsl(var(--card))";
const PRIMARY = "hsl(var(--primary))";
const BG      = "hsl(var(--background))";

const PALETTES = [
  { bg: "#EEF2FF", color: "#6366F1" }, { bg: "#F5F3FF", color: "#8B5CF6" },
  { bg: "#FDF2F8", color: "#EC4899" }, { bg: "#FFF7E6", color: "#F59E0B" },
  { bg: "#ECFDF5", color: "#10B981" }, { bg: "#EFF6FF", color: "#3B82F6" },
  { bg: "#FEF2F2", color: "#EF4444" }, { bg: "#F0FDFF", color: "#06B6D4" },
];
const pal = (name: string) => PALETTES[name.charCodeAt(0) % PALETTES.length];

interface BatteryModel {
  id: number; brandId: number; brandName: string;
  modelNumber: string; capacity?: string; voltage?: string; notes?: string;
}

export default function BatteryBrandPage() {
  const [, params] = useRoute("/battery-brand/:id");
  const [, setLocation] = useLocation();
  const brandId = Number(params?.id);
  const [search, setSearch] = useState("");

  // Fetch brand info
  const { data: allBrands = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["brands-all"],
    queryFn: () => fetch("/api/brands", { credentials: "include" }).then(r => r.json()),
  });
  const brand = allBrands.find(b => b.id === brandId);

  const { data: models = [], isLoading } = useQuery<BatteryModel[]>({
    queryKey: ["battery-models", brandId],
    queryFn: () => fetch(`/api/battery-models?brandId=${brandId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!brandId,
  });

  const filtered = models.filter(m =>
    m.modelNumber.toLowerCase().includes(search.toLowerCase()) ||
    (m.capacity ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedPage>
      <div className="space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <button onClick={() => setLocation("/compatibility?category=battery")}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--muted))", color: MUTED }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold truncate">{brand?.name ?? "Battery"}</h1>
            <p className="text-xs" style={{ color: MUTED }}>
              {models.length} battery model{models.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
          <input
            type="text"
            placeholder="Search model number or capacity…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border text-sm outline-none"
            style={{ borderColor: BORDER, background: CARD }}
          />
        </div>

        {/* Models list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BatteryFull className="w-12 h-12 mx-auto mb-3" style={{ color: MUTED }} />
            <p className="font-semibold">No battery models found</p>
            {search && <p className="text-sm mt-1" style={{ color: MUTED }}>Try a different search</p>}
          </div>
        ) : (
          <div className="rounded-2xl border divide-y overflow-hidden" style={{ borderColor: BORDER, background: CARD }}>
            {filtered.map(m => {
              const p = pal(m.modelNumber);
              return (
                <button key={m.id}
                  onClick={() => setLocation(`/battery-model/${m.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/30 active:bg-muted/50">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: p.bg }}>
                    <BatteryFull className="w-5 h-5" style={{ color: p.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm font-mono">{m.modelNumber}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {m.capacity && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: p.bg, color: p.color }}>{m.capacity}</span>
                      )}
                      {m.voltage && (
                        <span className="text-[11px]" style={{ color: MUTED }}>{m.voltage}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: MUTED }} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}
