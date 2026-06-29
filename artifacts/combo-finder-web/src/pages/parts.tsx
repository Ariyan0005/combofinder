import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Wrench, ChevronDown, ChevronUp, Battery, Zap, CircuitBoard, ArrowLeft, ExternalLink, Cpu } from "lucide-react";

// Mobile LCD icon
function MobileLcdIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <rect x="7" y="4" width="10" height="13" rx="1"/>
      <circle cx="12" cy="19.5" r="0.7" fill="currentColor" stroke="none"/>
    </svg>
  );
}

const CATEGORIES = [
  { label: "LCD / Display", value: "LCD / Display", iconType: "lcd" as const, bg: "from-blue-500 to-blue-600", light: "bg-blue-50 text-blue-700", desc: "Compatible display assemblies", navigateHome: true },
  { label: "Battery", value: "Battery", iconType: "battery" as const, bg: "from-green-500 to-green-600", light: "bg-green-50 text-green-700", desc: "Compatible batteries by model", navigateHome: false },
  { label: "LCD Connector", value: "FPC Connector", iconType: "circuit" as const, bg: "from-violet-500 to-violet-600", light: "bg-violet-50 text-violet-700", desc: "Compatible LCD flex connectors", navigateHome: false },
  { label: "Charging Sub Board", value: "Charging Sub Board", iconType: "zap" as const, bg: "from-orange-500 to-orange-600", light: "bg-orange-50 text-orange-700", desc: "Compatible USB charging boards", navigateHome: false },
  { label: "IC Compatible", value: "IC Compatible", iconType: "cpu" as const, bg: "from-cyan-500 to-cyan-600", light: "bg-cyan-50 text-cyan-700", desc: "Compatible integrated circuits", navigateHome: false },
  { label: "Other Parts", value: "Other", iconType: "wrench" as const, bg: "from-slate-500 to-slate-600", light: "bg-slate-50 text-slate-700", desc: "Compatible back cover, frame & more", navigateHome: false },
];

type IconType = "lcd" | "battery" | "circuit" | "zap" | "cpu" | "wrench";

function CatIcon({ type, className }: { type: IconType; className?: string }) {
  if (type === "lcd") return <MobileLcdIcon className={className} />;
  if (type === "battery") return <Battery className={className} />;
  if (type === "circuit") return <CircuitBoard className={className} />;
  if (type === "zap") return <Zap className={className} />;
  if (type === "cpu") return <Cpu className={className} />;
  return <Wrench className={className} />;
}

interface Part { id: number; partName: string; partType: string; compatibleModels: string; description: string | null; }
async function fetchParts(): Promise<Part[]> { const r=await fetch("/api/parts"); if(!r.ok) throw new Error("x"); return r.json(); }

function PartCard({ part }: { part: Part }) {
  const [exp, setExp] = useState(false);
  const models = part.compatibleModels.split(",").map(m=>m.trim()).filter(Boolean);
  return (
    <div className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-all">
      <p className="font-semibold text-sm text-foreground">{part.partName}</p>
      {part.description && <p className="text-xs text-muted-foreground mt-1">{part.description}</p>}
      <button onClick={()=>setExp(!exp)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-3 transition-colors">
        {exp?<ChevronUp className="w-3 h-3"/>:<ChevronDown className="w-3 h-3"/>}
        {models.length} compatible model{models.length!==1?"s":""}
      </button>
      {exp && <div className="mt-2 flex flex-wrap gap-1.5">{models.map((m,i)=><span key={i} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md">{m}</span>)}</div>}
    </div>
  );
}

export default function Parts() {
  const [, navigate] = useLocation();

  // Read ?cat= param from URL to auto-select category
  const urlCat = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("cat") : null;
  const [selected, setSelected] = useState<string|null>(urlCat);

  useEffect(() => {
    const cat = new URLSearchParams(window.location.search).get("cat");
    if (cat) setSelected(cat);
  }, []);

  const { data:allParts=[], isLoading } = useQuery({ queryKey:["web-parts"], queryFn:fetchParts });
  const displayParts = selected ? allParts.filter(p=>p.partType===selected) : [];
  const activeCategory = CATEGORIES.find(c=>c.value===selected);

  function handleCategoryClick(value: string, navigateHome: boolean) {
    if (navigateHome) {
      navigate("/");
      return;
    }
    setSelected(value);
  }

  return (
    <div className="space-y-5">
      <div>
        {selected && (
          <button onClick={()=>setSelected(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4"/> Back to categories
          </button>
        )}
        <h1 className="text-2xl font-bold text-foreground">Compatible Parts</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">{selected ? activeCategory?.desc : "Select a category to find compatible parts"}</p>
      </div>

      {isLoading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>
      : selected ? (
        <div className="space-y-3">
          {activeCategory && (
            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${activeCategory.light}`}>
              <CatIcon type={activeCategory.iconType} className="w-4 h-4"/>
              <span className="text-sm font-medium">{activeCategory.label}</span>
              <span className="ml-auto text-xs opacity-70">{displayParts.length} parts</span>
            </div>
          )}
          {displayParts.length===0 ? (
            <div className="text-center py-12 text-muted-foreground"><Wrench className="w-10 h-10 mx-auto mb-3 opacity-30"/><p className="text-sm font-medium">No {activeCategory?.label} parts yet</p><p className="text-xs mt-1 opacity-70">Parts are added regularly — check back soon</p></div>
          ) : displayParts.map(p=><PartCard key={p.id} part={p}/>)}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map(({label,value,iconType,bg,desc,navigateHome})=>{
              const count=allParts.filter(p=>p.partType===value).length;
              return (
                <button key={value} onClick={()=>handleCategoryClick(value, navigateHome)} className="relative overflow-hidden rounded-2xl text-left hover:scale-[1.02] active:scale-[0.98] transition-transform">
                  <div className={`bg-gradient-to-br ${bg} p-4`}>
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                      <CatIcon type={iconType} className="w-5 h-5 text-white"/>
                    </div>
                    <p className="font-semibold text-sm text-white leading-tight">{label}</p>
                    <p className="text-[11px] text-white/70 mt-0.5 leading-tight">{desc}</p>
                    {count>0 && <p className="text-[10px] text-white/50 mt-2 font-medium">{count} parts</p>}
                  </div>
                </button>
              );
            })}
          </div>
          <a href="https://gadgetsalalah.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg></div>
            <div className="flex-1"><p className="text-[10px] text-white/70 uppercase tracking-wide font-medium">Buy Parts in Oman 🇴🇲</p><p className="text-sm font-bold leading-tight">GadgetSalalah.com</p><p className="text-xs text-white/60 mt-0.5">LCD · Battery · Accessories · Salalah</p></div>
            <ExternalLink className="w-4 h-4 text-white/50 shrink-0"/>
          </a>
        </div>
      )}
    </div>
  );
}
