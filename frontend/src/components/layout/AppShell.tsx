"use client";



import type { ReactNode } from "react";

import { useEffect, useRef } from "react";

import { usePathname, useRouter } from "next/navigation";



import { useAuth } from "../../context/AuthContext";

import { useTheme } from "../../context/ThemeContext";

import { applyThemeToElement } from "../../lib/theme/theme";

import { CodeAnimatedBackground } from "../background/CodeAnimatedBackground";

import { AppNav } from "./AppNav";



interface AppShellProps {

  children: ReactNode;

}



export function AppShell({ children }: AppShellProps) {

  const { isAuthenticated, loading } = useAuth();

  const { theme } = useTheme();

  const router = useRouter();

  const pathname = usePathname();

  const scopeRef = useRef<HTMLDivElement>(null);



  useEffect(() => {

    if (!loading && !isAuthenticated) {

      router.replace(`/connexion?redirect=${encodeURIComponent(pathname)}`);

    }

  }, [loading, isAuthenticated, router, pathname]);



  useEffect(() => {

    if (scopeRef.current) {

      applyThemeToElement(scopeRef.current, theme);

    }

  }, [theme, loading, isAuthenticated]);



  if (loading) {

    return (

      <div

        ref={scopeRef}

        className="hubhex-app-theme relative flex min-h-screen items-center justify-center bg-slate-950 text-slate-400"

      >

        <CodeAnimatedBackground subdued />

        <p className="relative z-10 font-display text-sm">Chargement...</p>

      </div>

    );

  }



  if (!isAuthenticated) {

    return null;

  }



  return (

    <div ref={scopeRef} className="hubhex-app-theme relative isolate min-h-screen text-slate-100">

      <CodeAnimatedBackground subdued />

      <div className="relative z-10 flex min-h-screen flex-col">

        <AppNav />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">{children}</main>

        <footer className="relative z-10 border-t border-slate-700/50 bg-slate-950/40 px-4 py-6 text-center text-sm text-slate-500 backdrop-blur-sm md:px-8">

          <p className="font-display">HubHex — ton espace developpeur</p>

        </footer>

      </div>

    </div>

  );

}


