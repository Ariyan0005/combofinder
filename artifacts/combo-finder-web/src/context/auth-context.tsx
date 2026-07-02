import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type User = {
  id: string;
  name: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulated fetch for /api/auth/me as requested
    const checkAuth = async () => {
      try {
        // Fallback mock since endpoints might not exist yet during UI dev
        setUser({ id: "1", name: "Abu Mahara", role: "Technician" });
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = () => {
    setUser({ id: "1", name: "Abu Mahara", role: "Technician" });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}