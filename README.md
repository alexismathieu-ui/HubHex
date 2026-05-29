# HubHex

Plateforme web de gestion de projets pour developpeurs : depots heberges sur HubHex (`username/slug`), Kanban, fichiers, communaute et **differentiation** (stack vivante, journal, templates, graphe).

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Express 5, Node.js |
| BDD | PostgreSQL |
| Auth | JWT (localStorage `hubhex_token`) |

## Demarrage rapide

### Prerequis

- Node.js 20+
- PostgreSQL en local

### 1. Base de donnees

```bash
createdb hubhex
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Editer DATABASE_URL et JWT_SECRET (32+ caracteres aleatoires)
npm install
npm run dev
```

API : http://localhost:4000

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Application : http://localhost:3000

Variable optionnelle : `NEXT_PUBLIC_API_URL=http://localhost:4000/api`

**Checklist detaillee** : [docs/CHECKLIST_DEMARRAGE_LOCAL.md](docs/CHECKLIST_DEMARRAGE_LOCAL.md)

Premier usage : inscrivez-vous sur http://localhost:3000/connexion (pas de compte demo automatique).

## Structure du monorepo

```
HubHex/
  backend/          API Express
  frontend/         Application Next.js
  database/         Export schema SQL
  docs/             Documentation utilisateur, technique, soutenance
  postman/          Collection tests API
  http/             Fichiers REST Client
```

## Fonctionnalites principales

- **Auth** : inscription, connexion, profil (avatar, pseudo, statut), reset MDP (SMTP ou mode dev)
- **Depots** : CRUD, slug, fichiers (import ZIP, editeur texte), Kanban drag & drop
- **Differentiation** : stack vivante, journal de decisions, notes techniques, templates, graphe HubHex
- **Communaute** : projets publics, commentaires, recherche et filtres
- **Dashboard** : resume et activite recente

## Scripts utiles

| Commande | Description |
|----------|-------------|
| `backend/npm run dev` | API en developpement |
| `backend/npm test` | Tests automatises (node:test) |
| `backend/npm run db:export` | Export schema vers `database/hubhex_schema.sql` |
| `backend/npm run db:dump` | Export complet (structure + donnees) vers `database/hubhex_full_dump.sql` |
| `backend/npm run reset-password -- email NouveauMdp1!` | Reset MDP admin |

## Documentation

- [Tests de securite API](docs/TESTS_SECURITE.md) — JWT + refresh token, checklist audit
- [Partager l’API via un lien (prof)](docs/GUIDE_LIEN_API.md) — tunnel + URL publique
- [Guide test API (correcteur / prof)](docs/GUIDE_TEST_API.md) — Postman, REST Client, curl
- [Checklist demarrage local](docs/CHECKLIST_DEMARRAGE_LOCAL.md)
- [Documentation utilisateur](docs/DOCUMENTATION_UTILISATEUR.md)
- [Documentation technique](docs/DOCUMENTATION_TECHNIQUE.md)
- [Scenario de demo soutenance](docs/SCENARIO_DEMO.md)
- [Support presentation](docs/SOUTENANCE.md)

## Livrables CDC

- Code source frontend + backend (ce depot)
- Export BDD : `database/hubhex_schema.sql` (structure) et `npm run db:dump` pour un dump complet avec donnees (`database/hubhex_full_dump.sql`, non versionne)
- Documentation utilisateur et technique (`docs/`)
- Support de presentation (`docs/SOUTENANCE.md`)

## Securite (resume)

- Mots de passe bcrypt (cost 12), JWT avec invalidation si changement MDP
- Helmet, CORS, rate limits, validation Zod
- En production : configurer `SMTP_*` pour le reset password (ne pas exposer `ALLOW_DEV_RESET_TOKEN`)
