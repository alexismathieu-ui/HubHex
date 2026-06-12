"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { getDisplayName } from "../../lib/auth/userDisplay";
import { UserAvatar } from "../profile/UserAvatar";
import { AppButton } from "../ui/AppButton";
import { BurgerButton } from "./BurgerButton";
import { HubHexLogo } from "./HubHexLogo";
import { MobileNavDrawer } from "./MobileNavDrawer";

const NAV_ITEMS = [
  { href: "/tableau-de-bord", label: "Tableau de bord" },
  { href: "/depots", label: "Mes depots" },
  { href: "/graphe", label: "Graphe" },
  { href: "/communaute", label: "Communaute" },
  { href: "/profil", label: "Mon profil" },
];

const drawerLinkClass =
  "rounded-lg px-4 py-3 font-display text-base transition hover:bg-slate-800/80 hover:text-cyan-200";

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const onLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.push("/");
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const linkClass = (href: string) =>
    `${drawerLinkClass} ${
      isActive(href) ? "bg-[color:var(--hubhex-accent-muted)] font-medium text-accent" : "text-slate-300"
    }`;

  return (
    <header className="sticky top-0 z-20 border-b border-slate-700/50 bg-slate-950/60 backdrop-blur-md">
      <div className="mx-auto flex min-h-[4rem] max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <HubHexLogo href="/tableau-de-bord" size={48} className="shrink-0" />
          <nav
            className="hidden items-center gap-1 text-sm font-display lg:flex"
            aria-label="Navigation principale"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[color:var(--hubhex-accent)] ${
                  isActive(item.href)
                    ? "bg-[color:var(--hubhex-accent-muted)] font-medium text-accent"
                    : "text-slate-400 hover:-translate-y-0.5 hover:bg-slate-900/80 hover:text-slate-200"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser ? (
            <>
              <Link
                href="/profil"
                className="hidden items-center gap-2 rounded-md px-2 py-1 text-slate-400 transition-all duration-300 hover:bg-slate-900/80 hover:text-accent sm:inline-flex"
              >
                <UserAvatar user={currentUser} size="sm" />
                <span className="max-w-[140px] truncate font-display">
                  {getDisplayName(currentUser)}
                </span>
              </Link>
              <AppButton
                variant="ghost"
                onClick={onLogout}
                className="hidden px-3 py-1.5 sm:inline-flex"
              >
                Deconnexion
              </AppButton>
            </>
          ) : (
            <Link
              href="/connexion"
              className="hidden rounded-lg bg-accent px-3 py-1.5 font-display font-semibold text-[color:var(--hubhex-accent-on)] hover:bg-[color:var(--hubhex-accent-hover)] sm:inline-flex"
            >
              Connexion
            </Link>
          )}
          <BurgerButton open={menuOpen} onClick={() => setMenuOpen((value) => !value)} className="lg:hidden" />
        </div>
      </div>

      <MobileNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Navigation">
        {currentUser ? (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3">
            <UserAvatar user={currentUser} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-medium text-slate-100">
                {getDisplayName(currentUser)}
              </p>
              <p className="truncate font-mono text-xs text-slate-500">@{currentUser.username}</p>
            </div>
          </div>
        ) : null}

        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={linkClass(item.href)}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}

        <div className="mt-auto border-t border-slate-700/50 pt-4">
          {currentUser ? (
            <button
              type="button"
              className={`${drawerLinkClass} w-full text-left text-slate-400`}
              onClick={onLogout}
            >
              Deconnexion
            </button>
          ) : (
            <Link
              href="/connexion"
              className="block rounded-lg bg-accent px-4 py-3 text-center font-display font-semibold text-[color:var(--hubhex-accent-on)]"
              onClick={() => setMenuOpen(false)}
            >
              Connexion
            </Link>
          )}
        </div>
      </MobileNavDrawer>
    </header>
  );
}
