# HubHex — Support de presentation (soutenance)

---

## Slide 1 — Titre

**HubHex**  
Plateforme de gestion et de partage de projets developpeur

*Votre nom — Promo CODA B1 — Date*

---

## Slide 2 — Contexte CDC

- Application web individuelle
- Next.js (TypeScript) + Node.js + PostgreSQL
- Gestion projets, taches Kanban, communaute, recherche

---

## Slide 3 — Proposition HubHex

- Chaque **depot est heberge** sur HubHex (`username/slug`)
- Pas un simple lien GitHub externe : fichiers, Kanban, notes dans la plateforme
- **Differentiation** : capitalisation technique entre projets

---

## Slide 4 — Stack technique

| Frontend | Backend | Donnees |
|----------|---------|---------|
| Next.js 16, TS strict | Express 5 | PostgreSQL |
| React 19, Tailwind 4 | JWT access 15 min + refresh 7 j | Schema au boot + export SQL |
| Monaco (editeur) | bcrypt, Zod, Helmet | 13 tables |

---

## Slide 5 — Fonctionnalites CDC

- **Page d'accueil** (landing) pour visiteurs ; connexion / inscription ; redirection vers le tableau de bord si deja connecte
- Auth complete + profil enrichi + reset MDP (SMTP ou dev)
- CRUD depots, visibilite public/prive
- Kanban 3 colonnes (+ drag & drop)
- Communaute : recherche, filtres, commentaires
- Dashboard et activite

---

## Slide 6 — Differentiation (1/2)

**Stack vivante** — techno + lien + statut + snippet  
**Journal de decisions** — historique des choix  
**Notes techniques** — documentation separee  
**Templates** — demarrage rapide avec taches pre-remplies

---

## Slide 7 — Differentiation (2/2)

**Graphe HubHex** — relations entre depots  
→ Visualiser l'evolution et les liens (meme techno, suite, inspiration)

*Phrase cle : « Mes projets ne sont plus isoles, ils forment un reseau de savoir-faire. »*

---

## Slide 8 — Securite

- Mots de passe hashes (bcrypt 12)
- **JWT access court (15 min)** + **refresh token (7 j)** avec rotation en BDD (**implemente**, pas roadmap)
- Cookie refresh **HttpOnly** ; revocation au logout / changement MDP
- **Frontend** : renouvellement silencieux (~14 min) + retry sur 401 (`AuthContext`) — session transparente en demo
- Rate limits (`ENABLE_RATE_LIMIT=true` pour demo jury), CORS, validation Zod, Helmet
- Logs requetes : **Morgan** (`dev` / `combined`)
- Reset password par email (`SMTP_*`) en production

---

## Slide 9 — Demo live

Voir [SCENARIO_DEMO.md](SCENARIO_DEMO.md) — 5 a 10 minutes (variante 6 etapes ~5 min)

Checklist jour J : [CHECKLIST_JOUR_J.md](CHECKLIST_JOUR_J.md) — grille orale : [ORAL_GRILLE_B1.md](ORAL_GRILLE_B1.md)

---

## Slide 10 — Livrables

- Code GitHub (monorepo front + back)
- Export BDD : `hubhex_schema.sql` + `npm run db:dump` sur demande
- Documentation utilisateur et technique
- Tests securite documentes (`TESTS_SECURITE.md`)
- Tunnel API pour audit (`npm run share` + `GUIDE_LIEN_API.md`)

---

## Slide 11 — Architecture (oral)

- **Vue** : pages Next.js + composants (`components/`)
- **Controle** : hooks, `AuthContext`, appels API (`lib/`)
- **Modele** : types TypeScript + API REST Express

---

## Slide 12 — Questions

Merci pour votre attention.
