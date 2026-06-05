import Link from "next/link";

import { PublicPageShell } from "../../components/layout/PublicPageShell";
import { PublicSiteNav } from "../../components/layout/PublicSiteNav";

export default function ContactPage() {
  return (
    <PublicPageShell>
      <PublicSiteNav active="contact" />
      <main className="px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-sm uppercase tracking-wider text-cyan-400/90">// contact</p>
          <h1 className="font-display mt-2 text-3xl font-bold text-slate-50 md:text-4xl">
            Une question sur HubHex ?
          </h1>
          <p className="mt-4 text-slate-400">
            Retrouvez les reponses courantes dans la FAQ ou contactez l&apos;equipe du projet.
          </p>

          <div className="mt-10 space-y-6">
            <section className="rounded-xl border border-slate-700/50 bg-slate-900/55 p-6 backdrop-blur-sm">
              <h2 className="font-display text-lg font-semibold text-slate-100">Support projet</h2>
              <p className="mt-2 text-sm text-slate-400">
                Pour un retour technique, un bug ou une question sur la soutenance, ecrivez a
                l&apos;equipe HubHex.
              </p>
              <a
                href="mailto:contact@hubhex.dev"
                className="mt-4 inline-flex rounded-lg bg-cyan-500/15 px-4 py-2 font-mono text-sm text-cyan-300 transition hover:bg-cyan-500/25"
              >
                contact@hubhex.dev
              </a>
            </section>

            <section className="rounded-xl border border-cyan-800/30 bg-gradient-to-br from-cyan-950/40 to-slate-900/60 p-6">
              <h2 className="font-display text-lg font-semibold text-cyan-100">Ressources utiles</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>
                  <Link href="/faq" className="text-cyan-400 hover:text-cyan-300">
                    FAQ — questions frequentes
                  </Link>
                </li>
                <li>
                  <Link href="/inscription" className="text-cyan-400 hover:text-cyan-300">
                    Creer un compte gratuit
                  </Link>
                </li>
                <li>
                  <Link href="/connexion" className="text-cyan-400 hover:text-cyan-300">
                    Se connecter
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </PublicPageShell>
  );
}
