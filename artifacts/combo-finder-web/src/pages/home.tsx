import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useGetStats, useSearchModels } from "@workspace/api-client-react";
import { Search, Smartphone, Tag, Layers, ChevronRight, Monitor, Battery, Zap, CircuitBoard, ExternalLink, ShieldCheck } from "lucide-react";

function StatCard({ label, value, icon: Icon }: { label: string; value: number | undefined; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5 text-primary" /></div>
      <div><p className="text-2xl font-bold text-foreground">{value ?? "—"}</p><p className="text-xs text-muted-foreground">{label}</p></div>
    </div>
  );
}

const PART_SHORTCUTS = [
  { label: "LCD / Display", icon: Monitor, color: "bg-blue-50 text-blue-600 border-blue-100" },
  { label: "Battery", icon: Battery, color: "bg-green-50 text-green-600 border-green-100" },
  { label: "FPC Connector", icon: CircuitBoard, color: "bg-purple-50 text-purple-600 border-purple-100" },
  { label: "Charging Sub Board", icon: Zap, color: "bg-orange-50 text-orange-600 border-orange-100" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const { data: stats } = useGetStats();
  const { data: results, isLoading } = useSearchModels({ q: query }, { query: { enabled: query.length >= 2 } });
  const [, navigate] = useLocation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Find Display Combos</h1>
        <p className="text-muted-foreground mt-1 text-sm">Search your phone model for compatible display assemblies & spare parts</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="search" placeholder="Search brand or model (e.g. Samsung S21, iPhone 13...)" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" autoComplete="off" />
      </div>
      {query.length >= 2 ? (
        <div className="space-y-3">
          {isLoading && <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
          {!isLoading && results && (
            <>
              {results.brands.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Brands</p>
                  <div className="space-y-2">{results.brands.map((brand) => (<button key={brand.id} onClick={() => navigate(`/brands/${brand.id}`)} className="w-full bg-white rounded-xl border border-border p-3 flex items-center justify-between hover:border-primary/40 hover:shadow-sm transition-all text-left"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Tag className="w-4 h-4 text-primary" /></div><div><p className="font-medium text-sm">{brand.name}</p><p className="text-xs text-muted-foreground">{brand.modelCount} models</p></div></div><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>))}</div>
                </div>
              )}
              {results.models.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Models</p>
                  <div className="space-y-2">{results.models.map((model) => (<button key={model.id} onClick={() => navigate(`/models/${model.id}`)} className="w-full bg-white rounded-xl border border-border p-3 flex items-center justify-between hover:border-primary/40 hover:shadow-sm transition-all text-left"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Smartphone className="w-4 h-4 text-primary" /></div><div><p className="font-medium text-sm">{model.name}</p><p className="text-xs text-muted-foreground">{model.brandName} · {model.comboCount} combos</p></div></div><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>))}</div>
                </div>
              )}
              {results.brands.length === 0 && results.models.length === 0 && (<div className="text-center py-10 text-muted-foreground"><Smartphone className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No results for "{query}"</p></div>)}
              <a href="https://iunlockd.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl p-3.5 hover:opacity-90 transition-opacity">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                <div className="flex-1"><p className="text-xs text-slate-400 leading-none mb-0.5">Need to unlock this phone?</p><p className="text-sm font-semibold">Professional unlock → iUnlockd.com</p></div>
                <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
              </a>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Brands" value={stats?.totalBrands} icon={Tag} />
            <StatCard label="Models" value={stats?.totalModels} icon={Smartphone} />
            <StatCard label="Combos" value={stats?.totalCombos} icon={Layers} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Spare Parts Database</p>
              <Link href="/parts" className="text-xs text-primary font-medium hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {PART_SHORTCUTS.map(({ label, icon: Icon, color }) => (
                <Link key={label} href={`/parts?type=${encodeURIComponent(label)}`}>
                  <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${color} hover:opacity-80 transition-opacity cursor-pointer`}>
                    <Icon className="w-4 h-4 shrink-0" /><span className="text-xs font-medium leading-tight">{label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20 p-5">
            <div className="flex items-center gap-2 mb-1"><Smartphone className="w-5 h-5 text-primary" /><p className="font-semibold text-sm text-foreground">Get the App</p></div>
            <p className="text-xs text-muted-foreground mb-4">Download ComboFinder — faster search with offline support</p>
            <div className="flex flex-col gap-2.5">
              <a href="https://combofinder.iunlockd.com/download" className="flex items-center gap-3 bg-primary text-white rounded-xl px-4 py-3 hover:bg-primary/90 transition-colors"><svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm-1 14.93V16h2v.93A8 8 0 0 1 4 12a8 8 0 0 1 8-8 8 8 0 0 1 8 8 8.001 8.001 0 0 1-9 7.93zM8 11l4 4 4-4h-3V8h-2v3H8z"/></svg><div><p className="text-[10px] text-white/70 leading-none">Direct Download</p><p className="text-sm font-semibold leading-tight">Download APK (Android)</p></div><span className="ml-auto text-xs bg-white text-primary font-semibold px-2 py-0.5 rounded-full">v1.0</span></a>
              <a href="#" className="flex items-center gap-3 bg-[#1a1a1a] text-white rounded-xl px-4 py-3"><svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18.5v-13A1.5 1.5 0 0 1 5.06 4.07l13 6.5a1.5 1.5 0 0 1 0 2.68l-13 6.5A1.5 1.5 0 0 1 3 18.5z"/></svg><div><p className="text-[10px] text-gray-400 leading-none">Download on</p><p className="text-sm font-semibold leading-tight">Google Play</p></div><span className="ml-auto text-xs bg-yellow-400 text-black font-semibold px-2 py-0.5 rounded-full">Coming Soon</span></a>
              <a href="#" className="flex items-center gap-3 bg-[#1a1a1a] text-white rounded-xl px-4 py-3"><svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg><div><p className="text-[10px] text-gray-400 leading-none">Download on the</p><p className="text-sm font-semibold leading-tight">App Store</p></div><span className="ml-auto text-xs bg-yellow-400 text-black font-semibold px-2 py-0.5 rounded-full">Coming Soon</span></a>
            </div>
          </div>
          <a href="https://iunlockd.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl p-4 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0"><ShieldCheck className="w-5 h-5 text-blue-400" /></div>
            <div className="flex-1"><p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Professional Service</p><p className="text-sm font-bold leading-tight">Phone Unlock Service</p><p className="text-xs text-slate-400 mt-0.5">All networks · iUnlockd.com</p></div>
            <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
          </a>
        </div>
      )}
    </div>
  );
}
