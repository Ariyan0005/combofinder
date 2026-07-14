import { useState } from "react";
import { Link } from "wouter";
import { useSearchModels } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { SearchIcon, Smartphone, Layers, ArrowRight } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data: results, isLoading, isFetching } = useSearchModels(
    { q: debouncedQuery || undefined },
    { query: { enabled: !!debouncedQuery } }
  );

  const totalResults = (results?.brands.length || 0) + (results?.models.length || 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search Database</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Find brands and models instantly across the database.</p>
      </div>

      {/* Search Box */}
      <div className="relative max-w-2xl">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Type a brand or model name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-12 h-12 text-base bg-card shadow-sm rounded-xl"
          autoFocus
        />
        {isFetching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results summary */}
      {debouncedQuery && !isLoading && (
        <p className="text-xs text-muted-foreground">
          Found <span className="font-semibold text-foreground">{totalResults}</span> result{totalResults !== 1 ? "s" : ""} for{" "}
          <span className="font-semibold text-foreground">"{debouncedQuery}"</span>
        </p>
      )}

      {/* Empty state */}
      {!debouncedQuery && (
        <div className="text-center py-16 bg-card rounded-xl border border-dashed border-border">
          <SearchIcon className="mx-auto h-10 w-10 text-muted-foreground opacity-20 mb-3" />
          <h3 className="text-base font-semibold text-foreground">Start typing to search</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try "Samsung", "Galaxy A15", or "Oppo"
          </p>
        </div>
      )}

      {/* Results Grid */}
      {debouncedQuery && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Brands */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Brands</h2>
              <span className="text-xs font-semibold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                {results?.brands.length || 0}
              </span>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Name</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Models</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={3} className="h-20 text-center text-sm text-muted-foreground">Searching...</TableCell></TableRow>
                  ) : results?.brands.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="h-20 text-center text-sm text-muted-foreground">No brands found</TableCell></TableRow>
                  ) : (
                    results?.brands.map(brand => (
                      <TableRow key={brand.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium text-sm">{brand.name}</TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {brand.modelCount}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link href={`/brands/${brand.id}/models`}>
                            <div className="flex justify-end">
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors cursor-pointer" />
                            </div>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Models */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-sm font-bold text-foreground">Models</h2>
              <span className="text-xs font-semibold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                {results?.models.length || 0}
              </span>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Model</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">Brand</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={3} className="h-20 text-center text-sm text-muted-foreground">Searching...</TableCell></TableRow>
                  ) : results?.models.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="h-20 text-center text-sm text-muted-foreground">No models found</TableCell></TableRow>
                  ) : (
                    results?.models.map(model => (
                      <TableRow key={model.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium text-sm">{model.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{model.brandName}</TableCell>
                        <TableCell>
                          <Link href={`/models/${model.id}`}>
                            <div className="flex justify-end">
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors cursor-pointer" />
                            </div>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
