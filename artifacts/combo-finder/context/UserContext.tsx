import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type BusinessType = "mobile_repair" | "general_store";

export interface AppUser {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  plan?: string;
  currency?: string;
  shopName?: string;
  businessType: BusinessType;
}

interface UserContextValue {
  user: AppUser;
  loading: boolean;
  setUser: (u: AppUser) => void;
  refreshUser: () => Promise<void>;
}

const DEFAULT_USER: AppUser = { businessType: "mobile_repair" };
const STORAGE_KEY = "@user_business_type";

const UserContext = createContext<UserContextValue>({
  user: DEFAULT_USER,
  loading: true,
  setUser: () => {},
  refreshUser: async () => {},
});

const domain = process.env.EXPO_PUBLIC_DOMAIN;
const baseUrl = domain ? `https://${domain}` : "";

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AppUser>(DEFAULT_USER);
  const [loading, setLoading] = useState(true);

  const setUser = (u: AppUser) => {
    setUserState(u);
    AsyncStorage.setItem(STORAGE_KEY, u.businessType).catch(() => {});
  };

  const refreshUser = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/auth/me`, { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as { authenticated: boolean; user?: any };
        if (data.authenticated && data.user) {
          const bt: BusinessType =
            data.user.businessType === "general_store" ? "general_store" : "mobile_repair";
          const u: AppUser = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            plan: data.user.plan,
            currency: data.user.currency,
            shopName: data.user.shopName,
            businessType: bt,
          };
          setUserState(u);
          await AsyncStorage.setItem(STORAGE_KEY, bt);
          return;
        }
      }
    } catch {}
    // Fall back to cached value from AsyncStorage
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached === "general_store" || cached === "mobile_repair") {
        setUserState((prev) => ({ ...prev, businessType: cached as BusinessType }));
      }
    } catch {}
  };

  useEffect(() => {
    (async () => {
      // First load cached value for instant render
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached === "general_store" || cached === "mobile_repair") {
          setUserState((prev) => ({ ...prev, businessType: cached as BusinessType }));
        }
      } catch {}
      // Then try to sync from API
      await refreshUser();
      setLoading(false);
    })();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, setUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
