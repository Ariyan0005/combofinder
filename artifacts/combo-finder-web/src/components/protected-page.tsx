import type { ReactNode } from "react";
import { Link } from "wouter";
import { Lock } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function ProtectedPage({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();

  if (!user && isGuest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 p-6 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "hsl(var(--accent))" }}>
          <Lock className="w-9 h-9" style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-1">Login Required</h2>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Create an account or login to access this feature.
          </p>
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <Link href="/login" className="flex-1">
            <button className="w-full py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: "hsl(var(--primary))" }}>
              Login
            </button>
          </Link>
          <Link href="/register" className="flex-1">
            <button className="w-full py-3 rounded-xl font-semibold text-sm border"
              style={{ borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))" }}>
              Sign Up
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
