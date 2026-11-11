import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import type { AdminUser } from "../api/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: AdminUser | null;
  csrfToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Drop local session state (e.g. after a 401 from any call). */
  expire: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Session-expiry bridge. The query/mutation caches live outside the React
 * tree (main.tsx); AuthProvider registers its `expire` here so any 401 from
 * a cached query or mutation also drops the local session and triggers the
 * redirect handled by AdminLayout.
 */
let unauthorizedHandler: (() => void) | null = null;

export function handleUnauthorized(): void {
  unauthorizedHandler?.();
}

function registerUnauthorizedHandler(fn: (() => void) | null): void {
  unauthorizedHandler = fn;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // Bootstrap: validate any existing session cookie and pull the CSRF token.
  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setCsrfToken(me.csrfToken);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("unauthenticated");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await authApi.login(email, password);
    const me = await authApi.me();
    setUser(me);
    setCsrfToken(me.csrfToken);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    if (csrfToken !== null) {
      await authApi.logout(csrfToken).catch(() => undefined);
    }
    setUser(null);
    setCsrfToken(null);
    setStatus("unauthenticated");
  }, [csrfToken]);

  const expire = useCallback(() => {
    setUser(null);
    setCsrfToken(null);
    setStatus("unauthenticated");
  }, []);

  // Expose expire to the query/mutation caches (see handleUnauthorized).
  useEffect(() => {
    registerUnauthorizedHandler(expire);
    return () => registerUnauthorizedHandler(null);
  }, [expire]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, csrfToken, login, logout, expire }),
    [status, user, csrfToken, login, logout, expire],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
