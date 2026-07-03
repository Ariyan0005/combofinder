import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type User = {
  name: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/auth/me`, { credentials: "include" })
      .then(r => r.json())
      .then((data: { authenticated: boolean; username?: string }) => {
        if (data.authenticated) {
          const stored = sessionStorage.getItem("cf_user");
          setUser(stored ? JSON.parse(stored) : { name: "Admin", role: "Technician" });
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(username: string, password: string) {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json() as { error: string };
      throw new Error(data.error ?? "Invalid username or password");
    }
    const u: User = { name: username, role: "Technician" };
    sessionStorage.setItem("cf_user", JSON.stringify(u));
    setUser(u);
  }

  async function logout() {
    await fetch(`${BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
    sessionStorage.removeItem("cf_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
