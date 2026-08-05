import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, X, Search, Pencil, Trash2, UserCheck, Users2, ArrowLeft,
  Phone, BadgeCheck, ShieldCheck, Wrench, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import { ProtectedPage } from "@/components/protected-page";
import { localStaff } from "@/lib/local-store";

const PRIMARY = "hsl(var(--primary))";
const MUTED   = "hsl(var(--muted-foreground))";
const BORDER  = "hsl(var(--border))";
const CARD    = "hsl(var(--card))";
const BG      = "hsl(var(--background))";

type Role = "Staff" | "Technician" | "Both";

type StaffMember = {
  id: number;
  name: string;
  phone?: string;
  staffId?: string;
  role: Role;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; icon: typeof UserCheck }> = {
  Staff:      { label: "Staff",      color: "#6366F1", bg: "#EEF2FF",  icon: UserCheck   },
  Technician: { label: "Technician", color: "#10B981", bg: "#ECFDF5",  icon: Wrench      },
  Both:       { label: "Both",       color: "#F59E0B", bg: "#FFFBEB",  icon: ShieldCheck },
};

function RoleBadge({ role }: { role: Role }) {
  const { label, color, bg, icon: Icon } = ROLE_CONFIG[role] ?? ROLE_CONFIG.Staff;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: bg, color }}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

function StaffForm({
  onClose, existing,
}: { onClose: () => void; existing?: StaffMember }) {
  const { user } = useAuth();
  const isFreePlan = user?.plan === "Free" || !user?.plan;
  const qc = useQueryClient();

  const [name,     setName]     = useState(existing?.name     ?? "");
  const [phone,    setPhone]    = useState(existing?.phone    ?? "");
  const [staffId,  setStaffId]  = useState(existing?.staffId  ?? "");
  const [role,     setRole]     = useState<Role>(existing?.role ?? "Staff");
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [notes,    setNotes]    = useState(existing?.notes    ?? "");
  const [error,    setError]    = useState("");

  const saveMut = useMutation({
    mutationFn: async (data: Omit<StaffMember, "id" | "createdAt" | "updatedAt">) => {
      if (isFreePlan && user?.id) {
        if (existing) {
          localStaff.update(user.id, existing.id, data);
          return { ...existing, ...data };
        }
        return localStaff.create(user.id, data);
      }
      const method = existing ? "PUT" : "POST";
      const url    = existing ? `/api/staff/${existing.id}` : `/api/staff`;
      const res    = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); onClose(); },
    onError:   (e: any) => setError(e.message ?? "Failed to save"),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    setError("");
    saveMut.mutate({ name: name.trim(), phone: phone.trim() || undefined, staffId: staffId.trim() || undefined, role, isActive, notes: notes.trim() || undefined });
  }

  const ROLES: Role[] = ["Staff", "Technician", "Both"];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full md:max-w-sm rounded-t-2xl md:rounded-2xl shadow-xl p-5 space-y-4"
        style={{ background: CARD, maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">{existing ? "Edit Member" : "Add Staff / Technician"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
            <X className="w-4 h-4" style={{ color: MUTED }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <div>
            <label className="text-[11px] font-semibold mb-1 block" style={{ color: MUTED }}>Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Ahmed"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: BORDER, background: BG }} />
          </div>

          {/* Staff ID */}
          <div>
            <label className="text-[11px] font-semibold mb-1 block" style={{ color: MUTED }}>Staff ID (optional)</label>
            <input value={staffId} onChange={e => setStaffId(e.target.value)} placeholder="e.g. CF-001"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none font-mono"
              style={{ borderColor: BORDER, background: BG }} />
          </div>

          {/* Phone */}
          <div>
            <label className="text-[11px] font-semibold mb-1 block" style={{ color: MUTED }}>Phone (optional)</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+880 1xxx-xxxxxx" type="tel"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: BORDER, background: BG }} />
          </div>

          {/* Role */}
          <div>
            <label className="text-[11px] font-semibold mb-2 block" style={{ color: MUTED }}>Role *</label>
            <div className="flex gap-2">
              {ROLES.map(r => {
                const { label, color, bg, icon: Icon } = ROLE_CONFIG[r];
                const active = role === r;
                return (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all"
                    style={{
                      borderColor: active ? color : BORDER,
                      background:  active ? bg    : CARD,
                      color:       active ? color : MUTED,
                    }}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-semibold mb-1 block" style={{ color: MUTED }}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Specialization, schedule..."
              rows={2} className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: BORDER, background: BG }} />
          </div>

          {/* Active toggle */}
          <button type="button" onClick={() => setIsActive(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all"
            style={{ borderColor: isActive ? PRIMARY : BORDER, background: isActive ? `${PRIMARY}10` : CARD }}>
            <span className="text-sm font-semibold" style={{ color: isActive ? PRIMARY : MUTED }}>
              {isActive ? "Active" : "Inactive"}
            </span>
            {isActive
              ? <ToggleRight className="w-6 h-6" style={{ color: PRIMARY }} />
              : <ToggleLeft  className="w-6 h-6" style={{ color: MUTED  }} />}
          </button>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <button type="submit" disabled={saveMut.isPending}
            className="w-full py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: PRIMARY, opacity: saveMut.isPending ? 0.7 : 1 }}>
            {saveMut.isPending ? "Saving…" : existing ? "Save Changes" : "Add Member"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const { user } = useAuth();
  const isFreePlan = user?.plan === "Free" || !user?.plan;
  const qc = useQueryClient();

  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState<"all" | Role>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [confirm, setConfirm] = useState<StaffMember | null>(null);

  const { data: members = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ["staff"],
    queryFn: () => {
      if (isFreePlan && user?.id) return Promise.resolve(localStaff.getAll(user.id));
      return fetch("/api/staff", { credentials: "include" }).then(r => r.json());
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      if (isFreePlan && user?.id) { localStaff.delete(user.id, id); return; }
      await fetch(`/api/staff/${id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });

  const toggleActive = useMutation({
    mutationFn: async (m: StaffMember) => {
      if (isFreePlan && user?.id) { localStaff.update(user.id, m.id, { isActive: !m.isActive }); return; }
      await fetch(`/api/staff/${m.id}`, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !m.isActive }) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });

  const list = Array.isArray(members) ? members : [];

  const filtered = list.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || (m.staffId ?? "").toLowerCase().includes(search.toLowerCase()) || (m.phone ?? "").includes(search);
    const matchRole   = filter === "all" || m.role === filter || (filter !== "all" && m.role === "Both");
    return matchSearch && matchRole;
  });

  const totalStaff = list.filter(m => m.role === "Staff" || m.role === "Both").length;
  const totalTech  = list.filter(m => m.role === "Technician" || m.role === "Both").length;
  const activeCount = list.filter(m => m.isActive).length;

  return (
    <ProtectedPage>
      <div className="space-y-4 pb-8">

        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <Link href="/">
            <button className="w-8 h-8 rounded-full flex items-center justify-center border"
              style={{ borderColor: BORDER, background: CARD }}>
              <ArrowLeft className="w-4 h-4" style={{ color: MUTED }} />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold leading-tight">Staff & Technician</h1>
            <p className="text-[11px]" style={{ color: MUTED }}>{list.length} member{list.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: PRIMARY }}>
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Staff",       value: totalStaff,  color: "#6366F1", bg: "#EEF2FF",  icon: Users2     },
            { label: "Technicians", value: totalTech,   color: "#10B981", bg: "#ECFDF5",  icon: Wrench     },
            { label: "Active",      value: activeCount, color: PRIMARY,   bg: `${PRIMARY}15`, icon: BadgeCheck },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border"
              style={{ borderColor: BORDER, background: CARD }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-xl font-extrabold leading-none" style={{ color }}>{value}</p>
              <p className="text-[10px] font-semibold" style={{ color: MUTED }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3.5 rounded-xl border" style={{ borderColor: BORDER, background: CARD }}>
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: MUTED }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID, phone…"
              className="flex-1 py-2.5 bg-transparent text-sm outline-none" />
            {search && <button onClick={() => setSearch("")}><X className="w-4 h-4" style={{ color: MUTED }} /></button>}
          </div>
          <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
            {(["all", "Staff", "Technician", "Both"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                style={{
                  background: filter === f ? CARD : "transparent",
                  color:      filter === f ? "hsl(var(--foreground))" : MUTED,
                  boxShadow:  filter === f ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                }}>
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: PRIMARY, borderTopColor: "transparent" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
              <Users2 className="w-8 h-8" style={{ color: MUTED }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: MUTED }}>
              {search ? "No members found" : "No staff added yet"}
            </p>
            {!search && (
              <button onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: PRIMARY }}>
                <Plus className="w-4 h-4" /> Add First Member
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(m => {
              const { color, bg } = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.Staff;
              return (
                <div key={m.id} className="flex items-center gap-3 p-3.5 rounded-2xl border"
                  style={{ borderColor: BORDER, background: CARD, opacity: m.isActive ? 1 : 0.6 }}>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: bg, color }}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold truncate">{m.name}</p>
                      {m.staffId && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: "hsl(var(--muted))", color: MUTED }}>{m.staffId}</span>
                      )}
                      {!m.isActive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-400">Inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <RoleBadge role={m.role} />
                      {m.phone && (
                        <span className="flex items-center gap-0.5 text-[10px]" style={{ color: MUTED }}>
                          <Phone className="w-2.5 h-2.5" /> {m.phone}
                        </span>
                      )}
                    </div>
                    {m.notes && <p className="text-[10px] mt-0.5 truncate" style={{ color: MUTED }}>{m.notes}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => toggleActive.mutate(m)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: m.isActive ? `${PRIMARY}12` : "hsl(var(--muted))" }}>
                      {m.isActive
                        ? <ToggleRight className="w-4 h-4" style={{ color: PRIMARY }} />
                        : <ToggleLeft  className="w-4 h-4" style={{ color: MUTED  }} />}
                    </button>
                    <button onClick={() => setEditing(m)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "hsl(var(--muted))" }}>
                      <Pencil className="w-3.5 h-3.5" style={{ color: MUTED }} />
                    </button>
                    <button onClick={() => setConfirm(m)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "#FEF2F2" }}>
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {(showAdd || editing) && (
        <StaffForm
          onClose={() => { setShowAdd(false); setEditing(null); }}
          existing={editing ?? undefined}
        />
      )}

      {/* Delete confirm */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirm(null)} />
          <div className="relative rounded-2xl p-5 w-full max-w-xs shadow-xl space-y-3" style={{ background: CARD }}>
            <p className="font-bold text-base">Remove {confirm.name}?</p>
            <p className="text-sm" style={{ color: MUTED }}>This will permanently delete this member.</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: BORDER }}>
                Cancel
              </button>
              <button onClick={() => { deleteMut.mutate(confirm.id); setConfirm(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#EF4444" }}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}
