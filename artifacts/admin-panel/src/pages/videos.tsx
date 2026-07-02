import { Plus, Search, Play, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockVideos = [
  { id: 1, title: "iPhone 15 Pro Max Teardown", duration: "14:20", views: 3400, date: "2023-10-01" },
  { id: 2, title: "Samsung S23 Screen Replacement", duration: "22:15", views: 2100, date: "2023-09-12" },
];

export default function Videos() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training Videos</h1>
          <p className="text-sm text-muted-foreground">Video tutorials for complex repairs.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Video
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search videos..." 
            className="w-full bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockVideos.map(video => (
          <div key={video.id} className="bg-card border border-border rounded-xl overflow-hidden group">
            <div className="aspect-video bg-secondary relative flex items-center justify-center">
              <Play className="h-10 w-10 text-white/50 group-hover:text-white transition-colors" />
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                {video.duration}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-sm line-clamp-2 mb-2">{video.title}</h3>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{video.views} views</span>
                <span>{video.date}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex justify-end">
                <Button variant="ghost" size="sm" className="h-8 gap-1">
                  <Edit className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
