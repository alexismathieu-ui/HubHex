import Link from "next/link";

export function PublicMarketingFooter() {
  return (
    <footer className="border-t border-slate-700/50 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-500 backdrop-blur-sm md:px-8">
      <p className="font-display">HubHex — gestion et partage de projets developpeur</p>
      <p className="mt-2 font-mono text-xs">
        <Link
          href="/faq"
          prefetch
          className="text-cyan-400 transition hover:-translate-y-px hover:text-cyan-300"
        >
          FAQ
        </Link>
        <span className="mx-2 text-slate-700">·</span>
        <Link
          href="/contact"
          prefetch
          className="text-cyan-400 transition hover:-translate-y-px hover:text-cyan-300"
        >
          Contact
        </Link>
        <span className="mx-2 text-slate-700">·</span>
        <Link
          href="/inscription"
          prefetch
          className="text-cyan-400 transition hover:-translate-y-px hover:text-cyan-300"
        >
          Inscription
        </Link>
        <span className="mx-2 text-slate-700">·</span>
        <Link
          href="/connexion"
          prefetch
          className="text-cyan-400 transition hover:-translate-y-px hover:text-cyan-300"
        >
          Connexion
        </Link>
      </p>
    </footer>
  );
}
