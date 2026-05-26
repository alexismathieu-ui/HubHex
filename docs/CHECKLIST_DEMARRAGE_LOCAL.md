# Checklist — demarrage local HubHex

Objectif : retrouver **http://localhost:3000** avec l’API sur **http://localhost:4000**.

## Prerequis

- [ ] Node.js 20+ installe (`node -v`)
- [ ] PostgreSQL demarre (service Windows ou `pg_ctl`)
- [ ] Base `hubhex` creee : `createdb hubhex` (ou via pgAdmin)

## Configuration (une fois)

- [ ] `backend/.env` present (copie depuis `backend/.env.example`)
- [ ] `DATABASE_URL` correct (utilisateur, mot de passe, port `5432`, base `hubhex`)
- [ ] `JWT_SECRET` : au moins 32 caracteres aleatoires
- [ ] `FRONTEND_URL=http://localhost:3000`
- [ ] `ENABLE_RATE_LIMIT=false` en developpement (evite les erreurs 429)
- [ ] `npm install` dans `backend/` et `frontend/`

## Demarrage (a chaque session)

### Terminal 1 — API

```bash
cd backend
npm run dev
```

- [ ] Message du type : API ecoute sur le port **4000**
- [ ] Test : ouvrir http://localhost:4000/api/health → reponse JSON `ok`

### Terminal 2 — Application

```bash
cd frontend
npm run dev
```

- [ ] Message Next.js : **Local: http://localhost:3000**
- [ ] Ouvrir http://localhost:3000 dans le navigateur

## Premier usage (sans script demo)

- [ ] Aller sur **Connexion** → **S’inscrire** (email, pseudo, mot de passe fort)
- [ ] Creer un depot (optionnel : choisir un **template** en bas du formulaire)
- [ ] Verifier : tableau de bord, fichiers, Kanban, communaute (si depot public)

## Depannage rapide

| Probleme | Piste |
|----------|--------|
| Page blanche / erreurs reseau | Backend lance ? `GET http://localhost:4000/api/health` |
| `ECONNREFUSED` base de donnees | PostgreSQL demarre ? `DATABASE_URL` dans `.env` |
| Erreur 429 (trop de requetes) | `ENABLE_RATE_LIMIT=false` dans `backend/.env`, redemarrer l’API |
| Mot de passe oublie sans mail | `ALLOW_DEV_RESET_TOKEN=true` en local uniquement, ou script `npm run reset-password` |
| Port 3000 deja utilise | Arreter l’autre processus ou `npx next dev -p 3001` |

## Scripts utiles

```bash
cd backend
npm test                    # tests automatises
npm run db:export           # export schema → database/hubhex_schema.sql
npm run reset-password -- email NouveauMdp1!
```

## Avant la soutenance

- [ ] Parcours teste une fois : inscription → depot → Kanban → public → commentaire
- [ ] Voir `docs/SCENARIO_DEMO.md`
- [ ] Slides : `docs/SOUTENANCE.md`
