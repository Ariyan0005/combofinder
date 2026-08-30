import { useState } from "react";
import { Link } from "wouter";
import { Smartphone, Cpu, Wrench, Package, Sparkles } from "lucide-react";
import { GuestModal } from "@/components/guest-modal";

export default function Splash() {
  const [showGuestModal, setShowGuestModal] = useState(false);

  return (
    <div className="h-dvh flex flex-col items-center p-5 overflow-hidden"
      style={{ background: "linear-gradient(160deg, hsl(252,100%,30%) 0%, hsl(252,100%,50%) 60%, hsl(260,80%,60%) 100%)" }}>

      {/* Top spacer */}
      <div className="flex-1" />

      {/* Center content */}
      <div className="flex flex-col items-center gap-4 text-white text-center">
        {/* Logo icon */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">PosCert</h1>
          <p className="mt-1.5 text-sm opacity-80 font-medium">Smart POS for every Business</p>
        </div>

        {/* Illustration */}
        <div className="relative w-56 h-32 mt-1">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.12)" }}>
            <Cpu className="w-8 h-8 text-white opacity-70" />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-11 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Smartphone className="w-5 h-5 text-white opacity-60" />
          </div>
          <div className="absolute top-4 right-0 w-14 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Package className="w-4 h-4 text-white opacity-60" />
          </div>
          <div className="absolute top-4 left-0 w-14 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Wrench className="w-4 h-4 text-white opacity-60" />
          </div>
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="flex-1" />

      {/* Bottom buttons */}
      <div className="w-full max-w-xs flex flex-col gap-2.5 pb-2">
        <Link href="/login">
          <button className="w-full py-3.5 rounded-2xl font-bold text-base shadow-lg transition-transform active:scale-95 cursor-pointer"
            style={{ background: "#fff", color: "hsl(252,100%,40%)" }}>
            Login
          </button>
        </Link>
        <Link href="/register">
          <button className="w-full py-3 rounded-2xl font-bold text-base shadow-lg transition-transform active:scale-95 cursor-pointer"
            style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff" }}>
            Create Account
          </button>
        </Link>
        <button
          type="button"
          onClick={() => setShowGuestModal(true)}
          className="w-full py-2.5 font-semibold text-sm text-white opacity-75 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Explore as Guest
        </button>
      </div>

      {/* Choose business type modal */}
      <GuestModal open={showGuestModal} onClose={() => setShowGuestModal(false)} />
    </div>
  );
}
