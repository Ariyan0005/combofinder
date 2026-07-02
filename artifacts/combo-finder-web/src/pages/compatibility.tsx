import { useState } from "react";
import { Search, ChevronRight, Smartphone, Battery, Cpu, Layers, Wrench } from "lucide-react";

export default function Compatibility() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Displays");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Compatibility Finder</h1>
        <p className="text-muted-foreground mt-1 text-sm">Find compatible parts, schematics, and repair solutions instantly.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm">
        <div className="relative max-w-2xl mx-auto">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search model or part (e.g. iPhone 13, Samsung A51 LCD)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
      </div>

      {query ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 text-center border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
                <Smartphone className="w-16 h-16 mx-auto text-primary mb-3" />
                <h2 className="text-xl font-bold">iPhone 13</h2>
                <p className="text-sm text-muted-foreground">Apple • Released 2021</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted p-2 rounded text-center">
                  <p className="text-xs text-muted-foreground">Model IDs</p>
                  <p className="font-semibold mt-0.5">A2633, A2482</p>
                </div>
                <div className="bg-muted p-2 rounded text-center">
                  <p className="text-xs text-muted-foreground">Repairs</p>
                  <p className="font-semibold mt-0.5">142 total</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm p-4 space-y-3">
              <h3 className="font-bold mb-2">Quick Resources</h3>
              {[
                { label: "Repair Notes", icon: Layers },
                { label: "Known Issues", icon: Cpu },
                { label: "Schematics & Boardview", icon: Cpu },
              ].map((res, i) => (
                <button key={i} className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary hover:text-primary transition-colors text-left text-sm font-medium">
                  <div className="flex items-center gap-3">
                    <res.icon className="w-4 h-4" /> {res.label}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="flex border-b border-border overflow-x-auto hide-scrollbar">
              {["Displays", "Batteries", "Charging Ports", "ICs", "More"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              {activeTab === "Displays" && (
                <div className="space-y-4">
                  {[
                    { name: "iPhone 13 Original Pull", type: "OLED", match: 100 },
                    { name: "iPhone 13 Aftermarket (Hard OLED)", type: "OLED", match: 100 },
                    { name: "iPhone 13 Aftermarket (Incell)", type: "LCD", match: 100, warn: "TrueTone may not work without copy" },
                  ].map((part, i) => (
                    <div key={i} className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-foreground">{part.name}</h4>
                          <p className="text-sm text-muted-foreground">{part.type}</p>
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded">
                          {part.match}% Match
                        </span>
                      </div>
                      {part.warn && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-2 border border-amber-200">
                          Note: {part.warn}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {activeTab !== "Displays" && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wrench className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">Select parts to view compatibility</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Start Typing to Search</h3>
          <p className="text-muted-foreground mt-2">Find parts, models, and schematics across thousands of devices.</p>
        </div>
      )}
    </div>
  );
}

