import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, X, Users, AlertCircle, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { ProtectedPage } from "@/components/protected-page";
import { localCustomers } from "@/lib/local-store";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", BDT: "৳", INR: "₹",
  PKR: "₨", NPR: "रू", LKR: "Rs", AED: "د.إ", SAR: "﷼",
  OMR: "OMR", KWD: "KD", QAR: "QR", MYR: "RM", SGD: "S$",
};


type Customer = {
  id: number;
  name: string;
  phone?: string;
  whatsapp?: string;
  notes?: string;
  totalRepairs?: number;
  repairDue?: number;
  creditDue?: number;
  createdAt: string;
};

function CustomerForm({ onClose, existing, allCustomers }: {
  onClose: () => void; existing?: Customer; allCustomers?: Customer[];
}) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isFreePlan = user?.plan !== "Pro";
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    phone: existing?.phone ?? "",
    whatsapp: existing?.whatsapp ?? "",
    notes: existing?.notes ?? "",
  });
  const [error, setError] = useState("");

  const mut = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      // ── Free plan: local storage ──────────────────────────────────────────
      if (isFreePlan && user?.id) {
        return existing
          ? localCustomers.update(user.id, existing.id, data)
          : localCustomers.create(user.id, data);
      }
      // ── Pro plan: server ─────────────────────────────────────────────────
      const url = existing ? `/api/customers/${existing.id}` : `/api/customers`;
      const res = await fetch(url, {
        method: existing ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); onClose(); },
    onError: (err: any) => setError(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name) { setError("Name is required"); return; }
    // ── Phone duplicate check ────────────────────────────────────────────────
    if (form.phone.trim() && allCustomers) {
      const normalise = (p: string) => p.replace(/\s+/g, "").replace(/^0+/, "");
      const incoming = normalise(form.phone.trim());
      const clash = allCustomers.find(c =>
        c.id !== (existing?.id ?? 0) &&
        c.phone &&
        normalise(c.phone) === incoming
      );
      if (clash) { setError(`Phone already used by "${clash.name}"`); return; }
    }
    mut.mutate(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-base">{existing ? "Edit Customer" : "New Customer"}</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: "hsl(var(--muted-foreground))" }} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {[
            { label: "Full Name", key: "name", type: "text", placeholder: "Customer name" },
            { label: "Phone", key: "phone", type: "tel", placeholder: "Phone number" },
            { label: "WhatsApp", key: "whatsapp", type: "tel", placeholder: "WhatsApp number (optional)" },
            { label: "Notes", key: "notes", type: "text", placeholder: "Additional notes" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</label>
              <input type={type} value={(form as any)[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3.5 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}
                onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }}
              />
            </div>
          ))}
          {error && <p className="text-xs text-center" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
          <button type="submit" disabled={mut.isPending}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 mt-1"
            style={{ background: "hsl(var(--primary))" }}>
            {mut.isPending ? "Saving…" : existing ? "Save Changes" : "Add Customer"}
          </button>
        </form>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ["#6248FF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

export default function Customers() {
  const [searchQ, setSearchQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>();
  const qc = useQueryClient();
  const { user } = useAuth();
  const sym = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? user?.currency ?? "$";
  const [, setLocation] = useLocation();
  const fromInventory = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("from") === "inventory";

  const isFreePlan = user?.plan !== "Pro";

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["customers", searchQ, isFreePlan ? "local" : "server"],
    queryFn: () => {
      if (isFreePlan && user?.id) {
        return Promise.resolve(localCustomers.search(user.id, searchQ.trim()));
      }
      const url = searchQ.trim()
        ? `/api/customers?q=${encodeURIComponent(searchQ.trim())}`
        : `/api/customers`;
      return fetch(url, { credentials: "include" }).then(r => r.json());
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => {
      if (isFreePlan && user?.id) {
        localCustomers.delete(user.id, id);
        return Promise.resolve({ ok: true });
      }
      return fetch(`/api/customers/${id}`, { method: "DELETE", credentials: "include" }).then(r => r.json());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  const list = Array.isArray(customers) ? customers : [];

  return (
    <ProtectedPage>
      <div className="space-y-4">
        {/* Back to Inventory — only shown when navigated from Inventory FAB */}
        {fromInventory && (
          <button onClick={() => setLocation("/inventory")}
            className="flex items-center gap-1.5 text-sm font-medium pt-1"
            style={{ color: "hsl(var(--muted-foreground))" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Inventory
          </button>
        )}

        <div className="flex items-center justify-between pt-1">
          <h1 className="text-xl font-extrabold">Customers</h1>
          <button onClick={() => { setEditCustomer(undefined); setShowForm(true); }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white"
            style={{ background: "hsl(var(--primary))" }}>
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search customers…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm outline-none"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />)}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
            <p className="font-semibold">No customers yet</p>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              {searchQ ? "No results for your search" : "Add your first customer"}
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {list.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                  style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {initials(c.name)}
                </div>
                <Link href={`/customers/${c.id}`} className="flex-1 min-w-0">
                  <div className="cursor-pointer">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    {c.phone && <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{c.phone}</p>}
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                        Repairs: {c.totalRepairs ?? 0}
                      </p>
                      {((c.creditDue ?? 0) + (c.repairDue ?? 0)) > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: "#FEF2F2", color: "#DC2626" }}>
                          <AlertCircle className="w-2.5 h-2.5" />
                          Due: {sym}{((c.creditDue ?? 0) + (c.repairDue ?? 0)).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <button onClick={() => { setEditCustomer(c); setShowForm(true); }}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
                    style={{ background: "hsl(var(--accent))", color: "hsl(var(--primary))" }}>
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => { if (confirm("Delete this customer?")) deleteMut.mutate(c.id); }}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
                    style={{ background: "#FEF2F2", color: "#DC2626" }}>
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showForm && <CustomerForm onClose={() => setShowForm(false)} existing={editCustomer} allCustomers={list} />}
    </ProtectedPage>
  );
}
