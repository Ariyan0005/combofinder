import { useState } from "react";
import { Plus, Search, Filter, PackageOpen } from "lucide-react";

const inventoryData = [
  { id: 1, name: "iPhone 13 Display (OLED)", category: "Displays", stock: 2, min: 5, price: "$85.00", brand: "Apple" },
  { id: 2, name: "Samsung S21 Battery", category: "Batteries", stock: 1, min: 3, price: "$25.00", brand: "Samsung" },
  { id: 3, name: "Type-C Charging Port", category: "Ports", stock: 45, min: 20, price: "$3.50", brand: "Generic" },
  { id: 4, name: "iPhone 12 Pro Max Display", category: "Displays", stock: 8, min: 3, price: "$120.00", brand: "Apple" },
  { id: 5, name: "U2 Tristar IC", category: "ICs", stock: 12, min: 10, price: "$4.00", brand: "Apple" },
];

export default function Inventory() {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage spare parts and monitor stock levels.</p>
        </div>
        <button className="bg-primary text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
          <div className="flex overflow-x-auto hide-scrollbar w-full sm:w-auto gap-2">
            {["All", "Displays", "Batteries", "ICs", "Ports", "More"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search parts..."
                className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button className="p-2 border border-border rounded-lg bg-background hover:bg-muted text-muted-foreground transition-colors shrink-0">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium text-muted-foreground">Item Name</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Brand</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Category</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inventoryData
                .filter(item => activeTab === "All" || item.category === activeTab)
                .map((item) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-semibold text-foreground">{item.name}</td>
                  <td className="px-6 py-4">{item.brand}</td>
                  <td className="px-6 py-4 text-muted-foreground">{item.category}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${item.stock <= item.min ? 'text-red-600' : 'text-foreground'}`}>
                        {item.stock}
                      </span>
                      {item.stock <= item.min && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">Low</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">{item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {inventoryData.filter(item => activeTab === "All" || item.category === activeTab).length === 0 && (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <PackageOpen className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p>No items found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}