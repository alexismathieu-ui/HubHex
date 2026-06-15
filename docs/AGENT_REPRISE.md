# HubHex — Reprise agent

Document pour enchaîner dans un **nouveau chat Cursor** sans perdre le contexte soutenance CODA B1.

**Projet considéré finalisé côté code (juin 2026)** — reste surtout du manuel jury (PDF slides, tests sécurité cochés, push final si demandé).

---

## Micro-prompt (copier-coller en premier message)

```
Tu reprends HubHex (soutenance CODA B1). Lis d'abord :
1. docs/AGENT_REPRISE.md (ce fichier)
2. README.md
3. docs/CHECKLIST_JOUR_J.md

=== QU'EST-CE QUE HUBHEX ===
Plateforme web type mini-GitHub interne : dépôts hébergés sur HubHex (username/slug),
Kanban, fichiers + éditeur, communauté, différenciation CDC (maîtrise technos, journal,
templates, graphe). Monorepo Next.js 16 (TS strict) + Express 5 + PostgreSQL.

GitHub : https://github.com/alexismathieu-ui/HubHex

=== DÉMARRAGE LOCAL (Windows : utiliser ; pas &&) ===
cd c:\Users\User\HubHex\backend; npm run dev    → http://localhost:4000
cd c:\Users\User\HubHex\frontend; npm run dev   → http://localhost:3000
⚠ Pas de package.json à la racine — npm run dev depuis backend/ ou frontend/ uniquement.
PostgreSQL local requis (pas Docker pour le dev quotidien).
Checklist : docs/CHECKLIST_DEMARRAGE_LOCAL.md

=== DOCKER (démo prod / jury — lent au 1er build) ===
cp .env.docker.example .env.docker  → éditer JWT_SECRET
docker compose --env-file .env.docker up --build
Guide : docs/DEPLOIEMENT_PRODUCTION.md
Arrêter avant de repasser en npm run dev (ports 3000/4000/5432).

=== EXPORT SQL ===
cd backend; npm run db:export  → database/hubhex_schema.sql (schéma CDC)
cd backend; npm run db:dump    → database/hubhex_full_dump.sql (données — ne pas committer)
Guide : docs/EXPORT_SQL.md

=== AUTH ===
- JWT access 15 min + refresh 7 j (rotation, cookie HttpOnly hubhex_refresh)
- Front : localStorage hubhex_token + hubhex_refresh ; authFetch retry sur 401 ACCESS_TOKEN_EXPIRED
- MDP : 8 car. maj/min/chiffre/symbole (passwordPolicy.ts + security.js)

=== PAGES PUBLIQUES ===
/ accueil, /faq, /contact, /inscription, /connexion
Layout (public)/ → PublicMarketingLayout, PublicSiteNav
Menu burger animé : BurgerButton.tsx, MobileNavDrawer.tsx (< md public, < lg app)
Accueil : IdlePageRefresh 20 s inactivité (pas 5 s)

=== ESPACE CONNECTÉ ===
AppShell, AppNav (burger mobile), theme par compte hubhex_theme_{userId} UNIQUEMENT
Pages publiques = cyan fixe (PublicThemeReset) — jamais hubhex_theme global

=== EXPLORATEUR FICHIERS ===
DepotFileExplorer.tsx, DepotCodeWorkbench.tsx → authFetch
Desktop : sidebar redimensionnable, Monaco (monacoSetup.ts CDN jsdelivr, monacoKeywordCompletions.ts)
Mobile : panneaux Liste | Éditeur exclusifs ; tap fichier ouvre éditeur
Mobile éditeur = SimpleCodeViewer (lecture seule) — pas Monaco (évite erreur Cancelled)
Hauteur desktop défaut 520px — localStorage hubhex_file_explorer_height / hubhex_file_sidebar_width
Schema mind-map : FileTreeSchemaModal.tsx

=== ONGLET MAÎTRISE (ex « stack vivante » — refonte juin 2026) ===
- Onglet dépôt : « Maitrise » (pas « Stack »)
- Source unique : badges technologies du dépôt (TechTagPicker à la création / Paramètres)
- ProjectStackPanel.tsx : POST /stack/sync (body JSON {} + Content-Type application/json obligatoire)
  puis fiches par techno : niveau À venir / En cours / Maîtrisée + lien doc + note optionnels
- Plus de doublon « ajouter une techno » dans l'onglet Maîtrise
- Fichiers : ProjectStackPanel.tsx, project-stack.routes.js (route /sync)

=== NETTOYAGE DÉJÀ FAIT ===
- Code mort supprimé : ProjectRepoList, ProjectRepositoriesField, repositories.js backend, etc.
- Captures docs/assets/00-accueil.png … 06-profil.png intégrées DOCUMENTATION_UTILISATEUR.md
- Docs : EXPORT_SQL.md, DEPLOIEMENT_PRODUCTION.md, CHECKLIST_FONCTIONNALITES.md
- .gitignore racine (.env.docker)

=== RESTE MANUEL UTILISATEUR (priorité soutenance) ===
[ ] Export PDF/PPT depuis docs/SOUTENANCE.md
[ ] Parcours demo docs/SCENARIO_DEMO.md
[ ] Cocher docs/TESTS_SECURITE.md après exécution
[ ] Tunnel npm run share → /api/health → couper après
[ ] git push final si demandé explicitement

=== NE PAS SANS DEMANDE EXPLICITE ===
- commit / push git
- tunnel Cloudflare permanent
- clé localStorage hubhex_theme globale
- script npm test:security auto (supprimé volontairement)

Réponds en français. Shell Windows : ; entre commandes, pas &&.
```

---

## Fichiers à lire en priorité

| Fichier | Pourquoi |
|---------|----------|
| [README.md](../README.md) | Vue d'ensemble + scripts |
| [CHECKLIST_JOUR_J.md](CHECKLIST_JOUR_J.md) | Matin soutenance |
| [SCENARIO_DEMO.md](SCENARIO_DEMO.md) | Démo 5–10 min (onglet **Maitrise**) |
| [EXPORT_SQL.md](EXPORT_SQL.md) | Export BDD |
| [DEPLOIEMENT_PRODUCTION.md](DEPLOIEMENT_PRODUCTION.md) | Docker + .env prod |
| [CHECKLIST_FONCTIONNALITES.md](CHECKLIST_FONCTIONNALITES.md) | README vs réalisé |
| [ORAL_GRILLE_B1.md](ORAL_GRILLE_B1.md) | Réponses jury |
| [SOUTENANCE.md](SOUTENANCE.md) | Base slides |
| [TESTS_SECURITE.md](TESTS_SECURITE.md) | Audit manuel |

---

## Points d'entrée code

| Zone | Fichiers |
|------|----------|
| Pages publiques | `frontend/src/app/(public)/` |
| Burger / nav mobile | `BurgerButton.tsx`, `MobileNavDrawer.tsx`, `AppNav.tsx`, `PublicSiteNav.tsx` |
| Auth + fetch | `AuthContext.tsx`, `authFetch.ts` |
| Explorateur + éditeur | `DepotFileExplorer.tsx`, `DepotCodeWorkbench.tsx`, `SimpleCodeViewer.tsx` |
| Monaco (desktop) | `MonacoEditorPane.tsx`, `monacoSetup.ts`, `monacoKeywordCompletions.ts` |
| Maîtrise technos | `ProjectStackPanel.tsx`, `backend/.../project-stack.routes.js` |
| Theme user | `theme.ts`, `ThemeContext.tsx`, `PublicThemeReset.tsx` |
| Docker | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile` |

---

## Pièges connus

| Problème | Cause / solution |
|----------|------------------|
| `ENOENT package.json` à la racine | Lancer npm depuis `backend/` ou `frontend/` |
| Backend s'arrête tout seul | Terminal fermé / Ctrl+C — normal, pas un service Windows |
| Maîtrise : Content-Type JSON | POST /sync doit envoyer `body: JSON.stringify({})` + headers JSON |
| Monaco « Cancelled » mobile | Volontaire : SimpleCodeViewer lecture seule |
| Docker lent | 1er build ; dev quotidien = npm run dev |
| Export SQL | Fichiers dans `database/` à la racine (pas `backend/database/`) |

---

## Démarrage rapide

```powershell
cd c:\Users\User\HubHex\backend; npm run dev
cd c:\Users\User\HubHex\frontend; npm run dev
```

- Accueil : http://localhost:3000/
- API : http://localhost:4000/api/health

---

## Conventions code

- Tailwind slate/cyan (public) ; theme user sur AppShell uniquement
- `cd frontend; npm run build` avant de valider le front
- Scope minimal — ne pas réintroduire code mort (liens GitHub externes legacy)
