# HubHex — Documentation technique

## Architecture

Monorepo avec deux applications :

- **backend/** — API REST Express 5, port 4000
- **frontend/** — Next.js App Router, TypeScript (`.ts`/`.tsx`), port 3000

Le schema PostgreSQL est applique au demarrage du backend (`ensureDatabaseSchema` dans `backend/src/config/db.js`). Pas de migrations versionnees separees : le DDL est idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).

## Modele de donnees

| Table | Role |
|-------|------|
| `users` | Comptes, profil, avatar (TEXT base64) |
| `projects` | Depots (`slug` unique par `user_id`) |
| `tasks` | Kanban (`todo`, `in_progress`, `done`) |
| `comments` | Communaute |
| `project_files` | Arborescence fichiers |
| `project_technical_notes` | Notes techniques |
| `project_stack_items` | Stack vivante |
| `project_journal_entries` | Journal de decisions |
| `project_templates` | Templates systeme ou utilisateur |
| `project_relations` | Graphe entre depots |
| `refresh_tokens` | Sessions refresh (hash SHA-256, rotation, revocation) |
| `password_reset_tokens` | Reset mot de passe par email |

## API principale

Prefixe : `/api`

### Auth (`/api/auth`)

- `POST /register`, `POST /login`
- `POST /refresh` — rotation du refresh token (body JSON et/ou cookie `hubhex_refresh` HttpOnly)
- `POST /logout` — revocation refresh + suppression cookie
- `POST /forgot-password`, `POST /reset-password`
- `GET|PATCH|DELETE /me` (authentifie)

### Projets (`/api/projects`, JWT requis)

- CRUD `/`
- `/:projectId/files` — arborescence, editeur, import batch, download binaire
- `/:projectId/tasks` — Kanban
- `/:projectId/notes` — notes techniques
- `/:projectId/stack` — stack vivante
- `/:projectId/journal` — journal

### Templates & graphe

- `GET /api/templates`, `POST /api/templates/apply`
- `GET /api/graph`, `POST /api/graph/relations`, `DELETE /api/graph/relations/:id`

### Communaute (`/api/community`)

- `GET /projects?q=&technology=&sort=recent|popular`
- Commentaires CRUD sur projets publics

### Utilisateurs publics

- `GET /api/users/:username/public`
- `GET /api/users/:username/avatar`

## Authentification

- **Access token** : JWT HS256, duree courte (`JWT_ACCESS_EXPIRES_IN`, defaut `15m`). Payload : `userId`, `username`. Invalidation si `password_changed_at` > `iat` du JWT.
- **Refresh token** : duree longue (`JWT_REFRESH_EXPIRES_DAYS`, defaut `7`), stocke **hashe** (SHA-256) dans `refresh_tokens`. **Rotation** a chaque `POST /api/auth/refresh` (ancienne session revoquee).
- **Cookie** : `hubhex_refresh` HttpOnly, `path=/api/auth`, `sameSite=lax`, `secure` en production.
- **Frontend** : `localStorage` `hubhex_token` + `hubhex_refresh` ; renouvellement automatique avant expiration (`AuthContext.tsx`, `lib/auth/tokenRefresh.ts`). Appels API avec `credentials: "include"` pour le cookie.

## Partage API (audit / jury sans installation)

```bash
cd backend
npm run dev          # terminal 1
npm run share        # terminal 2 — URL *.trycloudflare.com
```

Voir [GUIDE_LIEN_API.md](GUIDE_LIEN_API.md). Variable optionnelle `PUBLIC_API_URL` affichee au demarrage de l'API.

## Logs

Requetes HTTP tracees avec **Morgan** (`combined` en production, `dev` en developpement). Pas de logger structure type winston/pino (hors perimetre MVP ; evolutif).

## Modération (CDC)

Suppression de commentaires par **l'auteur** ou le **proprietaire** du depot public. Pas de signalements ni role administrateur global.

## Variables d'environnement (backend)

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | oui | PostgreSQL |
| `JWT_SECRET` | oui | Cle JWT |
| `JWT_ACCESS_EXPIRES_IN` | non | Duree access token (defaut `15m`) |
| `JWT_REFRESH_EXPIRES_DAYS` | non | Duree refresh (defaut `7`) |
| `FRONTEND_URL` | non | CORS (defaut localhost:3000) |
| `ENABLE_RATE_LIMIT` | non | `true` pour activer les limites en dev |
| `HOST` | non | Ecoute (defaut `0.0.0.0`) |
| `PUBLIC_API_URL` | non | URL publique affichee au boot (tunnel) |
| `ALLOW_DEV_RESET_TOKEN` | non | Token reset en JSON (dev uniquement) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | non | Email reset password |

## Frontend TypeScript

- Tous les fichiers sous `frontend/src/` sont en **`.ts`** (utilitaires) ou **`.tsx`** (React).
- **`strict: true`** dans `frontend/tsconfig.json` (comme le portfolio Vite).
- Types partages : `frontend/src/types/hubhex.ts`, `depot.ts`, `profile.ts`, `auth.ts`.
- Helpers : `frontend/src/lib/apiHeaders.ts` (`createAuthHeaders`), `frontend/src/lib/errors.ts` (`getErrorMessage`).
- Le build Next valide les types (`npm run build` / `npx tsc --noEmit`).
- Le backend reste en **JavaScript** (CommonJS).

## Demarrage local

Voir [CHECKLIST_DEMARRAGE_LOCAL.md](CHECKLIST_DEMARRAGE_LOCAL.md) (PostgreSQL, `.env`, ports 4000 / 3000).

## Export base de donnees

| Commande | Fichier produit | Contenu |
|----------|-----------------|---------|
| `cd backend && npm run db:export` | `database/hubhex_schema.sql` | Metadonnees colonnes (13 tables, sans donnees) |
| `cd backend && npm run db:dump` | `database/hubhex_full_dump.sql` | **Complet** : DDL live + toutes les lignes + sequences |

`db:dump` tente d'abord `pg_dump` (outil client PostgreSQL). Sinon, un export SQL est genere via Node (13 tables incl. `refresh_tokens`, ordre FK respecte). Le fichier complet est ignore par Git (`database/.gitignore`) car il contient des donnees sensibles.

Pour le jury : preferer le **dump complet** si un fichier SQL executable avec structure est demande ; `hubhex_schema.sql` sert de reference lisible du modele.

Restauration du dump complet :

```bash
psql "$DATABASE_URL" -f database/hubhex_full_dump.sql
```

Variable optionnelle `PG_DUMP_PATH` dans `backend/.env` si `pg_dump` n'est pas dans le PATH.

## Tests

```bash
cd backend
npm test
```

Tests unitaires `node:test` : validation mot de passe, slugs, bcrypt, connectivite BDD si `DATABASE_URL` est defini.

## Points de entree code

- Boot : `backend/src/server.js`
- Routes : `backend/src/app.js`
- Schema : `backend/src/config/db.js`
- Session front : `frontend/src/context/AuthContext.tsx`
