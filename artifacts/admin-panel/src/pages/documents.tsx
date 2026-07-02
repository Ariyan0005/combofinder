import { Plus, Search, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockDocs = [
  { id: 1, name: "Apple Service Policies 2024", type: "PDF", size: "2.4 MB", date: "2024-01-10" },
  { id: 2, name: "Battery Safety Guidelines", type: "PDF", size: "1.1 MB", date: "2023-11-22" },
];

export default function Documents() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">Important manuals, guidelines, and policies.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Upload Document
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search docs..." 
              className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-4 py-3">Document Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Upload Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockDocs.map((doc) => (
                <tr key={doc.id} className="border-b border-border hover:bg-secondary/20">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <FileText className="h-5 w-5 text-red-400" />
                    <span className="font-semibold text-foreground">{doc.name}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{doc.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{doc.size}</td>
                  <td className="px-4 py-3 text-muted-foreground">{doc.date}</td>
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
