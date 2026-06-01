# HubHex — Checklist jour J (soutenance)

Cochez au fur et a mesure. Ordre conseille le matin meme.

## Matin — technique (30–45 min)

- [ ] PostgreSQL demarre, `backend/.env` a jour (`JWT_SECRET`, `DATABASE_URL`)
- [ ] Terminal 1 : `cd backend` → `npm run dev` → http://localhost:4000/api/health OK
- [ ] Terminal 2 : `cd frontend` → `npm run dev` → http://localhost:3000 OK
- [ ] Parcours demo une fois : [SCENARIO_DEMO.md](SCENARIO_DEMO.md)
- [ ] (Option jury cyber) Terminal 3 : `cd backend` → `npm run share` → noter URL → tester `/api/health`
- [ ] Couper `npm run share` apres les tests (ne pas laisser le tunnel ouvert)

## Livrables a avoir sous la main

- [ ] Depot GitHub a jour (`git push` fait)
- [ ] `database/hubhex_schema.sql` regenere (`npm run db:export`) — metadonnees + table `refresh_tokens`
- [ ] Dump complet si demande : `npm run db:dump` → `database/hubhex_full_dump.sql` (non versionne)
- [ ] Support : [SOUTENANCE.md](SOUTENANCE.md) exporte en PDF/PPT
- [ ] Captures `docs/assets/` (6 PNG manuels : accueil, connexion, dashboard, kanban, graphe, communaute) referencees dans [DOCUMENTATION_UTILISATEUR.md](DOCUMENTATION_UTILISATEUR.md)

## Securite (demo ou oral, 10 min)

- [ ] `ENABLE_RATE_LIMIT=true` dans `.env` + redemarrer API → test 429 (voir [TESTS_SECURITE.md](TESTS_SECURITE.md))
- [ ] Parcours refresh : login → `POST /api/auth/refresh` (ou attendre renouvellement auto front)
- [ ] Expliquer : JWT access 15 min, refresh 7 j rotatif, cookie HttpOnly cote API

## A dire au jury si on vous interroge

| Sujet | Reponse courte |
|-------|----------------|
| MVC | Next.js = Vue (pages/composants) + controle (hooks, context) + modele (`types/`, API) |
| Modération | Suppression par auteur du commentaire ou proprietaire du depot public |
| Logs CDC | Morgan (requetes HTTP) ; pas de winston/pino (choix MVP) |
| Migrations | Schema au boot (`db.js`) + export `.sql` livrable |
| Access token | `localStorage` + duree courte ; refresh rotatif + cookie HttpOnly cote API |

## Apres la soutenance

- [ ] Arreter tunnel et serveurs
- [ ] Ne pas committer `hubhex_full_dump.sql` ni `.env`
