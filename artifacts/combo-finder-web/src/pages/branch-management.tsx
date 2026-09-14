import { useState } from "react";
import type { FormEvent } from "react";
import { Building2, Check, ChevronDown, MapPin, Pencil, Plus, Users, Package, X, Store } from "lucide-react";
import { useBranchSelection, type Branch, createBranch, updateBranch, DEFAULT_BRANCH } from "@/lib/branch-store";
import { ProtectedPage } from "@/components/protected-page";
import { useLocation } from "wouter";

function BranchForm({ branch, onClose, onSuccess }: { branch?: Branch; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: branch?.name || "", code: branch?.code || "", city: branch?.city || "", address: branch?.address || "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (branch) {
        await updateBranch(branch.id, form);
      } else {
        await createBranch(form);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save branch");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">{branch ? "Edit branch" : "New branch"}</p>
            <h2 className="mt-1 text-xl font-extrabold">{branch ? "Update branch details" : "Add a new branch"}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-muted p-2">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["name", "Branch name", "Enter your Branch name"],
            ["code", "Branch code", "Branch code (e.g. B2)"],
            ["city", "City", "Branch city"],
            ["address", "Address", "Branch address"],
          ] as const).map(([key, label, placeholder]) => (
            <label key={key} className={key === "address" ? "sm:col-span-2" : ""}>
              <span className="text-xs font-bold">{label}</span>
              <input
                required
                value={form[key]}
                disabled={key === "code" && !!branch && branch.code === "MAIN"}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
          ))}
        </div>
        {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold">
            Cancel
          </button>
          <button disabled={isSubmitting} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {isSubmitting ? "Saving..." : branch ? "Save changes" : "Create branch"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function BranchManagement() {
  const [, navigate] = useLocation();
  const { branches, activeBranch, selectBranch, refresh } = useBranchSelection();
  const [editing, setEditing] = useState<Branch | null>(null);
  const [adding, setAdding] = useState(false);

  const mainBranch = branches.find((b) => b.code === "MAIN") || DEFAULT_BRANCH;
  const isMainActive = activeBranch.code === "MAIN" || activeBranch.id === mainBranch.id || activeBranch.id === "default-main";

  const toggleStatus = async (branch: Branch) => {
    if (branch.code === "MAIN") return;
    await updateBranch(branch.id, { status: branch.status === "Active" ? "Inactive" : "Active" });
    refresh();
  };

  return (
    <ProtectedPage>
      <div className="space-y-5 pb-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="whitespace-nowrap text-xl font-black tracking-tight">Branch management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage and switch between your business branches</p>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-90 transition active:scale-95"
          >
            <Plus className="h-4 w-4" /> Branch
          </button>
        </div>

        {/* Top active branch overview */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shrink-0">
              <Check className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">Currently viewing</p>
              <p className="font-extrabold text-foreground truncate">
                {activeBranch?.name || "Default Branch"}{" "}
                <span className="ml-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary font-bold">
                  {activeBranch?.code || "MAIN"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isMainActive && (
                <button
                  onClick={() => selectBranch(mainBranch.id)}
                  className="rounded-lg border border-primary/30 bg-primary text-white px-3 py-2 text-xs font-bold hover:bg-primary/90 transition whitespace-nowrap shadow-xs"
                >
                  Switch to Main
                </button>
              )}
              <button
                onClick={() => navigate("/")}
                className="hidden rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground sm:block hover:bg-muted transition whitespace-nowrap"
              >
                View dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Branches Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => {
            const isBranchActive = branch.id === activeBranch.id || (branch.code === "MAIN" && isMainActive);
            const isMain = branch.code === "MAIN" || branch.id === "default-main";

            return (
              <div
                key={branch.id}
                className={`rounded-2xl border bg-card p-4 shadow-sm transition ${
                  isBranchActive ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isBranchActive ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}>
                    {isMain ? <Store className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isMain && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        Main Store
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        branch.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {branch.status}
                    </span>
                  </div>
                </div>

                <h2 className="mt-3 font-extrabold text-foreground flex items-center gap-1.5">
                  {branch.name}
                </h2>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {branch.city} · {branch.code}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{branch.address}</p>

                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span><b>{branch.staff}</b> staff</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5 text-primary" />
                    <span><b>{branch.inventory}</b> items</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => selectBranch(branch.id)}
                    disabled={branch.status !== "Active" || isBranchActive}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                      isBranchActive
                        ? "bg-primary text-white cursor-default"
                        : "bg-primary/10 text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
                    }`}
                  >
                    {isBranchActive ? "Selected" : "Switch to branch"}
                  </button>
                  <button
                    onClick={() => setEditing(branch)}
                    className="rounded-lg border border-border p-2 hover:bg-muted transition"
                    title="Edit branch"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {!isMain && (
                    <button
                      onClick={() => toggleStatus(branch)}
                      className="rounded-lg border border-border p-2 text-xs hover:bg-muted transition"
                      title="Toggle status"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {(adding || editing) && (
          <BranchForm
            branch={editing || undefined}
            onClose={() => { setAdding(false); setEditing(null); }}
            onSuccess={() => refresh()}
          />
        )}
      </div>
    </ProtectedPage>
  );
}