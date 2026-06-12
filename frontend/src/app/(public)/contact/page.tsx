import Link from "next/link";

import { PublicMarketingFooter } from "../../../components/layout/PublicMarketingFooter";

const RESOURCES = [
  { href: "/faq", label: "FAQ — questions frequentes" },
  { href: "/inscription", label: "Creer un compte gratuit" },
  { href: "/connexion", label: "Se connecter" },
] as const;

export default function ContactPage() {
  return (
    <>
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
            <section className="hubhex-public-fade-in group rounded-xl border border-slate-700/50 bg-slate-900/55 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-600/40 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-cyan-500/10">
              <h2 className="font-display text-lg font-semibold text-slate-100 transition-colors group-hover:text-cyan-50">
                Support projet
              </h2>
              <p className="mt-2 text-sm text-slate-400 transition-colors group-hover:text-slate-300">
                Pour un retour technique, un bug ou une question sur la soutenance, ecrivez a
                l&apos;equipe HubHex.
              </p>
              <a
                href="mailto:alexis.mathieupro45170@gmail.com"
                className="mt-4 inline-flex rounded-lg bg-cyan-500/15 px-4 py-2.5 font-mono text-sm text-cyan-300 ring-1 ring-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-500/25 hover:text-cyan-200 hover:shadow-md hover:shadow-cyan-500/20 hover:ring-cyan-400/40"
              >
                alexis.mathieupro45170@gmail.com
              </a>
            </section>

            <section
              className="hubhex-public-fade-in rounded-xl border border-cyan-800/30 bg-gradient-to-br from-cyan-950/40 to-slate-900/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-600/45 hover:shadow-lg hover:shadow-cyan-900/25"
              style={{ animationDelay: "80ms" }}
            >
              <h2 className="font-display text-lg font-semibold text-cyan-100">Ressources utiles</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {RESOURCES.map((resource) => (
                  <li key={resource.href}>
                    <Link
                      href={resource.href}
                      prefetch
                      className="group/link inline-flex items-center gap-2 text-cyan-400 transition-all duration-300 hover:translate-x-1 hover:text-cyan-300"
                    >
                      <span className="opacity-0 transition-opacity group-hover/link:opacity-100" aria-hidden>
                        →
                      </span>
                      {resource.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
      <PublicMarketingFooter />
    </>
  );
}
