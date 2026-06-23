import { useState } from "react";
import { Link } from "wouter";
import { 
  useGetCombos, 
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
import { Search, Check, X, Filter } from "lucide-react";
import { ComboBadge } from "@/components/combo-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Combos() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const { data: combos = [], isLoading } = useGetCombos();
  
  const filteredCombos = combos.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.modelName.toLowerCase().includes(search.toLowerCase()) ||
                          c.brandName.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || c.comboType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Combos</h1>
        <p className="text-muted-foreground mt-1">Global view of all compatible displays.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-3 rounded-lg border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by brand, model, or combo name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full sm:w-48 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full">
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

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Combo Details</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Loading all combos...</TableCell>
              </TableRow>
            ) : filteredCombos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No combos found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCombos.map((combo) => (
                <TableRow key={combo.id} className="group">
                  <TableCell className="font-medium text-muted-foreground">{combo.brandName}</TableCell>
                  <TableCell>
                    <Link href={`/models/${combo.modelId}`} className="font-medium hover:underline text-primary">
                      {combo.modelName}
                    </Link>
                  </TableCell>
                  <TableCell>{combo.name}</TableCell>
                  <TableCell><ComboBadge type={combo.comboType} /></TableCell>
                  <TableCell>{combo.priceRange || "-"}</TableCell>
                  <TableCell>
                    {combo.inStock ? (
                      <div className="flex items-center text-green-600 gap-1 text-sm"><Check className="h-4 w-4" /> Yes</div>
                    ) : (
                      <div className="flex items-center text-destructive gap-1 text-sm"><X className="h-4 w-4" /> No</div>
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
