import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { exportAllLocalData } from "@/lib/local-store";
import { silentDriveBackup } from "@/lib/google-drive";

export type UserInfo = {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  plan?: string;
  businessType?: "mobile_repair" | "general_store";
  currency?: string;
  shopName?: string;
  shopAddress?: string;
  shopLogo?: string;
  isStaff?: boolean;
  isManager?: boolean;
  staffId?: number;
  branchId?: string;
  branchName?: string;
};

type AuthContextType = {
  user: UserInfo | null;
  isGuest: boolean;
  guestMode: "mobile_repair" | "general_store";
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithGoogle: (userData?: UserInfo) => Promise<void>;
  logout: () => Promise<void>;
  enterAsGuest: (mode?: "mobile_repair" | "general_store") => void;
  exitGuest: () => void;
  register: (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    businessType?: "mobile_repair" | "general_store";
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function applyBusinessTheme(user: UserInfo | null, guestMode?: "mobile_repair" | "general_store") {
  if (typeof document === "undefined") return;
  const isGeneralStore = user ? user.businessType === "general_store" : guestMode === "general_store";
  if (isGeneralStore) {
    document.documentElement.dataset.businessType = "general_store";
  } else {
    delete document.documentElement.dataset.businessType;
  }
}

// Subscription values have historically been stored with inconsistent casing
// for some users. Keep the UI's plan checks reliable without requiring a data
// migration just to render the correct account data.
function normalizeUser(user: UserInfo): UserInfo {
  const plan = user.plan?.trim();
  return {
    ...user,
    plan: plan?.toLowerCase() === "pro" ? "Pro" : plan,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [guestMode, setGuestMode] = useState<"mobile_repair" | "general_store">("mobile_repair");
  const [isLoading, setIsLoading] = useState(true);

  async function fetchMe() {
    const r = await fetch(`/api/auth/me`, { credentials: "include" });
    const data = await r.json() as { authenticated: boolean; user?: UserInfo };
    if (data.authenticated && data.user) {
      const normalizedUser = normalizeUser(data.user);
      setUser(normalizedUser);
      applyBusinessTheme(normalizedUser);
      // Free users: auto-backup to Google Drive (silent — only if already connected)
      if (normalizedUser.id && normalizedUser.plan !== "Pro") {
        const uid = normalizedUser.id;
        silentDriveBackup(uid, () => exportAllLocalData(uid)).catch(() => {});
      }
    } else {
      setUser(null);
      applyBusinessTheme(null);
    }
  }

  useEffect(() => {
    const guestFlag = sessionStorage.getItem("cf_guest");
    if (guestFlag === "1") {
      const mode = (sessionStorage.getItem("cf_guest_mode") as "mobile_repair" | "general_store") || "mobile_repair";
      setGuestMode(mode);
      setUser(null);
      setIsGuest(true);
      applyBusinessTheme(null, mode);
      setIsLoading(false);
      return;
    }
    fetchMe().catch(() => setUser(null)).finally(() => setIsLoading(false));
  }, []);

  async function refreshUser() {
    try { await fetchMe(); } catch {}
  }

  async function login(identifier: string, password: string, branchId?: string) {
    const res = await fetch(`/api/auth/login`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: identifier, email: identifier, password, branchId }),
    });
    const data = await res.json() as { success?: boolean; error?: string; user?: UserInfo };
    if (!res.ok) throw new Error(data.error ?? "Invalid credentials");
    const normalizedUser = normalizeUser(data.user!);
    setUser(normalizedUser);
    applyBusinessTheme(normalizedUser);
    setIsGuest(false);
    sessionStorage.removeItem("cf_guest");
    sessionStorage.removeItem("cf_guest_mode");
    const effectiveBranch = branchId || normalizedUser.branchId;
    if (effectiveBranch) {
      localStorage.setItem("poscert-active-branch", effectiveBranch);
    }
    if (normalizedUser.id && normalizedUser.plan !== "Pro") {
      const uid = normalizedUser.id;
      silentDriveBackup(uid, () => exportAllLocalData(uid)).catch(() => {});
    }
  }

  async function loginWithGoogle(userData?: UserInfo) {
    if (userData) {
      const normalizedUser = normalizeUser(userData);
      setUser(normalizedUser);
      applyBusinessTheme(normalizedUser);
      setIsGuest(false);
      sessionStorage.removeItem("cf_guest");
      sessionStorage.removeItem("cf_guest_mode");
      if (normalizedUser.id && normalizedUser.plan !== "Pro") {
        const uid = normalizedUser.id;
        silentDriveBackup(uid, () => exportAllLocalData(uid)).catch(() => {});
      }
    } else {
      await fetchMe();
    }
  }

  async function register(form: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    businessType?: "mobile_repair" | "general_store";
  }) {
    const res = await fetch(`/api/auth/register`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json() as { success?: boolean; error?: string; user?: UserInfo };
    if (!res.ok) throw new Error(data.error ?? "Registration failed");
    const normalizedUser = normalizeUser(data.user!);
    setUser(normalizedUser);
    applyBusinessTheme(normalizedUser);
    setIsGuest(false);
    sessionStorage.removeItem("cf_guest");
    sessionStorage.removeItem("cf_guest_mode");
  }

  async function logout() {
    await fetch(`/api/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null); setIsGuest(false);
    applyBusinessTheme(null);
    sessionStorage.removeItem("cf_guest");
    sessionStorage.removeItem("cf_guest_mode");
  }

  function enterAsGuest(mode: "mobile_repair" | "general_store" = "mobile_repair") {
    sessionStorage.setItem("cf_guest", "1");
    sessionStorage.setItem("cf_guest_mode", mode);
    setIsGuest(true);
    setGuestMode(mode);
    setUser(null);
    applyBusinessTheme(null, mode);
  }

  function exitGuest() {
    sessionStorage.removeItem("cf_guest");
    sessionStorage.removeItem("cf_guest_mode");
    setIsGuest(false);
    setUser(null);
    applyBusinessTheme(null);
  }

  return (
    <AuthContext.Provider value={{ user, isGuest, guestMode, isLoading, login, loginWithGoogle, logout, enterAsGuest, exitGuest, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
