"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { API_BASE_URL } from "../lib/apiBaseUrl";
import { TOKEN_KEY } from "../lib/auth/constants";
import { formatApiError } from "../lib/formatApiError";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (authToken) => {
    if (!authToken) {
      setCurrentUser(null);
      return null;
    }
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(formatApiError(data) || "Session invalide.");
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
    fetchMe(saved)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setCurrentUser(null);
      })
      .finally(() => setLoading(false));
  }, [fetchMe]);

  const login = useCallback(
    async (email, password) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data) || "Erreur de connexion.");
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      return data;
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setCurrentUser(null);
  }, []);

  const setSession = useCallback((newToken, user) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
    }
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const value = useMemo(
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit etre utilise dans AuthProvider.");
  }
  return context;
}
