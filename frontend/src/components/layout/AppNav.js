"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "../../context/AuthContext";
import { getDisplayName } from "../../lib/auth/userDisplay";
import { UserAvatar } from "../profile/UserAvatar";

const NAV_ITEMS = [
  { href: "/tableau-de-bord", label: "Tableau de bord" },
  { href: "/depots", label: "Mes depots" },
  { href: "/communaute", label: "Communaute" },
  { href: "/profil", label: "Mon profil" },
];

export function AppNav() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <div className="flex items-center gap-6">
          <Link href="/tableau-de-bord" className="text-lg font-bold text-cyan-300 hover:text-cyan-200">
            HubHex
          </Link>
          <nav className="flex flex-wrap gap-1">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 text-sm transition ${
                    active
                      ? "bg-cyan-950/60 font-medium text-cyan-200"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
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
                className="hidden items-center gap-2 rounded-md px-2 py-1 text-slate-400 hover:bg-slate-900 hover:text-violet-200 sm:inline-flex"
              >
                <UserAvatar user={currentUser} size="sm" />
                <span className="max-w-[140px] truncate">{getDisplayName(currentUser)}</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-slate-300 hover:border-slate-500"
              >
                Deconnexion
              </button>
            </>
          ) : (
            <Link
              href="/connexion"
              className="rounded-md bg-cyan-600 px-3 py-1.5 font-medium text-white hover:bg-cyan-500"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
