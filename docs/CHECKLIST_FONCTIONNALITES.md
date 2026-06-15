# HubHex — Checklist fonctionnalites (README vs realise)

Verification des points annonces dans le [README](../README.md). Cocher apres test manuel reel.

Legende : **OK** = implemente et teste · **PARTIEL** = present mais limite · **MANUEL** = hors code · **NON** = absent du MVP

## Auth

| Fonctionnalite | Statut | Fichiers / notes | Teste |
|----------------|--------|------------------|-------|
| Inscription MDP fort (maj/min/chiffre/symbole) | OK | `passwordPolicy.ts`, `security.js` | [X] |
| Connexion JWT access 15 min | OK | `auth.routes.js`, `AuthContext.tsx` | [X] |
| Refresh token 7 j + rotation | OK | `refresh_tokens`, cookie HttpOnly | [X] |
| Profil (lecture / edition / suppression) | OK | `/profil`, `PATCH /api/auth/me` | [X] |
| Reset mot de passe | PARTIEL | SMTP prod a configurer ; mode dev token | [X] |
| Deconnexion + revocation refresh | OK | `POST /api/auth/logout` | [X] |

## Pages publiques

| Fonctionnalite | Statut | Notes | Teste |
|----------------|--------|-------|-------|
| Accueil marketing | OK | `(public)/`, `LandingPage` | [X] |
| FAQ | OK | `/faq` | [X] |
| Contact | OK | `/contact` | [~] |
| Layout partage + nav rapide | OK | `PublicMarketingLayout` | [X] |
| Menu burger mobile | OK | `BurgerButton`, `MobileNavDrawer` | [X] |
| Responsive global | PARTIEL | Depots/Kanban OK mobile ; audit complet WCAG a faire | [X] |

## Theme

| Fonctionnalite | Statut | Notes | Teste |
|----------------|--------|-------|-------|
| Theme par compte (`hubhex_theme_{userId}`) | OK | `ThemeContext`, `ThemeCustomizer` | [X] |
| Pages publiques cyan fixe | OK | `PublicThemeReset` | [X] |

## Depots

| Fonctionnalite | Statut | Notes | Teste |
|----------------|--------|-------|-------|
| CRUD depots + slug | OK | `/depots`, API projects | [X] |
| Explorateur fichiers (liste) | OK | `DepotFileExplorer` | [X] |
| Schema mind-map (zoom, DnD) | OK | `FileTreeSchemaModal` | [X] |
| Import / copier-coller / deplacer | OK | API files, toolbar | [X] |
| Editeur Monaco (desktop) | OK | `MonacoEditorPane`, workers CDN | [X] |
| Apercu code mobile (lecture seule) | OK | `SimpleCodeViewer` — pas Monaco sur mobile | [X] |
| Kanban (todo / in_progress / done) | OK | `TasksBoard` | [X] |

## Differentiation CDC

| Fonctionnalite | Statut | Notes | Teste |
|----------------|--------|-------|-------|
| Stack vivante | OK | `ProjectStackPanel` | [X] |
| Journal de decisions | OK | `ProjectJournalPanel` | [X] |
| Notes techniques | OK | `ProjectNotesPanel` | [X] |
| Templates (appliquer un modele) | OK | API `/api/templates` | [X] |
| Graphe HubHex | OK | `/graphe` | [X] |

## Communaute

| Fonctionnalite | Statut | Notes | Teste |
|----------------|--------|-------|-------|
| Projets publics | OK | visibilite `public` | [X] |
| Commentaires | OK | CRUD communaute | [X] |
| Recherche + filtres | OK | `q`, `technology`, `sort` | [X] |
| Moderation signalements / admin global | NON | Suppression auteur/proprio seulement (documente) | — |

## Dashboard

| Fonctionnalite | Statut | Notes | Teste |
|----------------|--------|-------|-------|
| Resume projets | OK | `/tableau-de-bord` | [X] |
| Activite recente | OK | endpoint dashboard | [X] |

## Infra / livrables

| Element | Statut | Notes | Teste |
|---------|--------|-------|-------|
| Tests backend `npm test` | OK | auth, slugs, bcrypt | [X] |
| Export schema SQL | OK | `npm run db:export` | [X] |
| Docker Compose | OK | `docker-compose.yml` | [X] |
| Doc deploiement prod | OK | `DEPLOIEMENT_PRODUCTION.md` | [X] |
| Captures PNG doc utilisateur | OK | `docs/assets/00-accueil.png` … `06-profil.png` | [x] |
| Slides PDF/PPT soutenance | MANUEL | export depuis `SOUTENANCE.md` | [X] |
| Parcours demo chronometre | MANUEL | `SCENARIO_DEMO.md` | [X] |
| Tests securite cocher | MANUEL | `TESTS_SECURITE.md` | [X] |

## Ecarts connus (a mentionner au jury)

- **Monaco mobile** : apercu lecture seule (`SimpleCodeViewer`) — edition complete sur desktop (workers CDN lourds).
- **Reset MDP** : necessite SMTP en production (`ALLOW_DEV_RESET_TOKEN` interdit en prod).
- **Moderation CDC complete** : pas de signalements ni role admin global.
- **Hebergement cloud** : Docker fourni ; pas de deploiement Render/Railway automatise.

## Commandes de verification rapide

```powershell
cd c:\Users\User\HubHex\backend; npm test
cd c:\Users\User\HubHex\frontend; npm run build
# Health API :
Invoke-RestMethod http://localhost:4000/api/health
```
