# HubHex — Deploiement production

Guide pour heberger HubHex (Docker, variables d'environnement, checklist avant mise en ligne).

## Options de deploiement

| Methode | Usage | Fichiers |
|---------|-------|----------|
| **Docker Compose** | Demo jury, VPS, staging | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile` |
| **Manuel** | Dev local classique | [CHECKLIST_DEMARRAGE_LOCAL.md](CHECKLIST_DEMARRAGE_LOCAL.md) |
| **Tunnel temporaire** | Prof sans installation | `npm run share` — [GUIDE_LIEN_API.md](GUIDE_LIEN_API.md) |

## Docker Compose (recommande)

### Prerequis

- Docker 24+ et Docker Compose v2
- Ports libres : `3000` (front), `4000` (API), `5432` (PostgreSQL optionnel)

### Etapes

```bash
# 1. Variables
cp .env.docker.example .env.docker
# Editer JWT_SECRET (32+ caracteres), POSTGRES_PASSWORD, FRONTEND_URL, NEXT_PUBLIC_API_URL

# 2. Build et demarrage
docker compose --env-file .env.docker up --build -d

# 3. Verifier
curl http://localhost:4000/api/health
# Front : http://localhost:3000
```

Le schema PostgreSQL est cree automatiquement au premier boot du backend (`ensureDatabaseSchema`).

### Arreter / supprimer

```bash
docker compose --env-file .env.docker down
# Supprimer aussi les donnees :
docker compose --env-file .env.docker down -v
```

## Variables d'environnement

### Backend (`backend/.env` ou service `backend` dans Compose)

| Variable | Obligatoire | Defaut | Description |
|----------|-------------|--------|-------------|
| `DATABASE_URL` | oui | — | URL PostgreSQL |
| `JWT_SECRET` | oui | — | Cle HS256 (32+ caracteres aleatoires) |
| `JWT_ACCESS_EXPIRES_IN` | non | `15m` | Duree access token |
| `JWT_REFRESH_EXPIRES_DAYS` | non | `7` | Duree refresh token |
| `FRONTEND_URL` | oui* | `http://localhost:3000` | Origine CORS autorisee |
| `NODE_ENV` | non | `development` | `production` en prod |
| `PORT` | non | `4000` | Port HTTP API |
| `HOST` | non | `0.0.0.0` | Interface d'ecoute |
| `ENABLE_RATE_LIMIT` | non | `false` (dev) | `true` en production |
| `ALLOW_DEV_RESET_TOKEN` | non | `false` | **Jamais `true` en prod** |
| `PUBLIC_API_URL` | non | — | URL affichee au boot (tunnel audit) |
| `SMTP_HOST` | non* | — | Serveur mail reset MDP |
| `SMTP_PORT` | non | `587` | Port SMTP |
| `SMTP_SECURE` | non | `false` | TLS explicite |
| `SMTP_USER` / `SMTP_PASS` | non | — | Identifiants SMTP |
| `SMTP_FROM` | non | — | Expéditeur (ex. `HubHex <noreply@...>`) |

\* `FRONTEND_URL` obligatoire en prod (URL reelle du front). SMTP fortement recommande pour le reset mot de passe par email.

Reference complete : `backend/.env.example`

### Frontend (`frontend/.env.local` ou build Docker)

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `NEXT_PUBLIC_API_URL` | oui en prod | Base API **vue par le navigateur**, doit finir par `/api` (ex. `https://api.mondomaine.fr/api`) |

Reference : `frontend/.env.example`

**Important** : `NEXT_PUBLIC_API_URL` est injectee au **build** Next.js. Si l'URL API change, reconstruire l'image frontend.

## Deploiement sur VPS (sans Docker)

1. Installer Node 20+, PostgreSQL 16+
2. Cloner le depot, configurer `backend/.env` et `frontend/.env.local`
3. Backend : `cd backend && npm ci --omit=dev && npm start` (PM2 ou systemd)
4. Frontend : `cd frontend && npm ci && npm run build && npm start`
5. Reverse proxy (Nginx/Caddy) :
   - `https://app.domaine.fr` → `localhost:3000`
   - `https://api.domaine.fr` → `localhost:4000`
6. `FRONTEND_URL=https://app.domaine.fr`
7. `NEXT_PUBLIC_API_URL=https://api.domaine.fr/api`
8. HTTPS obligatoire (cookie refresh `secure` en production)

## Securite production (checklist)

- [ ] `JWT_SECRET` unique et long (pas la valeur d'exemple)
- [ ] `ALLOW_DEV_RESET_TOKEN=false`
- [ ] `ENABLE_RATE_LIMIT=true`
- [ ] SMTP configure pour reset MDP
- [ ] HTTPS sur front et API
- [ ] `.env` / `.env.docker` jamais commites
- [ ] Tunnel `npm run share` coupe apres audit
- [ ] Sauvegardes PostgreSQL planifiees

## Captures d'ecran (documentation)

Deposer les PNG dans `docs/assets/` (voir [assets/README.md](assets/README.md)) puis les referenceer dans [DOCUMENTATION_UTILISATEUR.md](DOCUMENTATION_UTILISATEUR.md).

Liste minimale (6) :

1. Connexion / inscription
2. Tableau de bord
3. Depot — fichiers / editeur
4. Kanban
5. Stack ou journal
6. Graphe ou communaute

## Tests avant mise en ligne

- [ ] Parcours [SCENARIO_DEMO.md](SCENARIO_DEMO.md)
- [ ] [TESTS_SECURITE.md](TESTS_SECURITE.md) (cocher tableau execution)
- [ ] `cd backend && npm test`
- [ ] `cd frontend && npm run build`
- [ ] Verification fonctionnalites : [CHECKLIST_FONCTIONNALITES.md](CHECKLIST_FONCTIONNALITES.md)
