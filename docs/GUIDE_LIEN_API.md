# Partager l’API HubHex via un lien (pour le professeur)

Objectif : le correcteur ouvre **un lien dans son navigateur** ou dans Postman — **sans installer** le projet sur son PC.

---

## Cote etudiant (vous) — 3 etapes

### 1. Lancer l’API (terminal 1)

```bash
cd backend
npm run dev
```

Laissez ce terminal **ouvert**.

### 2. Creer un lien public Internet (terminal 2)

```bash
cd backend
npm run share
```

Cloudflare affiche une ligne du type :

```text
https://quelque-chose.trycloudflare.com
```

**Copiez cette URL** (sans `/api/health` a la fin).

Optionnel : collez-la dans `backend/.env` pour la retrouver au prochain demarrage :

```env
PUBLIC_API_URL=https://quelque-chose.trycloudflare.com
```

Redemarrez `npm run dev` : l’URL s’affichera dans la console.

### 3. Envoyer au professeur

Message type :

> API HubHex : **https://votre-lien.trycloudflare.com**  
> Test dans le navigateur : **https://votre-lien.trycloudflare.com/api/health**  
> Liste des routes (dev) : **https://votre-lien.trycloudflare.com/**

**Important :** tant que vos deux terminaux tournent (`npm run dev` + `npm run share`), le lien fonctionne. Si vous les fermez, le lien ne marche plus (sauf hebergement cloud).

---

## Cote professeur — ce qu’il fait

### Dans le navigateur (le plus simple)

Ouvrir :

```text
https://VOTRE-LIEN.trycloudflare.com/api/health
```

Reponse attendue : JSON avec `"status": "ok"` (ou equivalent).

Pour voir les routes disponibles :

```text
https://VOTRE-LIEN.trycloudflare.com/
```

### Avec Postman

1. Importer `postman/HubHex.postman_collection.json`
2. Creer un environnement avec une variable :
   - `baseUrl` = `https://VOTRE-LIEN.trycloudflare.com` (**sans** `/api` a la fin)
3. Executer **00 Demarrage → Health**, puis **01 Auth → Register / Login**

### Avec REST Client (`http/hubhex.http`)

Remplacer en haut du fichier :

```http
@baseUrl = https://VOTRE-LIEN.trycloudflare.com
```

Puis lancer les requetes comme en local.

---

## Alternative : meme reseau Wi-Fi (sans tunnel)

Si le prof est dans **la meme salle / le meme Wi-Fi** :

1. Votre API ecoute sur `HOST=0.0.0.0` (defaut dans `.env.example`)
2. Au demarrage, `npm run dev` affiche des lignes du type `http://192.168.x.x:4000/api/health`
3. Envoyez cette adresse au prof (autoriser le port **4000** dans le pare-feu Windows si besoin)

Pas besoin de `npm run share` dans ce cas.

---

## Depannage

| Probleme | Piste |
|----------|--------|
| Lien ne repond pas | `npm run dev` et `npm run share` sont-ils toujours lances ? |
| Erreur 502 / tunnel | Relancer `npm run share` (l’URL change souvent) |
| Health OK mais Login echoue | PostgreSQL tourne chez vous ; creer un compte via Register |
| Pare-feu Windows | Autoriser Node.js sur le port 4000 (reseau local) |

---

## Hebergement permanent (optionnel)

Pour un lien **stable** (24/7), heberger backend + PostgreSQL (Render, Railway, Fly.io, VPS). Ce n’est pas obligatoire pour une soutenance : le tunnel suffit souvent.

Voir aussi : [GUIDE_TEST_API.md](GUIDE_TEST_API.md) (tests detailles une fois l’API joignable).
