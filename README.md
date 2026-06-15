# HubHex

Plateforme web de gestion de projets pour developpeurs : depots heberges sur HubHex (`username/slug`), Kanban, fichiers, communaute et **differentiation** (Maitrise, journal, templates, graphe).

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Express 5, Node.js |
| BDD | PostgreSQL |
| Auth | JWT access court (15 min) + refresh (7 j, rotation) ; cookie HttpOnly cote API |

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

- **Page d'accueil** : http://localhost:3000/
- **Inscription** : http://localhost:3000/inscription
- **Connexion** : http://localhost:3000/connexion

Variable optionnelle : `NEXT_PUBLIC_API_URL=http://localhost:4000/api`

**Checklist detaillee** : [docs/CHECKLIST_DEMARRAGE_LOCAL.md](docs/CHECKLIST_DEMARRAGE_LOCAL.md)

Premier usage : page d'accueil http://localhost:3000/ puis **S'inscrire** (`/inscription`) — pas de compte demo automatique.

## Structure du monorepo

```
HubHex/
  backend/          API Express
  frontend/         Application Next.js
  backend/database/ Export schema SQL
  docs/             Documentation utilisateur, technique, soutenance
  postman/          Collection tests API
  http/             Fichiers REST Client
```

## Fonctionnalites principales

- **Auth** : inscription (MDP fort : maj/min/chiffre/symbole), connexion, profil, reset MDP
- **Pages publiques** : accueil, FAQ, contact — layout partage, navigation rapide
- **Theme** : personnalisation par compte (espace connecte) ; pages publiques en cyan fixe
- **Depots** : CRUD, slug, fichiers (liste + schema mind-map modale, zoom, DnD multiple), Monaco (desktop) / apercu code mobile, Kanban
- **Differentiation** : Maitrise, journal de decisions, notes techniques, templates, graphe HubHex
- **Communaute** : projets publics, commentaires, recherche et filtres
- **Dashboard** : resume et activite recente

## Scripts utiles

| Commande | Description |
|----------|-------------|
| `backend/npm run dev` | API en developpement |
| `backend/npm test` | Tests automatises (node:test) |
| `backend/npm run db:export` | Export schema vers `database/hubhex_schema.sql` |
| `backend/npm run db:dump` | Export complet vers `database/hubhex_full_dump.sql` |
| `backend/npm run share` | Tunnel public Cloudflare vers l'API (audit jury) |
| `backend/npm run reset-password -- email NouveauMdp1!` | Reset MDP admin |

## Deploiement production (Docker)

```bash
cp .env.docker.example .env.docker
# Editer JWT_SECRET, mots de passe, FRONTEND_URL, NEXT_PUBLIC_API_URL
docker compose --env-file .env.docker up --build
```

Guide complet : [docs/DEPLOIEMENT_PRODUCTION.md](docs/DEPLOIEMENT_PRODUCTION.md) (variables `.env`, VPS, securite, captures).

Verification des fonctionnalites annoncees : [docs/CHECKLIST_FONCTIONNALITES.md](docs/CHECKLIST_FONCTIONNALITES.md).

## Documentation

- [Export SQL (schema et dump)](docs/EXPORT_SQL.md)
- [Deploiement production & Docker](docs/DEPLOIEMENT_PRODUCTION.md)
- [Checklist fonctionnalites (README vs realise)](docs/CHECKLIST_FONCTIONNALITES.md)
- [Tests de securite API](docs/TESTS_SECURITE.md) — JWT + refresh token, checklist audit
- [Partager l’API via un lien (prof)](docs/GUIDE_LIEN_API.md) — tunnel + URL publique
- [Guide test API (correcteur / prof)](docs/GUIDE_TEST_API.md) — Postman, REST Client, curl
- [Checklist demarrage local](docs/CHECKLIST_DEMARRAGE_LOCAL.md)
- [Documentation utilisateur](docs/DOCUMENTATION_UTILISATEUR.md) (captures integrees)
- [Documentation technique](docs/DOCUMENTATION_TECHNIQUE.md)
- [Scenario de demo soutenance](docs/SCENARIO_DEMO.md)
- [Checklist jour J soutenance](docs/CHECKLIST_JOUR_J.md)
- [Reprise agent / micro-prompt](docs/AGENT_REPRISE.md)

## Livrables CDC

- Code source frontend + backend (ce depot)
- Export BDD : regenerer avant remise avec `cd backend && npm run db:export` (`backend/database/hubhex_schema.sql`) ; dump complet avec `npm run db:dump` (`backend/database/hubhex_full_dump.sql`, non versionne)
- Documentation utilisateur et technique (`docs/`)

## Securite (resume)

- Mots de passe bcrypt (cost 12), politique entropie a l'inscription, JWT access court + refresh rotatif
- Helmet, CORS, rate limits, validation Zod
- En production : configurer `SMTP_*` pour le reset password (ne pas exposer `ALLOW_DEV_RESET_TOKEN`)
