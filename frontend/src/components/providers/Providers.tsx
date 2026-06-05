"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "../../context/AuthContext";
import { ThemeProvider } from "../../context/ThemeContext";
import { PublicThemeReset } from "../theme/PublicThemeReset";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PublicThemeReset />
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}
