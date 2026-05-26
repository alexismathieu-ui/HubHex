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

## API principale

Prefixe : `/api`

### Auth (`/api/auth`)

- `POST /register`, `POST /login`
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

JWT HS256, secret `JWT_SECRET` (min. 32 caracteres). Payload : `userId`, `username`. Invalidation via `password_changed_at` compare au claim `iat`.

## Variables d'environnement (backend)

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | oui | PostgreSQL |
| `JWT_SECRET` | oui | Cle JWT |
| `FRONTEND_URL` | non | CORS (defaut localhost:3000) |
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
- Session front : `frontend/src/context/AuthContext.js`
