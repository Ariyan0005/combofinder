import { useState } from "react";
import { Check, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import { ProtectedPage } from "@/components/protected-page";

const getFreeFeatures = (isGeneralStore: boolean) => [
  ...(isGeneralStore ? [] : ["✅ Unlimited Repairs"]),
  "✅ Unlimited Inventory",
  "✅ Customers & Ledger",
  "✅ Invoices & POS",
  "📱 Data stored on your device",
  "⚠️ Data stays on this device only",
];

const PRO_FEATURES = [
  "✅ Everything in Free",
  "🌐 Access from Web & Desktop",
  "☁️ Cloud Backup & Sync",
  "🔄 Access from any device",
  "👥 Staff Login & Team Access",
  "📤 1-click migrate Free plan data to cloud",
  "📊 Advanced Analytics & Reports",
  "⭐ Priority Support",
];

const YEARLY_DISCOUNT = Math.round((1 - 75 / (7 * 12)) * 100);

export default function Subscription() {
  const { user } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState("pro");

  const isGeneralStore = user?.businessType === "general_store";
  const freeFeatures = getFreeFeatures(isGeneralStore);

  const plans = {
    monthly: [
      {
        id: "free",
        name: "Free Plan",
        price: "0",
        currency: "$",
        period: "month",
        features: freeFeatures,
      },
      {
        id: "pro",
        name: "Pro Plan",
        price: "7",
        currency: "$",
        period: "month",
        features: PRO_FEATURES,
        highlighted: true,
      },
    ],
    yearly: [
      {
        id: "free",
        name: "Free Plan",
        price: "0",
        currency: "$",
        period: "year",
        features: freeFeatures,
      },
      {
        id: "pro",
        name: "Pro Plan",
        price: "75",
        currency: "$",
        period: "year",
        features: PRO_FEATURES,
        highlighted: true,
      },
    ],
  }[billing];

  const currentPlan = user?.plan ?? "Free";
  const isProUser = Boolean(
    user?.plan &&
    user.plan.toLowerCase() !== "free"
  );

  return (
    <ProtectedPage>
      <div className="space-y-5 max-w-sm mx-auto">
        <div className="flex items-center gap-3 pt-1">
          <Link href="/">
            <button className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="text-xl font-extrabold">Subscription Plans</h1>
        </div>

        {/* Current plan badge */}
        {currentPlan && (
          <div className="text-center py-3 rounded-2xl text-sm font-semibold"
            style={{ background: "hsl(var(--accent))", color: "hsl(var(--primary))" }}>
            Current Plan: <span className="font-extrabold">{currentPlan}</span>
          </div>
        )}

        {/* Billing toggle */}
        <div className="flex bg-card border border-border rounded-2xl p-1">
          {(["monthly", "yearly"] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all flex items-center justify-center gap-2"
              style={billing === b
                ? { background: "hsl(var(--primary))", color: "#fff" }
                : { color: "hsl(var(--muted-foreground))" }}>
              {b === "yearly" ? "Yearly" : "Monthly"}
              {b === "yearly" && billing !== "yearly" && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "#ECFDF5", color: "#10B981" }}>Save {YEARLY_DISCOUNT}%</span>
              )}
            </button>
          ))}
        </div>

        {/* Plan cards */}
        <div className="flex flex-col gap-4">
          {plans.map(plan => {
            const selected = selectedPlan === plan.id;
            return (
              <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                className="w-full text-left p-5 rounded-2xl border-2 transition-all"
                style={plan.highlighted
                  ? { borderColor: selected ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.3)", background: "hsl(var(--primary) / 0.04)" }
                  : { borderColor: selected ? "hsl(var(--border))" : "hsl(var(--border))", background: "hsl(var(--card))" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-extrabold text-base">{plan.name}</p>
                    <p className="text-2xl font-extrabold mt-1">
                      {plan.currency}{plan.price} <span className="text-sm font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>
                        / {plan.period}
                      </span>
                    </p>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={selected
                      ? { borderColor: "hsl(var(--primary))", background: "hsl(var(--primary))" }
                      : { borderColor: "hsl(var(--border))" }}>
                    {selected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <div className="space-y-2">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-sm">
                      <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#10B981" }} />
                      <span style={{ color: "hsl(var(--foreground))" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Subscribe / Current Plan buttons */}
        {isProUser ? (
          <div className="w-full py-3.5 rounded-2xl font-bold text-center border text-sm flex items-center justify-center gap-2"
            style={{ borderColor: "#10B981", background: "#ECFDF5", color: "#065F46" }}>
            <Check className="w-4 h-4 text-emerald-600" />
            You are already on the Pro Plan (Active)
          </div>
        ) : (
          <>
            {selectedPlan !== "free" && (
              <button className="w-full py-4 rounded-2xl font-extrabold text-white transition-transform active:scale-95 flex items-center justify-center gap-2"
                style={{ background: "hsl(var(--primary))" }}
                onClick={() => alert("Payment integration coming soon.")}>
                Subscribe Now
              </button>
            )}

            {selectedPlan === "free" && (
              <button className="w-full py-4 rounded-2xl font-extrabold border-2 transition-transform active:scale-95"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
                onClick={() => alert("You are on the Free plan.")}>
                Current Free Plan
              </button>
            )}
          </>
        )}
      </div>
    </ProtectedPage>
  );
}
