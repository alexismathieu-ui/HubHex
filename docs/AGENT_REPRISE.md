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
- Pages publiques OK : / accueil, /inscription, /connexion
- Fond techno au survol souris (CodeAnimatedBackground) + KanbanPreviewWindow anime sur l'accueil
- Auth : JWT access 15 min + refresh 7 j (rotation, cookie HttpOnly API)
- UI espace connecte refaite (dashboard, depots, profil…) alignee landing
- Theme personnalise : 3 couleurs (boutons / fond / textes) — localStorage par user
  → UNIQUEMENT dans (app) via AppShell ; pages publiques = cyan fixe (PublicThemeReset)
- Profil : modale « Personnaliser le theme » ; statut = 1 emoji max
- Ne pas commit/push sans demande explicite

Priorites restantes (MANUEL utilisateur) :
- 6 captures PNG → docs/assets/ + doc utilisateur
- Exporter docs/SOUTENANCE.md en PDF/PPT
- Parcours demo docs/SCENARIO_DEMO.md une fois
- Tests docs/TESTS_SECURITE.md (cocher apres execution) ; tunnel npm run share puis couper

NE PAS sans demande : commit/push, tunnel Cloudflare permanent, script npm test:security auto.

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

## Ne pas toucher / risques malus

| Element | Raison |
|---------|--------|
| `backend/.env` | Secrets — jamais committer |
| `database/hubhex_full_dump.sql` | Donnees sensibles — gitignore |
| Tunnel `npm run share` laisse ouvert | Expose l'API locale au public |
| `git push --force` sur main | Destructif |
| Reactiver script `test:security` npm | Supprime volontairement |

---

## Demarrage local (rappel)

```powershell
cd c:\Users\User\HubHex\backend; npm run dev
cd c:\Users\User\HubHex\frontend; npm run dev
```

- Accueil : http://localhost:3000/
- API health : http://localhost:4000/api/health

---

## Si l'utilisateur demande du code

- Respecter les conventions existantes (Tailwind slate/cyan, composants dans `frontend/src/components/`)
- Theme user : applyThemeToElement sur AppShell uniquement — jamais :root global hors reset public
- Ne pas refondre auth/tunnel sans demande
- Build : `cd frontend; npm run build` avant de valider le front
