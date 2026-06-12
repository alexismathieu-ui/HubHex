"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { BurgerButton } from "./BurgerButton";
import { HubHexLogo } from "./HubHexLogo";
import { MobileNavDrawer } from "./MobileNavDrawer";

function resolveActive(pathname: string): "home" | "faq" | "contact" | undefined {
  if (pathname === "/") {
    return "home";
  }
  if (pathname === "/faq" || pathname.startsWith("/faq/")) {
    return "faq";
  }
  if (pathname === "/contact" || pathname.startsWith("/contact/")) {
    return "contact";
  }
  return undefined;
}

const drawerLinkClass =
  "rounded-lg px-4 py-3 font-display text-base transition hover:bg-slate-800/80 hover:text-cyan-200";

export function PublicSiteNav() {
  const pathname = usePathname();
  const active = resolveActive(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (key: "home" | "faq" | "contact" | "connexion") =>
    `${drawerLinkClass} ${
      active === key ? "bg-cyan-950/40 font-medium text-cyan-200" : "text-slate-300"
    }`;

  const desktopLinkClass = (key: "home" | "faq" | "contact" | "connexion") =>
    `rounded-md px-2.5 py-1 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-cyan-400 ${
      active === key ? "text-cyan-200" : "text-slate-400 hover:text-cyan-200"
    }`;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-700/50 bg-slate-950/60 backdrop-blur-md">
      <div className="mx-auto flex min-h-[4rem] max-w-6xl items-center justify-between gap-x-3 px-4 py-3 md:px-8 md:py-3.5">
        <HubHexLogo href="/" size={48} className="shrink-0 transition-transform duration-300 hover:scale-[1.03]" />

        <nav
          className="hidden items-center gap-1.5 text-sm font-display md:flex"
          aria-label="Navigation principale"
        >
          <Link href="/faq" prefetch className={desktopLinkClass("faq")}>
            FAQ
          </Link>
          <Link href="/contact" prefetch className={desktopLinkClass("contact")}>
            Contact
          </Link>
          <Link href="/connexion" prefetch className={desktopLinkClass("connexion")}>
            Connexion
          </Link>
          <Link
            href="/inscription"
            prefetch
            className="rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-cyan-400 hover:shadow-cyan-400/40 focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Commencer
          </Link>
        </nav>

        <BurgerButton open={menuOpen} onClick={() => setMenuOpen((value) => !value)} className="md:hidden" />
      </div>

      <MobileNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} title="HubHex">
        <Link href="/" prefetch className={linkClass("home")} onClick={() => setMenuOpen(false)}>
          Accueil
        </Link>
        <Link href="/faq" prefetch className={linkClass("faq")} onClick={() => setMenuOpen(false)}>
          FAQ
        </Link>
        <Link href="/contact" prefetch className={linkClass("contact")} onClick={() => setMenuOpen(false)}>
          Contact
        </Link>
        <Link
          href="/connexion"
          prefetch
          className={linkClass("connexion")}
          onClick={() => setMenuOpen(false)}
        >
          Connexion
        </Link>
        <Link
          href="/inscription"
          prefetch
          className="mt-2 block rounded-lg bg-cyan-500 px-4 py-3 text-center font-display font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400"
          onClick={() => setMenuOpen(false)}
        >
          Commencer gratuitement
        </Link>
      </MobileNavDrawer>
    </header>
  );
}
