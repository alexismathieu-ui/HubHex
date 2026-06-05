import Link from "next/link";

import { HubHexLogo } from "./HubHexLogo";

interface PublicSiteNavProps {
  active?: "home" | "faq" | "contact";
}

export function PublicSiteNav({ active }: PublicSiteNavProps) {
  const linkClass = (key: PublicSiteNavProps["active"]) =>
    `rounded-md px-2.5 py-1 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-cyan-400 ${
      active === key
        ? "text-cyan-200"
        : "text-slate-400 hover:text-cyan-200"
    }`;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-700/50 bg-slate-950/60 backdrop-blur-md">
      <div className="mx-auto flex min-h-[4rem] max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 md:px-8 md:py-3.5">
        <HubHexLogo href="/" size={48} className="shrink-0" />
        <nav
          className="flex flex-wrap items-center justify-end gap-1.5 text-sm font-display"
          aria-label="Navigation principale"
        >
          <Link href="/faq" className={linkClass("faq")}>
            FAQ
          </Link>
          <Link href="/contact" className={linkClass("contact")}>
            Contact
          </Link>
          <Link href="/connexion" className={linkClass(undefined)}>
            Connexion
          </Link>
          <Link
            href="/inscription"
            className="rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-cyan-400 hover:shadow-cyan-400/40 focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Commencer
          </Link>
        </nav>
      </div>
    </header>
  );
}
