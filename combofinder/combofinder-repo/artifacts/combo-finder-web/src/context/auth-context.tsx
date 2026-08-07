import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { exportAllLocalData } from "@/lib/local-store";
import { silentDriveBackup } from "@/lib/google-drive";

export type UserInfo = {
  id?: number;
  name: string;
  email?: string;
  role: string;
  plan?: string;
  currency?: string;
  shopName?: string;
};

type AuthContextType = {
  user: UserInfo | null;
  isGuest: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  enterAsGuest: () => void;
  exitGuest: () => void;
  register: (data: { name: string; email: string; phone?: string; password: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


  async function fetchMe() {
    const r = await fetch(`/api/auth/me`, { credentials: "include" });
    const data = await r.json() as { authenticated: boolean; user?: UserInfo };
    if (data.authenticated && data.user) {
      setUser(data.user);
      // Free users: auto-backup to Google Drive (silent — only if already connected)
      if (data.user.id && data.user.plan !== "Pro") {
        const uid = data.user.id;
        silentDriveBackup(uid, () => exportAllLocalData(uid)).catch(() => {});
      }
    } else setUser(null);
  }

  useEffect(() => {
    const guestFlag = sessionStorage.getItem("cf_guest");
    if (guestFlag === "1") { setIsGuest(true); setIsLoading(false); return; }
    fetchMe().catch(() => setUser(null)).finally(() => setIsLoading(false));
  }, []);

  async function refreshUser() {
    try { await fetchMe(); } catch {}
  }

  async function login(identifier: string, password: string) {
    const res = await fetch(`/api/auth/login`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: identifier, email: identifier, password }),
    });
    const data = await res.json() as { success?: boolean; error?: string; user?: UserInfo };
    if (!res.ok) throw new Error(data.error ?? "Invalid credentials");
    setUser(data.user!);
    setIsGuest(false);
    sessionStorage.removeItem("cf_guest");
    if (data.user?.id && data.user?.plan !== "Pro") {
      const uid = data.user.id;
      silentDriveBackup(uid, () => exportAllLocalData(uid)).catch(() => {});
    }
  }

  async function register(form: { name: string; email: string; phone?: string; password: string }) {
    const res = await fetch(`/api/auth/register`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json() as { success?: boolean; error?: string; user?: UserInfo };
    if (!res.ok) throw new Error(data.error ?? "Registration failed");
    setUser(data.user!);
    setIsGuest(false);
    sessionStorage.removeItem("cf_guest");
  }

  async function logout() {
    await fetch(`/api/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null); setIsGuest(false);
    sessionStorage.removeItem("cf_guest");
  }

  function enterAsGuest() { sessionStorage.setItem("cf_guest", "1"); setIsGuest(true); setUser(null); }
  function exitGuest() { sessionStorage.removeItem("cf_guest"); setIsGuest(false); }

  return (
    <AuthContext.Provider value={{ user, isGuest, isLoading, login, logout, enterAsGuest, exitGuest, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
