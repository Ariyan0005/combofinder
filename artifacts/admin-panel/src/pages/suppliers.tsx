import { Plus, Search, Edit, Trash2, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockSuppliers = [
  { id: 1, name: "China Mobile Parts", contact: "Zhang Wei", phone: "+86 138 0000 0000", email: "sales@chinamobileparts.com", items: 450 },
  { id: 2, name: "Dubai Electronics", contact: "Ahmed Ali", phone: "+971 50 000 0000", email: "info@dubaielectronics.ae", items: 120 },
];

export default function Suppliers() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground">Manage your parts and inventory suppliers.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Supplier
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search suppliers..." 
              className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-4 py-3">Supplier Name</th>
                <th className="px-4 py-3">Contact Person</th>
                <th className="px-4 py-3">Contact Info</th>
                <th className="px-4 py-3">Items Supplied</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockSuppliers.map((sup) => (
                <tr key={sup.id} className="border-b border-border hover:bg-secondary/20">
                  <td className="px-4 py-3 font-semibold text-foreground">{sup.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{sup.contact}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> {sup.phone}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" /> {sup.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{sup.items} items</td>
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
    </div>
  );
}
