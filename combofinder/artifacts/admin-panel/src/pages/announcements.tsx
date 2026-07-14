import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Megaphone, Edit, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Announcement {
  id: number;
  title: string;
  content: string;
  targetType: string;
  priority: string;
  isPublished: boolean;
  expiresAt?: string;
  createdAt: string;
}

const EMPTY: Omit<Announcement, "id" | "createdAt"> = {
  title: "", content: "", targetType: "All", priority: "Normal", isPublished: false,
};

export default function Announcements() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["admin-announcements"],
    queryFn: () => fetch("/api/announcements", { credentials: "include" }).then(r => r.json()),
  });

  const openCreate = () => { setForm({ ...EMPTY }); setEditing(null); setShowForm(true); };
  const openEdit = (a: Announcement) => {
    setForm({ title: a.title, content: a.content, targetType: a.targetType, priority: a.priority, isPublished: a.isPublished });
    setEditing(a);
    setShowForm(true);
  };

  const saveM = useMutation({
    mutationFn: async (data: typeof form) => {
      const url = editing ? `/api/announcements/${editing.id}` : "/api/announcements";
      const method = editing ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      setShowForm(false);
      toast({ title: editing ? "Announcement updated" : "Announcement created" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const publishM = useMutation({
    mutationFn: async ({ id, pub }: { id: number; pub: boolean }) => {
      const r = await fetch(`/api/announcements/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: pub }), credentials: "include",
      });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-announcements"] }); toast({ title: "Status updated" }); },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const deleteM = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/announcements/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-announcements"] }); toast({ title: "Deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const PRIORITY_COLORS: Record<string, string> = {
    Low: "bg-gray-500/10 text-gray-400",
    Normal: "bg-blue-500/10 text-blue-400",
    High: "bg-amber-500/10 text-amber-400",
    Critical: "bg-red-500/10 text-red-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">Broadcast messages to your users.</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Create Announcement
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Megaphone className="h-8 w-8 opacity-30" />
            <p>No announcements yet. Create one!</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-border hover:bg-secondary/20">
                  <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate max-w-xs">{item.title}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.targetType}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[item.priority] ?? "bg-gray-500/10 text-gray-400"}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => publishM.mutate({ id: item.id, pub: !item.isPublished })}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium cursor-pointer transition-opacity hover:opacity-70 ${item.isPublished ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}
                    >
                      {item.isPublished ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => openEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => { if (confirm("Delete this announcement?")) deleteM.mutate(item.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={v => !v && setShowForm(false)}>
        <DialogContent className="bg-card border border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Title</label>
              <input
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Announcement title..."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Content</label>
              <textarea
                rows={4}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                placeholder="Write your announcement..."
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Target</label>
                <select
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.targetType}
                  onChange={e => setForm(f => ({ ...f, targetType: e.target.value }))}
                >
                  {["All", "Free", "Pro", "Business", "Lifetime"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Priority</label>
                <select
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                >
                  {["Low", "Normal", "High", "Critical"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                className="accent-primary"
                checked={form.isPublished}
                onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
              />
              <label htmlFor="published" className="text-sm">Publish immediately</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              onClick={() => saveM.mutate(form)}
              disabled={saveM.isPending || !form.title || !form.content}
              className="gap-2"
            >
              <Send className="h-4 w-4" /> {saveM.isPending ? "Saving..." : editing ? "Update" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
