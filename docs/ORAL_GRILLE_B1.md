# Grille orale B1 — HubHex (1 page)

Preparation jury CODA — a lire avec [SOUTENANCE.md](SOUTENANCE.md) et [CHECKLIST_JOUR_J.md](CHECKLIST_JOUR_J.md).

---

## Pitch (30 s)

**HubHex** heberge vos depots developpeur (`username/slug`) : fichiers, Kanban, stack, journal, graphe entre projets et communaute publique — pas un simple lien GitHub externe.

---

## MVC avec Next.js

| Couche | HubHex |
|--------|--------|
| **Vue** | Pages `app/`, composants `components/` (Tailwind, React 19) |
| **Controle** | Hooks, `AuthContext`, appels API `lib/` |
| **Modele** | Types `types/`, contrat REST Express + PostgreSQL |

*Phrase* : « Le front separe presentation, orchestration et donnees ; le modele metier vit cote API + BDD. »

---

## JWT + refresh (deja en place)

- **Access JWT** : ~15 min (`JWT_ACCESS_EXPIRES_IN`), client `localStorage` `hubhex_token`
- **Refresh** : 7 j (`JWT_REFRESH_EXPIRES_DAYS`), hash SHA-256 en table `refresh_tokens`, **rotation** a chaque `POST /api/auth/refresh`
- **Cookie** `hubhex_refresh` HttpOnly, `path=/api/auth`
- **Front** : renouvellement **silencieux** (~14 min) + retry sur 401 (`AuthContext.tsx`, `tokenRefresh.ts`) — **pas une fonctionnalite « a venir »**

Tests : [TESTS_SECURITE.md](TESTS_SECURITE.md) sections A6–A8.

---

## Moderation (limite assumée)

- Commentaires sur depots **publics** uniquement
- **Suppression** : auteur du commentaire **ou** proprietaire du depot
- Pas de file de moderation admin complete (hors perimetre MVP B1) — **rate limit** anti-spam sur `POST` commentaires si `ENABLE_RATE_LIMIT=true`

---

## Logs CDC (Morgan)

- **Morgan** sur Express : format `dev` en local, `combined` en production (`app.js`)
- Trace chaque requete HTTP (methode, URL, statut, duree)
- Pas de winston/pino : choix MVP documente, evolutif

---

## Demo & jour J

- Scenario : [SCENARIO_DEMO.md](SCENARIO_DEMO.md) (5–10 min, variante 6 etapes)
- Matin : [CHECKLIST_JOUR_J.md](CHECKLIST_JOUR_J.md)
- Rate limit demo : `ENABLE_RATE_LIMIT=true` dans `backend/.env` → [TESTS_SECURITE.md](TESTS_SECURITE.md) section D

---

## Questions pieges — reponses courtes

| Question | Reponse |
|----------|---------|
| Pourquoi pas de migrations Alembic ? | Schema au boot (`db.js`) + export SQL livrable |
| Token en localStorage ? | Access court ; refresh rotatif + cookie HttpOnly cote API |
| IDOR ? | Verif proprietaire depot sur routes sensibles (tests B1–B3) |
| Exposer l'API ? | `npm run share` temporaire, compte test dedie |
