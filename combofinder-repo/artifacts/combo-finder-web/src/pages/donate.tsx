import { Link } from "wouter";
import { Heart, Coffee, Smartphone, ArrowLeft, ExternalLink } from "lucide-react";

const DONATE_TIERS = [
  { amount: "$2", label: "Buy us a coffee", icon: Coffee, desc: "Every little bit helps keep the servers running." },
  { amount: "$5", label: "Support a feature", icon: Smartphone, desc: "Help us build new features for mobile technicians." },
  { amount: "$10", label: "Be a hero", icon: Heart, desc: "Your generosity keeps ComboFinder free for everyone." },
];

export default function Donate() {
  return (
    <div className="min-h-screen flex flex-col p-5"
      style={{ background: "hsl(var(--background))" }}>

      <div className="w-full max-w-sm mx-auto">
        {/* Back */}
        <Link href="/">
          <button className="flex items-center gap-1.5 text-sm font-medium mb-6"
            style={{ color: "hsl(var(--muted-foreground))" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </Link>

        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "hsl(var(--primary) / 0.12)" }}>
            <Heart className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h1 className="text-2xl font-extrabold">Support ComboFinder</h1>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
            ComboFinder is a <strong>100% free service</strong> for mobile technicians. We cover server costs, development, and data maintenance from our own pocket.
            If this tool saves you time, consider buying us a coffee!
          </p>
        </div>

        {/* Tiers */}
        <div className="flex flex-col gap-3 mb-6">
          {DONATE_TIERS.map(({ amount, label, icon: Icon, desc }) => (
            <div key={amount} className="flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:border-primary/50 hover:shadow-sm"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "hsl(var(--primary) / 0.1)" }}>
                <Icon className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm">{label}</p>
                  <span className="text-sm font-extrabold" style={{ color: "hsl(var(--primary))" }}>{amount}</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Donate via PayPal / bKash */}
        <div className="flex flex-col gap-3">
          <a
            href="https://paypal.me/combofinder"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: "hsl(var(--primary))" }}>
            <Heart className="w-4 h-4" />
            Donate via PayPal
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
          <p className="text-xs text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
            All donations go directly toward server and development costs.
            Thank you for keeping ComboFinder free!
          </p>
        </div>

        {/* Bottom note */}
        <div className="mt-8 p-4 rounded-xl text-center"
          style={{ background: "hsl(var(--muted) / 0.4)" }}>
          <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
            ComboFinder will always remain free. Donations are voluntary and deeply appreciated.
          </p>
        </div>
      </div>
    </div>
  );
}
