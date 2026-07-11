import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tag, ChevronRight, Search, Layers } from "lucide-react";

export default function Brands() {
  const [filter, setFilter] = useState("");
  const [location, navigate] = useLocation();

  const slug = new URLSearchParams(location.split("?")[1] ?? "").get("category");

  const { data: categories } = useQuery<any[]>({
    queryKey: ["categories"],
    queryFn: () => fetch(`/api/categories`, { credentials: "include" }).then(r => r.json()),
  });
  const selectedCategory = Array.isArray(categories) ? categories.find((c: any) => c.slug === slug) : undefined;
  const categoryId = selectedCategory?.id;

  const { data: brands, isLoading } = useQuery<any[]>({
    queryKey: ["brands", categoryId],
    queryFn: () => fetch(`/api/brands${categoryId ? `?category_id=${categoryId}` : ""}`, { credentials: "include" }).then(r => r.json()),
  });

  const filtered = (brands ?? []).filter((b: any) =>
    b.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {selectedCategory ? `${selectedCategory.name} Brands` : "All Brands"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {selectedCategory ? "Browse brands in this category" : "Browse all supported phone brands"}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Filter brands..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered?.map((brand: any) => (
            <button
              key={brand.id}
              onClick={() => navigate(`/brands/${brand.id}`)}
              className="w-full bg-white rounded-xl border border-border p-3 flex items-center justify-between hover:border-primary/40 hover:shadow-sm transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{brand.name}</p>
                  <p className="text-xs text-muted-foreground">{brand.modelCount} models available</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
          {filtered?.length === 0 && (
            <p className="text-center py-8 text-sm text-muted-foreground">No brands found</p>
          )}
        </div>
      )}
    </div>
  );
}
