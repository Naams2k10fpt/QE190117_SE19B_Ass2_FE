"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { AccountDto } from "@/lib/types";
import { loadSession } from "@/lib/auth-client";
import { authApi } from "@/lib/api";
import { useToast } from "./ToastContext";

type AuthState = {
  account: AccountDto | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AccountDto | null>(null);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();
  useEffect(() => {
    loadSession().then(setAccount).catch((reason: unknown) => {
      error(reason instanceof Error ? reason.message : "Unable to verify the session.");
    }).finally(() => setLoading(false));
  }, [error]);
  const login = useCallback(async (email: string, password: string) => {
    setAccount(await authApi.login(email, password));
  }, []);
  const logout = useCallback(async () => {
    await authApi.logout();
    setAccount(null);
    window.location.assign("/");
  }, []);
  return <AuthContext.Provider value={{ account, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider is required.");
  return context;
}
