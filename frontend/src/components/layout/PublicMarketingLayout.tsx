"use client";

import type { ReactNode } from "react";

import { PublicPageShell } from "./PublicPageShell";
import { PublicSiteNav } from "./PublicSiteNav";

/** Shell persistant accueil / FAQ / contact — evite de remonter le fond anime a chaque navigation. */
export function PublicMarketingLayout({ children }: { children: ReactNode }) {
  return (
    <PublicPageShell>
      <PublicSiteNav />
      {children}
    </PublicPageShell>
  );
}
