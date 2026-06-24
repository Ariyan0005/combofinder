import { useState } from "react";
import { useLocation } from "wouter";
import { useGetBrands } from "@workspace/api-client-react";
import { Tag, ChevronRight, Search } from "lucide-react";

export default function Brands() {
  const [filter, setFilter] = useState("");
  const { data: brands, isLoading } = useGetBrands();
  const [, navigate] = useLocation();

  const filtered = brands?.filter((b) =>
    b.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Brands</h1>
        <p className="text-muted-foreground mt-1 text-sm">Browse all supported phone brands</p>
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
          {filtered?.map((brand) => (
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
