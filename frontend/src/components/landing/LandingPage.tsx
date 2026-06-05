import Link from "next/link";

import { PublicPageShell } from "../layout/PublicPageShell";
import { PublicSiteNav } from "../layout/PublicSiteNav";
import { IdlePageRefresh } from "./IdlePageRefresh";
import { KanbanPreviewWindow } from "./KanbanPreviewWindow";

const FEATURES = [
  {
    title: "Depots heberges",
    description:
      "Chaque projet vit sur HubHex avec son URL publique username/slug — fichiers, notes et parametres au meme endroit.",
    icon: "◈",
  },
  {
    title: "Kanban integre",
    description:
      "Colonnes A faire, En cours, Termine avec glisser-deposer pour suivre l'avancement sans outil externe.",
    icon: "▣",
  },
  {
    title: "Editeur de code",
    description:
      "Monaco dans le navigateur : coloration syntaxique, formatage et edition des fichiers de votre depot.",
    icon: "{ }",
  },
  {
    title: "Communaute dev",
    description:
      "Inspirez-vous des projets publics, echangez avec d'autres developpeurs et faites rayonner vos depots ouverts.",
    icon: "◎",
  },
  {
    title: "Stack & journal",
    description:
      "Documentez les technos (liens, statuts, snippets) et l'historique de vos decisions techniques.",
    icon: "▤",
  },
  {
    title: "Graphe HubHex",
    description:
      "Reliez vos depots entre eux pour visualiser la capitalisation et les liens entre projets.",
    icon: "⬡",
  },
] as const;

export function LandingPage() {
  return (
    <PublicPageShell>
      <IdlePageRefresh />
      <PublicSiteNav active="home" />

      <main>
        <section className="relative overflow-hidden border-b border-slate-700/40 px-4 py-20 md:px-8 md:py-28">
          <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-mono text-sm font-medium uppercase tracking-wider text-cyan-400/90">
                // plateforme developpeur
              </p>
              <h1 className="font-display mt-3 text-4xl font-bold leading-tight tracking-tight text-slate-50 md:text-5xl">
                Gerez, organisez et partagez vos projets au meme endroit
              </h1>
              <p className="mt-5 max-w-xl text-lg text-slate-300">
                HubHex combine gestion de depot, Kanban, editeur de fichiers et communaute —
                avec une stack documentee et un graphe qui relie vos projets dans le temps.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/inscription"
                  className="rounded-lg bg-cyan-500 px-6 py-3 font-display font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-cyan-400 hover:shadow-xl hover:shadow-cyan-400/35 focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  Creer un compte gratuit
                </Link>
                <Link
                  href="/connexion"
                  className="rounded-lg border border-slate-600/80 bg-slate-900/50 px-6 py-3 font-display font-semibold text-slate-200 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-600/50 hover:bg-slate-900/90 hover:shadow-lg hover:shadow-cyan-950/30 focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  Se connecter
                </Link>
              </div>
              <p className="mt-6 font-mono text-sm text-slate-500">
                pas de compte demo — inscription en 30 secondes
              </p>
            </div>

            <KanbanPreviewWindow />
          </div>
        </section>

        <section
          id="fonctionnalites"
          className="border-b border-slate-700/40 px-4 py-20 md:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-3xl font-bold text-slate-50">
              Tout pour vos projets dev
            </h2>
            <p className="mt-3 max-w-2xl text-slate-400">
              Fonctionnalites du cahier des charges et outils qui vont au-dela d&apos;un simple
              gestionnaire de taches.
            </p>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <li
                  key={feature.title}
                  className="group rounded-xl border border-slate-700/50 bg-slate-900/55 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-600/40 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <span
                    className="inline-block font-mono text-2xl text-cyan-400 transition-transform duration-300 group-hover:scale-110 group-hover:text-cyan-300"
                    aria-hidden
                  >
                    {feature.icon}
                  </span>
                  <h3 className="font-display mt-3 text-lg font-semibold text-slate-100">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {feature.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="differentiation"
          className="border-b border-slate-700/40 px-4 py-20 md:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl border border-cyan-800/40 bg-gradient-to-br from-cyan-950/50 to-slate-900/70 p-8 backdrop-blur-md transition-all duration-500 hover:border-cyan-600/50 hover:shadow-xl hover:shadow-cyan-900/20 md:p-12">
              <h2 className="font-display text-2xl font-bold text-cyan-100 md:text-3xl">
                Vos projets ne sont plus isoles
              </h2>
              <p className="mt-4 max-w-3xl text-slate-300">
                Templates pour demarrer vite, journal de decisions pour capitaliser, graphe pour
                voir les liens entre depots — HubHex est pense pour les developpeurs qui veulent
                garder une trace de leur progression technique.
              </p>
              <blockquote className="mt-6 border-l-2 border-cyan-500 pl-4 font-display text-lg italic text-slate-200">
                « Mes projets forment un reseau de savoir-faire, pas une liste de dossiers
                oublies. »
              </blockquote>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold text-slate-50">
              Pret a lancer votre premier depot ?
            </h2>
            <p className="mt-4 text-slate-400">
              Inscrivez-vous pour acceder au tableau de bord, creer un depot depuis un template et
              rejoindre la communaute.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/inscription"
                className="rounded-lg bg-cyan-500 px-8 py-3 font-display font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:bg-cyan-400 hover:shadow-xl hover:shadow-cyan-400/35 focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Creer un compte
              </Link>
              <Link
                href="/connexion?redirect=/communaute"
                className="rounded-lg border border-slate-600/80 bg-slate-900/50 px-8 py-3 font-display font-semibold text-slate-200 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-600/50 hover:bg-slate-900/90 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-700/50 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-500 backdrop-blur-sm md:px-8">
        <p className="font-display">HubHex — gestion et partage de projets developpeur</p>
        <p className="mt-2 font-mono text-xs">
          <Link href="/faq" className="text-cyan-400 hover:text-cyan-300">
            FAQ
          </Link>
          <span className="mx-2 text-slate-700">·</span>
          <Link href="/contact" className="text-cyan-400 hover:text-cyan-300">
            Contact
          </Link>
          <span className="mx-2 text-slate-700">·</span>
          <Link href="/inscription" className="text-cyan-400 hover:text-cyan-300">
            Inscription
          </Link>
          <span className="mx-2 text-slate-700">·</span>
          <Link href="/connexion" className="text-cyan-400 hover:text-cyan-300">
            Connexion
          </Link>
        </p>
      </footer>
    </PublicPageShell>
  );
}
