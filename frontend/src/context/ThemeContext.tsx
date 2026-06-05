"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_THEME,
  loadStoredTheme,
  normalizeTheme,
  saveStoredTheme,
  type HubHexThemeSettings,
} from "../lib/theme/theme";
import { useAuth } from "./AuthContext";

interface ThemeContextValue {
  theme: HubHexThemeSettings;
  setTheme: (settings: HubHexThemeSettings) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [theme, setThemeState] = useState<HubHexThemeSettings>(DEFAULT_THEME);

  useEffect(() => {
    setThemeState(normalizeTheme(loadStoredTheme(currentUser?.id)));
  }, [currentUser?.id]);

  const setTheme = useCallback(
    (settings: HubHexThemeSettings) => {
      const normalized = normalizeTheme(settings);
      setThemeState(normalized);
      if (currentUser?.id != null) {
        saveStoredTheme(normalized, currentUser.id);
      }
    },
    [currentUser?.id],
  );

  const resetTheme = useCallback(() => {
    setTheme(DEFAULT_THEME);
  }, [setTheme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resetTheme,
    }),
    [theme, setTheme, resetTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
