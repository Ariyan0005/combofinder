import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Wrench, ChevronDown, ChevronUp, Monitor, Battery, Zap, CircuitBoard, ArrowLeft, ExternalLink } from "lucide-react";

const CATEGORIES = [
  { label: "LCD / Display", value: "LCD / Display", icon: Monitor, bg: "from-blue-500 to-blue-600", light: "bg-blue-50 text-blue-700", desc: "Display assemblies & touch screens" },
  { label: "Battery", value: "Battery", icon: Battery, bg: "from-green-500 to-green-600", light: "bg-green-50 text-green-700", desc: "Original & compatible batteries" },
  { label: "FPC Connector", value: "FPC Connector", icon: CircuitBoard, bg: "from-violet-500 to-violet-600", light: "bg-violet-50 text-violet-700", desc: "Flex cable connectors" },
  { label: "Charging Sub Board", value: "Charging Sub Board", icon: Zap, bg: "from-orange-500 to-orange-600", light: "bg-orange-50 text-orange-700", desc: "USB charging boards" },
  { label: "Power/Volume Flex", value: "Power/Volume Flex", icon: Zap, bg: "from-pink-500 to-pink-600", light: "bg-pink-50 text-pink-700", desc: "Side button flex cables" },
  { label: "Other Parts", value: "Other", icon: Wrench, bg: "from-slate-500 to-slate-600", light: "bg-slate-50 text-slate-700", desc: "Back cover, frame & more" },
];

interface Part { id: number; partName: string; partType: string; compatibleModels: string; description: string | null; }
async function fetchParts(): Promise<Part[]> { const r=await fetch("/api/parts"); if(!r.ok) throw new Error("x"); return r.json(); }
async function searchParts(q: string): Promise<Part[]> { const r=await fetch(`/api/parts/search?q=${encodeURIComponent(q)}`); if(!r.ok) throw new Error("x"); return r.json(); }

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
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string|null>(null);
  const { data:allParts=[], isLoading } = useQuery({ queryKey:["web-parts"], queryFn:fetchParts });
  const { data:searchResults=[], isFetching:isSearching } = useQuery({ queryKey:["web-parts-search",query], queryFn:()=>searchParts(query), enabled:query.length>=2 });
  const isSearch = query.length>=2;
  const displayParts = isSearch ? searchResults : selected ? allParts.filter(p=>p.partType===selected) : [];
  const activeCategory = CATEGORIES.find(c=>c.value===selected);

  return (
    <div className="space-y-5">
      <div>
        {selected && !isSearch && (
          <button onClick={()=>setSelected(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4"/> Back to categories
          </button>
        )}
        <h1 className="text-2xl font-bold text-foreground">Phone Parts</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">{selected&&!isSearch ? activeCategory?.desc : "Select a category or search by model"}</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
        {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"/>}
        <input type="search" placeholder="Search by phone model (e.g. Samsung S21, iPhone 13...)" value={query} onChange={e=>{setQuery(e.target.value); if(e.target.value.length>=2) setSelected(null);}} className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" autoComplete="off"/>
      </div>
      {isLoading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>
      : isSearch ? (
        <div className="space-y-3">
          {!isSearching && searchResults.length===0 ? (
            <div className="text-center py-12 text-muted-foreground"><Wrench className="w-10 h-10 mx-auto mb-3 opacity-30"/><p className="text-sm font-medium">No parts found for "{query}"</p><p className="text-xs mt-1 opacity-70">Try a different model name</p></div>
          ) : !isSearching && (<>
            <p className="text-xs text-muted-foreground">{searchResults.length} result{searchResults.length!==1?"s":""} for "{query}"</p>
            {searchResults.map(p=><PartCard key={p.id} part={p}/>)}
          </>)}
        </div>
      ) : selected ? (
        <div className="space-y-3">
          {activeCategory && (
            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${activeCategory.light}`}>
              <activeCategory.icon className="w-4 h-4"/>
              <span className="text-sm font-medium">{activeCategory.label}</span>
              <span className="ml-auto text-xs opacity-70">{displayParts.length} parts</span>
            </div>
          )}
          {displayParts.length===0 ? (
            <div className="text-center py-12 text-muted-foreground"><Wrench className="w-10 h-10 mx-auto mb-3 opacity-30"/><p className="text-sm font-medium">No {activeCategory?.label} parts yet</p><p className="text-xs mt-1 opacity-70">Check back soon — parts are added daily</p></div>
          ) : displayParts.map(p=><PartCard key={p.id} part={p}/>)}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map(({label,value,icon:Icon,bg,desc})=>{
              const count=allParts.filter(p=>p.partType===value).length;
              return (
                <button key={value} onClick={()=>setSelected(value)} className="relative overflow-hidden rounded-2xl text-left hover:scale-[1.02] active:scale-[0.98] transition-transform">
                  <div className={`bg-gradient-to-br ${bg} p-4`}>
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3"><Icon className="w-5 h-5 text-white"/></div>
                    <p className="font-semibold text-sm text-white leading-tight">{label}</p>
                    <p className="text-[11px] text-white/70 mt-0.5 leading-tight">{desc}</p>
                    <p className="text-[10px] text-white/50 mt-2 font-medium">{count>0?`${count} parts`:"Coming soon"}</p>
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
