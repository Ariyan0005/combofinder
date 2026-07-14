import { ExternalLink, Shield, Smartphone, Wifi } from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";

const SERVICES = [
  {
    name: "Remote Unlock",
    description: "IMEI-based remote unlocking for all major carriers worldwide",
    icon: Wifi,
    color: "#1D4ED8",
    bg: "#EFF6FF",
  },
  {
    name: "iCloud Bypass",
    description: "Professional iCloud activation lock removal service",
    icon: Shield,
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    name: "FRP Removal",
    description: "Factory Reset Protection bypass for Android devices",
    icon: Smartphone,
    color: "#059669",
    bg: "#ECFDF5",
  },
];

export default function UnlockServices() {
  return (
    <ProtectedPage>
      <div className="space-y-5">
        <div className="pt-1">
          <h1 className="text-xl font-extrabold">Unlock Services</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            Professional unlock and bypass services powered by iUnlockd.
          </p>
        </div>

        {/* Service cards */}
        <div className="flex flex-col gap-3">
          {SERVICES.map(({ name, description, icon: Icon, color, bg }) => (
            <div key={name} className="bg-card rounded-2xl border border-border p-4 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{name}</p>
                <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <a href="https://iunlockd.com" target="_blank" rel="noreferrer">
          <button className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white text-sm"
            style={{ background: "hsl(var(--primary))" }}>
            <ExternalLink className="w-4 h-4" />
            Open iUnlockd Portal
          </button>
        </a>

        <p className="text-xs text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
          Powered by iUnlockd · Professional mobile technician services
        </p>
      </div>
    </ProtectedPage>
  );
}
