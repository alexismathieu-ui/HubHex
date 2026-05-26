"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { API_BASE_URL } from "../lib/apiBaseUrl";
import { TOKEN_KEY } from "../lib/auth/constants";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { formatApiError } from "../lib/formatApiError";
import { readApiJson } from "../lib/readApiJson";
import type { AuthContextValue, AuthProviderProps } from "../types/auth";
import type { ApiErrorBody, AuthLoginResponse, AuthMeResponse, User } from "../types/hubhex";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (authToken: string) => {
    if (!authToken) {
      setCurrentUser(null);
      return null;
    }
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const { data, ok } = await readApiJson<AuthMeResponse>(response, `${API_BASE_URL}/auth/me`);
    if (response.status === 429) {
      throw new Error(
        "Trop de requetes vers l'API. Redemarrez le backend (npm run dev) puis rafraichissez la page.",
      );
    }
    if (!ok) {
      throw new Error(formatApiError(data as ApiErrorBody) || "Session invalide.");
    }
    setCurrentUser(data.user);
    return data.user;
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setCurrentUser(null);
      return null;
    }
    try {
      return await fetchMe(token);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setToken("");
      setCurrentUser(null);
      return null;
    }
  }, [fetchMe, token]);

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY) || "";
    setToken(saved);
    if (!saved) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchMe(saved)
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setToken("");
          setCurrentUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    const safety = setTimeout(() => setLoading(false), 15_000);
    return () => {
      cancelled = true;
      clearTimeout(safety);
    };
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await response.json()) as AuthLoginResponse & { error?: { message?: string } };
    if (!response.ok) {
      throw new Error(formatApiError(data) || "Erreur de connexion.");
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setCurrentUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setCurrentUser(null);
  }, []);

  const setSession = useCallback((newToken: string, user: User) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
    }
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      currentUser,
      loading,
      isAuthenticated: Boolean(token && currentUser),
      login,
      logout,
      refreshUser,
      setSession,
    }),
    [token, currentUser, loading, login, logout, refreshUser, setSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit etre utilise dans AuthProvider.");
  }
  return context;
}
