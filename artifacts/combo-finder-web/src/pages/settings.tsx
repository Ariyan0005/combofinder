import { useState, type FormEvent } from "react";
import { Store, User, Lock, Bell, ChevronRight, Check } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ProtectedPage } from "@/components/protected-page";

export default function Settings() {
  const { user } = useAuth();
  const [shopName, setShopName] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const MENU_ITEMS = [
    { label: "Profile Settings", icon: User, description: "Update your name and contact" },
    { label: "Notifications", icon: Bell, description: "Manage notification preferences" },
    { label: "Change Password", icon: Lock, description: "Update your account password" },
  ];

  return (
    <ProtectedPage>
      <div className="space-y-5">
        <h1 className="text-xl font-extrabold pt-1">Settings</h1>

        {/* Account info */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wide mb-3"
            style={{ color: "hsl(var(--muted-foreground))" }}>Account</p>
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-extrabold text-white"
              style={{ background: "hsl(var(--primary))" }}>
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div>
              <p className="font-bold">{user?.name ?? "User"}</p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                {user?.role ?? "Technician"} · {user?.plan ?? "Free"} Plan
              </p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {MENU_ITEMS.map(({ label, icon: Icon, description }) => (
              <div key={label} className="flex items-center gap-3 py-3 cursor-pointer">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(var(--muted))" }}>
                  <Icon className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{description}</p>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Shop settings */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wide mb-3"
            style={{ color: "hsl(var(--muted-foreground))" }}>Shop Profile</p>
          <form onSubmit={handleSave} className="flex flex-col gap-3.5">
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                Shop Name
              </label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(var(--muted-foreground))" }} />
                <input value={shopName} onChange={e => setShopName(e.target.value)}
                  placeholder="Enter your shop name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
              </div>
            </div>
            <button type="submit"
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all"
              style={{ background: "hsl(var(--primary))" }}>
              {saved ? <><Check className="w-4 h-4" /> Saved!</> : "Save Changes"}
            </button>
          </form>
        </div>

        {/* App version */}
        <p className="text-xs text-center pb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
          ComboFinder v1.0 · All-in-One for Technicians
        </p>
      </div>
    </ProtectedPage>
  );
}
