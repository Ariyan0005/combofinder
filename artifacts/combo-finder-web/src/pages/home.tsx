import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useGetStats, useSearchModels } from "@workspace/api-client-react";
import {
  Search, Smartphone, Layers, ChevronRight,
  Battery, Cpu, Wrench, ShieldCheck, ExternalLink,
  Download
} from "lucide-react";

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
  { label: "LCD / Display", icon: MobileLcdIcon, color: "bg-blue-500", href: "/compatibility?category=display" },
  { label: "Battery", icon: Battery, color: "bg-emerald-500", href: "/compatibility?category=battery" },
  { label: "IC Compatible", icon: Cpu, color: "bg-violet-500", href: "/compatibility?category=ic" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const { data: stats } = useGetStats();
  const { data: results, isLoading } = useSearchModels(
    { q: query },
    { query: { enabled: query.length >= 2 } }
  );
  const [, navigate] = useLocation();

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="pt-1">
        <h1 className="text-xl font-bold text-foreground leading-tight">
          Compatible Parts Finder
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search any phone model — find compatible displays, batteries & spare parts instantly.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" style={{ width: "1.1rem", height: "1.1rem" }} />
        <input
          type="search"
          placeholder="e.g. Samsung A15, iPhone 13, Oppo A54..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors shadow-sm"
          autoComplete="off"
          autoFocus
        />
        {query && isLoading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Search Results */}
      {query.length >= 2 ? (
        <div className="space-y-3">
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}
            </div>
          )}
          {!isLoading && results && (
            <>
              {results.brands.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brands</p>
                  {results.brands.map(b => (
                    <button key={b.id} onClick={() => navigate(`/brands/${b.id}`)}
                      className="w-full bg-card rounded-xl border border-border p-3 flex items-center justify-between hover:border-primary/50 hover:shadow-sm transition-all text-left group">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.modelCount} models</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              )}
              {results.models.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Models</p>
                  {results.models.map(m => (
                    <button key={m.id} onClick={() => navigate(`/models/${m.id}`)}
                      className="w-full bg-card rounded-xl border border-border p-3 flex items-center justify-between hover:border-primary/50 hover:shadow-sm transition-all text-left group">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Smartphone className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.brandName}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              )}
              {results.brands.length === 0 && results.models.length === 0 && (
                <div className="text-center py-10 bg-card rounded-xl border border-dashed border-border">
                  <Smartphone className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-25" />
                  <p className="text-sm font-semibold text-foreground">No results for "{query}"</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different model name or brand</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: "Brands", value: stats?.totalBrands, icon: Layers },
              { label: "Models", value: stats?.totalModels, icon: Smartphone },
              { label: "Combos", value: stats?.totalCombos, icon: Wrench },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-card rounded-xl border border-border p-3 flex flex-col items-center gap-1.5 text-center">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xl font-bold leading-none text-foreground">{value ?? "—"}</p>
                <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* Quick categories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-foreground">Compatibility Database</p>
              <Link href="/compatibility" className="text-xs text-primary font-semibold hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {SHORTCUTS.map(({ label, icon: Icon, color, href }) => (
                <Link key={label} href={href}>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group">
                    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">{label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Browse Brands */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-foreground">Browse Brands</p>
              <Link href="/brands" className="text-xs text-primary font-semibold hover:underline">All brands →</Link>
            </div>
            <Link href="/brands">
              <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">All Phone Brands</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Samsung, Oppo, Vivo, Xiaomi & more</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
            </Link>
          </div>

          {/* Download APK */}
          <a href="https://combofinder.iunlockd.com/download"
            className="flex items-center gap-3 bg-primary text-white rounded-xl px-4 py-3.5 hover:bg-primary/90 transition-colors shadow-md shadow-primary/25">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-white/70 leading-none mb-0.5 font-medium uppercase tracking-wide">Direct Download</p>
              <p className="text-sm font-bold leading-tight">Download APK (Android)</p>
            </div>
            <span className="text-xs bg-white text-primary font-bold px-2 py-0.5 rounded-full shrink-0">v1.0</span>
          </a>

          {/* iUnlockd */}
          <a href="https://iunlockd.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white rounded-xl p-4 hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-white/70 uppercase tracking-wide font-medium">Professional Service</p>
              <p className="text-sm font-bold">Phone Unlock Service</p>
              <p className="text-xs text-white/60 mt-0.5">All networks · iUnlockd.com</p>
            </div>
            <ExternalLink className="w-4 h-4 text-white/50 shrink-0" />
          </a>
        </div>
      )}
    </div>
  );
}
