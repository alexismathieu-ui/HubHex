# Tests de securite — HubHex API

Checklist pour vous (et pour un auditeur / prof cyber) apres mise en place des **JWT courts (15 min)** et **refresh tokens (7 jours)**.

Remplacez `BASE` par votre URL (`http://localhost:4000` ou tunnel Cloudflare).

---

## Exécution jury

> **Template** — a remplir le jour de la soutenance ou de l'audit cyber. Ne pas cocher avant d'avoir reellement execute le test. Indiquer la date du jour (format JJ/MM/AAAA).

| # | Test (section) | Date d'execution | OK |
|---|----------------|------------------|-----|
| 1 | A — Authentification et tokens (A1–A8) | ____/____/2026 | [ ] |
| 2 | B — Controle d'acces IDOR (B1–B3) | ____/____/2026 | [ ] |
| 3 | C — Validation et injections (C1–C4) | ____/____/2026 | [ ] |
| 4 | D — Rate limiting (D1–D2, `ENABLE_RATE_LIMIT=true`) | ____/____/2026 | [ ] |
| 5 | E — Exposition et transport (E1–E3) | ____/____/2026 | [ ] |
| 6 | F — Donnees sensibles (F1–F2) | ____/____/2026 | [ ] |

**Notes jury** (optionnel) :

- Auditeur / correcteur :
- URL `BASE` utilisee :
- Comptes de test :
- Observations :

---

## A. Authentification et tokens

### A1 — Health (sans auth)

```http
GET BASE/api/health
```

Attendu : **200**, JSON `status: ok`.

### A2 — Route protegee sans token

```http
GET BASE/api/projects
```

Attendu : **401**, message type `Missing token.`

### A3 — Inscription + connexion

```http
POST BASE/api/auth/register
POST BASE/api/auth/login
```

Attendu login : **200** avec `token`, `expiresIn` (~900 s), `refreshToken`, `refreshExpiresAt`, `user`.

### A4 — Profil avec access token

```http
GET BASE/api/auth/me
Authorization: Bearer <token>
```

Attendu : **200**, profil utilisateur.

### A5 — Access token expire

1. Dans `backend/.env` : `JWT_ACCESS_EXPIRES_IN=30s` (test uniquement)
2. Redemarrer l’API, se connecter, attendre 35 s
3. `GET BASE/api/auth/me` avec l’ancien token

Attendu : **401**, `code: ACCESS_TOKEN_EXPIRED` ou message `Access token expired.`

Remettre `JWT_ACCESS_EXPIRES_IN=15m` apres le test.

### A6 — Refresh token

```http
POST BASE/api/auth/refresh
Content-Type: application/json

{ "refreshToken": "<refreshToken du login>" }
```

Attendu : **200**, nouveau `token` et nouveau `refreshToken` (rotation).

L’ancien refresh ne doit plus fonctionner (rejouer la requete → **401**).

### A7 — Deconnexion

```http
POST BASE/api/auth/logout
Content-Type: application/json

{ "refreshToken": "<refreshToken>" }
```

Puis `POST /auth/refresh` avec le meme refresh → **401**.

### A8 — Mot de passe change = sessions invalidees

1. Login → noter `refreshToken`
2. `PATCH /api/auth/me` avec `currentPassword` + `newPassword`
3. Reutiliser l’ancien refresh → **401**
4. Reutiliser l’ancien access token → **401**

---

## B. Controle d’acces (IDOR / autorisation)

### B1 — Projet d’un autre utilisateur

1. Compte A : creer un projet, noter `projectId`
2. Compte B : `GET BASE/api/projects/{projectId}/tasks` avec token B

Attendu : **403** ou **404** (pas les donnees de A).

### B2 — Modifier le depot d’un autre

`PATCH BASE/api/projects/{id}` avec token d’un autre user → **403/404**.

### B3 — Fichiers / taches

Meme logique sur `/files`, `/tasks` : seul le proprietaire du depot peut modifier.

---

## C. Validation et injections

### C1 — Mot de passe faible a l’inscription

```json
{ "username": "test", "email": "x@test.com", "password": "123" }
```

Attendu : **400** (validation Zod).

### C2 — SQL injection dans recherche communaute

```http
GET BASE/api/community/projects?q=' OR 1=1 --
```

Attendu : **200** avec liste vide ou resultats normaux, **pas** d’erreur SQL serveur.

### C3 — XSS stocke (commentaire)

Poster `<script>alert(1)</script>` en commentaire sur un projet public, reafficher : le front doit echapper / sanitizer (dompurify cote rendu si applicable).

### C4 — Corps JSON invalide

`POST BASE/api/auth/login` avec body `not json` → **400/415**, pas crash 500.

---

## D. Limitation d’abus (rate limiting)

**Demo soutenance / jury cyber** : copier `ENABLE_RATE_LIMIT=true` depuis `backend/.env.example` (ou basculer la variable dans `backend/.env`), **redemarrer l’API**, puis executer D1–D2. En developpement quotidien, laisser `false` pour eviter des 429 intempestifs pendant l’edition de fichiers. Voir aussi [CHECKLIST_JOUR_J.md](CHECKLIST_JOUR_J.md) (section Securite).

Mettre `ENABLE_RATE_LIMIT=true` dans `.env`, redemarrer l’API.

### D1 — Brute force login

> 20 requetes `POST /api/auth/login` avec mauvais mot de passe en quelques minutes.

Attendu : **429** avec message trop de requetes.

### D2 — Spam commentaires

Repeter `POST` commentaire sur un projet public → **429** apres le seuil.

Remettre `ENABLE_RATE_LIMIT=false` en dev quotidien si besoin.

---

## E. Exposition et transport

### E1 — Tunnel public

Si API exposee via Cloudflare :

- Ne pas laisser le tunnel ouvert hors creneau de test
- Ne pas commiter `.env` / tokens dans GitHub
- Utiliser un compte de test dedie

### E2 — Headers securite

```http
GET BASE/api/health
```

Verifier presence de headers Helmet (ex. `X-Content-Type-Options`, pas de `X-Powered-By: Express`).

### E3 — CORS

Depuis la console navigateur sur un autre domaine, requete vers l’API avec `fetch` : origine non autorisee → erreur CORS (en dev seulement localhost:3000 autorise).

---

## F. Donnees sensibles

### F1 — Mots de passe jamais en clair

`GET /api/auth/me` : pas de champ `password` / `password_hash`.

### F2 — Reset password

`POST /api/auth/forgot-password` : meme reponse que l’email existe ou non (pas d’enumeration facile).

`ALLOW_DEV_RESET_TOKEN=false` en production et pour l’audit public.

---

## G. Outils recommandes pour l’auditeur

| Outil | Usage |
|-------|--------|
| **Postman** | Collection `postman/HubHex.postman_collection.json` |
| **REST Client** | `http/hubhex.http` |
| **Burp Suite / OWASP ZAP** | Proxy, fuzzing, replay |
| **jwt.io** | Decoder le JWT (verifier `exp`, pas de donnees sensibles) |

---

## Resume des durees (configuration actuelle)

| Jeton | Duree par defaut | Stockage |
|-------|------------------|----------|
| Access JWT | 15 minutes (`JWT_ACCESS_EXPIRES_IN`) | Client (localStorage `hubhex_token`) |
| Refresh | 7 jours (`JWT_REFRESH_EXPIRES_DAYS`) | BDD hash SHA-256 + cookie HttpOnly `/api/auth` + localStorage pour renouvellement |

---

## Commandes PowerShell rapides (apres login)

```powershell
$base = "http://localhost:4000"
$login = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType "application/json" `
  -Body (@{ email="prof@test.local"; password="MotDePasse1" } | ConvertTo-Json)
$login.expiresIn
$refresh = $login.refreshToken
Invoke-RestMethod -Method Post -Uri "$base/api/auth/refresh" -ContentType "application/json" `
  -Body (@{ refreshToken=$refresh } | ConvertTo-Json)
```
