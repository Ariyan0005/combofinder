import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Smartphone, Cpu, Search } from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";

const MUTED   = "hsl(var(--muted-foreground))";
const BORDER  = "hsl(var(--border))";
const CARD    = "hsl(var(--card))";
const PRIMARY = "hsl(var(--primary))";

const PALETTES = [
  { bg: "#EEF2FF", color: "#6366F1" }, { bg: "#F5F3FF", color: "#8B5CF6" },
  { bg: "#FDF2F8", color: "#EC4899" }, { bg: "#FFF7E6", color: "#F59E0B" },
  { bg: "#ECFDF5", color: "#10B981" }, { bg: "#EFF6FF", color: "#3B82F6" },
  { bg: "#FEF2F2", color: "#EF4444" }, { bg: "#F0FDFF", color: "#06B6D4" },
];
const pal = (name: string) => PALETTES[name.charCodeAt(0) % PALETTES.length];

interface IcModel {
  id: number; brandId: number; brandName: string;
  icNumber: string; description?: string; package?: string; notes?: string;
}
interface DeviceCompat {
  id: number; icModelId: number; deviceName: string; notes?: string;
}

export default function IcModelPage() {
  const [, params] = useRoute("/ic-model/:id");
  const [, setLocation] = useLocation();
  const icModelId = Number(params?.id);
  const [search, setSearch] = useState("");

  const { data: icModel } = useQuery<IcModel>({
    queryKey: ["ic-model", icModelId],
    queryFn: () => fetch(`/api/ic-models/${icModelId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!icModelId,
  });

  const { data: devices = [], isLoading } = useQuery<DeviceCompat[]>({
    queryKey: ["ic-compat", icModelId],
    queryFn: () => fetch(`/api/ic-compat?icModelId=${icModelId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!icModelId,
  });

  const filtered = devices.filter(d =>
    d.deviceName.toLowerCase().includes(search.toLowerCase())
  );

  const headerPal = icModel ? pal(icModel.icNumber) : PALETTES[0];

  return (
    <ProtectedPage>
      <div className="space-y-4 pb-24">
        <div className="flex items-center gap-3 pt-1">
          <button onClick={() => icModel ? setLocation(`/ic-brand/${icModel.brandId}`) : history.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--muted))", color: MUTED }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold font-mono truncate">{icModel?.icNumber ?? "IC"}</h1>
            <p className="text-xs" style={{ color: MUTED }}>
              {icModel?.brandName}
              {icModel?.description && <> · {icModel.description}</>}
            </p>
          </div>
        </div>

        {/* IC info pill */}
        {icModel && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: headerPal.bg }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "white" }}>
              <Cpu className="w-5 h-5" style={{ color: headerPal.color }} />
            </div>
            <div>
              <p className="font-bold text-sm font-mono" style={{ color: headerPal.color }}>{icModel.icNumber}</p>
              <div className="flex flex-wrap gap-2 mt-0.5">
                {icModel.description && <span className="text-[11px] font-medium" style={{ color: headerPal.color }}>{icModel.description}</span>}
                {icModel.package && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "white", color: headerPal.color }}>{icModel.package}</span>
                )}
              </div>
              {icModel.notes && <p className="text-[11px] mt-0.5" style={{ color: headerPal.color }}>{icModel.notes}</p>}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">Compatible Devices</h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "#EEF2FF", color: PRIMARY }}>
            {devices.length} device{devices.length !== 1 ? "s" : ""}
          </span>
        </div>

        {devices.length > 5 && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
            <input type="text" placeholder="Search device…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border text-sm outline-none"
              style={{ borderColor: BORDER, background: CARD }} />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Smartphone className="w-12 h-12 mx-auto mb-3" style={{ color: MUTED }} />
            <p className="font-semibold">No compatible devices found</p>
            {!search && <p className="text-sm mt-1" style={{ color: MUTED }}>Admin panel থেকে devices যোগ করুন</p>}
          </div>
        ) : (
          <div className="rounded-2xl border divide-y overflow-hidden" style={{ borderColor: BORDER, background: CARD }}>
            {filtered.map(d => {
              const p = pal(d.deviceName);
              const initials = d.deviceName.split(/[\s/]/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: p.bg, color: p.color }}>{initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{d.deviceName}</p>
                    {d.notes && (
                      <p className="text-[11px] mt-0.5 truncate font-semibold" style={{ color: PRIMARY }}>
                        Part: {d.notes}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "#ECFDF5", color: "#10B981" }}>Compatible</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}
