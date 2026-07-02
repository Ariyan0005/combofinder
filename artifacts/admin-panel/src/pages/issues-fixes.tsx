import { useState } from "react";
import { Wrench, Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockIssues = [
  { id: 1, title: "iPhone 13 Pro Blank Screen after drop", device: "iPhone 13 Pro", category: "Display", views: 1245 },
  { id: 2, title: "Samsung S22 Ultra No Service", device: "Galaxy S22 Ultra", category: "Network", views: 890 },
];

export default function IssuesFixes() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Issues & Fixes</h1>
          <p className="text-sm text-muted-foreground">Knowledge base for common hardware and software issues.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Solution
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex gap-4 items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search issues..." 
            className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockIssues.map(issue => (
          <div key={issue.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                {issue.category}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white">
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <h3 className="font-semibold text-lg line-clamp-2">{issue.title}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" /> {issue.device}
            </p>
            <div className="pt-3 border-t border-border mt-auto text-xs text-muted-foreground">
              {issue.views} views
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
