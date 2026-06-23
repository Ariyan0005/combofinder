import { useState, useEffect } from "react";
import { Link } from "wouter";
import { 
  useSearchModels, 
} from "@workspace/api-client-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search Database</h1>
        <p className="text-muted-foreground mt-1">Quickly find brands and models across the system.</p>
      </div>

      <div className="relative max-w-2xl">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
        <Input 
          placeholder="Type a brand or model name..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-12 h-14 text-lg bg-card shadow-sm"
          autoFocus
        />
        {isFetching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {!debouncedQuery ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border border-dashed">
          <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">Start typing to search</h3>
          <p className="text-sm text-muted-foreground mt-1">Find brands like "Samsung" or models like "Galaxy S23"</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Brands Results */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> Brands
              <span className="text-sm font-normal bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                {results?.brands.length || 0}
              </span>
            </h2>
            
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Models</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center h-20">Searching...</TableCell></TableRow>
                  ) : results?.brands.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center h-20 text-muted-foreground">No brands found.</TableCell></TableRow>
                  ) : (
                    results?.brands.map(brand => (
                      <TableRow key={brand.id}>
                        <TableCell className="font-medium">{brand.name}</TableCell>
                        <TableCell>{brand.modelCount}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/brands/${brand.id}/models`}>
                            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground hover:text-primary cursor-pointer" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Models Results */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" /> Models
              <span className="text-sm font-normal bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                {results?.models.length || 0}
              </span>
            </h2>
            
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center h-20">Searching...</TableCell></TableRow>
                  ) : results?.models.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center h-20 text-muted-foreground">No models found.</TableCell></TableRow>
                  ) : (
                    results?.models.map(model => (
                      <TableRow key={model.id}>
                        <TableCell className="font-medium">{model.name}</TableCell>
                        <TableCell className="text-muted-foreground">{model.brandName}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/models/${model.id}`}>
                            <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground hover:text-primary cursor-pointer" />
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
