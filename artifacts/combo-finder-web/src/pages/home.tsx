import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useGetStats, useSearchModels } from "@workspace/api-client-react";
import { Search, Smartphone, Tag, Layers, ChevronRight, Battery, Zap, CircuitBoard, ExternalLink, ShieldCheck, Cpu, MoreHorizontal } from "lucide-react";

function StatCard({ label, value, icon: Icon }: { label: string; value: number|undefined; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-xl border border-border p-3 flex flex-col items-center gap-1.5 text-center">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-primary"/></div>
      <p className="text-xl font-bold leading-none">{value ?? "—"}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

// Mobile LCD icon (SVG inline)
function MobileLcdIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <rect x="7" y="4" width="10" height="13" rx="1"/>
      <circle cx="12" cy="19.5" r="0.7" fill="currentColor" stroke="none"/>
    </svg>
  );
}

const SHORTCUTS = [
  { label:"Battery", icon:Battery, color:"bg-green-50 text-green-600 border-green-100", href:"/parts?cat=Battery" },
  { label:"LCD Connector", icon:CircuitBoard, color:"bg-blue-50 text-blue-600 border-blue-100", href:"/parts?cat=FPC+Connector" },
  { label:"IC Compatible", icon:Cpu, color:"bg-violet-50 text-violet-600 border-violet-100", href:"/parts?cat=IC+Compatible" },
  { label:"More Parts", icon:MoreHorizontal, color:"bg-orange-50 text-orange-600 border-orange-100", href:"/parts" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const { data:stats } = useGetStats();
  const { data:results, isLoading } = useSearchModels({ q:query }, { query:{ enabled:query.length>=2 } });
  const [, navigate] = useLocation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Find Display Combos</h1>
        <p className="text-muted-foreground mt-1 text-sm">Search your phone model for display combos &amp; spare parts</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
        <input type="search" placeholder="Search brand or model (e.g. Samsung S21, iPhone 13...)" value={query} onChange={e=>setQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" autoComplete="off"/>
      </div>

      {query.length>=2 ? (
        <div className="space-y-3">
          {isLoading && <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>}
          {!isLoading && results && (<>
            {results.brands.length>0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Brands</p>
                <div className="space-y-2">{results.brands.map(b=>(
                  <button key={b.id} onClick={()=>navigate(`/brands/${b.id}`)} className="w-full bg-white rounded-xl border border-border p-3 flex items-center justify-between hover:border-primary/40 hover:shadow-sm transition-all text-left">
                    <div className="flex items-center gap-2 min-w-0"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Tag className="w-4 h-4 text-primary"/></div><div className="min-w-0"><p className="font-semibold text-sm truncate">{b.name}</p><p className="text-xs text-muted-foreground">{b.modelCount} models</p></div></div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0"/>
                  </button>
                ))}</div>
              </div>
            )}
            {results.models.length>0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Models</p>
                <div className="space-y-2">{results.models.map(m=>(
                  <button key={m.id} onClick={()=>navigate(`/models/${m.id}`)} className="w-full bg-white rounded-xl border border-border p-3 flex items-center justify-between hover:border-primary/40 hover:shadow-sm transition-all text-left">
                    <div className="flex items-center gap-2 min-w-0"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Smartphone className="w-4 h-4 text-primary"/></div><div className="min-w-0"><p className="font-semibold text-sm truncate">{m.name}</p><p className="text-xs text-muted-foreground truncate">{m.brandName} · {m.comboCount} combos</p></div></div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0"/>
                  </button>
                ))}</div>
              </div>
            )}
            {results.brands.length===0&&results.models.length===0&&(
              <div className="text-center py-10 text-muted-foreground"><Smartphone className="w-10 h-10 mx-auto mb-2 opacity-30"/><p className="text-sm">No results for "{query}"</p></div>
            )}
            <a href="https://iunlockd.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl p-3.5 hover:opacity-90 transition-opacity">
              <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0"/>
              <div className="flex-1"><p className="text-xs text-slate-400 leading-none mb-0.5">Need to unlock this phone?</p><p className="text-sm font-semibold">Professional unlock → iUnlockd.com</p></div>
              <ExternalLink className="w-4 h-4 text-slate-400 shrink-0"/>
            </a>
          </>)}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Brands" value={stats?.totalBrands} icon={Tag}/>
            <StatCard label="Models" value={stats?.totalModels} icon={Smartphone}/>
            <StatCard label="Combos" value={stats?.totalCombos} icon={Layers}/>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Spare Parts</p>
              <Link href="/parts" className="text-xs text-primary font-medium">View all →</Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {SHORTCUTS.map(({label,icon:Icon,color,href})=>(
                <Link key={label} href={href}>
                  <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${color} hover:opacity-80 transition-opacity cursor-pointer`}>
                    <Icon className="w-4 h-4 shrink-0"/><span className="text-xs font-medium leading-tight">{label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <a href="https://combofinder.iunlockd.com/download" className="flex items-center gap-3 bg-primary text-white rounded-xl px-4 py-3.5 hover:bg-primary/90 transition-colors">
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm-1 14.93V16h2v.93A8 8 0 0 1 4 12a8 8 0 0 1 8-8 8 8 0 0 1 8 8 8.001 8.001 0 0 1-9 7.93zM8 11l4 4 4-4h-3V8h-2v3H8z"/></svg>
            <div><p className="text-[10px] text-white/70 leading-none">Direct Download</p><p className="text-sm font-semibold leading-tight">Download APK (Android)</p></div>
            <span className="ml-auto text-xs bg-white text-primary font-semibold px-2 py-0.5 rounded-full">v1.0</span>
          </a>
          <a href="https://iunlockd.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white rounded-xl p-4 hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/25">
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0"><ShieldCheck className="w-5 h-5 text-white"/></div>
            <div className="flex-1"><p className="text-[10px] text-white/70 uppercase tracking-wide font-medium">Professional Service</p><p className="text-sm font-bold">Phone Unlock Service</p><p className="text-xs text-white/60 mt-0.5">All networks · iUnlockd.com</p></div>
            <ExternalLink className="w-4 h-4 text-white/60 shrink-0"/>
          </a>
        </div>
      )}
    </div>
  );
}
