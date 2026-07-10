import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, ChevronDown, ChevronUp, Clock, X, Layers, Smartphone,
} from "lucide-react";

const LS_KEY_PREFIX = "cf_recent_searches_";

const MUTED = "hsl(var(--muted-foreground))";
const BORDER = "hsl(var(--border))";
const CARD = "hsl(var(--card))";
const PRIMARY = "hsl(var(--primary))";

interface Category { id: number; name: string; linkCount: number; }
interface Link {
  id: number;
  categoryId: number; categoryName: string;
  modelId: number; modelName: string; brandId: number; brandName: string;
  compatibleModelId: number; compatibleModelName: string; compatibleBrandId: number; compatibleBrandName: string;
}
interface GroupedModel {
  modelId: number; modelName: string; brandId: number; brandName: string;
  compatibles: { id: number; brandName: string; modelName: string }[];
}

function getRecentSearches(categoryId: number): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY_PREFIX + categoryId) ?? "[]"); } catch { return []; }
}
function addRecentSearch(categoryId: number, q: string) {
  const arr = getRecentSearches(categoryId).filter(s => s !== q).slice(0, 9);
  arr.unshift(q);
  localStorage.setItem(LS_KEY_PREFIX + categoryId, JSON.stringify(arr));
}
function removeRecentSearch(categoryId: number, q: string) {
  const arr = getRecentSearches(categoryId).filter(s => s !== q);
  localStorage.setItem(LS_KEY_PREFIX + categoryId, JSON.stringify(arr));
  return arr;
}

const fetchCategories = (): Promise<Category[]> =>
  fetch("/api/compatibility-categories", { credentials: "include" }).then(r => r.json());

const fetchLinks = (categoryId: number): Promise<Link[]> =>
  fetch(`/api/compatibility?categoryId=${categoryId}`, { credentials: "include" }).then(r => r.json());

export default function Compatibility() {
  // No default category — user must pick a Part Type before anything loads.
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [expandedModelId, setExpandedModelId] = useState<number | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ["compatibility-categories"],
    queryFn: fetchCategories,
  });

  // Switching category fully resets everything below — no mixing of part types.
  function selectCategory(id: number) {
    setCategoryId(id);
    setQuery("");
    setDebouncedQuery("");
    setExpandedModelId(null);
    setRecentSearches(getRecentSearches(id));
  }

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ["compatibility-links", categoryId],
    queryFn: () => fetchLinks(categoryId as number),
    enabled: categoryId !== null,
  });

  const grouped: GroupedModel[] = [];
  for (const l of links) {
    let g = grouped.find(x => x.modelId === l.modelId);
    if (!g) {
      g = { modelId: l.modelId, modelName: l.modelName, brandId: l.brandId, brandName: l.brandName, compatibles: [] };
      grouped.push(g);
    }
    g.compatibles.push({ id: l.id, brandName: l.compatibleBrandName, modelName: l.compatibleModelName });
  }
  grouped.sort((a, b) => a.modelName.localeCompare(b.modelName));

  const term = debouncedQuery.toLowerCase();
  const filtered = term.length < 1
    ? grouped
    : grouped.filter(g =>
        g.modelName.toLowerCase().includes(term) ||
        g.brandName.toLowerCase().includes(term) ||
        g.compatibles.some(c => c.modelName.toLowerCase().includes(term) || c.brandName.toLowerCase().includes(term))
      );

  function handleSelectModel(g: GroupedModel) {
    setExpandedModelId(prev => (prev === g.modelId ? null : g.modelId));
    if (categoryId !== null) {
      addRecentSearch(categoryId, g.modelName);
      setRecentSearches(getRecentSearches(categoryId));
    }
  }

  function removeRecent(q: string) {
    if (categoryId === null) return;
    setRecentSearches(removeRecentSearch(categoryId, q));
  }

  const activeCategory = categories.find(c => c.id === categoryId);

  return (
    <div className="space-y-4">
      <div className="pt-1">
        <h1 className="text-xl font-extrabold">Compatibility Finder</h1>
        <p className="text-xs mt-1" style={{ color: MUTED }}>
          Find which models share a compatible part.
        </p>
      </div>

      {/* ── Part Type — must pick one first ─────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: MUTED }}>1. Select Part Type</p>
        {catsLoading ? (
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 w-24 rounded-xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 rounded-2xl border border-dashed" style={{ borderColor: BORDER }}>
            <Layers className="w-8 h-8 mx-auto mb-2" style={{ color: MUTED, opacity: 0.4 }} />
            <p className="text-sm" style={{ color: MUTED }}>No part types available yet.</p>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => {
              const active = cat.id === categoryId;
              return (
                <button
                  key={cat.id}
                  onClick={() => selectCategory(cat.id)}
                  className="px-4 py-2 rounded-xl border text-sm font-semibold transition-all"
                  style={active
                    ? { background: PRIMARY, color: "#fff", borderColor: PRIMARY }
                    : { background: CARD, color: "hsl(var(--foreground))", borderColor: BORDER }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {categoryId === null ? (
        <div className="text-center py-14 rounded-2xl border border-dashed" style={{ borderColor: BORDER }}>
          <Smartphone className="w-9 h-9 mx-auto mb-2" style={{ color: MUTED, opacity: 0.4 }} />
          <p className="text-sm font-semibold">Pick a part type above to start</p>
          <p className="text-xs mt-1" style={{ color: MUTED }}>Compatibility results only ever show within one part type at a time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── Search within the selected category only ── */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: MUTED }}>
              2. Search {activeCategory?.name} models
            </p>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
              <input
                type="text"
                placeholder={`Search a ${activeCategory?.name ?? ""} model…`}
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3.5 rounded-2xl border text-sm outline-none transition-all"
                style={{ borderColor: BORDER, background: CARD }}
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: MUTED }}>
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Recent searches (only shown before typing) */}
          {!query && recentSearches.length > 0 && (
            <div>
              <h2 className="font-bold text-sm mb-2">Recent Searches</h2>
              <div className="rounded-2xl border divide-y overflow-hidden" style={{ borderColor: BORDER, background: CARD }}>
                {recentSearches.slice(0, 5).map(q => (
                  <div key={q} className="flex items-center justify-between px-4 py-2.5">
                    <button className="flex items-center gap-3 flex-1 text-left" onClick={() => setQuery(q)}>
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: MUTED }} />
                      <span className="text-sm font-medium truncate">{q}</span>
                    </button>
                    <button onClick={() => removeRecent(q)}>
                      <X className="w-3.5 h-3.5" style={{ color: MUTED }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div>
            {linksLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed" style={{ borderColor: BORDER }}>
                <Smartphone className="w-9 h-9 mx-auto mb-2" style={{ color: MUTED, opacity: 0.4 }} />
                <p className="text-sm font-semibold">
                  {grouped.length === 0 ? `No ${activeCategory?.name} compatibility entries yet` : `No matches for "${debouncedQuery}"`}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border divide-y overflow-hidden" style={{ borderColor: BORDER, background: CARD }}>
                {filtered.map(g => {
                  const expanded = expandedModelId === g.modelId;
                  return (
                    <div key={g.modelId}>
                      <button
                        onClick={() => handleSelectModel(g)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--muted))" }}>
                            <Smartphone className="w-4 h-4" style={{ color: MUTED }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{g.modelName}</p>
                            <p className="text-[10px] truncate" style={{ color: MUTED }}>
                              {g.brandName} · {g.compatibles.length} compatible model{g.compatibles.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        {expanded ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: MUTED }} /> : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: MUTED }} />}
                      </button>
                      {expanded && (
                        <div className="px-4 pb-3 pt-0.5 flex flex-wrap gap-1.5">
                          {g.compatibles.map(c => (
                            <span key={c.id} className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "hsl(var(--muted))" }}>
                              {c.brandName} {c.modelName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
