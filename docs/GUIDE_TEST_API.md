# Guide — tester l’API HubHex

## Le prof doit ouvrir un lien (sans installer le projet)

→ Voir **[GUIDE_LIEN_API.md](GUIDE_LIEN_API.md)** (tunnel `npm run share` + URL a envoyer).

Le prof ouvre par exemple : `https://votre-lien.trycloudflare.com/api/health`

---

## Installer le projet sur le PC du correcteur (autre methode)

Ce qui suit s’applique si le correcteur **clone** le depot sur **son** ordinateur.

API locale : **http://localhost:4000**

---

## 1. Prerequis

| Outil | Version conseillee | Verification |
|-------|-------------------|--------------|
| Node.js | 20 ou plus | `node -v` |
| npm | fourni avec Node | `npm -v` |
| PostgreSQL | 14+ | service demarre, port `5432` |

---

## 2. Installation (une fois)

### 2.1 Cloner le projet

```bash
git clone https://github.com/alexismathieu-ui/HubHex.git
cd HubHex
```

(Adapter l’URL si le depot est ailleurs.)

### 2.2 Creer la base PostgreSQL

```bash
createdb hubhex
```

Sous Windows, via **pgAdmin** ou **psql** : creer une base nommee `hubhex`.

### 2.3 Configurer le backend

```bash
cd backend
copy .env.example .env
```

Sous Linux / macOS : `cp .env.example .env`

Editer `backend/.env` :

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:VOTRE_MDP@localhost:5432/hubhex
JWT_SECRET=une-cle-aleatoire-d-au-moins-32-caracteres-ici
FRONTEND_URL=http://localhost:3000
ENABLE_RATE_LIMIT=false
```

- **DATABASE_URL** : adapter utilisateur, mot de passe et hote PostgreSQL.
- **JWT_SECRET** : minimum 32 caracteres (ex. `openssl rand -hex 32`).

### 2.4 Installer les dependances

```bash
cd backend
npm install
```

Le frontend n’est **pas necessaire** pour tester l’API seule.

---

## 3. Demarrer l’API

```bash
cd backend
npm run dev
```

Reponse attendue : message indiquant que l’API ecoute sur le port **4000**.

### Test rapide dans le navigateur

Ouvrir : **http://localhost:4000/api/health**

Reponse JSON attendue (equivalent) :

```json
{ "status": "ok" }
```

Liste des routes en dev : **http://localhost:4000/**

---

## 4. Tester l’API (3 methodes au choix)

### Methode A — REST Client (VS Code / Cursor) — recommande

1. Installer l’extension **REST Client** (`humao.rest-client`).
2. L’API doit tourner (`npm run dev` dans `backend/`).
3. Ouvrir le fichier **`http/hubhex.http`** a la racine du depot.
4. Cliquer sur **Send Request** au-dessus de chaque bloc.

**Ordre conseille :**

1. `GET` Health  
2. `POST` Register (une seule fois par email)  
3. `POST` Login → copier le champ `token` de la reponse  
4. Coller le token dans la variable `@token` en haut du fichier  
5. `GET` Profil, Dashboard, Projets publics, etc.

Variables en tete de `hubhex.http` (modifiables) :

```
@baseUrl = http://localhost:4000
@email = test@hubhex.dev
@password = MotDePasse1
@username = proftest
```

Mot de passe : **8 caracteres minimum**, au moins **une lettre** et **un chiffre**.

---

### Methode B — Postman

1. Importer **`postman/HubHex.postman_collection.json`**
2. Importer **`postman/HubHex-local.postman_environment.json`**
3. Selectionner l’environnement **HubHex local** (coin haut droit)
4. Ajuster `email`, `password`, `username` si besoin
5. Executer le dossier **00 Demarrage** → **Health**
6. Puis **01 Auth** → **Register** (si nouveau compte) → **Login**  
   (certaines requetes enregistrent le token automatiquement selon la collection)

Voir aussi : `postman/IMPORT-VSCODE.txt`

---

### Methode C — Ligne de commande (curl)

**Sante :**

```bash
curl http://localhost:4000/api/health
```

**Inscription :**

```bash
curl -X POST http://localhost:4000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"proftest\",\"email\":\"prof@example.com\",\"password\":\"MotDePasse1\"}"
```

(Sous Linux/macOS, remplacer `^` par `\` en fin de ligne.)

**Connexion :**

```bash
curl -X POST http://localhost:4000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"prof@example.com\",\"password\":\"MotDePasse1\"}"
```

Recuperer `token` dans la reponse JSON.

**Profil connecte :**

```bash
curl http://localhost:4000/api/auth/me ^
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

---

## 5. Principales routes API

| Methode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/health` | Non | Verifier que l’API repond |
| POST | `/api/auth/register` | Non | Inscription |
| POST | `/api/auth/login` | Non | Connexion → JWT |
| GET | `/api/auth/me` | Bearer | Profil utilisateur |
| GET | `/api/projects` | Bearer | Liste des depots |
| POST | `/api/projects` | Bearer | Creer un depot |
| GET | `/api/dashboard` | Bearer | Tableau de bord |
| GET | `/api/community/projects` | Non* | Projets publics |
| GET | `/api/templates` | Bearer | Modeles de depot |
| GET | `/api/graph/relations` | Bearer | Graphe entre depots |

\* Certaines routes communaute acceptent un token optionnel.

En-tete d’authentification pour les routes protegees :

```http
Authorization: Bearer <token>
```

---

## 6. Depannage

| Probleme | Solution |
|----------|----------|
| `ECONNREFUSED` sur le port 4000 | Lancer `npm run dev` dans `backend/` |
| Erreur PostgreSQL / `DATABASE_URL` | Verifier que PostgreSQL tourne et que la base `hubhex` existe |
| `JWT_SECRET` invalide | Au moins 32 caracteres dans `.env` |
| Erreur **429** (trop de requetes) | Mettre `ENABLE_RATE_LIMIT=false` dans `.env`, redemarrer l’API |
| Register : email deja utilise | Changer l’email ou utiliser Login |
| Mot de passe refuse | 8+ caracteres, lettre + chiffre |

Tests automatises backend :

```bash
cd backend
npm test
```

---

## 7. Tester aussi l’application complete (optionnel)

Terminal 1 — API :

```bash
cd backend && npm run dev
```

Terminal 2 — interface web :

```bash
cd frontend
npm install
npm run dev
```

Ouvrir **http://localhost:3000** → Connexion / Inscription.

Checklist detaillee : [CHECKLIST_DEMARRAGE_LOCAL.md](CHECKLIST_DEMARRAGE_LOCAL.md)

---

## 8. Tester l’API sur le PC de l’etudiant (reseau local)

Si l’etudiant expose son API sur le reseau (ex. `http://192.168.1.10:4000`) :

- **Postman / REST Client / curl** depuis le PC du prof : remplacer `baseUrl` par l’IP de l’etudiant (pas de CORS pour ces outils).
- **Navigateur + frontend** : l’etudiant doit autoriser l’origine du prof dans la config CORS (`backend/src/lib/cors-options.js`) — cas avance, a preparer avant la soutenance.

Pour un jury qui clone le depot, la **section 1 à 4** suffit en general.
