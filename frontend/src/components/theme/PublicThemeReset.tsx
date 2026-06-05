"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { resetPublicTheme } from "../../lib/theme/theme";

const PUBLIC_PATH_PREFIXES = ["/connexion", "/inscription"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Remet le cyan classique sur :root hors espace connecte (app). */
export function PublicThemeReset() {
  const pathname = usePathname();

  useEffect(() => {
    resetPublicTheme();
  }, []);

  useEffect(() => {
    if (isPublicPath(pathname)) {
      resetPublicTheme();
    }
  }, [pathname]);

  return null;
}
