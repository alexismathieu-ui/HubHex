# HubHex — Reprise agent

Document pour enchaîner dans un **nouveau chat Cursor** sans perdre le contexte soutenance CODA B1.

Etat detaille : [HubHex_etat_projet.txt](../HubHex_etat_projet.txt)

---

## Micro-prompt (copier-coller en premier message)

```
Tu reprends le projet HubHex (soutenance CODA B1). Lis d'abord :
1. HubHex_etat_projet.txt (verite terrain — fait / reste a faire)
2. docs/CHECKLIST_JOUR_J.md (taches manuelles jour J)

Contexte rapide :
- Monorepo : Next.js 16 (TS strict) + Express 5 + PostgreSQL
- Pages publiques : / accueil, /faq, /contact, /inscription, /connexion
  → layout partage (public)/ (PublicMarketingLayout) — nav + fond persistent
- Auth : JWT access 15 min + refresh 7 j (rotation, cookie HttpOnly API)
- MDP inscription : 8 car. + maj + min + chiffre + symbole (passwordPolicy.ts + security.js)
- Theme par compte : hubhex_theme_{userId} UNIQUEMENT (pas de cle globale hubhex_theme)
  → AppShell + modales ; pages publiques = cyan fixe (PublicThemeReset)

Explorateur fichiers (session 5 juin 2026) :
- DepotFileExplorer.tsx + DepotCodeWorkbench.tsx → authFetch (pas fetch brut)
  authFetch : frontend/src/lib/auth/authFetch.ts — retry auto sur 401 ACCESS_TOKEN_EXPIRED
- Hauteur defaut 520px (min 320, max 680) — localStorage hubhex_file_explorer_height
- Creation fichier/dossier : plus de window.prompt — creation auto + renommage inline
- Schema = modale mind-map (FileTreeSchemaModal) : zoom, DnD multiple, racine centree
- Header « Arborescence » adaptatif selon largeur sidebar (clamp)

Monaco editeur :
- monacoSetup.ts : workers via CDN jsdelivr (MonacoEnvironment.getWorker) — internet utile en dev
- monacoKeywordCompletions.ts : suggestions mots-cles (C, C#, JS, TS, Python…)
- MonacoEditorPane.tsx : beforeMount → registerKeywordCompletions

- UI espace connecte alignee landing ; profil = 1 emoji max
- Ne pas commit/push sans demande explicite

Priorites restantes (MANUEL utilisateur) :
- 6 captures PNG → docs/assets/ + doc utilisateur
- Exporter docs/SOUTENANCE.md en PDF/PPT
- Parcours demo docs/SCENARIO_DEMO.md une fois
- Tests docs/TESTS_SECURITE.md (cocher apres execution) ; tunnel npm run share puis couper

NE PAS sans demande : commit/push, tunnel Cloudflare permanent, script npm test:security auto,
cle localStorage hubhex_theme globale (fuite themes entre comptes).

Reponds en francais. Shell Windows : pas de && ; utiliser ; entre commandes.
```

---

## Fichiers a lire en 2 minutes

| Fichier | Pourquoi |
|---------|----------|
| [HubHex_etat_projet.txt](../HubHex_etat_projet.txt) | Etat complet du depot |
| [CHECKLIST_JOUR_J.md](CHECKLIST_JOUR_J.md) | Checklist matin soutenance |
| [SCENARIO_DEMO.md](SCENARIO_DEMO.md) | Parcours demo 5–10 min |
| [ORAL_GRILLE_B1.md](ORAL_GRILLE_B1.md) | Reponses jury (MVC, JWT, modération) |
| [SOUTENANCE.md](SOUTENANCE.md) | Base des slides |
| [TESTS_SECURITE.md](TESTS_SECURITE.md) | Tests manuels + rate limit |
| [GUIDE_LIEN_API.md](GUIDE_LIEN_API.md) | Tunnel pour le prof |
| [DOCUMENTATION_TECHNIQUE.md](DOCUMENTATION_TECHNIQUE.md) | Architecture + auth |

---

## Points d'entree code (session juin 2026)

| Zone | Fichiers |
|------|----------|
| Pages publiques | `frontend/src/app/(public)/` |
| Theme par user | `frontend/src/lib/theme/theme.ts`, `ThemeContext.tsx` |
| MDP inscription | `frontend/src/lib/auth/passwordPolicy.ts`, `backend/src/lib/security.js` |
| Explorateur fichiers | `DepotFileExplorer.tsx`, `DepotCodeWorkbench.tsx`, `FileExplorerToolbar.tsx` |
| Auth fetch API | `frontend/src/lib/auth/authFetch.ts` |
| Schema fichiers | `FileTreeSchemaModal.tsx`, `fileTreeLayout.ts` |
| Monaco editeur | `MonacoEditorPane.tsx`, `monacoSetup.ts`, `monacoKeywordCompletions.ts` |
| Langage editeur | `frontend/src/lib/depots/editorLanguage.ts` |

---

## Ne pas toucher / risques malus

| Element | Raison |
|---------|--------|
| `backend/.env` | Secrets — jamais committer |
| `backend/database/hubhex_full_dump.sql` | Donnees sensibles — gitignore |
| Tunnel `npm run share` laisse ouvert | Expose l'API locale au public |
| `git push --force` sur main | Destructif |
| Reactiver script `test:security` npm | Supprime volontairement |
| `localStorage hubhex_theme` (sans userId) | Melange les themes entre comptes |

---

## Demarrage local (rappel)

```powershell
cd c:\Users\User\HubHex\backend; npm run dev
cd c:\Users\User\HubHex\frontend; npm run dev
```

- Accueil : http://localhost:3000/
- FAQ : http://localhost:3000/faq
- API health : http://localhost:4000/api/health

---

## Si l'utilisateur demande du code

- Respecter les conventions existantes (Tailwind slate/cyan, composants dans `frontend/src/components/`)
- Theme user : `applyThemeToElement` sur AppShell / modales — jamais `:root` global hors reset public
- Theme storage : uniquement `hubhex_theme_{userId}`
- Build : `cd frontend; npm run build` avant de valider le front
