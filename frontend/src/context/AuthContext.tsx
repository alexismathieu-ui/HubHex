"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { API_BASE_URL } from "../lib/apiBaseUrl";
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from "../lib/auth/constants";
import { registerAccessTokenRefresh } from "../lib/auth/tokenRefresh";
import { fetchWithTimeout } from "../lib/fetchWithTimeout";
import { formatApiError } from "../lib/formatApiError";
import { readApiJson } from "../lib/readApiJson";
import type { AuthContextValue, AuthProviderProps } from "../types/auth";
import type { ApiErrorBody, AuthLoginResponse, AuthMeResponse, User } from "../types/hubhex";

const AuthContext = createContext<AuthContextValue | null>(null);

function persistSession(accessToken: string, refreshToken: string | null) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

function clearPersistedSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const applySession = useCallback((session: AuthLoginResponse) => {
    persistSession(session.token, session.refreshToken ?? null);
    setToken(session.token);
    setCurrentUser(session.user);
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefresh) {
      return null;
    }

    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefresh }),
      });
      const data = (await response.json()) as AuthLoginResponse & ApiErrorBody;
      if (!response.ok) {
        clearPersistedSession();
        setToken("");
        setCurrentUser(null);
        return null;
      }
      applySession(data);
      return data.token;
    } catch {
      return null;
    }
  }, [applySession]);

  useEffect(() => {
    registerAccessTokenRefresh(refreshAccessToken);
  }, [refreshAccessToken]);

  /** Renouvellement proactif avant expiration du JWT (defaut 15 min). */
  useEffect(() => {
    if (!token || !localStorage.getItem(REFRESH_TOKEN_KEY)) {
      return;
    }
    const intervalMs = 14 * 60 * 1000;
    const id = setInterval(() => {
      void refreshAccessToken();
    }, intervalMs);
    return () => clearInterval(id);
  }, [token, refreshAccessToken]);

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
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return fetchMe(refreshed);
      }
      throw new Error(formatApiError(data as ApiErrorBody) || "Session invalide.");
    }
    if (!ok) {
      throw new Error(formatApiError(data as ApiErrorBody) || "Session invalide.");
    }
    setCurrentUser(data.user);
    return data.user;
  }, [refreshAccessToken]);

  const refreshUser = useCallback(async () => {
    if (!tokenRef.current) {
      setCurrentUser(null);
      return null;
    }
    try {
      return await fetchMe(tokenRef.current);
    } catch {
      clearPersistedSession();
      setToken("");
      setCurrentUser(null);
      return null;
    }
  }, [fetchMe]);

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
          clearPersistedSession();
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

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as AuthLoginResponse & ApiErrorBody;
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur de connexion.");
      }
      applySession(data);
      return data;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      await fetchWithTimeout(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          storedRefresh ? { refreshToken: storedRefresh } : {},
        ),
      });
    } catch {
      /* deconnexion locale meme si l'API est injoignable */
    }
    clearPersistedSession();
    setToken("");
    setCurrentUser(null);
  }, []);

  const setSession = useCallback((newToken: string, user: User, refreshToken?: string) => {
    if (newToken) {
      persistSession(newToken, refreshToken ?? localStorage.getItem(REFRESH_TOKEN_KEY));
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
