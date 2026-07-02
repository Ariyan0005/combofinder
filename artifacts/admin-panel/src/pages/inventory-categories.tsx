import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockCategories = [
  { id: 1, name: "Displays & Screens", count: 120 },
  { id: 2, name: "Batteries", count: 85 },
  { id: 3, name: "Flex Cables", count: 204 },
  { id: 4, name: "Motherboards", count: 15 },
];

export default function InventoryCategories() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Categories</h1>
          <p className="text-sm text-muted-foreground">Manage categories for parts and stock.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden max-w-3xl">
        <div className="p-4 border-b border-border">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search categories..." 
              className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
            <tr>
              <th className="px-4 py-3">Category Name</th>
              <th className="px-4 py-3">Items in Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockCategories.map((cat) => (
              <tr key={cat.id} className="border-b border-border hover:bg-secondary/20">
                <td className="px-4 py-3 font-semibold text-foreground">{cat.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{cat.count} items</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
