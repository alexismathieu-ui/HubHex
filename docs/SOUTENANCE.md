# HubHex — Support de presentation (soutenance)

---

## Slide 1 — Titre

**HubHex**  
Plateforme de gestion et de partage de projets developpeur

*Votre nom — Date*

---

## Slide 2 — Contexte CDC

- Application web individuelle
- React/Next.js + Node.js + PostgreSQL
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
| Next.js 16 | Express 5 | PostgreSQL |
| React 19 | JWT + bcrypt | Schema au boot |
| Tailwind 4 | Zod, Helmet | Fichiers en BDD |

---

## Slide 5 — Fonctionnalites CDC

- Auth complete + profil enrichi
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
- JWT, invalidation si changement MDP
- Rate limits, CORS, validation entrees
- Reset password par email (SMTP) en production

---

## Slide 9 — Demo live

Voir `SCENARIO_DEMO.md` — 5 a 10 minutes

---

## Slide 10 — Livrables & perspectives

- Code GitHub, export SQL, documentation
- Tests API automatises
- Pistes : object storage fichiers, refresh token httpOnly, moderation avancee

---

## Slide 11 — Questions

Merci pour votre attention.
