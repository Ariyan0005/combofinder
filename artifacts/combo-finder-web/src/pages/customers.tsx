import { useState } from "react";
import { Search, Plus, Phone, MessageSquare, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const customersData = [
  { id: 1, name: "Sarah Jenkins", phone: "+1 555-0123", whatsapp: true, repairs: 4, spent: "$450.00", date: "Jan 12, 2023" },
  { id: 2, name: "Mike Ross", phone: "+1 555-0124", whatsapp: true, repairs: 1, spent: "$80.00", date: "Oct 24, 2023" },
  { id: 3, name: "Emily Chen", phone: "+1 555-0125", whatsapp: false, repairs: 2, spent: "$190.00", date: "Mar 05, 2023" },
  { id: 4, name: "Tom Hardy", phone: "+1 555-0126", whatsapp: true, repairs: 5, spent: "$820.00", date: "Nov 18, 2022" },
];

export default function Customers() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage client profiles and repair history.</p>
        </div>
        <button className="bg-primary text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Contact</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Stats</th>
                <th className="px-6 py-3 font-medium text-muted-foreground text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customersData.map((customer) => (
                <tr key={customer.id} className="hover:bg-muted/30 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">Joined {customer.date}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{customer.phone}</span>
                      <div className="flex gap-1">
                        <button className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        {customer.whatsapp && (
                          <button className="w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{customer.repairs} Repairs</p>
                    <p className="text-xs text-muted-foreground">Spent {customer.spent}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/customers/${customer.id}`}>
                      <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </Link>
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