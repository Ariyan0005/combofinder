import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronRight, Monitor, Battery, Cpu, Plug, MoreHorizontal, Clock, X } from "lucide-react";
import { Link } from "wouter";

const BASE = () => import.meta.env.BASE_URL.replace(/\/$/, "");
const LS_KEY = "cf_recent_searches";

const CATEGORIES = [
  { label: "Display", icon: Monitor, color: "#6248FF", bg: "#EEF2FF" },
  { label: "Battery", icon: Battery, color: "#10B981", bg: "#ECFDF5" },
  { label: "IC", icon: Cpu, color: "#F59E0B", bg: "#FFF7E6" },
  { label: "Connector", icon: Plug, color: "#06B6D4", bg: "#F0FDFF" },
  { label: "More", icon: MoreHorizontal, color: "#8B5CF6", bg: "#F5F3FF" },
];

function getRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function addRecentSearch(q: string) {
  const arr = getRecentSearches().filter(s => s !== q).slice(0, 9);
  arr.unshift(q);
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

export default function Compatibility() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const { data: searchResults, isLoading: searching } = useQuery<{ brands?: any[]; models?: any[] }>({
    queryKey: ["search", debouncedQuery],
    queryFn: () =>
      fetch(`${BASE()}/api/search?q=${encodeURIComponent(debouncedQuery)}`, { credentials: "include" }).then(r => r.json()),
    enabled: debouncedQuery.length >= 2,
  });

  const { data: brands } = useQuery<any[]>({
    queryKey: ["brands"],
    queryFn: () => fetch(`${BASE()}/api/brands`, { credentials: "include" }).then(r => r.json()),
    enabled: debouncedQuery.length < 2,
  });

  function handleSearchSelect(q: string) {
    addRecentSearch(q);
    setRecentSearches(getRecentSearches());
  }

  function removeRecent(q: string) {
    const arr = getRecentSearches().filter(s => s !== q);
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
    setRecentSearches(arr);
  }

  const allModels = Array.isArray(searchResults?.models) ? searchResults.models : [];
  const allBrands = Array.isArray(searchResults?.brands) ? searchResults.brands : [];
  const brandList = Array.isArray(brands) ? brands.slice(0, 8) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-xl font-extrabold">Compatibility Finder</h1>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: "hsl(var(--muted-foreground))" }} />
        <input
          type="text"
          placeholder="Search model or part…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm outline-none transition-all"
          style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
          onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }}
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2"
            style={{ color: "hsl(var(--muted-foreground))" }}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category icons */}
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
        {CATEGORIES.map(({ label, icon: Icon, color, bg }) => (
          <button key={label}
            onClick={() => setQuery(label === "More" ? "" : label)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-[60px]">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: bg }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Search results */}
      {debouncedQuery.length >= 2 ? (
        <div className="space-y-4">
          {searching ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
              ))}
            </div>
          ) : (
            <>
              {allBrands.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2"
                    style={{ color: "hsl(var(--muted-foreground))" }}>Brands</p>
                  <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
                    {allBrands.map((b: any) => (
                      <Link key={b.id} href={`/brands/${b.id}`}>
                        <div onClick={() => handleSearchSelect(b.name)}
                          className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-muted/30">
                          <span className="text-sm font-semibold">{b.name}</span>
                          <ChevronRight className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {allModels.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2"
                    style={{ color: "hsl(var(--muted-foreground))" }}>Models</p>
                  <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
                    {allModels.map((m: any) => (
                      <Link key={m.id} href={`/models/${m.id}`}>
                        <div onClick={() => handleSearchSelect(m.name)}
                          className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-muted/30">
                          <div>
                            <p className="text-sm font-semibold">{m.name}</p>
                            {m.brandName && (
                              <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{m.brandName}</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {allBrands.length === 0 && allModels.length === 0 && (
                <div className="text-center py-10 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  No results for "{debouncedQuery}"
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {/* Popular brands/models */}
          {brandList.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-base">Popular Brands</h2>
                <span className="text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>View All</span>
              </div>
              <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
                {brandList.map((b: any) => (
                  <Link key={b.id} href={`/brands/${b.id}`}>
                    <div className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-muted/30">
                      <span className="text-sm font-semibold">{b.name}</span>
                      <ChevronRight className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div>
              <h2 className="font-bold text-base mb-3">Recent Searches</h2>
              <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
                {recentSearches.slice(0, 5).map(q => (
                  <div key={q} className="flex items-center justify-between px-4 py-3.5">
                    <button className="flex items-center gap-3 flex-1 text-left"
                      onClick={() => setQuery(q)}>
                      <Clock className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
                      <span className="text-sm font-medium">{q}</span>
                    </button>
                    <button onClick={() => removeRecent(q)}>
                      <X className="w-3.5 h-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
