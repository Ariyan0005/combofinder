import { useState, useEffect, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, X, Search, Pencil, Trash2, UserCheck, Users2, ArrowLeft,
  Phone, BadgeCheck, ShieldCheck, Wrench, ToggleLeft, ToggleRight,
  Building2, KeyRound, Eye, EyeOff, User, ChevronDown
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import { ProtectedPage } from "@/components/protected-page";
import { useBranchSelection } from "@/lib/branch-store";

const PRIMARY = "hsl(var(--primary))";
const MUTED   = "hsl(var(--muted-foreground))";
const BORDER  = "hsl(var(--border))";
const CARD    = "hsl(var(--card))";
const BG      = "hsl(var(--background))";

export type Role = "Manager" | "Staff" | "Technician";

export type StaffMember = {
  id: number;
  name: string;
  phone?: string;
  staffId?: string;
  username?: string;
  role: Role | string;
  branchId?: string;
  branchName?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type BranchItem = {
  id: string;
  name: string;
  code?: string;
  city?: string;
  address?: string;
};

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof UserCheck }> = {
  Manager:    { label: "Manager",    color: "#8B5CF6", bg: "#F5F3FF", icon: ShieldCheck },
  Staff:      { label: "Staff",      color: "#6366F1", bg: "#EEF2FF", icon: UserCheck   },
  Technician: { label: "Technician", color: "#10B981", bg: "#ECFDF5", icon: Wrench      },
};

function RoleBadge({ role }: { role: string }) {
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
  onClose, existing, initialRole, defaultBranchId
}: { onClose: () => void; existing?: StaffMember; initialRole?: Role; defaultBranchId?: string }) {
  const { user } = useAuth();
  const { activeBranch } = useBranchSelection();
  const isGeneralStore = user?.businessType === "general_store";
  const qc = useQueryClient();

  const [name,       setName]       = useState(existing?.name       ?? "");
  const [phone,      setPhone]      = useState(existing?.phone      ?? "");
  const [staffId,    setStaffId]    = useState(existing?.staffId    ?? "");
  const [username,   setUsername]   = useState(existing?.username   ?? "");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [role,       setRole]       = useState<Role>(
    (existing?.role === "Manager" || existing?.role === "Technician" ? existing.role : (initialRole || "Staff")) as Role
  );
  const [branchId,   setBranchId]   = useState(
    existing?.branchId ?? defaultBranchId ?? (activeBranch && activeBranch.id !== "all" ? (activeBranch.code === "MAIN" ? "default" : activeBranch.id) : "default")
  );
  const [isActive,   setIsActive]   = useState(existing?.isActive   ?? true);
  const [notes,      setNotes]      = useState(existing?.notes      ?? "");
  const [error,      setError]      = useState("");

  // Fetch branches from API
  const { data: branches = [] } = useQuery<BranchItem[]>({
    queryKey: ["branches"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/branches", { credentials: "include" });
        if (res.ok) {
          const list = await res.json();
          return Array.isArray(list) ? list : [];
        }
      } catch {}
      return [];
    },
  });

  // Block body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const branchOptions = [
    { id: "default", name: "Default / Main Branch", code: "MAIN" },
    ...branches.filter(b => String(b.id) !== "default"),
  ];

  const saveMut = useMutation({
    mutationFn: async (data: Omit<StaffMember, "id" | "createdAt" | "updatedAt">) => {
      const method = existing ? "PUT" : "POST";
      const url    = existing ? `/api/staff/${existing.id}` : `/api/staff`;
      const res    = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save employee");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      onClose();
    },
    onError: (e: any) => setError(e.message ?? "Failed to save"),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    setError("");

    // Find selected branch name
    const selectedBranch = branchOptions.find(b => String(b.id) === String(branchId));
    const branchName = selectedBranch?.name ?? "Default / Main Branch";

    const isTech = role === "Technician";
    const hasUsername = Boolean(username.trim());
    const hasPassword = Boolean(password);
    const isLoginAccount = !isTech && (hasUsername || hasPassword);

    if (isLoginAccount && !hasUsername) {
      setError("Enter both username and password for login access, or leave both empty");
      return;
    }
    if (isLoginAccount && !hasPassword) {
      setError("Enter both username and password for login access, or leave both empty");
      return;
    }
    if (!isTech && hasPassword && password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    saveMut.mutate({
      name: name.trim(),
      phone: phone.trim() || undefined,
      staffId: staffId.trim() || undefined,
      username: isTech ? undefined : (username.trim() || undefined),
      password: isTech ? undefined : (password || undefined),
      role,
      branchId: branchId || "default",
      branchName,
      isActive,
      notes: notes.trim() || undefined,
    } as any);
  }

  const ROLES: Role[] = isGeneralStore
    ? ["Manager", "Staff"]
    : ["Manager", "Staff", "Technician"];

  const modalTitle = existing
    ? "Edit Employee"
    : role === "Manager"
      ? "Add Manager"
      : role === "Technician"
        ? "Add Technician"
        : "Add Employee";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl p-5 md:p-6 space-y-4"
        style={{ background: CARD, maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: role === "Manager" ? "#F5F3FF" : role === "Technician" ? "#ECFDF5" : "#EEF2FF",
                color: role === "Manager" ? "#8B5CF6" : role === "Technician" ? "#10B981" : PRIMARY
              }}>
              {role === "Manager" ? <ShieldCheck className="w-4 h-4" /> : role === "Technician" ? <Wrench className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-bold text-base">{modalTitle}</h2>
              <p className="text-[11px]" style={{ color: MUTED }}>
                {role === "Manager" ? "Manage branch operations and store staff" : role === "Technician" ? "Repair technician profile (No login required)" : "Store staff member profile"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:opacity-80 transition" style={{ background: "hsl(var(--muted))" }}>
            <X className="w-4 h-4" style={{ color: MUTED }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name */}
          <div>
            <label className="text-[11px] font-bold mb-1 block" style={{ color: MUTED }}>Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Ahmed"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition focus:border-primary"
              style={{ borderColor: BORDER, background: BG }} />
          </div>

          {/* Role selector (Manager, Staff, Technician only - Both removed) */}
          <div>
            <label className="text-[11px] font-bold mb-1.5 block" style={{ color: MUTED }}>Role Designation *</label>
            <div className={`grid ${ROLES.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
              {ROLES.map(r => {
                const { label, color, bg, icon: Icon } = ROLE_CONFIG[r];
                const active = role === r;
                return (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all"
                    style={{
                      borderColor: active ? color : BORDER,
                      background:  active ? bg    : CARD,
                      color:       active ? color : MUTED,
                    }}>
                    <Icon className="w-4 h-4" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Branch Assignment Dropdown */}
          <div>
            <label className="text-[11px] font-bold mb-1 block flex items-center justify-between" style={{ color: MUTED }}>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-primary" /> Assign Branch *
              </span>
              <span className="text-[10px] font-normal" style={{ color: MUTED }}>Branch Management</span>
            </label>
            <select
              value={branchId}
              onChange={e => setBranchId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none font-medium cursor-pointer transition focus:border-primary"
              style={{ borderColor: BORDER, background: BG, color: "hsl(var(--foreground))" }}>
              {branchOptions.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.code ? `(${b.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Employee ID & Phone */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold mb-1 block" style={{ color: MUTED }}>Employee ID</label>
              <input value={staffId} onChange={e => setStaffId(e.target.value)} placeholder="EMP-001"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none font-mono"
                style={{ borderColor: BORDER, background: BG }} />
            </div>
            <div>
              <label className="text-[11px] font-bold mb-1 block" style={{ color: MUTED }}>Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567" type="tel"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: BORDER, background: BG }} />
            </div>
          </div>

          {/* Login Credentials: ONLY for Manager and Staff (Removed for Technician) */}
          {role !== "Technician" && (
            <div className="p-3.5 rounded-2xl border space-y-2.5" style={{ borderColor: `${PRIMARY}30`, background: `${PRIMARY}05` }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: PRIMARY }}>
                  <KeyRound className="w-3.5 h-3.5" /> Portal & App Login Access
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-primary/10 text-primary">
                  {role === "Manager" ? "Manager Portal" : "Staff Access"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold mb-1 block" style={{ color: MUTED }}>
                    Username (optional)
                  </label>
                  <input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. rahul_mgr"
                    disabled={Boolean(existing)}
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none disabled:opacity-60"
                    style={{ borderColor: BORDER, background: BG }} />
                </div>
                <div>
                  <label className="text-[10px] font-bold mb-1 block" style={{ color: MUTED }}>
                    {existing ? "New password" : "Password (optional)"}
                  </label>
                  <div className="relative">
                    <input value={password} onChange={e => setPassword(e.target.value)}
                      type={showPass ? "text" : "password"} placeholder="8+ chars"
                      className="w-full px-3 py-2 pr-8 rounded-xl border text-xs outline-none"
                      style={{ borderColor: BORDER, background: BG }} />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }}>
                      {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[10px]" style={{ color: MUTED }}>
                This account can log in via the Main Login screen under <b>Branch Login</b>.
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold mb-1 block" style={{ color: MUTED }}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Skills, shift schedule, remarks..."
              rows={2} className="w-full px-3.5 py-2 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: BORDER, background: BG }} />
          </div>

          {/* Active toggle */}
          <button type="button" onClick={() => setIsActive(v => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all"
            style={{ borderColor: isActive ? PRIMARY : BORDER, background: isActive ? `${PRIMARY}08` : CARD }}>
            <span className="text-xs font-bold" style={{ color: isActive ? PRIMARY : MUTED }}>
              Employee Status: {isActive ? "Active" : "Inactive"}
            </span>
            {isActive
              ? <ToggleRight className="w-6 h-6" style={{ color: PRIMARY }} />
              : <ToggleLeft  className="w-6 h-6" style={{ color: MUTED  }} />}
          </button>

          {error && <p className="text-xs text-red-500 font-medium px-2 py-1 bg-red-50 rounded-lg">{error}</p>}

          <button type="submit" disabled={saveMut.isPending}
            className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-sm transition"
            style={{ background: PRIMARY, opacity: saveMut.isPending ? 0.7 : 1 }}>
            {saveMut.isPending ? "Saving…" : existing ? "Save Changes" : (role === "Manager" ? "Add Manager" : role === "Technician" ? "Add Technician" : "Add Employee")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const { user } = useAuth();
  const isGeneralStore = user?.businessType === "general_store";
  const qc = useQueryClient();
  const { branches, activeBranch, branchParam, selectBranch } = useBranchSelection();

  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState<"all" | Role>("all");
  const [showAdd,     setShowAdd]     = useState(false);
  const [editing,     setEditing]     = useState<StaffMember | null>(null);
  const [confirm,     setConfirm]     = useState<StaffMember | null>(null);

  const { data: members = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ["staff", activeBranch?.id, branchParam],
    queryFn: async () => {
      const res = await fetch(`/api/staff?branchId=${encodeURIComponent(branchParam || "")}`, { credentials: "include" });
      if (!res.ok) return [];
      const d = await res.json();
      return Array.isArray(d) ? d : [];
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/staff/${id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });

  const toggleActive = useMutation({
    mutationFn: async (m: StaffMember) => {
      await fetch(`/api/staff/${m.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !m.isActive }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });

  const list = (Array.isArray(members) ? members : []);

  const filtered = list.filter(m => {
    const matchSearch = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.staffId ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (m.phone ?? "").includes(search) ||
      (m.branchName ?? "").toLowerCase().includes(search.toLowerCase());
    
    const roleLower = String(m.role || "").toLowerCase();
    const filterLower = String(filter).toLowerCase();

    let matchRole = false;
    if (filter === "all") {
      matchRole = true;
    } else if (filterLower === "manager") {
      matchRole = roleLower === "manager";
    } else if (filterLower === "staff") {
      matchRole = roleLower === "staff";
    } else if (filterLower === "technician") {
      matchRole = roleLower === "technician";
    } else {
      matchRole = roleLower === filterLower;
    }
    
    return matchSearch && matchRole;
  });

  // Calculate statistics according to business type
  const totalManagers = list.filter(m => String(m.role).toLowerCase() === "manager").length;
  const totalStaff    = list.filter(m => String(m.role).toLowerCase() === "staff").length;
  const totalTech     = list.filter(m => String(m.role).toLowerCase() === "technician").length;
  const activeCount   = list.filter(m => m.isActive).length;

  // 3 cards configuration with clickable filters:
  // Mobile & Repair: Manager, Staff, Technician
  // General: Manager, Staff, Active
  const summaryCards = isGeneralStore ? [
    { label: "Manager", filterKey: "Manager" as const, value: totalManagers, color: "#8B5CF6", bg: "#F5F3FF", icon: ShieldCheck },
    { label: "Staff",   filterKey: "Staff" as const,   value: totalStaff,    color: "#6366F1", bg: "#EEF2FF", icon: Users2      },
    { label: "Active",  filterKey: "all" as const,     value: activeCount,   color: "#10B981", bg: "#ECFDF5", icon: BadgeCheck  },
  ] : [
    { label: "Manager",    filterKey: "Manager" as const,    value: totalManagers, color: "#8B5CF6", bg: "#F5F3FF", icon: ShieldCheck },
    { label: "Staff",      filterKey: "Staff" as const,      value: totalStaff,    color: "#6366F1", bg: "#EEF2FF", icon: Users2      },
    { label: "Technician", filterKey: "Technician" as const, value: totalTech,     color: "#10B981", bg: "#ECFDF5", icon: Wrench      },
  ];

  // Filter tabs - strictly without "Both"
  const filterTabs = isGeneralStore
    ? (["all", "Manager", "Staff"] as const)
    : (["all", "Manager", "Staff", "Technician"] as const);

  return (
    <ProtectedPage>
      <div className="space-y-4 pb-12">

        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <Link href="/">
            <button className="w-8 h-8 rounded-full flex items-center justify-center border transition hover:opacity-80"
              style={{ borderColor: BORDER, background: CARD }}>
              <ArrowLeft className="w-4 h-4" style={{ color: MUTED }} />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold leading-tight">Employees</h1>
            <p className="text-[11px]" style={{ color: MUTED }}>
              {list.length} employee{list.length !== 1 ? "s" : ""} • {activeBranch?.name || "Main Branch"}
            </p>
          </div>
          
          {/* Single clean Add Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition hover:opacity-90 cursor-pointer"
              style={{ background: PRIMARY }}>
              <Plus className="w-3.5 h-3.5" /> Add Employee
            </button>
          </div>
        </div>

        {/* Branch Switcher Tabs (when multiple branches exist) */}
        {branches.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => selectBranch("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeBranch?.id === "all" ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              All Branches
            </button>
            <button
              onClick={() => selectBranch("default")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeBranch?.code === "MAIN" || activeBranch?.id === "default" ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Main Branch
            </button>
            {branches.filter(b => String(b.id) !== "default" && b.code !== "MAIN").map(b => (
              <button
                key={b.id}
                onClick={() => selectBranch(b.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeBranch?.id === b.id ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}

        {/* 3 Summary Cards (Clickable) */}
        <div className="grid grid-cols-3 gap-2">
          {summaryCards.map(({ label, filterKey, value, color, bg, icon: Icon }) => {
            const isSelected = filter === filterKey && filterKey !== "all";
            return (
              <button
                key={label}
                type="button"
                onClick={() => setFilter(prev => prev === filterKey ? "all" : (filterKey as any))}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border shadow-sm transition-all text-center cursor-pointer hover:shadow-md active:scale-95"
                style={{
                  borderColor: isSelected ? color : BORDER,
                  background: isSelected ? bg : CARD,
                  boxShadow: isSelected ? `0 0 0 1.5px ${color}` : undefined,
                }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className="text-xl font-black leading-none" style={{ color }}>{value}</p>
                <p className="text-[10px] font-bold" style={{ color: isSelected ? color : MUTED }}>{label}</p>
              </button>
            );
          })}
        </div>

        {/* Search + Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3.5 rounded-xl border" style={{ borderColor: BORDER, background: CARD }}>
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: MUTED }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID, phone, branch…"
              className="flex-1 py-2.5 bg-transparent text-sm outline-none" />
            {search && <button onClick={() => setSearch("")}><X className="w-4 h-4" style={{ color: MUTED }} /></button>}
          </div>
          
          <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "hsl(var(--muted))" }}>
            {filterTabs.map(f => (
              <button key={f} onClick={() => setFilter(f as any)}
                className="flex-1 min-w-[50px] py-1.5 rounded-lg text-[10px] font-bold transition-all text-center"
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
              {search ? "No employees found" : "No employees added yet"}
            </p>
            {!search && (
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white shadow cursor-pointer"
                  style={{ background: PRIMARY }}>
                  <Plus className="w-4 h-4" /> Add Employee
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(m => {
              const { color, bg } = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.Staff;
              return (
                <div key={m.id} className="flex items-center gap-3 p-3.5 rounded-2xl border shadow-sm transition"
                  style={{ borderColor: BORDER, background: CARD, opacity: m.isActive ? 1 : 0.65 }}>

                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ background: bg, color }}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-extrabold truncate">{m.name}</p>
                      {m.staffId && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md"
                          style={{ background: "hsl(var(--muted))", color: MUTED }}>{m.staffId}</span>
                      )}
                      {!m.isActive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-400">Inactive</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <RoleBadge role={m.role} />
                      
                      {/* Branch Badge */}
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
                        style={{ borderColor: `${PRIMARY}30`, background: `${PRIMARY}08`, color: PRIMARY }}>
                        <Building2 className="w-2.5 h-2.5" />
                        {m.branchName || "Default Branch"}
                      </span>

                      {m.username && (
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          @{m.username}
                        </span>
                      )}

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
                      title={m.isActive ? "Set Inactive" : "Set Active"}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-80 cursor-pointer"
                      style={{ background: m.isActive ? `${PRIMARY}12` : "hsl(var(--muted))" }}>
                      {m.isActive
                        ? <ToggleRight className="w-4 h-4" style={{ color: PRIMARY }} />
                        : <ToggleLeft  className="w-4 h-4" style={{ color: MUTED  }} />}
                    </button>
                    <button onClick={() => setEditing(m)}
                      title="Edit"
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-80 cursor-pointer"
                      style={{ background: "hsl(var(--muted))" }}>
                      <Pencil className="w-3.5 h-3.5" style={{ color: MUTED }} />
                    </button>
                    <button onClick={() => setConfirm(m)}
                      title="Delete"
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-80 cursor-pointer"
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

      {/* Add / Edit modal */}
      {(showAdd || editing) && (
        <StaffForm
          onClose={() => { setShowAdd(false); setEditing(null); }}
          existing={editing ?? undefined}
          defaultBranchId={activeBranch && activeBranch.id !== "all" ? (activeBranch.code === "MAIN" ? "default" : activeBranch.id) : "default"}
        />
      )}

      {/* Delete confirm */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirm(null)} />
          <div className="relative rounded-2xl p-5 w-full max-w-xs shadow-xl space-y-3" style={{ background: CARD }}>
            <p className="font-bold text-base">Remove {confirm.name}?</p>
            <p className="text-sm" style={{ color: MUTED }}>This will permanently delete this employee.</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer" style={{ borderColor: BORDER }}>
                Cancel
              </button>
              <button onClick={() => { deleteMut.mutate(confirm.id); setConfirm(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
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
