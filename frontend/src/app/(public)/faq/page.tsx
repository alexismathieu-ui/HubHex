import Link from "next/link";

import { PublicMarketingFooter } from "../../../components/layout/PublicMarketingFooter";

const FAQ_ITEMS = [
  {
    question: "HubHex remplace-t-il GitHub ?",
    answer:
      "Non. HubHex heberge vos depots et fichiers sur la plateforme pour organiser vos projets de soutenance ou personnels, avec Kanban, notes et communaute integres.",
    icon: "◈",
  },
  {
    question: "Faut-il un compte pour explorer la plateforme ?",
    answer:
      "L'accueil est public. L'inscription est gratuite et prend environ 30 secondes pour acceder au tableau de bord, creer un depot et publier en communaute.",
    icon: "◎",
  },
  {
    question: "Mes depots peuvent-ils rester prives ?",
    answer:
      "Oui. Chaque depot peut etre prive ou public. Seuls les depots publics apparaissent dans la communaute et acceptent les commentaires.",
    icon: "▣",
  },
  {
    question: "A quoi sert l'onglet Maitrise et le graphe ?",
    answer:
      "L'onglet Maitrise reprend les memes technologies que les badges du depot : pour chacune, vous indiquez si elle est a venir, en cours ou maitrisee (lien doc et note optionnels). Le graphe relie vos depots entre eux pour visualiser la capitalisation entre projets.",
    icon: "⬡",
  },
  {
    question: "Comment securiser mon compte ?",
    answer:
      "Utilisez un mot de passe robuste (majuscule, minuscule, chiffre, symbole). Les sessions utilisent un JWT court et un refresh token renouvele automatiquement.",
    icon: "{ }",
  },
] as const;

export default function FaqPage() {
  return (
    <>
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
            {FAQ_ITEMS.map((item, index) => (
              <li
                key={item.question}
                className="hubhex-public-fade-in group rounded-xl border border-slate-700/50 bg-slate-900/55 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-600/45 hover:bg-slate-900/85 hover:shadow-lg hover:shadow-cyan-500/10"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 font-mono text-xl text-cyan-400 transition-transform duration-300 group-hover:scale-110 group-hover:text-cyan-300"
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-slate-100 transition-colors group-hover:text-cyan-50">
                      {item.question}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400 transition-colors group-hover:text-slate-300">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/inscription"
              prefetch
              className="rounded-lg bg-cyan-500 px-5 py-2.5 font-display font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-cyan-400 hover:shadow-cyan-400/35"
            >
              Creer un compte
            </Link>
            <Link
              href="/contact"
              prefetch
              className="rounded-lg border border-slate-600/80 bg-slate-900/50 px-5 py-2.5 font-display font-semibold text-slate-200 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-600/50 hover:bg-slate-900/90 hover:shadow-lg hover:shadow-cyan-950/30"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </main>
      <PublicMarketingFooter />
    </>
  );
}
