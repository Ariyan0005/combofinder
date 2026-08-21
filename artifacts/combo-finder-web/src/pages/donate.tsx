import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Copy, Check, Heart, Wallet, CreditCard } from "lucide-react";

export default function Donate() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const PAYPAL_EMAIL = "combofinder.pay@gmail.com";
  const USDT_TRC20 = "TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxnSE";
  const BINANCE_PAY_ID = "203906410";
  const BTC_ADDRESS = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6" style={{ background: "hsl(var(--background))" }}>
      <div className="w-full max-w-md mx-auto space-y-5 pb-12">
        {/* Back Link */}
        <Link href="/">
          <button
            className="flex items-center gap-2 text-sm font-medium pt-2 transition-colors hover:text-primary"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </Link>

        {/* Hero Header */}
        <div className="flex flex-col items-center text-center pt-2 pb-1">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-sm"
            style={{ background: "hsl(var(--primary) / 0.12)" }}
          >
            <Heart className="w-7 h-7" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Support Pos Cert</h1>
          <p className="text-xs mt-1.5 leading-relaxed max-w-xs text-muted-foreground">
            Your generous contributions help us cover server costs, databases, and continuous development for technicians.
          </p>
        </div>

        {/* 1. PayPal Donation */}
        <div
          className="p-4 rounded-2xl border space-y-3 shadow-sm"
          style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
            >
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">PayPal Support</h2>
              <p className="text-[11px] text-muted-foreground">Send contribution via PayPal</p>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-semibold text-muted-foreground">
              PayPal Email Address:
            </label>
            <div
              className="flex items-center justify-between p-3 rounded-xl border text-xs font-mono font-medium"
              style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
            >
              <span className="truncate select-all text-xs">{PAYPAL_EMAIL}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(PAYPAL_EMAIL, "paypal")}
                className="ml-2 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 text-primary hover:bg-primary/10 transition-colors shrink-0"
              >
                {copiedKey === "paypal" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 2. Crypto Donation */}
        <div
          className="p-4 rounded-2xl border space-y-3.5 shadow-sm"
          style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Crypto Contribution</h2>
              <p className="text-[11px] text-muted-foreground">USDT, Binance Pay, or Bitcoin</p>
            </div>
          </div>

          {/* Binance Pay ID */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground">Binance Pay ID</label>
            <div
              className="flex items-center justify-between p-3 rounded-xl border text-xs font-mono font-medium"
              style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
            >
              <span className="truncate select-all text-xs font-mono font-bold">{BINANCE_PAY_ID}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(BINANCE_PAY_ID, "binance")}
                className="ml-2 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 text-primary hover:bg-primary/10 transition-colors shrink-0"
              >
                {copiedKey === "binance" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* USDT TRC20 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-foreground">USDT (TRC20 Network)</label>
              <span className="text-[10px] text-amber-600 font-semibold">TRC20</span>
            </div>
            <div
              className="flex items-center justify-between p-3 rounded-xl border text-xs font-mono font-medium"
              style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
            >
              <span className="truncate select-all text-xs">{USDT_TRC20}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(USDT_TRC20, "usdt")}
                className="ml-2 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 text-primary hover:bg-primary/10 transition-colors shrink-0"
              >
                {copiedKey === "usdt" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bitcoin Address */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground">Bitcoin (BTC) Address</label>
            <div
              className="flex items-center justify-between p-3 rounded-xl border text-xs font-mono font-medium"
              style={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
            >
              <span className="truncate select-all text-[11px]">{BTC_ADDRESS}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(BTC_ADDRESS, "btc")}
                className="ml-2 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 text-primary hover:bg-primary/10 transition-colors shrink-0"
              >
                {copiedKey === "btc" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Simple Thank you text without any plan or activation */}
        <p className="text-xs text-center text-muted-foreground pt-1">
          Every contribution keeps Pos Cert fast, free, and accessible to everyone. Thank you!
        </p>
      </div>
    </div>
  );
}
