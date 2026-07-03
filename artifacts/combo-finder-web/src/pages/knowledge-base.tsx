import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, FileText, Video, Cpu, Wrench, BookOpen, ChevronRight } from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";

const BASE = () => import.meta.env.BASE_URL.replace(/\/$/, "");

const TYPE_ICONS: Record<string, any> = {
  "Repair Tips": Wrench,
  "Schematics": Cpu,
  "Videos": Video,
  "PDF": FileText,
  "General": BookOpen,
};

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  "Repair Tips": { color: "#1D4ED8", bg: "#EFF6FF" },
  "Schematics":  { color: "#7C3AED", bg: "#F5F3FF" },
  "Videos":      { color: "#DC2626", bg: "#FEF2F2" },
  "PDF":         { color: "#059669", bg: "#ECFDF5" },
  "General":     { color: "#6B7280", bg: "#F3F4F6" },
};

export default function KnowledgeBase() {
  const [searchQ, setSearchQ] = useState("");

  const { data: items, isLoading } = useQuery<any[]>({
    queryKey: ["knowledge-base"],
    queryFn: () => fetch(`${BASE()}/api/knowledge-base`, { credentials: "include" }).then(r => r.json()),
  });

  const list = Array.isArray(items) ? items : [];
  const filtered = list.filter(item => {
    const q = searchQ.toLowerCase();
    return !q || (item.title ?? "").toLowerCase().includes(q) || (item.model ?? "").toLowerCase().includes(q);
  });

  return (
    <ProtectedPage>
      <div className="space-y-4">
        <h1 className="text-xl font-extrabold pt-1">Knowledge Base</h1>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search guides, schematics, videos…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm outline-none"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
            <p className="font-semibold">No articles found</p>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              {list.length === 0 ? "Knowledge base is empty" : "Try a different search"}
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {filtered.map((item: any) => {
              const cfg = TYPE_COLORS[item.type ?? "General"] ?? TYPE_COLORS["General"];
              const Icon = TYPE_ICONS[item.type ?? "General"] ?? FileText;
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-muted/30">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {item.type ?? "General"}{item.model ? ` · ${item.model}` : ""}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}
