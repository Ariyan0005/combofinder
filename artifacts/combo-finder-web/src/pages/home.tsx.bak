import { useState } from "react";
import { useLocation } from "wouter";
import { useGetStats, useSearchModels } from "@workspace/api-client-react";
import { Search, Smartphone, Tag, Layers, ChevronRight } from "lucide-react";

function StatCard({ label, value, icon: Icon }: { label: string; value: number | undefined; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const { data: stats } = useGetStats();
  const { data: results, isLoading } = useSearchModels(
    { q: query },
    { query: { enabled: query.length >= 2 } }
  );

  const [, navigate] = useLocation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Find Display Combos</h1>
        <p className="text-muted-foreground mt-1 text-sm">Search for your phone model to find compatible display assemblies</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search brand or model (e.g. Samsung, iPhone 15...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          autoComplete="off"
        />
      </div>

      {query.length >= 2 ? (
        <div className="space-y-3">
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!isLoading && results && (
            <>
              {results.brands.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Brands</p>
                  <div className="space-y-2">
                    {results.brands.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => navigate(`/brands/${brand.id}`)}
                        className="w-full bg-white rounded-xl border border-border p-3 flex items-center justify-between hover:border-primary/40 hover:shadow-sm transition-all text-left"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Tag className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{brand.name}</p>
                            <p className="text-xs text-muted-foreground">{brand.modelCount} models</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {results.models.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Models</p>
                  <div className="space-y-2">
                    {results.models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => navigate(`/models/${model.id}`)}
                        className="w-full bg-white rounded-xl border border-border p-3 flex items-center justify-between hover:border-primary/40 hover:shadow-sm transition-all text-left"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Smartphone className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{model.name}</p>
                            <p className="text-xs text-muted-foreground">{model.brandName} · {model.comboCount} combos</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {results.brands.length === 0 && results.models.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <Smartphone className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No results found for "{query}"</p>
                </div>
              )}
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

          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Smartphone className="w-5 h-5 text-primary" />
              <p className="font-semibold text-sm text-foreground">Get the App</p>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Download the ComboFinder app — faster search with offline support
            </p>
            <div className="flex flex-col gap-2.5">
              <a href="#android" className="flex items-center gap-3 bg-[#1a1a1a] text-white rounded-xl px-4 py-3 hover:bg-black transition-colors">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.341 14.63 12l2.893-3.341A1 1 0 0 0 16.77 7.2l-3.233 3.73L10.305 7.2a1 1 0 0 0-1.752.459 1 1 0 0 0 .228.9L11.674 12l-2.893 3.341a1 1 0 0 0 1.524 1.295L13.537 13l3.233 3.636a1 1 0 0 0 1.524-1.295zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
                </svg>
                <div>
                  <p className="text-[10px] text-gray-400 leading-none">Download on</p>
                  <p className="text-sm font-semibold leading-tight">Google Play</p>
                </div>
                <span className="ml-auto text-xs bg-yellow-400 text-black font-semibold px-2 py-0.5 rounded-full">Coming Soon</span>
              </a>
              <a href="#ios" className="flex items-center gap-3 bg-[#1a1a1a] text-white rounded-xl px-4 py-3 hover:bg-black transition-colors">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <p className="text-[10px] text-gray-400 leading-none">Download on the</p>
                  <p className="text-sm font-semibold leading-tight">App Store</p>
                </div>
                <span className="ml-auto text-xs bg-yellow-400 text-black font-semibold px-2 py-0.5 rounded-full">Coming Soon</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
