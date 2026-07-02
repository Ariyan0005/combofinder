import { useState } from "react";
import { Search, Plus, FileText, Video, Cpu, Wrench } from "lucide-react";

const kbData = [
  { id: 1, title: "iPhone 13 Pro Screen Replacement Guide", type: "Repair Tips", model: "iPhone 13 Pro", date: "Oct 20, 2023", icon: Wrench, color: "text-blue-600 bg-blue-50" },
  { id: 2, title: "Samsung S22 Ultra Boardview", type: "Schematics", model: "Samsung S22 Ultra", date: "Oct 15, 2023", icon: Cpu, color: "text-purple-600 bg-purple-50" },
  { id: 3, title: "Tristar IC Diagnostic Steps", type: "Videos", model: "Universal Apple", date: "Oct 10, 2023", icon: Video, color: "text-red-600 bg-red-50" },
  { id: 4, title: "Water Damage First Steps Protocol", type: "PDF", model: "General", date: "Sep 28, 2023", icon: FileText, color: "text-emerald-600 bg-emerald-50" },
];

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">Schematics, manuals, and repair guides.</p>
        </div>
        <button className="bg-primary text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
          <div className="flex overflow-x-auto hide-scrollbar w-full sm:w-auto gap-2">
            {["All", "Repair Tips", "Schematics", "Videos", "PDF"].map(tab => (
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
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search guides..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* List */}
        <div className="p-4 grid gap-4 grid-cols-1 md:grid-cols-2">
          {kbData
            .filter(item => activeTab === "All" || item.type === activeTab)
            .map((item) => (
            <div key={item.id} className="flex gap-4 p-4 border border-border rounded-xl hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group bg-background">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">{item.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="font-semibold">{item.type}</span>
                  <span>•</span>
                  <span>{item.model}</span>
                  <span>•</span>
                  <span>{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}