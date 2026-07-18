import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { exportAllLocalData } from "@/lib/local-store";

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


  // Silent auto-backup: runs once per 24 h after login, no email sent
  async function silentAutoBackup(userId: number, plan: string) {
    if (plan === "Pro") return; // Pro users have server data — no local backup needed
    const key = `cf_last_backup_${userId}`;
    const last = localStorage.getItem(key);
    if (last && Date.now() - Number(last) < 24 * 60 * 60 * 1000) return; // within 24 h
    try {
      const data = exportAllLocalData(userId);
      const res = await fetch(`/api/backup/save?auto=1`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (res.ok) localStorage.setItem(key, String(Date.now()));
    } catch {}
  }

  async function fetchMe() {
    const r = await fetch(`/api/auth/me`, { credentials: "include" });
    const data = await r.json() as { authenticated: boolean; user?: UserInfo };
    if (data.authenticated && data.user) {
      setUser(data.user);
      if (data.user.id && data.user.plan !== "Pro") {
        silentAutoBackup(data.user.id, data.user.plan ?? "Free").catch(() => {});
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
      silentAutoBackup(data.user.id, data.user.plan ?? "Free").catch(() => {});
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
