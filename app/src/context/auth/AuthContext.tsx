import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { authApi, ApiError } from "@/api";
import type { AuthUser } from "@/api";
import type {
  AuthContextValue,
  AuthProviderProps,
  LoginCredentials,
} from "./types";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await authApi.verify();
      const nextUser = response.success ? (response.user ?? null) : null;
      setUser(nextUser);
      return Boolean(nextUser);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.code === "SESSION_EXPIRED") {
        toast.error(err.message || "Your session ended because you logged in from another browser or device.");
      }
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await authApi.login(credentials);
      if (!response.success) {
        throw new Error(response.message || "Login failed");
      }

      await refreshSession();
    },
    [refreshSession],
  );

  const loginAsTestUserWithGoogle = useCallback(
    async (idToken: string) => {
      const response = await authApi.loginAsTestUserWithGoogle(idToken);
      if (!response.success) {
        throw new Error(response.message || "Google login failed");
      }
      await refreshSession();
    },
    [refreshSession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue logout flow even if server-side logout request fails.
    } finally {
      setUser(null);
      window.location.href = "/";
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      loginAsTestUserWithGoogle,
      logout,
      refreshSession,
    }),
    [isLoading, login, loginAsTestUserWithGoogle, logout, refreshSession, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
