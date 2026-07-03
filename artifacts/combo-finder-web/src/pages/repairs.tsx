import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, ChevronRight, X, Wrench, AlertCircle } from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";

const BASE = () => import.meta.env.BASE_URL.replace(/\/$/, "");

const STATUSES = ["All", "Repairing", "Waiting", "Ready", "Delivered"];
const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  Waiting:   { text: "#F59E0B", bg: "#FFF7E6" },
  Repairing: { text: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.1)" },
  Ready:     { text: "#10B981", bg: "#ECFDF5" },
  Delivered: { text: "#6B7280", bg: "#F3F4F6" },
};

type Repair = {
  id: number;
  customerName: string;
  customerPhone?: string;
  phoneBrand: string;
  phoneModel: string;
  problem: string;
  status: string;
  engineer?: string;
  totalCost?: string;
  createdAt: string;
  updatedAt: string;
};

function RepairForm({ onClose, existing }: { onClose: () => void; existing?: Repair }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    customerName: existing?.customerName ?? "",
    deviceName: existing?.deviceName ?? existing?.device ?? "",
    problem: existing?.problem ?? existing?.issue ?? "",
    status: existing?.status ?? "Waiting",
    totalCost: String(existing?.totalCost ?? ""),
  });
  const [error, setError] = useState("");

  const mut = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const url = existing ? `${BASE()}/api/repairs/${existing.id}` : `${BASE()}/api/repairs`;
      const res = await fetch(url, {
        method: existing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["repairs"] }); onClose(); },
    onError: (err: any) => setError(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.deviceName || !form.problem) { setError("Device and problem are required"); return; }
    mut.mutate(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-base">{existing ? "Edit Repair" : "New Repair"}</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: "hsl(var(--muted-foreground))" }} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {[
            { label: "Customer Name", key: "customerName", placeholder: "Customer name" },
            { label: "Phone Brand", key: "phoneBrand", placeholder: "e.g. Apple, Samsung" },
            { label: "Phone Model", key: "phoneModel", placeholder: "e.g. iPhone 13 Pro" },
            { label: "Problem Description", key: "problem", placeholder: "Describe the issue" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</label>
              <input
                value={(form as any)[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}
                onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }}
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}>
              {["Waiting", "Repairing", "Ready", "Delivered"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Total Cost</label>
            <input type="number" value={form.totalCost}
              onChange={e => setForm(p => ({ ...p, totalCost: e.target.value }))}
              placeholder="0" min="0"
              className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }} />
          </div>
          {error && <p className="text-xs text-center" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
          <button type="submit" disabled={mut.isPending}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 mt-1"
            style={{ background: "hsl(var(--primary))" }}>
            {mut.isPending ? "Saving…" : existing ? "Save Changes" : "Create Repair"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Repairs() {
  const [activeStatus, setActiveStatus] = useState("All");
  const [searchQ, setSearchQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editRepair, setEditRepair] = useState<Repair | undefined>();
  const qc = useQueryClient();

  const { data: repairs, isLoading } = useQuery<Repair[]>({
    queryKey: ["repairs"],
    queryFn: () => fetch(`${BASE()}/api/repairs`, { credentials: "include" }).then(r => r.json()),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      fetch(`${BASE()}/api/repairs/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repairs"] }),
  });

  const list = Array.isArray(repairs) ? repairs : [];
  const filtered = list.filter(r => {
    const matchStatus = activeStatus === "All" || r.status === activeStatus;
    const q = searchQ.toLowerCase();
    const matchSearch = !q ||
      r.phoneModel.toLowerCase().includes(q) ||
      r.phoneBrand.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.problem.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const countOf = (s: string) => list.filter(r => r.status === s).length;

  return (
    <ProtectedPage>
      <div className="space-y-4">
        <div className="flex items-center justify-between pt-1">
          <h1 className="text-xl font-extrabold">Repairs</h1>
          <button onClick={() => { setEditRepair(undefined); setShowForm(true); }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white"
            style={{ background: "hsl(var(--primary))" }}>
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search repairs…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm outline-none"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} />
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {STATUSES.map(s => {
            const count = s === "All" ? list.length : countOf(s);
            const active = s === activeStatus;
            return (
              <button key={s} onClick={() => setActiveStatus(s)}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
                style={active
                  ? { background: "hsl(var(--primary))", color: "#fff" }
                  : { background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
                {s} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Wrench className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
            <p className="font-semibold">No repairs found</p>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              {list.length === 0 ? "Create your first repair job" : "Try a different filter"}
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {filtered.map(r => {
              const sc = STATUS_COLOR[r.status] ?? { text: "#9CA3AF", bg: "#F3F4F6" };
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: sc.bg }}>
                    <Wrench className="w-4 h-4" style={{ color: sc.text }} />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setEditRepair(r); setShowForm(true); }}>
                    <p className="text-sm font-semibold truncate">{r.phoneBrand} {r.phoneModel}</p>
                    <p className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {r.customerName ? `${r.customerName} · ` : ""}{r.problem}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: sc.bg, color: sc.text }}>{r.status}</span>
                    <button onClick={() => { if (confirm("Delete this repair?")) deleteMut.mutate(r.id); }}
                      className="text-[10px] font-medium" style={{ color: "hsl(var(--destructive))" }}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && <RepairForm onClose={() => setShowForm(false)} existing={editRepair} />}
    </ProtectedPage>
  );
}
