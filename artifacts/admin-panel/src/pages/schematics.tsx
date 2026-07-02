import { Plus, Search, FolderOpen, Download, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockSchematics = [
  { id: 1, name: "iPhone 14 Pro Max Schematic Diagram", brand: "Apple", size: "14.2 MB", date: "2023-10-15" },
  { id: 2, name: "Samsung Galaxy S23 Ultra Board View", brand: "Samsung", size: "8.5 MB", date: "2023-09-20" },
  { id: 3, name: "MacBook Pro M2 A2779 Schematic", brand: "Apple", size: "22.1 MB", date: "2023-11-05" },
];

export default function Schematics() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schematics & Board Views</h1>
          <p className="text-sm text-muted-foreground">Manage downloadable technical diagrams for devices.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Upload Schematic
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search schematics..." 
              className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Upload Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockSchematics.map((file) => (
                <tr key={file.id} className="border-b border-border hover:bg-secondary/20">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-blue-400" />
                    <span className="font-semibold text-foreground">{file.name}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{file.brand}</td>
                  <td className="px-4 py-3 text-muted-foreground">{file.size}</td>
                  <td className="px-4 py-3 text-muted-foreground">{file.date}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                      <Download className="h-4 w-4" />
                    </Button>
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
