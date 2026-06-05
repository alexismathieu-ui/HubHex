"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "../../context/AuthContext";
import { getDisplayName } from "../../lib/auth/userDisplay";
import { UserAvatar } from "../profile/UserAvatar";
import { AppButton } from "../ui/AppButton";
import { HubHexLogo } from "./HubHexLogo";

const NAV_ITEMS = [
  { href: "/tableau-de-bord", label: "Tableau de bord" },
  { href: "/depots", label: "Mes depots" },
  { href: "/graphe", label: "Graphe" },
  { href: "/communaute", label: "Communaute" },
  { href: "/profil", label: "Mon profil" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  const onLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-700/50 bg-slate-950/60 backdrop-blur-md">
      <div className="mx-auto flex min-h-[4rem] max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <HubHexLogo href="/tableau-de-bord" size={48} className="shrink-0" />
          <nav
            className="flex flex-wrap items-center gap-1 text-sm font-display"
            aria-label="Navigation principale"
          >
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-3 py-1.5 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[color:var(--hubhex-accent)] ${
                    active
                      ? "bg-[color:var(--hubhex-accent-muted)] font-medium text-accent"
                      : "text-slate-400 hover:-translate-y-0.5 hover:bg-slate-900/80 hover:text-slate-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
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
              <AppButton variant="ghost" onClick={onLogout} className="px-3 py-1.5">
                Deconnexion
              </AppButton>
            </>
          ) : (
            <Link
              href="/connexion"
              className="rounded-lg bg-accent px-3 py-1.5 font-display font-semibold text-[color:var(--hubhex-accent-on)] hover:bg-[color:var(--hubhex-accent-hover)]"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
