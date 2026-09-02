import { Wrench, Store, ArrowRight, X, Sparkles } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";

interface GuestModalProps {
  open: boolean;
  onClose: () => void;
}

export function GuestModal({ open, onClose }: GuestModalProps) {
  const { enterAsGuest } = useAuth();
  const [, navigate] = useLocation();

  if (!open) return null;

  const handleSelect = (mode: "mobile_repair" | "general_store") => {
    enterAsGuest(mode);
    onClose();
    navigate("/");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 border border-border"
        style={{ background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Demo</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight">Choose Business Type</h3>
            <p className="text-xs text-muted-foreground">Select an ERP workspace mode to preview features tailored for your store.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Mobile Repair Mode */}
          <button
            type="button"
            onClick={() => handleSelect("mobile_repair")}
            className="group flex items-start gap-4 p-4 rounded-2xl border border-border text-left hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Wrench className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">Mobile & Electronics Repair</h4>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Complete Repair ERP system with repair job tickets, parts compatibility database, inventory & POS invoice billing.
              </p>
            </div>
          </button>

          {/* General Store Mode */}
          <button
            type="button"
            onClick={() => handleSelect("general_store")}
            className="group flex items-start gap-4 p-4 rounded-2xl border border-border text-left hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Store className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">General Retail & Grocery Store</h4>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                All-in-one Retail ERP system with fast barcode POS checkout, stock management, customer ledger & sales analytics.
              </p>
            </div>
          </button>
        </div>

        <div className="pt-1 text-center">
          <p className="text-[11px] text-muted-foreground">
            No login required. Explore all core capabilities in read/demo mode.
          </p>
        </div>
      </div>
    </div>
  );
}
