import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextValue {
  authenticated: boolean | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data: { authenticated: boolean; user?: { role?: string } }) => {
        // A session can be "authenticated" for a regular ComboFinder
        // technician account (the login endpoint is shared). Only
        // admin/superadmin roles may use the admin panel, otherwise the
        // shell renders as logged-in but every mutation 403s.
        const role = (data.user?.role ?? "").toLowerCase();
        const isAdmin = data.authenticated && (role === "admin" || role === "superadmin");
        setAuthenticated(isAdmin);
      })
      .catch(() => setAuthenticated(false));
  }, []);

  async function login(username: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json() as { error?: string; user?: { role?: string } };
    if (!res.ok) {
      throw new Error(data.error ?? "Login failed");
    }
    // The shared /api/auth/login endpoint also authenticates regular
    // ComboFinder technician accounts. Only admin/superadmin roles may
    // use the admin panel — otherwise every admin action would silently
    // 403 later even though "login" appeared to succeed.
    const role = (data.user?.role ?? "").toLowerCase();
    if (role !== "admin" && role !== "superadmin") {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      throw new Error("This account does not have admin access.");
    }
    setAuthenticated(true);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
