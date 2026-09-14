import { useState, useMemo, useEffect, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Plus, X, Users, AlertCircle, ArrowLeft, Pencil, Trash2,
  Phone, MessageSquare, Truck, ArrowUpRight, ArrowDownLeft, ChevronRight,
  Filter, Check, UserCheck, Building2, Store,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { ProtectedPage } from "@/components/protected-page";
import { localCustomers, localSuppliers, localSupplierPurchases } from "@/lib/local-store";
import { useBranchSelection } from "@/lib/branch-store";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", BDT: "Tk", INR: "₹",
  PKR: "₨", NPR: "रू", LKR: "Rs", AED: "د.إ", SAR: "﷼",
  OMR: "OMR", KWD: "KD", QAR: "QR", MYR: "RM", SGD: "S$",
  THB: "฿", IDR: "Rp", PHP: "₱", CNY: "¥", JPY: "¥",
};

export type Customer = {
  id: number;
  name: string;
  phone?: string;
  whatsapp?: string;
  notes?: string;
  totalRepairs?: number;
  repairDue?: number;
  creditDue?: number;
  createdAt?: string;
};

export type Supplier = {
  id: number;
  name: string;
  phone?: string;
  whatsapp?: string;
  partTypes?: string;
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
};

type SupplierBalance = {
  supplierId: number;
  totalDue: number;
};

type PartyType = "customer" | "supplier";

type UnifiedParty = {
  id: number;
  type: PartyType;
  name: string;
  phone?: string;
  whatsapp?: string;
  notes?: string;
  partTypes?: string;
  totalRepairs?: number;
  dueAmount: number;
  rawCustomer?: Customer;
  rawSupplier?: Supplier;
};

const AVATAR_COLORS = ["#6248FF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#3B82F6"];

function initials(name: string) {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Unified Add / Edit Party Modal ──────────────────────────────────────────
function PartyFormModal({
  onClose,
  initialType = "customer",
  existingCustomer,
  existingSupplier,
  allCustomers,
  allSuppliers,
}: {
  onClose: () => void;
  initialType?: PartyType;
  existingCustomer?: Customer;
  existingSupplier?: Supplier;
  allCustomers?: Customer[];
  allSuppliers?: Supplier[];
}) {
  const isEditing = !!(existingCustomer || existingSupplier);
  const [partyType, setPartyType] = useState<PartyType>(
    existingSupplier ? "supplier" : existingCustomer ? "customer" : initialType
  );

  // Block body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const qc = useQueryClient();
  const { user } = useAuth();
  const isManager = Boolean(user?.isManager || user?.role?.toLowerCase() === "manager");
  const isFreePlan = (!user || user.plan === "Free") && !user?.isStaff && !isManager;
  const userId = user?.id;

  const [form, setForm] = useState({
    name: existingCustomer?.name ?? existingSupplier?.name ?? "",
    phone: existingCustomer?.phone ?? existingSupplier?.phone ?? "",
    whatsapp: existingCustomer?.whatsapp ?? existingSupplier?.whatsapp ?? "",
    notes: existingCustomer?.notes ?? existingSupplier?.notes ?? "",
    partTypes: existingSupplier?.partTypes ?? "",
  });
  const [error, setError] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      const phone = form.phone.trim() || undefined;
      const whatsapp = form.whatsapp.trim() || undefined;
      const notes = form.notes.trim() || undefined;
      const partTypes = form.partTypes.trim() || undefined;

      if (partyType === "customer") {
        const payload = { name, phone, whatsapp, notes };
        if (isFreePlan && userId) {
          return existingCustomer
            ? localCustomers.update(userId, existingCustomer.id, payload)
            : localCustomers.create(userId, payload);
        }
        const url = existingCustomer ? `/api/customers/${existingCustomer.id}` : "/api/customers";
        const res = await fetch(url, {
          method: existingCustomer ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error ?? "Failed to save customer");
        }
        return res.json();
      } else {
        const payload = { name, phone: phone ?? null, whatsapp: whatsapp ?? null, partTypes: partTypes ?? null, notes: notes ?? null };
        if (isFreePlan && userId) {
          return existingSupplier
            ? localSuppliers.update(userId, existingSupplier.id, payload)
            : localSuppliers.create(userId, payload);
        }
        const url = existingSupplier ? `/api/suppliers/${existingSupplier.id}` : "/api/suppliers";
        const res = await fetch(url, {
          method: existingSupplier ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "Failed to save supplier");
        return d;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      onClose();
    },
    onError: (err: any) => setError(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }

    // Phone duplicate validation
    if (form.phone.trim()) {
      const normalise = (p: string) => p.replace(/\s+/g, "").replace(/^0+/, "");
      const incoming = normalise(form.phone.trim());

      if (partyType === "customer" && allCustomers) {
        const clash = allCustomers.find(
          c => c.id !== (existingCustomer?.id ?? 0) && c.phone && normalise(c.phone) === incoming
        );
        if (clash) {
          setError(`Phone number already used by customer "${clash.name}"`);
          return;
        }
      } else if (partyType === "supplier" && allSuppliers) {
        const clash = allSuppliers.find(
          s => s.id !== (existingSupplier?.id ?? 0) && s.phone && normalise(s.phone) === incoming
        );
        if (clash) {
          setError(`Phone number already used by supplier "${clash.name}"`);
          return;
        }
      }
    }

    mut.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ background: partyType === "customer" ? "#10B981" : "#6366F1" }}
            >
              {partyType === "customer" ? <Users className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="font-bold text-base">
                {isEditing
                  ? `Edit ${partyType === "customer" ? "Customer" : "Supplier"}`
                  : `Add ${partyType === "customer" ? "Customer" : "Supplier"}`}
              </h2>
              <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                {partyType === "customer" ? "Client / Buyer profile" : "Vendor / Parts Provider"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: "hsl(var(--muted))" }}
          >
            <X className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        </div>

        {/* Scrollable form content */}
        <div className="overflow-y-auto py-3 flex-1">
          {/* Party type selector toggle if not editing existing */}
          {!isEditing && (
            <div className="flex p-1 rounded-xl mb-4" style={{ background: "hsl(var(--muted))" }}>
              <button
                type="button"
                onClick={() => setPartyType("customer")}
                className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                style={
                  partyType === "customer"
                    ? { background: "#10B981", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)" }
                    : { color: "hsl(var(--muted-foreground))" }
                }
              >
                <Users className="w-3.5 h-3.5" /> Customer
              </button>
              <button
                type="button"
                onClick={() => setPartyType("supplier")}
                className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                style={
                  partyType === "supplier"
                    ? { background: "#6366F1", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)" }
                    : { color: "hsl(var(--muted-foreground))" }
                }
              >
                <Truck className="w-3.5 h-3.5" /> Supplier
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                {partyType === "customer" ? "Customer Name *" : "Supplier / Company Name *"}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder={partyType === "customer" ? "e.g. John Doe" : "e.g. Global Parts Co."}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}
              />
            </div>

            {partyType === "supplier" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 234 567 8900"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 234 567 8900"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}
                  />
                </div>
              </>
            )}

            {partyType === "supplier" && (
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Supplies (Part Types / Categories)
                </label>
                <input
                  type="text"
                  value={form.partTypes}
                  onChange={e => setForm(p => ({ ...p, partTypes: e.target.value }))}
                  placeholder="e.g. Display, Battery, Charging IC, Flex…"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                Notes
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Additional details or address"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}
              />
            </div>

            {error && <p className="text-xs font-semibold text-center text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={mut.isPending}
              className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60 mt-2 transition-transform active:scale-98 cursor-pointer"
              style={{ background: partyType === "customer" ? "#10B981" : "#6366F1" }}
            >
              {mut.isPending
                ? "Saving…"
                : isEditing
                ? "Save Changes"
                : partyType === "customer"
                ? "Add Customer"
                : "Add Supplier"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main Unified Page ────────────────────────────────────────────────────────
export default function CustomersAndSuppliers() {
  const qc = useQueryClient();
  const { user, isGuest } = useAuth();
  const [, setLocation] = useLocation();

  // Read initial tab from URL if present (e.g., ?tab=suppliers or ?from=inventory)
  const queryParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialTabParam = queryParams?.get("tab");
  const fromInventory = queryParams?.get("from") === "inventory";

  const [activeTab, setActiveTab] = useState<"all" | "customers" | "suppliers">(
    initialTabParam === "suppliers" ? "suppliers" : initialTabParam === "customers" ? "customers" : "all"
  );
  const [searchQ, setSearchQ] = useState("");
  const [dueOnly, setDueOnly] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<PartyType>("customer");
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>();
  const [editSupplier, setEditSupplier] = useState<Supplier | undefined>();

  const isFreePlan = !user || user.plan === "Free";
  const isManager = Boolean(user?.isManager || user?.role?.toLowerCase() === "manager");
  const { activeBranch, branchParam } = useBranchSelection();
  // Free owners keep party data locally; Pro users, staff, and managers use the API (DB).
  const useLocalData = isFreePlan && !user?.isStaff && !isManager;
  const userId = user?.id;
  const sym = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? user?.currency ?? "$";

  // Fetch Customers
  const { data: rawCustomers = [], isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ["customers", useLocalData ? "local" : "server", userId, activeBranch?.id],
    queryFn: async () => {
      if (useLocalData && userId) {
        return localCustomers.getAll(userId) as Customer[];
      }
      const res = await fetch(`/api/customers?branchId=${encodeURIComponent(branchParam)}`, { credentials: "include" });
      const d = await res.json();
      return Array.isArray(d) ? d : [];
    },
    enabled: !isGuest && !!user,
  });

  // Fetch Suppliers
  const { data: rawSuppliers = [], isLoading: isLoadingSuppliers } = useQuery<Supplier[]>({
    queryKey: ["suppliers", useLocalData ? "local" : "server", userId, activeBranch?.id],
    queryFn: async () => {
      if (useLocalData && userId) {
        return localSuppliers.getAll(userId) as Supplier[];
      }
      const res = await fetch(`/api/suppliers?branchId=${encodeURIComponent(branchParam)}`, { credentials: "include" });
      const d = await res.json();
      return Array.isArray(d) ? d : [];
    },
    enabled: !isGuest && !!user,
  });

  // Fetch Supplier Balances
  const { data: rawBalances = [] } = useQuery<SupplierBalance[]>({
    queryKey: ["suppliers-balances", useLocalData ? "local" : "server", userId, activeBranch?.id],
    queryFn: async () => {
      if (useLocalData && userId) {
        return localSupplierPurchases.getAllBalances(userId);
      }
      const res = await fetch(`/api/supplier-purchases/balances?branchId=${encodeURIComponent(branchParam)}`, { credentials: "include" });
      const d = await res.json();
      return Array.isArray(d) ? d : [];
    },
    enabled: !isGuest && !!user,
  });

  const supplierBalanceMap = useMemo(() => {
    return Object.fromEntries(rawBalances.map(b => [b.supplierId, b.totalDue]));
  }, [rawBalances]);

  // Delete customer mutation
  const deleteCustomerMut = useMutation({
    mutationFn: (id: number) => {
      if (useLocalData && userId) {
        localCustomers.delete(userId, id);
        return Promise.resolve({ ok: true });
      }
      return fetch(`/api/customers/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  // Delete supplier mutation
  const deleteSupplierMut = useMutation({
    mutationFn: (id: number) => {
      if (useLocalData && userId) {
        localSuppliers.delete(userId, id);
        return Promise.resolve({ success: true });
      }
      return fetch(`/api/suppliers/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  // Transform into unified list
  const unifiedParties: UnifiedParty[] = useMemo(() => {
    const list: UnifiedParty[] = [];

    rawCustomers.forEach(c => {
      const due = (c.creditDue ?? 0) + (c.repairDue ?? 0);
      list.push({
        id: c.id,
        type: "customer",
        name: c.name,
        phone: c.phone,
        whatsapp: c.whatsapp,
        notes: c.notes,
        totalRepairs: c.totalRepairs ?? 0,
        dueAmount: due,
        rawCustomer: c,
      });
    });

    rawSuppliers.forEach(s => {
      const due = supplierBalanceMap[s.id] ?? 0;
      list.push({
        id: s.id,
        type: "supplier",
        name: s.name,
        phone: s.phone,
        whatsapp: s.whatsapp,
        notes: s.notes,
        partTypes: s.partTypes,
        dueAmount: due,
        rawSupplier: s,
      });
    });

    return list;
  }, [rawCustomers, rawSuppliers, supplierBalanceMap]);

  // Financial calculations
  const totalCustomerReceivable = useMemo(() => {
    return rawCustomers.reduce((acc, c) => acc + ((c.creditDue ?? 0) + (c.repairDue ?? 0)), 0);
  }, [rawCustomers]);

  const totalSupplierPayable = useMemo(() => {
    return Object.values(supplierBalanceMap).reduce((acc, due) => acc + due, 0);
  }, [supplierBalanceMap]);

  // Filter parties based on search, tab, and due status
  const filteredParties = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    return unifiedParties.filter(party => {
      // Tab filter
      if (activeTab === "customers" && party.type !== "customer") return false;
      if (activeTab === "suppliers" && party.type !== "supplier") return false;

      // Due only filter
      if (dueOnly && party.dueAmount <= 0) return false;

      // Search query filter
      if (q) {
        const matchesName = party.name.toLowerCase().includes(q);
        const matchesPhone = (party.phone ?? "").includes(q);
        const matchesWhatsapp = (party.whatsapp ?? "").includes(q);
        const matchesNotes = (party.notes ?? "").toLowerCase().includes(q);
        const matchesParts = (party.partTypes ?? "").toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesWhatsapp && !matchesNotes && !matchesParts) {
          return false;
        }
      }

      return true;
    });
  }, [unifiedParties, activeTab, dueOnly, searchQ]);

  function handleOpenAdd(type?: PartyType) {
    const targetType = type || (activeTab === "suppliers" ? "supplier" : "customer");
    setModalInitialType(targetType);
    setEditCustomer(undefined);
    setEditSupplier(undefined);
    setShowModal(true);
  }

  const isLoading = isLoadingCustomers || isLoadingSuppliers;

  return (
    <ProtectedPage>
      <div className="space-y-3.5 pb-8">
        {/* Back button if came from Inventory */}
        {fromInventory && (
          <button
            onClick={() => setLocation("/inventory")}
            className="flex items-center gap-1.5 text-xs font-semibold pt-1"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Inventory
          </button>
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Customers & Suppliers</h1>
          </div>
          <button
            onClick={() => handleOpenAdd()}
            disabled={user?.isStaff}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition-transform active:scale-95 cursor-pointer"
            style={{ background: "hsl(var(--primary))", opacity: user?.isStaff ? 0.45 : 1, cursor: user?.isStaff ? "not-allowed" : "pointer" }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Party</span>
          </button>
        </div>

        {/* Financial Highlights Overview Banner */}
        <div className="grid grid-cols-2 gap-2">
          {/* Customer Receivable */}
          <div
            className="p-3 rounded-2xl border flex flex-col justify-between"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                Receivable
              </span>
            </div>
            <div className="mt-1.5">
              <p className="text-base font-extrabold text-emerald-600">
                {sym}{totalCustomerReceivable.toLocaleString()}
              </p>
              <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                Total customer due
              </p>
            </div>
          </div>

          {/* Supplier Payable */}
          <div
            className="p-3 rounded-2xl border flex flex-col justify-between"
            style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-amber-600" />
                Payable
              </span>
            </div>
            <div className="mt-1.5">
              <p className="text-base font-extrabold text-amber-600">
                {sym}{totalSupplierPayable.toLocaleString()}
              </p>
              <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                Total supplier due
              </p>
            </div>
          </div>
        </div>

        {/* Segmented Filter Tabs */}
        <div className="flex items-stretch gap-1.5 p-1 rounded-2xl border" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
          <button
            onClick={() => setActiveTab("all")}
            className="flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer"
            style={
              activeTab === "all"
                ? { background: "hsl(var(--primary))", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }
                : { color: "hsl(var(--muted-foreground))" }
            }
          >
            <span>All Parties</span>
            <span className="text-[11px] font-semibold opacity-80 mt-0.5">{unifiedParties.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className="flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer"
            style={
              activeTab === "customers"
                ? { background: "#10B981", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)" }
                : { color: "hsl(var(--muted-foreground))" }
            }
          >
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Customers</span>
            <span className="text-[11px] font-semibold opacity-80 mt-0.5">{rawCustomers.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className="flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer"
            style={
              activeTab === "suppliers"
                ? { background: "#6366F1", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(99, 102, 241, 0.25)" }
                : { color: "hsl(var(--muted-foreground))" }
            }
          >
            <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Suppliers</span>
            <span className="text-[11px] font-semibold opacity-80 mt-0.5">{rawSuppliers.length}</span>
          </button>
        </div>

        {/* Search Bar + Due Only Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: "hsl(var(--muted-foreground))" }}
            />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search by name, phone, part types…"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm outline-none"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
            />
            {searchQ && (
              <button
                onClick={() => setSearchQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold p-1"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setDueOnly(!dueOnly)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
              dueOnly
                ? "bg-red-50 border-red-300 text-red-700 shadow-sm"
                : "border-border text-muted-foreground hover:border-primary"
            }`}
            style={!dueOnly ? { background: "hsl(var(--card))" } : undefined}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Due Only</span>
          </button>
        </div>

        {/* Party List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
            ))}
          </div>
        ) : filteredParties.length === 0 ? (
          <div
            className="text-center py-12 rounded-3xl border border-dashed border-border"
            style={{ background: "hsl(var(--card))" }}
          >
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" style={{ color: "hsl(var(--muted-foreground))" }} />
            <p className="font-bold text-sm">No contacts found</p>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              {searchQ || dueOnly ? "Try clearing your search or filter" : "Add your first customer or supplier above"}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              {!user?.isStaff && <button
                onClick={() => handleOpenAdd("customer")}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 shadow-sm"
              >
                + Add Customer
              </button>}
              {!user?.isStaff && <button
                onClick={() => handleOpenAdd("supplier")}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 shadow-sm"
              >
                + Add Supplier
              </button>}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredParties.map((party, i) => {
              const isCust = party.type === "customer";
              const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
              const phoneClean = party.phone?.replace(/[^0-9+]/g, "") ?? "";
              const waClean = (party.whatsapp || party.phone)?.replace(/[^0-9]/g, "") ?? "";

              return (
                <div
                  key={`${party.type}-${party.id}`}
                  className="rounded-2xl border p-3.5 transition-all hover:border-primary/50"
                  style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0 shadow-sm"
                      style={{ background: isCust ? avatarColor : "#6366F1" }}
                    >
                      {initials(party.name)}
                    </div>

                    {/* Middle Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-extrabold truncate">{party.name}</p>
                        {/* Type Badge */}
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                            isCust
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}
                        >
                          {isCust ? <Users className="w-2.5 h-2.5" /> : <Truck className="w-2.5 h-2.5" />}
                          {isCust ? "Customer" : "Supplier"}
                        </span>
                      </div>

                      {/* Phone & WhatsApp Quick Links */}
                      {party.phone && (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <a
                            href={`tel:${phoneClean}`}
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{party.phone}</span>
                          </a>
                          {waClean && (
                            <a
                              href={`https://wa.me/${waClean}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 hover:underline"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Additional Details: Repairs / Supplied Parts / Notes */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {isCust ? (
                          <span>Repairs: <strong className="font-semibold text-foreground">{party.totalRepairs ?? 0}</strong></span>
                        ) : (
                          party.partTypes && <span className="truncate max-w-[200px]">Supplies: {party.partTypes}</span>
                        )}
                        {party.notes && <span className="truncate max-w-[150px]">· {party.notes}</span>}
                      </div>
                    </div>

                    {/* Right side: Due Badge & Action Buttons */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      {party.dueAmount > 0 ? (
                        <span
                          className={`flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                            isCust ? "bg-red-50 text-red-600 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          <AlertCircle className="w-3 h-3" />
                          {isCust ? "Due: " : "Payable: "}{sym}{party.dueAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Settled
                        </span>
                      )}

                      <div className="flex items-center gap-1 mt-1">
                        {!user?.isStaff && <button
                          onClick={() => {
                            if (isCust) {
                              setEditCustomer(party.rawCustomer);
                              setEditSupplier(undefined);
                              setShowModal(true);
                            } else {
                              setEditSupplier(party.rawSupplier);
                              setEditCustomer(undefined);
                              setShowModal(true);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-border hover:border-primary text-xs font-semibold"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
                        </button>}
                        {!user?.isStaff && <button
                          onClick={() => {
                            if (confirm(`Delete ${isCust ? "customer" : "supplier"} "${party.name}"?`)) {
                              if (isCust) deleteCustomerMut.mutate(party.id);
                              else deleteSupplierMut.mutate(party.id);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>}
                      </div>
                    </div>
                  </div>

                  {/* Profile / Ledger Bottom Action Bar */}
                  <div className="mt-2.5 pt-2.5 border-t border-border flex items-center justify-between">
                    <Link
                      href={isCust ? `/customers/${party.id}` : `/supplier-ledger/${party.id}`}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:bg-muted/70"
                      style={{
                        background: "hsl(var(--muted) / 0.5)",
                        color: isCust ? "#10B981" : "#6366F1",
                      }}
                    >
                      <span className="flex items-center gap-1.5">
                        {isCust ? <Users className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                        {isCust ? "View Customer Profile & Invoices" : "View Supplier Ledger & Purchases"}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unified Add / Edit Modal */}
      {showModal && (
        <PartyFormModal
          onClose={() => {
            setShowModal(false);
            setEditCustomer(undefined);
            setEditSupplier(undefined);
          }}
          initialType={modalInitialType}
          existingCustomer={editCustomer}
          existingSupplier={editSupplier}
          allCustomers={rawCustomers}
          allSuppliers={rawSuppliers}
        />
      )}
    </ProtectedPage>
  );
}
