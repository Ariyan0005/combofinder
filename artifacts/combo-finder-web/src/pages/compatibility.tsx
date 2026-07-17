import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, ChevronRight, Layers, Smartphone, ChevronDown, X, Clock,
} from "lucide-react";
import { Link } from "wouter";

// Per-section isolated recent searches
const ALL = "all";

function lsKey(slug: string) { return `cf_recent_${slug}`; }
function getRecentSearches(slug: string): string[] {
  try { return JSON.parse(localStorage.getItem(lsKey(slug)) ?? "[]"); } catch { return []; }
}
function addRecentSearch(slug: string, q: string) {
  const arr = getRecentSearches(slug).filter(s => s !== q).slice(0, 9);
  arr.unshift(q);
  localStorage.setItem(lsKey(slug), JSON.stringify(arr));
}

const BRAND_PALETTES = [
  { bg: "#EEF2FF", color: "#6366F1" },
  { bg: "#F5F3FF", color: "#8B5CF6" },
  { bg: "#FDF2F8", color: "#EC4899" },
  { bg: "#FFF7E6", color: "#F59E0B" },
  { bg: "#ECFDF5", color: "#10B981" },
  { bg: "#EFF6FF", color: "#3B82F6" },
  { bg: "#FEF2F2", color: "#EF4444" },
  { bg: "#F0FDFF", color: "#06B6D4" },
];

function brandPalette(name: string) {
  return BRAND_PALETTES[name.charCodeAt(0) % BRAND_PALETTES.length];
}
function categoryColor(name: string) {
  return BRAND_PALETTES[name.charCodeAt(0) % BRAND_PALETTES.length];
}

function getRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function addRecentSearch(q: string) {
  const arr = getRecentSearches().filter(s => s !== q).slice(0, 9);
  arr.unshift(q);
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

const MUTED = "hsl(var(--muted-foreground))";
const BORDER = "hsl(var(--border))";
const CARD  = "hsl(var(--card))";
const PRIMARY = "hsl(var(--primary))";

function readCategoryFromUrl(): string {
  try { return new URLSearchParams(window.location.search).get("category") ?? ALL; } catch { return ALL; }
}

export default function Compatibility() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches(readCategoryFromUrl() || "display"));
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>(() => readCategoryFromUrl());
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Load categories
  const { data: cats } = useQuery<any[]>({
    queryKey: ["categories"],
    queryFn: () => fetch(`/api/categories`, { credentials: "include" }).then(r => r.json()),
  });
  useEffect(() => {
    // ISP & Pinout has its own dedicated page — exclude it from this dropdown
    if (Array.isArray(cats)) setCategories(cats.filter((c: any) => c.slug !== "isp-pinout"));
  }, [cats]);

  // Default the selection to "Display" when no category is in the URL
  useEffect(() => {
    if (categories.length === 0) return;
    const urlCat = readCategoryFromUrl();
    if (urlCat === ALL) {
      const display = categories.find(c => c.name === "Display" || c.slug === "display");
      const slug = display?.slug ?? categories[0]?.slug ?? ALL;
      if (slug !== ALL) {
        setSelectedSlug(slug);
        updateUrl(slug);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const selectedCategory = categories.find(c => c.slug === selectedSlug);
  const selectedCategoryId = selectedSlug === ALL ? undefined : selectedCategory?.id;

  function updateUrl(slug: string) {
    try {
      const url = new URL(window.location.href);
      if (slug === ALL) url.searchParams.delete("category");
      else url.searchParams.set("category", slug);
      window.history.replaceState(null, "", url.toString());
    } catch {}
  }

  function selectCategory(slug: string) {
    setSelectedSlug(slug);
    setShowDropdown(false);
    updateUrl(slug);
  }

  const { data: searchResults, isLoading: searching } = useQuery<{ brands?: any[]; models?: any[]; combos?: any[] }>({
    queryKey: ["search", debouncedQuery, selectedCategoryId],
    queryFn: () =>
      fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}${selectedCategoryId ? `&category_id=${selectedCategoryId}` : ""}`, { credentials: "include" }).then(r => r.json()),
    enabled: debouncedQuery.length >= 2,
  });

  const { data: brands } = useQuery<any[]>({
    queryKey: ["brands", selectedCategoryId],
    queryFn: () => fetch(`/api/brands${selectedCategoryId ? `?category_id=${selectedCategoryId}` : ""}`, { credentials: "include" }).then(r => r.json()),
    enabled: debouncedQuery.length < 2,
  });

  const { data: stats } = useQuery<{ totalBrands?: number; totalModels?: number; totalCombos?: number }>({
    queryKey: ["compat-stats", selectedCategoryId],
    queryFn: () => fetch(`/api/stats/public`, { credentials: "include" }).then(r => r.json()).catch(() => ({})),
    enabled: debouncedQuery.length < 2,
  });

  // Reload recent searches whenever the selected section changes
  useEffect(() => {
    setRecentSearches(getRecentSearches(selectedSlug));
  }, [selectedSlug]);

  function handleSearchSelect(q: string) {
    addRecentSearch(selectedSlug, q);
    setRecentSearches(getRecentSearches(selectedSlug));
  }

  function removeRecent(q: string) {
    const arr = getRecentSearches(selectedSlug).filter(s => s !== q);
    localStorage.setItem(lsKey(selectedSlug), JSON.stringify(arr));
    setRecentSearches(arr);
  }

  const allModels = Array.isArray(searchResults?.models) ? searchResults!.models : [];
  const allBrands = Array.isArray(searchResults?.brands) ? searchResults!.brands : [];
  const allCombos = Array.isArray(searchResults?.combos) ? searchResults!.combos : [];
  const brandList = Array.isArray(brands) ? brands.slice(0, 10) : [];

  // Section-specific routing: battery and IC get their own pages
  const isBatteryMode = selectedSlug === "battery";
  const isIcMode = selectedSlug === "ic";

  function brandLink(id: number) {
    if (isBatteryMode) return `/battery-brand/${id}`;
    if (isIcMode) return `/ic-brand/${id}`;
    return `/brands/${id}`;
  }

  function modelLink(id: number) {
    return selectedSlug !== ALL ? `/models/${id}?category=${selectedSlug}` : `/models/${id}`;
  }

  const activeColor = selectedSlug !== ALL && selectedCategory ? categoryColor(selectedCategory.name).color : PRIMARY;

  return (
    <div className="space-y-4">
      {/* Header + stats pills */}
      <div className="pt-1">
        <h1 className="text-xl font-extrabold">Compatibility Finder</h1>
        {(stats?.totalBrands || stats?.totalModels) && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {stats?.totalBrands && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "#EEF2FF", color: "#6366F1" }}>
                {stats.totalBrands} Brands
              </span>
            )}
            {stats?.totalModels && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "#ECFDF5", color: "#10B981" }}>
                {stats.totalModels} Models
              </span>
            )}
            {stats?.totalCombos && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "#FFF7E6", color: "#F59E0B" }}>
                {stats.totalCombos} Parts
              </span>
            )}
          </div>
        )}
      </div>

      {/* Search bar + Part Type dropdown */}
      <div className="flex gap-2 items-center">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
          <input
            type="text"
            placeholder={selectedSlug === "ic" ? "Search by IC number…" : "Search model or part…"}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl border text-sm outline-none transition-all"
            style={{ borderColor: BORDER, background: CARD }}
            onFocus={e => { e.currentTarget.style.borderColor = PRIMARY; }}
            onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: MUTED }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Part Type (Category) dropdown */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(v => !v)}
            className="flex items-center gap-1.5 px-3 py-3.5 rounded-2xl border text-sm font-semibold whitespace-nowrap transition-all"
            style={{
              borderColor: BORDER,
              background: selectedSlug !== ALL && selectedCategory ? categoryColor(selectedCategory.name).bg : CARD,
              color: selectedSlug !== ALL && selectedCategory ? categoryColor(selectedCategory.name).color : "hsl(var(--foreground))",
            }}
          >
            {selectedSlug !== ALL && selectedCategory ? (
              <span className="w-3.5 h-3.5 rounded-md flex-shrink-0" style={{ background: categoryColor(selectedCategory.name).color }} />
            ) : (
              <Layers className="w-3.5 h-3.5" style={{ color: MUTED }} />
            )}
            <span>{selectedSlug === ALL ? "Part Type" : (selectedCategory?.slug === "ic" ? "IC Match" : selectedCategory?.name ?? "Part Type")}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-1.5 z-50 rounded-2xl border shadow-lg overflow-hidden min-w-[150px]"
              style={{ borderColor: BORDER, background: CARD }}>
              {categories.map((c: any) => {
                const pal = categoryColor(c.name);
                const isActive = selectedSlug === c.slug;
                const label = c.slug === "ic" ? "IC Match" : c.name;
                return (
                  <button
                    key={c.slug}
                    onClick={() => selectCategory(c.slug)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-left transition-colors hover:bg-muted/50"
                    style={isActive ? { color: PRIMARY, fontWeight: 700 } : { color: "hsl(var(--foreground))" }}
                  >
                    <span className="w-3.5 h-3.5 rounded-md flex-shrink-0" style={{ background: pal.color }} />
                    {label}
                    {isActive && <span className="ml-auto text-primary">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected category badge when searching */}
      {debouncedQuery.length >= 2 && selectedSlug !== ALL && selectedCategory && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: categoryColor(selectedCategory.name).bg, color: categoryColor(selectedCategory.name).color }}>
            {selectedCategory.slug === "ic" ? "IC Match" : selectedCategory.name} Compatibility
          </span>
        </div>
      )}

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
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>Brands</p>
                  <div className="grid grid-cols-2 gap-2">
                    {allBrands.map((b: any) => {
                      const pal = brandPalette(b.name);
                      const initials = b.name.split(/[\s/]/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                      return (
                        <Link key={b.id} href={brandLink(b.id)}>
                          <div onClick={() => handleSearchSelect(b.name)}
                            className="flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all hover:shadow-sm"
                            style={{ borderColor: BORDER, background: CARD }}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
                              style={{ background: pal.bg, color: pal.color }}>{initials}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{b.name}</p>
                              <p className="text-[10px]" style={{ color: MUTED }}>{b.modelCount ?? 0} models</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: MUTED }} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
              {allModels.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>Models</p>
                  <div className="rounded-2xl border divide-y overflow-hidden" style={{ borderColor: BORDER, background: CARD }}>
                    {allModels.map((m: any) => (
                      <Link key={m.id} href={modelLink(m.id)}>
                        <div onClick={() => handleSearchSelect(m.name)}
                          className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-muted/30">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: "hsl(var(--muted))" }}>
                              <Smartphone className="w-4 h-4" style={{ color: MUTED }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{m.name}</p>
                              {m.brandName && <p className="text-[10px] truncate" style={{ color: MUTED }}>{m.brandName}{m.comboCount != null ? ` · ${m.comboCount} combo${m.comboCount !== 1 ? "s" : ""}` : ""}</p>}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 flex-shrink-0 ml-2" style={{ color: MUTED }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {allCombos.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: MUTED }}>
                    {selectedSlug === "ic" ? "IC Numbers" : "Compatible Parts"}
                  </p>
                  <div className="rounded-2xl border divide-y overflow-hidden" style={{ borderColor: BORDER, background: CARD }}>
                    {allCombos.map((c: any) => (
                      <Link key={c.id} href={modelLink(c.modelId)}>
                        <div onClick={() => handleSearchSelect(c.name)}
                          className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-muted/30">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: "hsl(var(--muted))" }}>
                              <Layers className="w-4 h-4" style={{ color: MUTED }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{c.name}</p>
                              <p className="text-[10px] truncate" style={{ color: MUTED }}>{c.brandName} {c.modelName} · {c.comboType}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 flex-shrink-0 ml-2" style={{ color: MUTED }} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {allBrands.length === 0 && allModels.length === 0 && allCombos.length === 0 && (
                <div className="text-center py-12 rounded-2xl border border-dashed" style={{ borderColor: BORDER }}>
                  <Smartphone className="w-9 h-9 mx-auto mb-2" style={{ color: MUTED, opacity: 0.4 }} />
                  <p className="text-sm font-semibold">No results for "{debouncedQuery}"</p>
                  <p className="text-xs mt-1" style={{ color: MUTED }}>Try a different model name or brand</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Popular Brands — 2-col grid with initials */}
          {brandList.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-base">
                  {selectedSlug !== ALL && selectedCategory ? `${selectedCategory.name} Brands` : "Popular Brands"}
                </h2>
                <Link href="/brands">
                  <span className="text-xs font-semibold" style={{ color: PRIMARY }}>View All</span>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {brandList.map((b: any) => {
                  const pal = brandPalette(b.name);
                  const initials = b.name.split(/[\s/]/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <Link key={b.id} href={brandLink(b.id)}>
                      <div className="flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all hover:shadow-sm"
                        style={{ borderColor: BORDER, background: CARD }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
                          style={{ background: pal.bg, color: pal.color }}>{initials}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{b.name}</p>
                          {b.modelCount != null && (
                            <p className="text-[10px]" style={{ color: MUTED }}>
                              {isBatteryMode ? `${b.modelCount} battery models` : `${b.modelCount} models`}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: MUTED }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div>
              <h2 className="font-bold text-base mb-3">Recent Searches</h2>
              <div className="rounded-2xl border divide-y overflow-hidden" style={{ borderColor: BORDER, background: CARD }}>
                {recentSearches.slice(0, 5).map(q => (
                  <div key={q} className="flex items-center justify-between px-4 py-3">
                    <button className="flex items-center gap-3 flex-1 text-left" onClick={() => setQuery(q)}>
                      <Clock className="w-4 h-4 flex-shrink-0" style={{ color: MUTED }} />
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
        </div>
      )}
    </div>
  );
}
