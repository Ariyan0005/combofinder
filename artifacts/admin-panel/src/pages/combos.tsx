import { useState } from "react";
import { Link } from "wouter";
import { useGetCombos } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Check, X, Filter, Database } from "lucide-react";
import { ComboBadge } from "@/components/combo-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Combos() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: combos = [], isLoading } = useGetCombos();

  const filteredCombos = combos.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.modelName.toLowerCase().includes(search.toLowerCase()) ||
      c.brandName.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || c.comboType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Combos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Global view of all compatible display combos.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by brand, model, or combo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-card"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-44">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 flex-1">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="OEM">OEM</SelectItem>
              <SelectItem value="Compatible">Compatible</SelectItem>
              <SelectItem value="Refurbished">Refurbished</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredCombos.length}</span> of{" "}
          <span className="font-semibold text-foreground">{combos.length}</span> combos
        </p>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Brand</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Model</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Combo</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Type</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Price</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-11">
                    <div className="h-4 bg-muted animate-pulse rounded w-full max-w-xs" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredCombos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Database className="h-8 w-8 text-muted-foreground opacity-30" />
                    <span className="text-sm text-muted-foreground">No combos found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCombos.map((combo) => (
                <TableRow key={combo.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm text-muted-foreground font-medium">{combo.brandName}</TableCell>
                  <TableCell>
                    <Link href={`/models/${combo.modelId}`}>
                      <span className="text-sm font-medium text-primary hover:underline cursor-pointer">
                        {combo.modelName}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{combo.name}</TableCell>
                  <TableCell><ComboBadge type={combo.comboType} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                    {combo.priceRange || "—"}
                  </TableCell>
                  <TableCell>
                    {combo.inStock ? (
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        In Stock
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs font-semibold text-destructive">
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                        Out
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
