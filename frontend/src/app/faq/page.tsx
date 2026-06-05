import Link from "next/link";

import { PublicPageShell } from "../../components/layout/PublicPageShell";
import { PublicSiteNav } from "../../components/layout/PublicSiteNav";

const FAQ_ITEMS = [
  {
    question: "HubHex remplace-t-il GitHub ?",
    answer:
      "Non. HubHex heberge vos depots et fichiers sur la plateforme pour organiser vos projets de soutenance ou personnels, avec Kanban, notes et communaute integres.",
  },
  {
    question: "Faut-il un compte pour explorer la plateforme ?",
    answer:
      "L'accueil est public. L'inscription est gratuite et prend environ 30 secondes pour acceder au tableau de bord, creer un depot et publier en communaute.",
  },
  {
    question: "Mes depots peuvent-ils rester prives ?",
    answer:
      "Oui. Chaque depot peut etre prive ou public. Seuls les depots publics apparaissent dans la communaute et acceptent les commentaires.",
  },
  {
    question: "Qu'est-ce que la stack vivante et le graphe ?",
    answer:
      "La stack documente vos technos avec statut et liens. Le graphe relie vos depots entre eux pour visualiser la capitalisation technique entre projets.",
  },
  {
    question: "Comment securiser mon compte ?",
    answer:
      "Utilisez un mot de passe robuste (majuscule, minuscule, chiffre, symbole). Les sessions utilisent un JWT court et un refresh token renouvele automatiquement.",
  },
] as const;

export default function FaqPage() {
  return (
    <PublicPageShell>
      <PublicSiteNav active="faq" />
      <main className="px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-sm uppercase tracking-wider text-cyan-400/90">// aide</p>
          <h1 className="font-display mt-2 text-3xl font-bold text-slate-50 md:text-4xl">
            Questions frequentes
          </h1>
          <p className="mt-4 text-slate-400">
            Tout ce qu&apos;il faut savoir avant de creer votre premier depot sur HubHex.
          </p>

          <ul className="mt-10 space-y-4">
            {FAQ_ITEMS.map((item) => (
              <li
                key={item.question}
                className="rounded-xl border border-slate-700/50 bg-slate-900/55 p-5 backdrop-blur-sm"
              >
                <h2 className="font-display text-lg font-semibold text-slate-100">{item.question}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.answer}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/inscription"
              className="rounded-lg bg-cyan-500 px-5 py-2.5 font-display font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Creer un compte
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-slate-600/80 px-5 py-2.5 font-display font-semibold text-slate-200 transition hover:border-cyan-600/50"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </main>
    </PublicPageShell>
  );
}
