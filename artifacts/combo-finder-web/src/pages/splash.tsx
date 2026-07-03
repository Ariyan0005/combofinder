import { Link } from "wouter";
import { Smartphone, Cpu, Wrench, Package } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function Splash() {
  const { enterAsGuest } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6"
      style={{ background: "linear-gradient(160deg, hsl(252,100%,30%) 0%, hsl(252,100%,50%) 60%, hsl(260,80%,60%) 100%)" }}>

      {/* Top spacer */}
      <div />

      {/* Center content */}
      <div className="flex flex-col items-center gap-6 text-white text-center">
        {/* Logo icon */}
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)" }}>
          <Smartphone className="w-12 h-12 text-white" />
        </div>

        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">ComboFinder</h1>
          <p className="mt-2 text-base opacity-80 font-medium">All-in-One Solution<br />for Mobile Technicians</p>
        </div>

        {/* Illustration — device exploded parts */}
        <div className="relative w-64 h-40 mt-2">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-20 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.12)" }}>
            <Cpu className="w-10 h-10 text-white opacity-70" />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Smartphone className="w-6 h-6 text-white opacity-60" />
          </div>
          <div className="absolute top-6 right-0 w-16 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Package className="w-5 h-5 text-white opacity-60" />
          </div>
          <div className="absolute top-6 left-0 w-16 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Wrench className="w-5 h-5 text-white opacity-60" />
          </div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        <Link href="/login">
          <button className="w-full py-4 rounded-2xl font-bold text-base shadow-lg transition-transform active:scale-95"
            style={{ background: "#fff", color: "hsl(var(--primary))" }}>
            Get Started
          </button>
        </Link>
        <button onClick={enterAsGuest}
          className="w-full py-3 font-semibold text-sm text-white opacity-80 hover:opacity-100 transition-opacity">
          Explore as Guest
        </button>
      </div>
    </div>
  );
}
