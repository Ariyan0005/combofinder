import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Edit2, Trash2, Video, Play, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = "/api/videos";

interface VideoData {
  id: number;
  title: string;
  category: string;
  deviceBrand?: string;
  deviceModel?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: string;
  description?: string;
  tags?: string;
  views: number;
  createdAt: string;
}

export default function Videos() {
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: videos = [], isLoading } = useQuery<VideoData[]>({
    queryKey: ["videos", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      const r = await fetch(`${API}?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const createM = useMutation({
    mutationFn: async (data: Partial<VideoData>) => {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["videos"] }); setIsCreateOpen(false); toast({ title: "Video added" }); },
    onError: () => toast({ title: "Failed to add video", variant: "destructive" }),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<VideoData> }) => {
      const r = await fetch(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["videos"] }); setEditingVideo(null); toast({ title: "Video updated" }); },
    onError: () => toast({ title: "Failed to update video", variant: "destructive" }),
  });

  const deleteM = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API}/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["videos"] }); toast({ title: "Video deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const getFormData = (form: HTMLFormElement) => ({
    title: (form.elements.namedItem("title") as HTMLInputElement).value.trim(),
    category: (form.elements.namedItem("category") as HTMLSelectElement).value,
    deviceBrand: (form.elements.namedItem("deviceBrand") as HTMLInputElement).value.trim() || undefined,
    deviceModel: (form.elements.namedItem("deviceModel") as HTMLInputElement).value.trim() || undefined,
    videoUrl: (form.elements.namedItem("videoUrl") as HTMLInputElement).value.trim(),
    thumbnailUrl: (form.elements.namedItem("thumbnailUrl") as HTMLInputElement).value.trim() || undefined,
    duration: (form.elements.namedItem("duration") as HTMLInputElement).value.trim() || undefined,
    description: (form.elements.namedItem("description") as HTMLTextAreaElement).value.trim() || undefined,
    tags: (form.elements.namedItem("tags") as HTMLInputElement).value.trim() || undefined,
  });

  function VideoForm({ def }: { def?: VideoData }) {
    return (
      <div className="space-y-4 py-2">
        <div className="space-y-1"><Label className="text-xs">Title *</Label><Input name="title" defaultValue={def?.title} required autoFocus placeholder="e.g. Screen Replacement Tutorial" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Category *</Label>
            <select name="category" defaultValue={def?.category || "Repair Tutorial"} className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="Repair Tutorial">Repair Tutorial</option>
              <option value="Tips & Tricks">Tips & Tricks</option>
              <option value="Tools">Tools</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-1"><Label className="text-xs">Duration</Label><Input name="duration" defaultValue={def?.duration} placeholder="e.g. 15:30" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label className="text-xs">Device Brand</Label><Input name="deviceBrand" defaultValue={def?.deviceBrand} /></div>
          <div className="space-y-1"><Label className="text-xs">Device Model</Label><Input name="deviceModel" defaultValue={def?.deviceModel} /></div>
        </div>
        <div className="space-y-1"><Label className="text-xs">Video URL *</Label><Input name="videoUrl" defaultValue={def?.videoUrl} required placeholder="https://youtube.com/..." /></div>
        <div className="space-y-1"><Label className="text-xs">Thumbnail URL</Label><Input name="thumbnailUrl" defaultValue={def?.thumbnailUrl} placeholder="https://..." /></div>
        <div className="space-y-1"><Label className="text-xs">Description</Label><Textarea name="description" defaultValue={def?.description} rows={2} /></div>
        <div className="space-y-1"><Label className="text-xs">Tags</Label><Input name="tags" defaultValue={def?.tags} placeholder="comma, separated, tags" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training Videos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage video tutorials and guides.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-9 text-sm">
          <Plus className="h-4 w-4" /> Add Video
        </Button>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search videos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 bg-card" />
      </div>

      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{videos.length}</span> videos available
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm h-64 animate-pulse">
              <div className="h-32 bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))
        ) : videos.length === 0 ? (
          <div className="col-span-full h-40 flex flex-col items-center justify-center border border-dashed border-border rounded-xl">
            <Video className="h-8 w-8 text-muted-foreground opacity-25 mb-2" />
            <span className="text-sm text-muted-foreground">No videos found</span>
          </div>
        ) : (
          videos.map(v => (
            <div key={v.id} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm group flex flex-col transition-all hover:border-primary/50">
              <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
                {v.thumbnailUrl ? (
                  <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                ) : (
                  <Video className="h-8 w-8 text-muted-foreground/30" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a href={v.videoUrl} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground transform scale-75 group-hover:scale-100 transition-all shadow-lg hover:bg-primary/90">
                    <Play className="h-5 w-5 ml-1" />
                  </a>
                </div>
                {v.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm">
                    {v.duration}
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight flex-1" title={v.title}>{v.title}</h3>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1" onClick={() => setEditingVideo(v)}><Edit2 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => { if (confirm("Delete video?")) deleteM.mutate(v.id); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-auto">
                  <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded">{v.category}</span>
                  {(v.deviceBrand || v.deviceModel) && (
                    <span className="text-[10px] px-1.5 py-0.5 border border-border text-muted-foreground rounded">
                      {v.deviceBrand} {v.deviceModel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={e => { e.preventDefault(); createM.mutate(getFormData(e.currentTarget)); }}>
            <DialogHeader><DialogTitle>Add Video</DialogTitle></DialogHeader>
            <VideoForm />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={createM.isPending}>{createM.isPending ? "Saving..." : "Add Video"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingVideo} onOpenChange={o => !o && setEditingVideo(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={e => { e.preventDefault(); if (editingVideo) updateM.mutate({ id: editingVideo.id, data: getFormData(e.currentTarget) }); }}>
            <DialogHeader><DialogTitle>Edit Video</DialogTitle></DialogHeader>
            {editingVideo && <VideoForm def={editingVideo} key={editingVideo.id} />}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingVideo(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={updateM.isPending}>{updateM.isPending ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
