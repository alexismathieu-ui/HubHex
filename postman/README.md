# Postman — HubHex API

## Import dans VS Code / Cursor

1. Extension **Postman** (ou importer via l'app Postman desktop).
2. Importer **un fichier a la fois** :
   - `HubHex.postman_collection.json`
   - puis `HubHex-local.postman_environment.json`
3. Selectionner l'environnement **HubHex local** (`baseUrl` = `http://localhost:4000`).

## Test rapide

```bash
cd backend
npm run dev
```

Dans Postman : **01 Auth → Login**, puis **02 Profil → GET me**.

## Alternative REST Client (souvent plus simple)

Extension **REST Client** (`humao.rest-client`) → ouvrir `http/hubhex.http` → **Send Request** sur chaque bloc.

Guide complet : [docs/GUIDE_TEST_API.md](../docs/GUIDE_TEST_API.md).
