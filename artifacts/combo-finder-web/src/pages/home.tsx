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
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Brands" value={stats?.totalBrands} icon={Tag} />
            <StatCard label="Models" value={stats?.totalModels} icon={Smartphone} />
            <StatCard label="Combos" value={stats?.totalCombos} icon={Layers} />
          </div>
          <div className="bg-white rounded-xl border border-border p-4 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search
          </div>
        </div>
      )}
    </div>
  );
}
