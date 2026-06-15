# HubHex — Export SQL

Guide rapide pour exporter la base PostgreSQL (livrable CDC).

## Prérequis

- PostgreSQL démarré
- Fichier `backend/.env` avec `DATABASE_URL` valide
- L’API a déjà tourné au moins une fois (`npm run dev` dans `backend/`) pour créer le schéma

## 1. Export schéma (structure, sans données)

**Usage :** livrable CDC, documentation du modèle, partage sans données sensibles.

```powershell
cd c:\Users\User\HubHex\backend
npm run db:export
```

**Fichier produit :** `database/hubhex_schema.sql` (à la racine du monorepo)

Contenu : liste commentée des **13 tables** et de leurs colonnes (`users`, `projects`, `tasks`, `refresh_tokens`, `project_files`, etc.). Pas de `INSERT`.

## 2. Export complet (structure + données)

**Usage :** sauvegarde, restauration sur une autre machine, demande du jury avec données de démo.

```powershell
cd c:\Users\User\HubHex\backend
npm run db:dump
```

**Fichier produit :** `database/hubhex_full_dump.sql`

- Tente d’abord `pg_dump` (outil client PostgreSQL)
- Sinon génère un SQL restaurable via **Node** (comportement courant sur Windows si `pg_dump` n’est pas dans le PATH)

**Attention :** contient mots de passe hashés et données utilisateur → **ne pas committer** (fichier ignoré par git si placé dans `backend/database/` ; à la racine, ne pas l’ajouter au dépôt).

### Restaurer un dump complet

```powershell
psql "$env:DATABASE_URL" -f c:\Users\User\HubHex\database\hubhex_full_dump.sql
```

Sous Linux/macOS :

```bash
psql "$DATABASE_URL" -f database/hubhex_full_dump.sql
```

### Forcer le chemin de pg_dump (optionnel)

Dans `backend/.env` :

```
PG_DUMP_PATH=C:\Program Files\PostgreSQL\16\bin\pg_dump.exe
```

## Quand régénérer ?

| Moment | Commande |
|--------|----------|
| Avant remise CDC / soutenance | `npm run db:export` |
| Après modification du schéma en dev | `npm run db:export` |
| Si le jury demande un SQL avec données | `npm run db:dump` |

## Dépannage

| Problème | Solution |
|----------|----------|
| `ECONNREFUSED` | Démarrer PostgreSQL, vérifier `DATABASE_URL` |
| Table absente dans le schéma | Lancer l’API une fois (`npm run dev`) puis ré-exporter |
| `pg_dump` introuvable | Normal : le script utilise le fallback Node |

Voir aussi : [DOCUMENTATION_TECHNIQUE.md](DOCUMENTATION_TECHNIQUE.md) (section Export base de données).
