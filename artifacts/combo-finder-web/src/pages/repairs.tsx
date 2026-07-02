import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash } from "lucide-react";

const repairsData = [
  { id: "RP-1042", customer: "Sarah Jenkins", device: "iPhone 13 Pro", problem: "Broken Screen", status: "Repairing", statusColor: "bg-blue-100 text-blue-700", date: "Oct 24, 2023", cost: "$150.00" },
  { id: "RP-1041", customer: "Mike Ross", device: "Samsung S22", problem: "Battery Replacement", status: "Waiting", statusColor: "bg-amber-100 text-amber-700", date: "Oct 24, 2023", cost: "$80.00" },
  { id: "RP-1040", customer: "Emily Chen", device: "iPad Air 4", problem: "Charging Port", status: "Ready", statusColor: "bg-emerald-100 text-emerald-700", date: "Oct 23, 2023", cost: "$95.00" },
  { id: "RP-1039", customer: "Tom Hardy", device: "Google Pixel 7", problem: "Water Damage", status: "Delivered", statusColor: "bg-slate-100 text-slate-700", date: "Oct 22, 2023", cost: "$120.00" },
  { id: "RP-1038", customer: "Jessica Alba", device: "MacBook Air M1", problem: "Keyboard", status: "Repairing", statusColor: "bg-blue-100 text-blue-700", date: "Oct 22, 2023", cost: "$200.00" },
];

export default function Repairs() {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Repairs Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and update ongoing repair jobs.</p>
        </div>
        <button className="bg-primary text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New Repair
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
          <div className="flex overflow-x-auto hide-scrollbar w-full sm:w-auto gap-2">
            {["All", "Waiting", "Repairing", "Ready", "Delivered"].map(tab => (
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
                placeholder="Search ID, Customer..."
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
                <th className="px-6 py-3 font-medium text-muted-foreground">ID / Date</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Device & Problem</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Cost</th>
                <th className="px-6 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {repairsData
                .filter(r => activeTab === "All" || r.status === activeTab)
                .map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground">{row.id}</p>
                    <p className="text-xs text-muted-foreground">{row.date}</p>
                  </td>
                  <td className="px-6 py-4 font-medium">{row.customer}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{row.device}</p>
                    <p className="text-xs text-muted-foreground">{row.problem}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.statusColor}`}>{row.status}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold">{row.cost}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {repairsData.filter(r => activeTab === "All" || r.status === activeTab).length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No repairs found for this status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}